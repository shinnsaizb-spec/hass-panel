import asyncio
import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

import aiohttp
from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from hass_panel.core.auth_deps import get_current_user
from hass_panel.core.deps import get_db
from hass_panel.models.database import NotifyMessage, SessionLocal
from hass_panel.utils.common import generate_resp
from hass_panel.utils.config import cfg
from loguru import logger

router = APIRouter(prefix="/api/notify", tags=["notify"])

# 内存中的 SSE 订阅者队列集合（每个在线主页一个队列）
_subscribers: set = set()

# webhook 令牌：默认一个简单值，可在 config/*.toml 的 [base] notify_token 修改。
# 外部系统（Home Assistant 自动化 / n8n 等）调用 /api/notify/webhook?token=xxx 时校验。
NOTIFY_TOKEN = cfg.base.get("notify_token", "hasspanel")

# 全局配置（config.json -> globalConfig）所在目录，通知相关设置从这里读
CONFIG_DIR = Path(cfg.base.user_config_dir)

# 图片保存目录（挂在 /api/upload 下）
NOTIFY_IMAGE_DIR = Path(cfg.base.upload_dir) / "notify"

VALID_LEVELS = ("info", "success", "warning", "error")


class NotifyPayload(BaseModel):
    title: str = ""
    message: str = ""
    level: str = "info"          # info | success | warning | error
    format: str = "text"         # text | markdown
    persist: bool = False        # True=长期保留；False=临时消息（只留最近 N 条）


def _read_global_config() -> dict:
    """读取 config.json 里的 globalConfig（读不到就返回空字典）。"""
    try:
        cfg_file = CONFIG_DIR / "config.json"
        if not cfg_file.exists():
            return {}
        with open(cfg_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        gc = data.get("globalConfig") or {}
        return gc if isinstance(gc, dict) else {}
    except Exception as e:
        logger.warning(f"[notify] 读取全局配置失败，使用默认值: {e}")
        return {}


def _limit(name: str, default: int) -> int:
    """从全局配置里取一个正整数上限。"""
    raw = _read_global_config().get(name)
    try:
        val = int(str(raw).strip())
        return val if val > 0 else default
    except Exception:
        return default


def _make_item(title: str, message: str, level: str, fmt: str = "text", persist: bool = False) -> dict:
    return {
        "id": uuid.uuid4().hex,
        "title": title or "通知",
        "message": message or "",
        "level": level if level in VALID_LEVELS else "info",
        "format": "markdown" if fmt == "markdown" else "text",
        "persist": bool(persist),
        "read": False,
        "timestamp": datetime.now().isoformat(),
    }


async def _maybe_save_images(item: dict) -> dict:
    """长期消息 + 开启「保存图片」时，把 Markdown 里的图片下载到本地，避免原图失效。

    默认关闭（notifySaveImages），只有用户明确开启才会占用磁盘。
    """
    gc = _read_global_config()
    if not item.get("persist"):
        return item
    if not gc.get("notifySaveImages"):
        return item
    if item.get("format") != "markdown" or not item.get("message"):
        return item

    urls = re.findall(r"!\[[^\]]*\]\((https?://[^)\s]+)\)", item["message"])
    if not urls:
        return item

    NOTIFY_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for url in urls:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        continue
                    ct = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
                    if not ct.startswith("image/"):
                        continue
                    ext = ct.split("/")[-1].split("+")[0][:5] or "png"
                    fname = f"{uuid.uuid4().hex}.{ext}"
                    with open(NOTIFY_IMAGE_DIR / fname, "wb") as fp:
                        fp.write(await resp.read())
                item["message"] = item["message"].replace(url, f"./api/upload/notify/{fname}")
            except Exception as e:
                logger.warning(f"[notify] 保存图片失败 {url}: {e}")
    return item


def _save(item: dict):
    """落库 + 按两级上限清理。"""
    db = SessionLocal()
    try:
        row = NotifyMessage(
            id=item["id"],
            title=item["title"],
            message=item["message"],
            level=item["level"],
            format=item["format"],
            persist=item["persist"],
            read=False,
            created_at=datetime.fromisoformat(item["timestamp"]),
        )
        db.add(row)
        db.commit()
        _prune(db, False, _limit("notifyRecentLimit", 50))
        _prune(db, True, _limit("notifyHistoryLimit", 500))
        db.commit()
    except Exception as e:
        logger.error(f"[notify] 保存通知失败: {e}")
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        db.close()


def _prune(db: Session, persist_flag: bool, limit: int):
    """只保留该类消息中最近的 limit 条，其余删除。"""
    if limit <= 0:
        return
    keep = (
        db.query(NotifyMessage.id)
        .filter(NotifyMessage.persist == persist_flag)
        .order_by(NotifyMessage.created_at.desc())
        .limit(limit)
        .subquery()
    )
    db.query(NotifyMessage).filter(
        NotifyMessage.persist == persist_flag,
        ~NotifyMessage.id.in_(select(keep.c.id)),
    ).delete(synchronize_session=False)


async def _broadcast(item: dict):
    """把一条通知推送给所有在线的 SSE 连接。"""
    dead = []
    for q in list(_subscribers):
        try:
            await q.put(item)
        except Exception:
            dead.append(q)
    for q in dead:
        _subscribers.discard(q)


async def _receive(item: dict):
    """统一的接收流程：可选保存图片 -> 落库 -> 广播。"""
    item = await _maybe_save_images(item)
    _save(item)
    await _broadcast(item)
    return item


@router.get("/info", dependencies=[Depends(get_current_user)])
async def notify_info(request: Request):
    """返回 webhook 地址和令牌，方便在前端复制使用（需登录）。"""
    base = str(request.base_url).rstrip("/")
    full_url = f"{base}/api/notify/webhook?token={NOTIFY_TOKEN}"
    return generate_resp(data={
        "url": "./api/notify/webhook",
        "token": NOTIFY_TOKEN,
        "full_url": full_url,
    })


@router.post("/webhook")
async def notify_webhook_post(payload: NotifyPayload, request: Request):
    token = request.query_params.get("token") or request.headers.get("X-Notify-Token") or ""
    if NOTIFY_TOKEN and token != NOTIFY_TOKEN:
        return generate_resp(code=401, error="invalid token")
    item = _make_item(
        payload.title, payload.message, payload.level, payload.format, payload.persist
    )
    await _receive(item)
    return generate_resp(data=item, message="ok")


@router.get("/webhook")
async def notify_webhook_get(request: Request):
    """支持 GET，方便一些只发 GET 的系统。"""
    params = request.query_params
    token = params.get("token") or ""
    if NOTIFY_TOKEN and token != NOTIFY_TOKEN:
        return generate_resp(code=401, error="invalid token")
    persist_raw = (params.get("persist") or "").strip().lower()
    item = _make_item(
        params.get("title", ""),
        params.get("message", ""),
        params.get("level", "info"),
        params.get("format", "text"),
        persist_raw in ("1", "true", "yes", "on"),
    )
    await _receive(item)
    return generate_resp(data=item, message="ok")


@router.get("/history", dependencies=[Depends(get_current_user)])
async def notify_history(
    type: str = "all",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """历史消息列表（需登录）。

    type: all | persisted（长期） | recent（临时）
    返回按时间倒序，并带上未读数量。
    """
    q = db.query(NotifyMessage)
    if type == "persisted":
        q = q.filter(NotifyMessage.persist.is_(True))
    elif type == "recent":
        q = q.filter(NotifyMessage.persist.is_(False))
    total = q.count()
    unread = q.filter(NotifyMessage.read.is_(False)).count()
    rows = (
        q.order_by(NotifyMessage.created_at.desc())
        .offset(max(0, offset))
        .limit(min(max(1, limit), 200))
        .all()
    )
    return generate_resp(data={
        "items": [
            {
                "id": r.id,
                "title": r.title,
                "message": r.message,
                "level": r.level,
                "format": r.format,
                "persist": bool(r.persist),
                "read": bool(r.read),
                "timestamp": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ],
        "total": total,
        "unread": unread,
    })


class ReadPayload(BaseModel):
    id: str = ""
    all: bool = False


@router.post("/read", dependencies=[Depends(get_current_user)])
async def notify_read(payload: ReadPayload, db: Session = Depends(get_db)):
    """标记已读：传 id 标记单条，传 all=true 标记全部。"""
    if payload.all:
        db.query(NotifyMessage).filter(NotifyMessage.read.is_(False)).update(
            {"read": True}, synchronize_session=False
        )
        db.commit()
        return generate_resp(data={"updated": "all"}, message="ok")
    if not payload.id:
        return generate_resp(code=400, error="id required")
    row = db.query(NotifyMessage).filter(NotifyMessage.id == payload.id).first()
    if not row:
        return generate_resp(code=404, error="not found")
    row.read = True
    db.commit()
    return generate_resp(data={"id": payload.id}, message="ok")


@router.delete("/message/{msg_id}", dependencies=[Depends(get_current_user)])
async def notify_delete(msg_id: str, db: Session = Depends(get_db)):
    row = db.query(NotifyMessage).filter(NotifyMessage.id == msg_id).first()
    if not row:
        return generate_resp(code=404, error="not found")
    db.delete(row)
    db.commit()
    return generate_resp(data={"id": msg_id}, message="ok")


@router.delete("/clear", dependencies=[Depends(get_current_user)])
async def notify_clear(type: str = "all", db: Session = Depends(get_db)):
    """清空：all | persisted | recent"""
    q = db.query(NotifyMessage)
    if type == "persisted":
        q = q.filter(NotifyMessage.persist.is_(True))
    elif type == "recent":
        q = q.filter(NotifyMessage.persist.is_(False))
    q.delete(synchronize_session=False)
    db.commit()
    return generate_resp(data={"cleared": type}, message="ok")


@router.get("/stream")
async def notify_stream():
    """SSE 流：主页通知弹窗从这里实时接收消息。"""
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.add(q)

    async def event_generator():
        try:
            yield "event: ready\ndata: {}\n\n"
            while True:
                item = await q.get()
                data = json.dumps(item, ensure_ascii=False)
                yield f"event: message\ndata: {data}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            _subscribers.discard(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ===== 图片代理 =====
# 让前端不直接访问外链：可以带 HA token、限制大小、校验类型。
# 安全上做基本防护：只放行 http/https、禁止云元数据地址、限时、限大小、校验 Content-Type。

BLOCKED_HOSTS = {"169.254.169.254", "metadata.google.internal"}


def _image_cfg():
    gc = _read_global_config()
    max_mb = 10
    timeout_s = 10
    try:
        max_mb = int(str(gc.get("notifyImageMaxSize", 10)).strip())
    except Exception:
        pass
    try:
        timeout_s = int(str(gc.get("notifyImageTimeout", 10)).strip())
    except Exception:
        pass
    return max_mb, timeout_s


@router.get("/image")
async def notify_image(url: str = "", token: str = ""):
    """代理加载通知里的图片。

    鉴权方式和 /webhook 一致（用 notify token），因为 <img> 无法携带 Authorization 头。
    """
    if NOTIFY_TOKEN and token != NOTIFY_TOKEN:
        return generate_resp(code=401, error="invalid token")
    if not url:
        return generate_resp(code=400, error="url required")

    try:
        from urllib.parse import urlparse
        p = urlparse(url)
        if p.scheme not in ("http", "https"):
            return generate_resp(code=400, error="unsupported scheme")
        if p.hostname in BLOCKED_HOSTS:
            return generate_resp(code=400, error="blocked host")
    except Exception:
        return generate_resp(code=400, error="bad url")

    max_mb, timeout_s = _image_cfg()
    max_bytes = max(1, max_mb) * 1024 * 1024

    timeout = aiohttp.ClientTimeout(total=max(1, timeout_s))
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return generate_resp(code=502, error=f"upstream {resp.status}")
                ct = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
                if not ct.startswith("image/"):
                    return generate_resp(code=415, error="not an image")
                # 边读边限制大小，避免大图把内存打满
                chunks = []
                total = 0
                async for chunk in resp.content.iter_chunked(64 * 1024):
                    total += len(chunk)
                    if total > max_bytes:
                        return generate_resp(code=413, error="image too large")
                    chunks.append(chunk)
                return Response(content=b"".join(chunks), media_type=ct)
    except asyncio.TimeoutError:
        return generate_resp(code=504, error="image timeout")
    except Exception as e:
        logger.warning(f"[notify] 图片代理失败 {url}: {e}")
        return generate_resp(code=502, error="fetch failed")
