import inspect
import asyncio
import datetime
import functools
import tarfile
from typing import Optional, Callable, Union, Iterable
from asyncio.exceptions import TimeoutError
import os.path as osp
import os
import zipfile
import aiohttp
from fastapi import HTTPException, UploadFile
from loguru import logger
from glob import glob
from fastapi.responses import JSONResponse
from hass_panel.utils.config import cfg

# ==============================================================================
# 上传安全（附件 / 底图 / 图标都走这里）
# ------------------------------------------------------------------------------
# 这个接口原来有三个问题叠在一起：① 没鉴权；② `file.filename` 原样拿去 join
# （Starlette 透传客户端文件名，`../../evil.js` 实测直接进到代码里）；
# ③ `await file.read()` 整个文件读进内存、无大小上限。
# ==============================================================================

# 单个上传文件的大小上限（100MB）：附件里最大的是卡片背景视频，再大不合理。
# 关键是必须有上限——原来一气读进内存，一个超大文件就能把容器 OOM。
MAX_UPLOAD_SIZE = 100 * 1024 * 1024

# 分块大小（1MB）
_UPLOAD_CHUNK = 1024 * 1024

# 允许的扩展名：图片 / 动图视频 / 图标。
# ⚠️ 刻意**不含** .html/.htm/.js/.xht 等——上传目录是同源静态托管的，
#    扔个 html 上去就是存储型 XSS（.svg 保留：图标功能需要，
#    由 main.py 给 /api/upload 的响应加 CSP + nosniff 兜底）。
ALLOWED_UPLOAD_EXT = {
    # 图片
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.avif',
    # 图标
    '.svg', '.ico',
    # 动图 / 视频（背景壁纸）
    '.mp4', '.webm', '.ogv', '.mov', '.m4v', '.apng',
}


def safe_upload_name(name: str) -> str:
    """把客户端给的文件名收敛成「单个安全文件名」。

    multipart 的 filename 完全由客户端控制（Starlette 原样透传），
    直接 join 就是路径穿越。这里：两种分隔符都切、只要最后一段；
    拒空名 / `.` / `..` / 控制字符 / 以点开头。
    故意**不**限制成 ASCII——中文文件名的图片很常见，砍了会被用户骂。
    """
    n = (name or '').strip().replace('\\', '/').split('/')[-1].strip()
    if not n or n in ('.', '..'):
        raise HTTPException(status_code=400, detail='非法的文件名')
    if n.startswith('.'):
        raise HTTPException(status_code=400, detail='非法的文件名（不能以点开头）')
    if any(ord(c) < 32 for c in n):
        raise HTTPException(status_code=400, detail='非法的文件名（含控制字符）')
    if len(n) > 128:
        n = n[:128]
    return n
def generate_resp(code: Optional[int]=200, message: Optional[str]=None, data: Optional[dict]=None, error: Optional[str]=None, **kwargs):
    # assert message or data or error, 'generate response error'
    resp = {
        'code': code
    }
    if message is not None:
        resp['message'] = message
    if data is not None:
        resp['data'] = data
    if error is not None:
        resp['error'] = error
    for k, v in kwargs.items():
        resp[k] = v
    return resp



def _size_limit_str(max_size: int) -> str:
    mb = max_size / 1024 / 1024
    return f'{mb:.0f}MB' if mb >= 1 else f'{max(1, max_size // 1024)}KB'


async def save_upload_stream(file: UploadFile, dest_path, max_size: int = MAX_UPLOAD_SIZE) -> int:
    """分块落盘上传文件，返回写入字节数。

    任何时候内存里只有一个 1MB 的块；超过 max_size 抛 413 并清掉半成品。
    附件上传 / 插件上传都走它，别在各自端点里各写一遍。
    """
    total = 0
    try:
        with open(dest_path, "wb") as f:
            while True:
                chunk = await file.read(_UPLOAD_CHUNK)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f'文件过大：上限 {_size_limit_str(max_size)}',
                    )
                f.write(chunk)
    except BaseException:
        # 失败（含超限）时清掉半成品，别在目录里留垃圾
        try:
            if osp.isfile(dest_path):
                os.remove(dest_path)
        except OSError:
            pass
        raise
    return total


async def handle_upload_file(
    file: UploadFile,
    file_dir=None,
    file_path=None,
    max_size: int = MAX_UPLOAD_SIZE,
):
    """保存上传的文件。

    安全三件套：① 文件名过 `safe_upload_name()`（防路径穿越）；
    ② 扩展名白名单（防上传 html/svg 之类的 XSS 载体）；
    ③ 分块落盘 + 总量上限（防超大文件打爆内存）。
    重名文件自动加 `_1`/`_2` 后缀（不覆盖旧文件——配置里是按 URL 引用的）。
    """
    os.makedirs(file_dir, exist_ok=True)

    file_name = safe_upload_name(file.filename)
    ext = osp.splitext(file_name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXT:
        raise HTTPException(
            status_code=400,
            detail=f'不支持的文件类型：{ext or "（无扩展名）"}',
        )

    if not file_path:
        # get_file_name 保持原有行为：重名加后缀，绝不静默覆盖
        file_path = osp.join(file_dir, get_file_name(file_name, file_dir))

    await save_upload_stream(file, file_path, max_size=max_size)

    # 原来这里是 0o777（全局可写），没必要：web 服务器只需要读
    os.chmod(file_path, 0o644)

    return file_name, file_path


def get_file_name(filename, file_dir):
    # Reemplazar espacios con guiones bajos en el nombre del archivo
    filename = filename.replace(" ", "_")
    
    full_path = osp.join(file_dir, filename)
    if full_path not in glob(f"{file_dir}/*"):
        return filename
    else:
        name, ext = osp.splitext(filename)
        parts = name.split("_")
        last_part = parts[-1]
        if last_part.isdigit():
            parts[-1] = str(int(last_part) + 1)
        else:
            parts.append("1")
        new_name = "_".join(parts) + ext
        return get_file_name(new_name, file_dir)
    

async def check_hass_token(hass_url: str, hass_token: str):
    """验证Home Assistant token"""
    # 必须显式设超时：aiohttp 默认总超时是 5 分钟，
    # HA 不可达时会让前端「获取配置」一直转圈。
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            hass_token = hass_token.replace("Bearer ", "")
            async with session.get(
                f"{hass_url}/api/",
                headers={"Authorization": f"Bearer {hass_token}"}
            ) as response:
                if response.status != 200:
                    return False
        except Exception as e:
            logger.error(f"check_hass_token error: {e}")
            return False
    return True



def compress_directory(input_path, output_path):
    # 检查输出文件的扩展名来决定压缩格式
    if output_path.endswith(".zip"):
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(input_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(
                        file_path,
                        os.path.relpath(file_path, input_path),
                        compresslevel=1,
                    )
    elif output_path.endswith(".tar.gz"):
        with tarfile.open(output_path, "w:gz") as tar:
            tar.add(input_path, arcname=os.path.basename(input_path))
    elif output_path.endswith(".tar"):
        with tarfile.open(output_path, "w") as tar:
            tar.add(input_path, arcname=os.path.basename(input_path))
    else:
        raise ValueError(
            "Unsupported file format. Please use '.zip' or '.tar.gz' or '.tar' as the file extension."
        )