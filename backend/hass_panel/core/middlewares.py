"""自定义异常中间件（只保留真正在用的 proc_custom_exception）。

历史包袱清理（2026-10-12）：add_process_time_header / log_request /
CorrelationIdMiddleware 这套 boilerplate 全项目无人使用（log_request 还引用不存在的
request.app.state.logger），已删。
"""
from asyncio.exceptions import TimeoutError

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

from .exc import CustomException
# ⚠️ 必须用绝对导入：原来写 `from utils.common import ...` 只在「python hass_panel/main.py」
# 这种脚本入口下才解析（sys.path[0] 恰好在 hass_panel/ 里），换成
# `uvicorn hass_panel.main:app` 就直接 ModuleNotFoundError。
from hass_panel.utils.common import generate_resp


async def proc_custom_exception(request: Request, call_next):
    """把自定义异常和 asyncio 超时翻译成统一的 JSON 响应。"""
    try:
        response = await call_next(request)
    except TimeoutError:
        response = JSONResponse(generate_resp(code=-1, message="MicroService Disconnect"))
    except CustomException as e:
        response = JSONResponse(generate_resp(**e.ret))
    return response
