from fastapi import APIRouter, Depends, UploadFile, HTTPException
from fastapi.responses import FileResponse
from loguru import logger
import asyncio
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from hass_panel.utils.config import cfg
from hass_panel.utils.common import (
    check_hass_token,
    compress_directory,
    generate_resp,
    handle_upload_file,
    get_file_name,
)
from hass_panel.core.auth_deps import get_current_user
from hass_panel.models.database import User, HassConfig, SessionLocal
from hass_panel.core.hash_utils import hash_password
from pydantic import BaseModel

router = APIRouter(
    prefix='/api/common',
    tags=['common']
)

# 上传目录（附件管理用）。与 notify 图片同源：cfg.base.upload_dir
UPLOAD_DIR = Path(cfg.base.upload_dir).resolve()

# 附件分类（按扩展名）
ANIMATED_EXT = {'.gif', '.webp', '.mp4', '.webm', '.apng', '.m4v', '.mov'}
ICON_EXT = {'.svg', '.ico'}
IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif', '.avif'}


def _category_of(name: str) -> str:
    ext = Path(name).suffix.lower()
    if ext in ANIMATED_EXT:
        return 'animated'
    if ext in ICON_EXT:
        return 'icon'
    if ext in IMAGE_EXT:
        return 'image'
    return 'other'


def _safe_name(name: str) -> str:
    """只允许单个文件名：禁止路径分隔符、.. 和空名（防目录穿越）。"""
    n = (name or '').strip()
    if not n or n in ('.', '..') or '/' in n or '\\' in n:
        raise HTTPException(status_code=400, detail='非法的文件名')
    return n

class InitializeData(BaseModel):
    username: str
    password: str
    hass_url: str
    hass_token: str = ""

@router.post("/upload")
async def upload_file(file: UploadFile):
    file_name, file_path = await handle_upload_file(file, file_dir=cfg.base.upload_dir)
    logger.info(f"Upload file: {file_name}, {file_path}")
    # 返回浏览器可直接访问的 URL，而不是服务器文件系统路径。
    # 原来的相对文件路径（如 ../data/xxx/upload/a.png）在开发环境解析出来是 404，
    # 只有生产环境靠 nginx 的 alias 才能访问。
    # 现在由 main.py 把上传目录挂在 /api/upload 下，这里返回相对 URL：
    # 开发环境走 CRA 代理，生产环境走 nginx 的 /api 代理，HA 插件模式下
    # 也能正确跟随 <base href>。
    return generate_resp(data={"file_name": file_name, "file_path": f"./api/upload/{file_name}"})


# ------------------------------------------------------------------------------
# 附件管理（上传目录里的图标 / 图片 / 动图）
# ------------------------------------------------------------------------------
# 只管理**顶层文件**，不动 notify 之类的子目录。
# 分类按扩展名：icon(.svg/.ico) / animated(.gif/.webp/.mp4/.webm/...) / image(其余图片) / other

class RenameAttachmentPayload(BaseModel):
    new_name: str


@router.get("/attachments", dependencies=[Depends(get_current_user)])
def list_attachments():
    """列出上传目录里的所有附件。"""
    items = []
    if UPLOAD_DIR.exists():
        for p in sorted(UPLOAD_DIR.iterdir(), key=lambda x: x.name.lower()):
            if not p.is_file():
                continue
            try:
                st = p.stat()
            except OSError:
                continue
            items.append({
                "name": p.name,
                "url": f"./api/upload/{p.name}",
                "size": st.st_size,
                "mtime": int(st.st_mtime),
                "category": _category_of(p.name),
            })
    return generate_resp(data={"items": items, "dir": str(UPLOAD_DIR)})


@router.post("/attachments/{name}/rename", dependencies=[Depends(get_current_user)])
def rename_attachment(name: str, payload: RenameAttachmentPayload):
    """重命名附件。新名没写扩展名时自动沿用原扩展名（避免改坏类型）。"""
    old = _safe_name(name)
    src = UPLOAD_DIR / old
    if not src.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")

    new_raw = _safe_name(payload.new_name)
    new = new_raw if Path(new_raw).suffix else f"{new_raw}{src.suffix}"
    dst = UPLOAD_DIR / new
    if dst.exists() and dst != src:
        raise HTTPException(status_code=400, detail="同名文件已存在")

    try:
        src.rename(dst)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"重命名失败: {e}")
    return generate_resp(data={"name": new, "url": f"./api/upload/{new}"})


@router.delete("/attachments/{name}", dependencies=[Depends(get_current_user)])
def delete_attachment(name: str):
    """删除附件。"""
    safe = _safe_name(name)
    target = UPLOAD_DIR / safe
    if not target.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")
    try:
        target.unlink()
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {e}")
    return generate_resp(data={"name": safe})


def _find_ffmpeg() -> Optional[str]:
    """定位 ffmpeg 二进制。

    - Docker 里 ffmpeg 装在 PATH 上（Dockerfile 用 apk add ffmpeg）。
    - 本地 Windows 开发：用 go2rtc 自带的 ffmpeg.exe（data/hass-panel-dev/go2rtc/）。
    """
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    candidates = [
        Path("../data/hass-panel-dev/go2rtc/ffmpeg.exe"),
        Path("data/hass-panel-dev/go2rtc/ffmpeg.exe"),
        Path(__file__).resolve().parents[3] / "data" / "hass-panel-dev" / "go2rtc" / "ffmpeg.exe",
    ]
    for c in candidates:
        if c.exists():
            return str(c.resolve())
    return None


class TranscodePayload(BaseModel):
    name: str                       # 源附件文件名（如 xxx.mp4）
    vcodec: str = "libvpx-vp9"    # VP9（体积更小）；想要更快可传 libvpx（VP8）
    crf: int = 34                  # VP9 质量（越大越小越糊）


# 转码任务表（进程内内存）。本地单实例 NAS 工具足够；多 worker 部署需换外部存储。
# 结构：task_id -> {"progress":0-100, "status":"running"|"done"|"error", "attachment":{...}, "error":str}
_TRANSCODE_TASKS: dict = {}


def _parse_ts(ts: str) -> float:
    """把 ffmpeg 的 HH:MM:SS.xx 解析成秒（浮点），解析失败返回 0。"""
    ts = (ts or "").strip()
    if not ts:
        return 0.0
    parts = ts.split(":")
    try:
        parts = [float(p) for p in parts]
    except ValueError:
        return 0.0
    if len(parts) == 3:
        h, m, s = parts
    elif len(parts) == 2:
        h, m, s = 0, parts[0], parts[1]
    elif len(parts) == 1:
        h, m, s = 0, 0, parts[0]
    else:
        return 0.0
    return h * 3600 + m * 60 + s


@router.post("/attachments/transcode", dependencies=[Depends(get_current_user)])
async def transcode_attachment_start(payload: TranscodePayload):
    """发起转码，立即返回 task_id（不阻塞）。真实进度用 GET /attachments/transcode/{task_id} 轮询。

    前端拿 task_id 后每 1 秒轮询一次，就能画真实进度条（当前时间 ÷ 总时长）。
    """
    src_name = _safe_name(payload.name)
    src = UPLOAD_DIR / src_name
    if not src.is_file():
        raise HTTPException(status_code=404, detail="源文件不存在")
    if _category_of(src_name) not in ("animated", "other"):
        raise HTTPException(status_code=400, detail="只能转换视频类附件")

    ffmpeg = _find_ffmpeg()
    if not ffmpeg:
        raise HTTPException(
            status_code=500,
            detail="未找到 ffmpeg，无法转码（Docker 请确认镜像已装 ffmpeg；本地开发需有 go2rtc/ffmpeg.exe）",
        )

    task_id = uuid.uuid4().hex
    _TRANSCODE_TASKS[task_id] = {
        "progress": 0,
        "status": "running",
        "attachment": None,
        "error": None,
        "cancel": False,
    }
    # 后台跑，不阻塞当前 HTTP 请求。转码在独立线程里用同步 subprocess 跑，
    # 绕开 Windows SelectorEventLoop 不支持 asyncio.create_subprocess_exec 的坑。
    asyncio.create_task(
        _run_transcode_async(task_id, src, ffmpeg, payload.vcodec, payload.crf)
    )
    return generate_resp(data={"task_id": task_id})


@router.get("/attachments/transcode/{task_id}", dependencies=[Depends(get_current_user)])
def transcode_progress(task_id: str):
    """轮询转码进度。只回传可序列化的字段（不把内部 _proc 对象暴露出去）。"""
    task = _TRANSCODE_TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期，请重新转换")
    return generate_resp(data={
        "progress": task.get("progress", 0),
        "status": task.get("status"),
        "attachment": task.get("attachment"),
        "error": task.get("error"),
    })


@router.post("/attachments/transcode/{task_id}/cancel", dependencies=[Depends(get_current_user)])
def transcode_cancel(task_id: str):
    """取消正在进行的转码：置 cancel 标记并 terminate ffmpeg 进程。"""
    task = _TRANSCODE_TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期，请重新转换")
    if task.get("status") != "running":
        return generate_resp(data={"task_id": task_id, "status": task.get("status")})
    task["cancel"] = True
    proc = task.get("_proc")
    if proc is not None:
        try:
            proc.terminate()
        except Exception:
            pass
    return generate_resp(data={"task_id": task_id, "cancelling": True})


async def _run_transcode_async(task_id: str, src: Path, ffmpeg: str, vcodec: str, crf: int):
    """在默认线程池里跑同步的 _run_transcode，避免阻塞事件循环，
    也绕开 Windows SelectorEventLoop 不支持 asyncio.create_subprocess_exec 的坑。"""
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _run_transcode, task_id, src, ffmpeg, vcodec, crf)


def _run_transcode(task_id: str, src: Path, ffmpeg: str, vcodec: str, crf: int):
    """后台转码（独立线程里跑）：用同步 subprocess 调 ffmpeg，实时读 stderr 的
    time= 进度写回 _TRANSCODE_TASKS[task_id]。支持取消（task['cancel']=True 时终止 ffmpeg）。"""
    task = _TRANSCODE_TASKS.get(task_id)
    if task is None:
        return
    # 输出名：原名去扩展名 + .webm，自动避免覆盖已有文件（foo.webm → foo_1.webm → foo_2.webm）
    stem = src.stem
    try:
        out_name = get_file_name(f"{stem}.webm", str(UPLOAD_DIR))
    except Exception as e:
        task["status"] = "error"
        task["error"] = f"生成输出文件名失败: {e}"
        return
    out = UPLOAD_DIR / out_name
    # -progress pipe:1：让 ffmpeg 把机器可读的进度（out_time= / progress=，按行 \n 输出）
    # 打到 stdout；再把 stderr 合并进 stdout，用单管道读取 —— 既不会双管道死锁，
    # 又能同时拿到报错文本。
    # ⚠️ 不能只读 stderr 的 stats 行：ffmpeg 的 stats 用 \r 分隔，按行读（for line in stderr）
    #    会被缓冲到进程结束才一次性吐出来，进度条就会一直不动、最后直接跳 100。
    cmd = [
        ffmpeg, "-y", "-progress", "pipe:1", "-i", str(src),
        "-c:v", vcodec,
        "-crf", str(crf),
        "-b:v", "0",
        "-an",
        str(out),
    ]
    proc = None
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        task["_proc"] = proc
        total = 0.0
        seen_total = False
        err_buf = []
        assert proc.stdout is not None
        # 边读边更新进度；每读一行都检查取消标记
        for raw in proc.stdout:
            if task.get("cancel"):
                proc.terminate()
                break
            line = raw.decode("utf-8", "ignore")
            err_buf.append(line)
            if len(err_buf) > 40:
                err_buf.pop(0)
            if not seen_total:
                m = re.search(r"Duration:\s*(\d+:\d+:\d+\.\d+)", line)
                if m:
                    total = _parse_ts(m.group(1))
                    seen_total = True
            m = re.search(r"out_time=(\d+:\d+:\d+\.\d+)", line)
            if m and total > 0:
                cur = _parse_ts(m.group(1))
                task["progress"] = min(99, int(cur / total * 100))
        rc = proc.wait()
        task.pop("_proc", None)
        # 取消分支：清理半成品，标记 cancelled
        if task.get("cancel"):
            if out.exists():
                try:
                    out.unlink()
                except OSError:
                    pass
            task["status"] = "cancelled"
            task["error"] = None
            return
        if rc != 0:
            if out.exists():
                try:
                    out.unlink()
                except OSError:
                    pass
            task["status"] = "error"
            task["error"] = "ffmpeg 退出码 %d：%s" % (
                rc,
                "".join(err_buf)[-600:],
            )
            return
        st = out.stat()
        task["progress"] = 100
        task["status"] = "done"
        task["attachment"] = {
            "name": out_name,
            "url": f"./api/upload/{out_name}",
            "size": st.st_size,
            "mtime": int(st.st_mtime),
            "category": _category_of(out_name),
        }
    except Exception as e:  # pragma: no cover - 极端环境错误
        proc = task.pop("_proc", None)
        if proc is not None:
            try:
                proc.kill()
            except Exception:
                pass
        if out.exists():
            try:
                out.unlink()
            except OSError:
                pass
        task["status"] = "error"
        task["error"] = f"转码异常: {e}"



@router.get("/init_info")
async def init_info():
    """检查系统是否已初始化"""
    db = SessionLocal()
    try:
        # 检查是否存在用户和Home Assistant配置
        user_count = db.query(User).count()
        hass_config = db.query(HassConfig).first()
        is_initialized = user_count > 0 and hass_config is not None
        return generate_resp(data={
            "is_initialized": is_initialized
        })
    finally:
        db.close()

@router.post("/initialize")
async def initialize(data: InitializeData):
    """系统初始化"""
    db = SessionLocal()
    try:
        # 检查是否已初始化
        if db.query(User).count() > 0 or db.query(HassConfig).count() > 0:
            return generate_resp(code=400, message="System already initialized")
        
        # 如果添加了hass_url和hass_token 需要判断url是否合规
        if data.hass_url:
            if not data.hass_url.startswith("http://") and not data.hass_url.startswith("https://"):
                return generate_resp(code=401, message="Invalid Home Assistant URL")

        if data.hass_token:
            if not await check_hass_token(data.hass_url, data.hass_token):
                return generate_resp(code=402, message="Invalid Home Assistant Token")
        

        # 创建管理员用户
        admin_user = User(
            username=data.username,
            hashed_password=data.password,
            is_active=True
        )
        db.add(admin_user)
        
        # 创建Home Assistant配置
        hass_url = data.hass_url.rstrip("/")
        hass_config = HassConfig(
            hass_url=data.hass_url,
            hass_token=data.hass_token
        )
        db.add(hass_config)
        
        db.commit()
        return generate_resp(message="System initialized successfully")
    except Exception as e:
        db.rollback()
        return generate_resp(code=500, message=str(e))
    finally:
        db.close()

@router.post("/reinitialize")
async def reinitialize(current_user: User = Depends(get_current_user)):
    """重新初始化"""
    db = SessionLocal()
    try:
        # 删除所有用户和Home Assistant配置
        db.query(User).delete()
        db.query(HassConfig).delete()
        db.commit()
        return generate_resp(message="System reinitialized successfully")
    except Exception as e:
        db.rollback()
        return generate_resp(code=500, message=str(e))
    finally:
        db.close()

# 下载日志
@router.get("/download_log")
async def download_log(current_user: User = Depends(get_current_user)):
    """下载日志文件
    将日志目录打包成zip文件并提供下载
    """
    try:
        log_path = cfg.log.server_log
        if not os.path.exists(log_path):
            raise HTTPException(status_code=404, detail="Log directory not found")
        
        # 创建临时zip文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"hass_panel_logs_{timestamp}.tar"
        zip_path = os.path.join('/tmp', zip_filename)
        compress_directory(log_path, zip_path)
        # 返回文件响应
        return FileResponse(
            path=zip_path,
            filename=zip_filename,
            media_type='application/x-tar',
            background=None  # 同步删除临时文件
        )
    except Exception as e:
        logger.error(f"Failed to download logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

