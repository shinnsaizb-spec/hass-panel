import json
import os
import shutil
import hashlib
import requests
from datetime import datetime
import zipfile
from loguru import logger
import subprocess
from hass_panel.utils.config import cfg
import tarfile
from typing import Dict
from fastapi import UploadFile

def ensure_version_file():
    """确保version.json文件存在"""
    logger.info(f"确保版本文件存在: {cfg.update_cfg.version_file}")
    
    if not os.path.exists(cfg.update_cfg.version_file):
        logger.info(f"创建版本文件: {cfg.update_cfg.version_file}")
        with open(cfg.update_cfg.version_file, 'w') as f:
            json.dump({"version": "0.0.0", "updateTime": ""}, f)

def get_current_version() -> str:
    """获取当前版本"""
    with open(cfg.update_cfg.version_file, 'r') as f:
        return json.load(f)["version"]

def get_latest_release() -> Dict:
    """获取最新版本信息。

    返回 {"version", "download_url", "checksum_url"}：
    - download_url 用 **GitHub 官方** assets 地址（原来是第三方镜像 ghfast.top 打头，
      链路或镜像本身被污染就能给全体升级用户投毒；官方源优先，镜像只作兜底）
    - checksum_url：release 里带的校验和文件（上游目前没提供，为空则不校验、
      只告警——硬失败会让更新功能完全不可用）
    """
    api_url = f"https://api.github.com/repos/{cfg.update_cfg.github_repo}/releases/latest"
    logger.info(f"正在获取最新版本信息: {api_url}")
    response = requests.get(api_url, timeout=10)
    response.raise_for_status()
    release_data = response.json()
    version = release_data["tag_name"]
    assets = release_data.get("assets") or []
    if not assets:
        raise Exception("release 里没有任何附件")

    # 主包：优先 .zip/.tar.gz，否则退到第一个附件
    main_asset = next(
        (a for a in assets if str(a.get("name", "")).endswith((".zip", ".tar.gz"))),
        assets[0],
    )
    # 校验和附件：SHA256SUMS / checksums.txt / *.sha256 之类
    checksum_asset = next(
        (
            a for a in assets
            if str(a.get("name", "")).lower() in ("sha256sums", "checksums.txt", "sha256sums.txt")
            or str(a.get("name", "")).lower().endswith(".sha256")
        ),
        None,
    )

    logger.info(
        f"获取到最新版本: {version}（主包 {main_asset['name']}，"
        f"校验和 {'有' if checksum_asset else '无'}）"
    )
    return {
        "version": version,
        "download_url": main_asset["browser_download_url"],
        "checksum_url": checksum_asset["browser_download_url"] if checksum_asset else "",
    }


# ==============================================================================
# 下载与校验
# ==============================================================================

def _download_with_fallback(url: str, zip_path: str, timeout=(10, 600)) -> None:
    """下载更新包：官方源优先，失败退第三方镜像（ghfast.top）。

    镜像对国内 NAS 用户几乎是必需（github.com 直连经常超时），但它是第三方，
    所以只作兜底；上游提供了校验和时下一步会验。
    """
    candidates = [url]
    mirror = f"https://ghfast.top/{url}"
    if mirror != url:
        candidates.append(mirror)

    last_err = None
    for u in candidates:
        try:
            # 流式落盘：不在内存里堆整个安装包
            with requests.get(u, stream=True, timeout=timeout) as r:
                r.raise_for_status()
                with open(zip_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            f.write(chunk)
            logger.info(f"下载完成: {u}")
            return
        except Exception as e:
            last_err = e
            logger.warning(f"下载源失败，尝试下一个: {u} - {e}")
    raise Exception(f"所有下载源都失败: {last_err}")


def _verify_checksum(zip_path: str, checksum_url: str, filename: str) -> None:
    """下载校验和文件并比对 sha256。比对不上直接中止更新。"""
    try:
        resp = requests.get(checksum_url, timeout=10)
        resp.raise_for_status()
        text = resp.text
    except Exception as e:
        logger.warning(f"校验和文件下载失败，跳过校验: {e}")
        return

    want = None
    t = (text or "").strip()
    # 单文件 .sha256：内容就是裸哈希
    if t and len(t.split()) == 1 and len(t) == 64:
        want = t.lower()
    else:
        # sha256sum 输出：'<hex>  <filename>'
        for line in t.splitlines():
            parts = line.strip().split()
            if len(parts) >= 2 and parts[1].lstrip("*") == filename:
                want = parts[0].lower()
                break

    if not want:
        logger.warning("校验和文件里找不到对应条目，跳过校验")
        return

    h = hashlib.sha256()
    with open(zip_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    got = h.hexdigest()
    if got != want:
        raise Exception(
            f"更新包校验失败（期望 {want}，实际 {got}）——镜像或链路可能被篡改，已中止更新"
        )
    logger.info("更新包 sha256 校验通过")


# ==============================================================================
# 解压安全
# ------------------------------------------------------------------------------
# zipfile.extract 自带 .. 过滤，但 extract_package 的「去公共前缀」分支是手写
# open() 落盘的，不过滤就是 zip slip；tarfile.extractall **不过滤任何东西**，
# `../` 和符号链接外逃都能中招。统一在这里逐个成员校验。
# ==============================================================================

def _check_archive_member_name(name: str) -> None:
    """拒绝对绝对路径 / `..` 穿越的成员名。"""
    n = name or ""
    if n.startswith("/") or n.startswith("\\") or (len(n) > 1 and n[1] == ":"):
        raise Exception(f"更新包含绝对路径成员: {name}")
    if ".." in n.replace("\\", "/").split("/"):
        raise Exception(f"更新包含路径穿越成员: {name}")


def _tar_extract(tar: tarfile.TarFile, member, extract_path: str):
    """解压单个 tar 成员；Python 3.12+ 用 data 过滤器（进一步挡外逃链接）。"""
    try:
        tar.extract(member, extract_path, filter="data")
    except TypeError:  # 老版本 python 没有 filter 参数
        tar.extract(member, extract_path)


def _check_tar_members(tar: tarfile.TarFile, extract_path: str) -> None:
    """tar 成员逐个校验：名字合法 + 符号/硬链接目标也在解压目录内 + 拒绝设备文件。"""
    base = os.path.realpath(extract_path)
    for m in tar.getmembers():
        _check_archive_member_name(m.name)
        if m.isdev():
            raise Exception(f"更新包含设备文件: {m.name}")
        if m.issym() or m.islnk():
            link_abs = os.path.realpath(os.path.join(base, os.path.dirname(m.name), m.linkname))
            if link_abs != base and not link_abs.startswith(base + os.sep):
                raise Exception(f"更新包含外逃的符号链接: {m.name} -> {m.linkname}")

def update_version_file(version: str):
    """更新版本文件"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"更新版本信息: {version}, 时间: {current_time}")
    with open(cfg.update_cfg.version_file, 'w') as f:
        json.dump({"version": version, "updateTime": current_time}, f)

def sync_files(src_dir: str, dst_dir: str):
    """使用rsync同步文件，排除特定目录
    
    Args:
        src_dir: 源目录路径
        dst_dir: 目标目录路径
        
    Raises:
        Exception: 当目录不存在或同步失败时抛出
    """
    # 验证目录是否存在
    if not os.path.exists(src_dir):
        raise Exception(f"源目录不存在: {src_dir}")
    if not os.path.exists(dst_dir):
        raise Exception(f"目标目录不存在: {dst_dir}")
        
    # 直接构建参数列表：subprocess 用列表形式（不过 shell）时不需要引号，
    # 原来先拼成带引号的字符串再 split()，引号会留在参数里（--exclude='media'
    # 实际排除的是名为 'media'【带引号】的文件），导致排除规则从未生效。
    cmd_parts = ['rsync', '-a']
    for path in cfg.update_cfg.exclude_path:
        cmd_parts.append(f'--exclude={path}')
    cmd_parts.extend([f"{src_dir}/", f"{dst_dir}/"])
    
    logger.info(f"开始同步文件: {' '.join(cmd_parts)}")
    try:
        result = subprocess.run(
            cmd_parts,
            check=True,
            capture_output=True,
            text=True
        )
        # 只在debug级别记录输出
        if result.stdout.strip():
            logger.debug(f"rsync输出: {result.stdout}")
    except subprocess.CalledProcessError as e:
        error_msg = f"同步失败: 退出码 {e.returncode}"
        if e.stderr.strip():
            error_msg += f"\n错误输出: {e.stderr}"
        logger.error(error_msg)
        raise Exception(error_msg)
    logger.info("文件同步完成")

def extract_package(file_path: str, extract_path: str) -> None:
    """解压更新包文件，直接解压到目标目录而不创建额外的父目录

    安全：逐个成员校验（绝对路径 / `..` 穿越 / tar 符号链接外逃全部拒绝），
    zip 和 tar、有/无公共前缀两种形态都过同一道闸。
    """
    logger.info(f"开始解压文件: {file_path} 到 {extract_path}")
    try:
        os.makedirs(extract_path, exist_ok=True)
        base = os.path.realpath(extract_path)

        if file_path.endswith('.zip'):
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                # 获取所有文件列表
                file_list = zip_ref.namelist()
                for m in file_list:
                    _check_archive_member_name(m)
                # 检查是否所有文件都在同一个根目录下
                common_prefix = os.path.commonprefix(file_list)
                if common_prefix and common_prefix.endswith('/'):
                    # 去除共同前缀
                    for member in file_list:
                        if member == common_prefix:
                            continue
                        if member.startswith(common_prefix):
                            # 提取相对路径
                            rel_path = member[len(common_prefix):]
                            if not rel_path:
                                continue
                            # 双保险：最终落点必须仍在解压目录内
                            target = os.path.realpath(os.path.join(base, rel_path))
                            if target != base and not target.startswith(base + os.sep):
                                raise Exception(f'非法的解压目标: {member}')
                            # 读取文件内容
                            content = zip_ref.read(member)
                            # 构建目标路径
                            target_path = os.path.join(extract_path, rel_path)
                            # 确保目标目录存在
                            os.makedirs(os.path.dirname(target_path), exist_ok=True)
                            # 如果是目录则跳过
                            if not member.endswith('/'):
                                with open(target_path, 'wb') as f:
                                    f.write(content)
                else:
                    # 没有共同前缀，直接解压（zipfile.extract 自带 .. 过滤，双保险已做）
                    zip_ref.extractall(extract_path)
        elif file_path.endswith('.tar.gz'):
            with tarfile.open(file_path, 'r:gz') as tar_ref:
                _check_tar_members(tar_ref, extract_path)
                # 获取所有成员
                members = tar_ref.getmembers()
                # 检查是否所有文件都在同一个根目录下
                common_prefix = os.path.commonprefix([m.name for m in members])
                if common_prefix and common_prefix.endswith('/'):
                    for member in members:
                        if member.name == common_prefix:
                            continue
                        if member.name.startswith(common_prefix):
                            # 修改成员的路径
                            member.name = member.name[len(common_prefix):]
                            if not member.name:
                                continue
                            _tar_extract(tar_ref, member, extract_path)
                else:
                    # 没有共同前缀，直接解压（成员已校验）
                    for member in members:
                        _tar_extract(tar_ref, member, extract_path)
        else:
            raise Exception("不支持的文件格式，仅支持 .zip 和 .tar.gz")
    except Exception as e:
        logger.error(f"解压文件失败: {e}")
        raise Exception(f"解压文件失败: {e}")

def verify_update_package(extract_path: str) -> Dict:
    """验证更新包的有效性并返回版本信息
    
    Args:
        extract_path: 解压后的目录路径
        
    Returns:
        Dict: 包含版本信息的字典
        
    Raises:
        Exception: 当验证失败时抛出
    """
    logger.info(f"验证更新包: {extract_path}")
    version_file = os.path.join(extract_path, "version.json")
    
    if not os.path.exists(version_file):
        raise Exception("无效的更新包：缺少 version.json 文件")
        
    try:
        with open(version_file, 'r') as f:
            version_info = json.load(f)
            
        if "version" not in version_info:
            raise Exception("无效的更新包：version.json 缺少版本信息")
            
        return version_info
    except json.JSONDecodeError:
        raise Exception("无效的更新包：version.json 格式错误")
    except Exception as e:
        raise Exception(f"验证更新包失败: {e}")

def _safe_package_name(filename) -> str:
    """更新包文件名收敛成单个安全名（客户端可控，防 join 穿越写出临时目录）。"""
    name = os.path.basename(str(filename or '').replace('\\', '/'))
    if not name or name in ('.', '..'):
        return 'update.zip'
    if len(name) > 128:
        name = name[:128]
    return name
def _has_symlink_component(root: str, target: str) -> bool:
    """检查 root..target 的路径组件里有没有符号链接。

    realpath 在 Linux 下可靠，但某些平台（Windows 开发机实测）对
    os.symlink 建的目录链接既不 islink 也不解析——多这一道兜底，
    真实部署（Linux）两道都在。
    """
    try:
        rel = os.path.relpath(target, root)
    except ValueError:
        return True  # 跨盘符等无法比较的情况，保守拒绝
    cur = root
    for part in rel.split(os.sep):
        if part in ('', '.', '..'):
            continue
        cur = os.path.join(cur, part)
        if os.path.islink(cur):
            return True
    return False


def _validate_extract_path(extract_path) -> str:
    """校验 extract_path 必须是**本次上传产生的、位于临时目录内**的目录。

    背景：`/api/manual-update` 原来直接把请求体里的 extract_path 交给
    `apply_manual_update`——它既能 `rsync` 任意目录进前端静态目录（等于把任意
    文件读取并公开化），finally 里还会 `rmtree(dirname(extract_path))`
    （传 `/` 就是删库级操作）。所以这里只认 tmp_dir 里自己产生的路径。
    realpath 会解析符号链接，想把 symlink 指向别处也会被识破。
    """
    raw = str(extract_path or '').strip()
    if not raw:
        raise Exception('缺少更新包路径')

    tmp_root = os.path.realpath(cfg.update_cfg.tmp_dir)
    real = os.path.realpath(raw)

    # 必须严格位于 tmp_dir 之内，且不能是 tmp_dir 本身
    if real == tmp_root or not real.startswith(tmp_root + os.sep):
        raise Exception(f'非法的更新包路径（必须位于 {tmp_root} 内）')
    if _has_symlink_component(tmp_root, real):
        raise Exception('非法的更新包路径（包含符号链接）')
    if not os.path.isdir(real):
        raise Exception('更新包目录不存在或已被清理，请重新上传')
    return real


_VERSION_RE = __import__('re').compile(r'^[A-Za-z0-9._+-]{1,32}$')

# 手动上传的更新包大小上限（200MB）：上游 release.zip 约 9MB，留足余量。
# 关键是必须有上限——原来 `file.file.read()` 一口气读进内存，个大包就能 OOM。
MAX_UPDATE_PACKAGE_SIZE = 200 * 1024 * 1024
_UPDATE_CHUNK = 1024 * 1024


def process_manual_update(file: UploadFile) -> Dict:
    """处理手动上传的更新包

    Args:
        file: 上传的文件对象

    Returns:
        Dict: 包含版本信息的字典

    Raises:
        Exception: 当处理失败时抛出
    """
    logger.info(f"开始处理手动更新包: {file.filename}")

    # 创建临时目录
    tmp_dir = os.path.join(cfg.update_cfg.tmp_dir, "manual_update")
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
    os.makedirs(tmp_dir)

    try:
        # 保存上传的文件（文件名只取 basename，防 `../../x.zip` 写出临时目录；
        # 分块落盘 + 总量上限，整个包不进内存）
        file_path = os.path.join(tmp_dir, _safe_package_name(file.filename))
        total = 0
        try:
            with open(file_path, "wb") as f:
                while True:
                    chunk = file.file.read(_UPDATE_CHUNK)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_UPDATE_PACKAGE_SIZE:
                        limit = MAX_UPDATE_PACKAGE_SIZE / 1024 / 1024
                        raise Exception(
                            f"更新包过大：上限 {limit:.0f}MB" if limit >= 1
                            else f"更新包过大：上限 {max(1, MAX_UPDATE_PACKAGE_SIZE // 1024)}KB"
                        )
                    f.write(chunk)
        except BaseException:
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except OSError:
                pass
            raise

        # 解压文件
        extract_path = os.path.join(tmp_dir, "app")
        extract_package(file_path, extract_path)

        # 验证更新包
        version_info = verify_update_package(f'{extract_path}')

        return {
            "version": version_info["version"],
            "extract_path": extract_path
        }
    except Exception as e:
        logger.error(f"处理更新包失败: {e}")
        raise


def apply_manual_update(package_info: Dict) -> str:
    """应用手动更新
    
    Args:
        package_info: 包含更新信息的字典
        
    Returns:
        str: 更新后的版本号
        
    Raises:
        Exception: 当更新失败时抛出
    """
    logger.info(f"开始应用手动更新")

    # ⚠️ 先把请求体里的字段收敛成可信值再谈执行：
    #    extract_path 必须是本次上传产生的、tmp_dir 内的目录（否则 rsync 任意目录
    #    + finally 的 rmtree 都是杀伤性原语）；version 只进版本文件，限个格式。
    extract_path = _validate_extract_path(
        (package_info or {}).get('extract_path')
    )
    version = str((package_info or {}).get('version') or '').strip()
    if not _VERSION_RE.match(version):
        raise Exception(f'非法的版本号：{version!r}')

    try:
        # 同步文件
        sync_files(extract_path, cfg.update_cfg.app_dir)
        
        # 更新版本文件
        update_version_file(version)
        
        logger.success("手动更新成功完成")
        return version
    except Exception as e:
        logger.error(f"应用更新失败: {e}")
        raise
    finally:
        # 清理临时文件（extract_path 已验证在 tmp_dir 内，dirname 也在其内）
        tmp_dir = os.path.dirname(extract_path)
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)

def run_update() -> str | None:
    """
    执行更新逻辑
    返回:
        str: 更新后的版本号
        None: 如果已经是最新版本
    抛出:
        Exception: 更新过程中的错误
    """
    try:
        logger.info("开始更新流程")
        # 确保version.json文件存在
        ensure_version_file()
        
        # 获取当前版本
        current_version = get_current_version()
        logger.info(f"当前版本: {current_version}")
        
        # 获取最新版本信息
        release = get_latest_release()
        latest_version = release["version"]
        download_url = release["download_url"]

        if current_version == latest_version:
            logger.info("已经是最新版本，无需更新")
            return None

        logger.info(f"开始更新到版本 {latest_version}")

        # 创建临时目录
        if os.path.exists(cfg.update_cfg.tmp_dir):
            logger.debug(f"清理临时目录: {cfg.update_cfg.tmp_dir}")
            shutil.rmtree(cfg.update_cfg.tmp_dir)
        os.makedirs(cfg.update_cfg.tmp_dir)

        try:
            # 下载新版本（官方源优先、镜像兜底；流式落盘不在内存里堆整个包）
            zip_path = os.path.join(cfg.update_cfg.tmp_dir, "release.zip")
            logger.info(f"下载新版本文件: {download_url}")
            _download_with_fallback(download_url, zip_path)

            # 校验和：release 带了就验（比对不上直接中止），没带只告警
            if release.get("checksum_url"):
                _verify_checksum(
                    zip_path,
                    release["checksum_url"],
                    os.path.basename(download_url.split("?")[0]),
                )
            else:
                logger.warning(
                    "该 release 未提供校验和文件，本次更新未做完整性校验"
                    "（官方源优先 + 镜像兜底，风险可控但非零）"
                )

            # 解压新版本（成员逐个校验，防 zip/tar slip）
            extract_path = os.path.join(cfg.update_cfg.tmp_dir, "app")
            logger.info(f"解压文件到: {extract_path}")
            extract_package(zip_path, extract_path)

            # 使用rsync同步文件
            sync_files(extract_path, cfg.update_cfg.app_dir)

            # 更新版本文件
            update_version_file(latest_version)

            logger.success("更新成功完成")
            return latest_version

        finally:
            # 清理临时文件
            logger.debug(f"清理临时文件: {cfg.update_cfg.tmp_dir}")
            shutil.rmtree(cfg.update_cfg.tmp_dir)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"网络请求错误: {e}")
        raise Exception(f"网络请求错误: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON解析错误: {e}")
        raise Exception(f"JSON解析错误: {e}")
    except Exception as e:
        logger.error(f"更新过程中发生错误: {e}")
        logger.exception(e)
        raise 