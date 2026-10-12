import os
import sys
# 以脚本方式启动时（`python hass_panel/main.py`），sys.path[0] 是 hass_panel/，
# 而包内全是 `hass_panel.xxx` 绝对导入 → 需要把上层目录（backend/）也加进来。
# 用绝对路径而不是 '.'：不受当前工作目录影响（也少一个「同目录文件劫持 import」的口子）。
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from hass_panel.core.middlewares import proc_custom_exception
from hass_panel.routers import update, user_config, common, auth, users, hass, daily_quote, onvif_ctl, notify, plugins, floorplan
from hass_panel.core.initial import lifespan
from hass_panel.utils.common import generate_resp
from hass_panel.utils.config import cfg
from loguru import logger
ROUTERS = [
    common.router,
    update.router,
    user_config.router,
    auth.router,
    users.router,
    hass.router,
    daily_quote.router,
    onvif_ctl.router,
    notify.router,
    plugins.router,
    floorplan.router
]


app = FastAPI(
    title=cfg.base.name.upper(), 
    lifespan=lifespan,
)



# ROUTERS
for r in ROUTERS:
    app.include_router(r)

# 静态文件：上传的图片 / 视频（背景壁纸等）
# 挂在 /api/upload 下，这样开发环境的 CRA 代理（只转发 /api）和生产环境的 nginx
# 都能直接访问到，无需再单独配置静态目录。
_upload_dir = cfg.base.upload_dir
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/api/upload", StaticFiles(directory=_upload_dir), name="upload")

# 插件 bundle 静态目录
#   主用：/api/plugin-assets/<plugin-id>/<entry>
#        —— 走 /api 前缀，开发环境 CRA 代理、生产环境 nginx 都必然转发 /api，
#           不依赖 /plugins 代理（dev server 未重启时 /plugins 会回退成 index.html）。
#   兼容：/plugins/...（生产 nginx 的 location /plugins alias 仍可用）
_plugins_dir = plugins.PLUGINS_DIR
os.makedirs(_plugins_dir, exist_ok=True)
app.mount("/api/plugin-assets", StaticFiles(directory=str(_plugins_dir)), name="plugin_assets")
app.mount("/plugins", StaticFiles(directory=str(_plugins_dir)), name="plugins")

# MIDDLEWARE
# CORS：默认「仅同源」。面板自身就是同源部署（nginx / CRA 代理 / HA ingress 全都满足），
# 原来的 `allow_origins=["*"] + allow_credentials=True` 是**无效且危险**的组合
# （浏览器规范下 * 与 credentials 互斥，Starlette 会回显 Origin，等于任意网站
# 都能带凭证跨域调用面板 API）。确需跨源时在 config/*.toml 的
# `[security] cors_allow_origins` 里显式列出允许的来源。
_cors_origins = [str(o) for o in (cfg.security.get('cors_allow_origins', []) or []) if str(o).strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
app.add_middleware(BaseHTTPMiddleware, dispatch=proc_custom_exception)

# 请求体上限：全局 20MB（够放下户型图 dataURL 的 14MB 上限），
# 上传类端点豁免（它们内部有分块 + 各自的大小上限）。
_MAX_BODY_BYTES = 20 * 1024 * 1024
_BODY_LIMIT_EXEMPT_PREFIXES = (
    "/api/common/upload",
    "/api/plugins/upload",
    "/api/upload-update",
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    """请求体大小上限（默认 20MB）。

    Starlette/FastAPI 默认**不限制** body 大小，任何 POST 都会被完整缓冲进内存
    —— 一个超大 body 就能把面板 OOM。这里按 Content-Length 预检。
    上传类端点（附件 100MB / 更新包 200MB）在各自端点内已有分块上限，单独豁免。
    ⚠️ 局限：`Transfer-Encoding: chunked`（无 Content-Length）的请求不受此检查约束，
       要彻底解决需包装 receive 调用，暂不做。
    """
    if not request.url.path.startswith(_BODY_LIMIT_EXEMPT_PREFIXES):
        cl = request.headers.get("content-length")
        if cl and cl.isdigit() and int(cl) > _MAX_BODY_BYTES:
            return JSONResponse(
                generate_resp(code=413, message=f"请求体过大：上限 {_MAX_BODY_BYTES // 1024 // 1024}MB"),
                status_code=413,
            )
    return await call_next(request)


@app.middleware("http")
async def add_upload_security_headers(request: Request, call_next):
    """给上传目录（/api/upload，与面板同源）的响应加安全头。

    上传接口做了文件名净化 + 扩展名白名单，但 .svg 因图标功能必须放行。
    万一被当页面直接打开，`default-src 'none'` 会让里面的脚本全部失效；
    而页面里 `<img src>` 引用它不受影响（img 上下文本来就不执行脚本）。
    """
    response = await call_next(request)
    if request.url.path.startswith("/api/upload"):
        response.headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'"
        response.headers["X-Content-Type-Options"] = "nosniff"
    return response



if __name__ == '__main__':
    print(f"Starting {cfg.base.name} on port {cfg.base.web_port}, env: {cfg.base.env}")
    uvicorn.run(
        app='main:app', 
        host="0.0.0.0", 
        port=cfg.base.web_port, 
        reload=cfg.base.debug
    )
