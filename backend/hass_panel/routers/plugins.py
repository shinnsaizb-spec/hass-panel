# ==============================================================================
# 插件（卡片）管理路由
# ------------------------------------------------------------------------------
# 设计目标：MoviePilot 式「上传插件文件 → 重启/重扫即生效」。
#
# 插件就是一个文件夹，放在 /config/hass-panel/plugins/<id>/ 下：
#   <id>/
#     manifest.json   # 插件元数据（cardType / name / icon / configFields ...）
#     plugin.js       # 预构建好的 JS 包（由插件作者的构建工具产出）
#
# 由于前端是 CRA 静态构建，没有运行时编译能力，插件不能是源码，
# 必须是「预构建的 JS 包」，运行时由前端动态 import() 加载。
# 本路由负责：①扫描目录给出清单；②静态托管这些 bundle 文件。
# ==============================================================================

import io
import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from hass_panel.core.auth_deps import get_current_user
from hass_panel.models.database import User
from hass_panel.utils.config import cfg

router = APIRouter(prefix="/api/plugins", tags=["plugins"])

# 插件目录与 user_configs 同级：/config/hass-panel/plugins
PLUGINS_DIR = Path(cfg.base.user_config_dir).resolve().parent / "plugins"

# 插件 bundle 的对外 URL 前缀。
# ⚠️ 刻意挂在 /api 下面：开发环境的 CRA 代理、生产环境的 nginx 都只保证转发 /api，
#    若用 /plugins 前缀，dev server 未重启（代理未加载）时会回退成 index.html，
#    导致插件 import() 到一段 HTML 而加载失败（卡片空白、收不到数据）。
ENTRY_PREFIX = "/api/plugin-assets"
try:
    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    # 创建失败（权限等）不致命，只是暂时没有插件目录
    pass

# 进程内缓存，应用启动时填充一次
_PLUGIN_CACHE: list = []

# 插件状态（启用/禁用、显示名覆盖）持久化文件。
# ⚠️ 刻意放在插件目录的「上一级」：放进 PLUGINS_DIR 会被静态托管暴露出去。
STATE_FILE = PLUGINS_DIR.parent / "plugins_state.json"


def _load_state() -> dict:
    """读取插件状态：{ "<id>": {"enabled": bool, "name": str} }"""
    try:
        if STATE_FILE.exists():
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
    except Exception as e:
        print(f"[plugins] 读取状态失败：{e}")
    return {}


def _save_state(state: dict) -> None:
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"[plugins] 保存状态失败：{e}")


def _find_plugin(pid: str):
    return next((p for p in _PLUGIN_CACHE if p["id"] == pid), None)


def scan_plugins() -> list:
    """扫描插件目录，返回插件清单列表（含 entry 的 URL 路径、启用状态、显示名覆盖）。"""
    global _PLUGIN_CACHE
    found: list = []
    if not PLUGINS_DIR.exists():
        _PLUGIN_CACHE = found
        return found

    state = _load_state()

    for sub in sorted((p for p in PLUGINS_DIR.iterdir() if p.is_dir()), key=lambda x: x.name):
        manifest_path = sub / "manifest.json"
        if not manifest_path.exists():
            continue
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[plugins] 跳过 {sub.name}：manifest.json 解析失败 -> {e}")
            continue

        pid = manifest.get("id") or sub.name
        card_type = manifest.get("cardType")
        entry = manifest.get("entry", "plugin.js")
        if not card_type:
            print(f"[plugins] 跳过 {pid}：manifest 缺少 cardType")
            continue

        entry_path = sub / entry
        if not entry_path.exists():
            print(f"[plugins] 跳过 {pid}：entry 文件不存在 -> {entry}")
            continue

        st = state.get(pid, {}) or {}
        builtin_name = manifest.get("name", pid)
        found.append({
            "id": pid,
            # 显示名：优先用管理页里改过的名字，否则用 manifest 里的
            "name": st.get("name") or builtin_name,
            "builtinName": builtin_name,
            "enabled": bool(st.get("enabled", True)),
            "version": manifest.get("version", "0.0.0"),
            "description": manifest.get("description", ""),
            "author": manifest.get("author", ""),
            "cardType": card_type,
            "icon": manifest.get("icon", "mdiHelpCircle"),
            "group": manifest.get("group", "plugin"),
            "defaultHeight": int(manifest.get("defaultHeight", 300)),
            "configFields": manifest.get("configFields", []),
            # 前端通过这个 URL 运行时 import()
            "entry": f"{ENTRY_PREFIX}/{pid}/{entry}",
        })

    _PLUGIN_CACHE = found
    print(f"[plugins] 扫描完成，发现 {len(found)} 个插件：{[p['id'] for p in found]}")
    return found


# 模块加载时即扫描一次（应用启动阶段）
scan_plugins()


@router.get("")
def list_plugins():
    """返回「已启用」的插件列表（前端加载器 / 配置页用）。"""
    enabled = [p for p in _PLUGIN_CACHE if p.get("enabled", True)]
    return {"plugins": enabled, "count": len(enabled)}


@router.get("/all", dependencies=[Depends(get_current_user)])
def list_all_plugins():
    """返回全部插件（含已禁用），供「插件管理」页使用。"""
    return {"plugins": _PLUGIN_CACHE, "count": len(_PLUGIN_CACHE)}


@router.post("/rescan")
def rescan_plugins():
    """重新扫描插件目录。上传新插件后不想重启容器时，可调用此接口立即生效。"""
    plugins = scan_plugins()
    enabled = [p for p in plugins if p.get("enabled", True)]
    return {"plugins": enabled, "count": len(enabled)}


# ------------------------------------------------------------------------------
# 卡片显示名覆盖
# ------------------------------------------------------------------------------
# 「添加卡片」列表里的名字，内置卡片来自 i18n、插件卡片来自 manifest。
# 这里提供一张「显示名覆盖表」，让用户能给**任意卡片**（内置 + 插件）起自定义名字。
# 与插件状态同存一个文件，避免再多一个配置文件。
# 注意：这些路由要定义在 /{pid} 之类通配路由**之前**，否则会被当成插件 id。

@router.get("/card-names")
def list_card_names():
    """返回卡片显示名覆盖表：{ "<cardType>": "自定义名" }。"""
    state = _load_state()
    names = state.get("cardNames")
    return {"names": names if isinstance(names, dict) else {}}


@router.post("/card-names/{card_type}", dependencies=[Depends(get_current_user)])
def rename_card(card_type: str, payload: dict):
    """设置某张卡片的显示名；name 传空字符串则恢复默认（删除覆盖）。"""
    if not card_type or "/" in card_type or "\\" in card_type or card_type in (".", ".."):
        raise HTTPException(status_code=400, detail="非法的卡片类型")
    name = str((payload or {}).get("name", "")).strip()
    state = _load_state()
    names = state.get("cardNames")
    if not isinstance(names, dict):
        names = {}
    if name:
        names[card_type] = name
    else:
        names.pop(card_type, None)
    state["cardNames"] = names
    _save_state(state)
    return {"code": 200, "message": "已保存", "data": {"names": names}}


# ------------------------------------------------------------------------------
# 卡片启用 / 禁用（内置卡片与插件卡片通用）
# ------------------------------------------------------------------------------
# 禁用后：
#   ① 不再出现在「添加卡片」列表里；
#   ② 已经放在主页 / 下拉屏上的实例显示为「已禁用」占位（不再渲染真实组件）。
# 插件卡片另有插件级的 enable/disable（整包启停），两者独立。

@router.get("/card-disabled")
def list_card_disabled():
    """返回被禁用的卡片类型列表。"""
    state = _load_state()
    disabled = state.get("cardDisabled")
    return {"disabled": disabled if isinstance(disabled, list) else []}


@router.post("/card-disabled/{card_type}", dependencies=[Depends(get_current_user)])
def set_card_disabled(card_type: str, payload: dict):
    """启用 / 禁用一张卡片。body: {"disabled": true|false}"""
    if not card_type or "/" in card_type or "\\" in card_type or card_type in (".", ".."):
        raise HTTPException(status_code=400, detail="非法的卡片类型")
    disabled = bool((payload or {}).get("disabled", True))
    state = _load_state()
    lst = state.get("cardDisabled")
    if not isinstance(lst, list):
        lst = []
    if disabled:
        if card_type not in lst:
            lst.append(card_type)
    else:
        lst = [x for x in lst if x != card_type]
    state["cardDisabled"] = lst
    _save_state(state)
    return {
        "code": 200,
        "message": "已禁用" if disabled else "已启用",
        "data": {"disabled": lst},
    }


def _safe_extract(zf: zipfile.ZipFile, dest: Path) -> None:
    """解压 zip 到 dest，阻止路径穿越（zip slip）。"""
    dest_resolved = dest.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    for member in zf.namelist():
        target = (dest / member).resolve()
        if not str(target).startswith(str(dest_resolved)):
            raise HTTPException(status_code=400, detail="压缩包包含非法路径，已拒绝")
    zf.extractall(dest)


def _resolve_plugin_root(extract_dir: Path):
    """从解压目录里找出真正存放 manifest.json 的插件根目录。

    支持两种常见打包方式：
      1) 根目录直接就是插件（manifest.json 在根）
      2) 根目录下只有一个（或第一个）含 manifest.json 的子目录
    """
    if (extract_dir / "manifest.json").exists():
        return extract_dir
    subs = [p for p in extract_dir.iterdir() if p.is_dir()]
    if len(subs) == 1 and (subs[0] / "manifest.json").exists():
        return subs[0]
    for s in subs:
        if (s / "manifest.json").exists():
            return s
    return None


@router.post("/upload", dependencies=[Depends(get_current_user)])
async def upload_plugin(file: UploadFile):
    """上传插件压缩包（.zip）并自动安装。

    压缩包结构：根目录含 manifest.json 与 entry 文件（或根目录下只有一个插件子目录）。
    上传后解压到 /config/hass-panel/plugins/<id>/ 并立即重扫，无需重启容器。
    """
    filename = (file.filename or "").lower()
    if not filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="只支持 .zip 格式的插件包")

    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)

    tmp_root = Path(tempfile.mkdtemp(prefix="plugin_upload_"))
    try:
        zip_bytes = await file.read()
        zip_path = tmp_root / "upload.zip"
        zip_path.write_bytes(zip_bytes)

        extract_dir = tmp_root / "extracted"
        with zipfile.ZipFile(zip_path, "r") as zf:
            _safe_extract(zf, extract_dir)

        plugin_dir = _resolve_plugin_root(extract_dir)
        if plugin_dir is None:
            raise HTTPException(
                status_code=400,
                detail="压缩包里找不到 manifest.json（需放在根目录或唯一的子目录中）",
            )

        manifest_path = plugin_dir / "manifest.json"
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"manifest.json 解析失败: {e}")

        pid = manifest.get("id") or plugin_dir.name
        if not manifest.get("cardType"):
            raise HTTPException(status_code=400, detail="manifest.json 缺少 cardType")
        entry = manifest.get("entry", "plugin.js")
        if not (plugin_dir / entry).exists():
            raise HTTPException(status_code=400, detail=f"manifest 指定的 entry 文件不存在: {entry}")

        dest = PLUGINS_DIR / pid
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(plugin_dir, dest)

        plugins = scan_plugins()
        installed = next((p for p in plugins if p["id"] == pid), None)
        return {
            "code": 200,
            "message": "插件上传成功",
            "data": {"plugin": installed, "count": len(plugins)},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {e}")
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)


# ------------------------------------------------------------------------------
# 插件管理：重命名 / 启用 / 禁用 / 卸载
# ------------------------------------------------------------------------------

def _valid_pid(pid: str) -> bool:
    """插件 id 必须是单个目录名，不能含路径分隔符或 ..（防目录穿越）。"""
    if not pid or pid in (".", ".."):
        return False
    return "/" not in pid and "\\" not in pid


def _set_enabled(pid: str, enabled: bool):
    if not _valid_pid(pid) or _find_plugin(pid) is None:
        raise HTTPException(status_code=404, detail="插件不存在")
    state = _load_state()
    entry = state.setdefault(pid, {})
    entry["enabled"] = bool(enabled)
    _save_state(state)
    scan_plugins()
    return {
        "code": 200,
        "message": "已启用" if enabled else "已禁用",
        "data": {"plugin": _find_plugin(pid)},
    }


@router.post("/{pid}/rename", dependencies=[Depends(get_current_user)])
def rename_plugin(pid: str, payload: dict):
    """重命名插件（只改显示名，不动 id / 目录）。name 传空字符串则恢复为 manifest 里的原名。"""
    if not _valid_pid(pid) or _find_plugin(pid) is None:
        raise HTTPException(status_code=404, detail="插件不存在")
    name = str((payload or {}).get("name", "")).strip()
    state = _load_state()
    entry = state.setdefault(pid, {})
    if name:
        entry["name"] = name
    else:
        entry.pop("name", None)
    _save_state(state)
    scan_plugins()
    return {"code": 200, "message": "已重命名", "data": {"plugin": _find_plugin(pid)}}


@router.post("/{pid}/enable", dependencies=[Depends(get_current_user)])
def enable_plugin(pid: str):
    return _set_enabled(pid, True)


@router.post("/{pid}/disable", dependencies=[Depends(get_current_user)])
def disable_plugin(pid: str):
    return _set_enabled(pid, False)


@router.delete("/{pid}", dependencies=[Depends(get_current_user)])
def uninstall_plugin(pid: str):
    """卸载插件：删除插件目录 + 清除其状态。"""
    if not _valid_pid(pid):
        raise HTTPException(status_code=400, detail="非法的插件 id")
    target = (PLUGINS_DIR / pid).resolve()
    if target.parent != PLUGINS_DIR.resolve() or not target.exists():
        raise HTTPException(status_code=404, detail="插件不存在")
    try:
        shutil.rmtree(target)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"卸载失败: {e}")
    state = _load_state()
    state.pop(pid, None)
    _save_state(state)
    scan_plugins()
    return {"code": 200, "message": "已卸载", "data": {"count": len(_PLUGIN_CACHE)}}
