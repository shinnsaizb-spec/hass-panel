"""共享的 aiohttp ClientSession（惰性单例）。

背景：notify 图片代理 / 图片下载 / 每日一句各自在调用处 `async with
aiohttp.ClientSession()`——每请求新建会话，零连接复用，每次都重新 TCP+TLS。

用法：
    from hass_panel.utils.http_client import get_shared_session
    session = get_shared_session()
    async with session.get(url, timeout=...) as resp:
        ...

⚠️ 惰性创建：必须在「有 running loop 的协程里」首次调用（请求处理时天然满足），
   不要在模块导入时创建（那时还没有事件循环）。
⚠️ 不提供 close：进程级单例，退出时自然释放；被异常关闭后下次调用会自动重建。
"""

import aiohttp

_shared_session = None


def get_shared_session() -> aiohttp.ClientSession:
    """拿共享 session；不存在 / 已关闭则重建。"""
    global _shared_session
    if _shared_session is None or _shared_session.closed:
        _shared_session = aiohttp.ClientSession()
    return _shared_session


async def close_shared_session() -> None:
    """关闭共享 session（应用退出时调用；下次 get 会自动重建）。"""
    global _shared_session
    if _shared_session is not None and not _shared_session.closed:
        await _shared_session.close()
    _shared_session = None
