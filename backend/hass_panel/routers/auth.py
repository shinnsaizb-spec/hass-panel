from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import time

from hass_panel.core.deps import get_db
from hass_panel.core.hash_utils import verify_password, hash_password, needs_rehash
from hass_panel.core.jwt_utils import create_access_token
from hass_panel.models.database import User
from hass_panel.utils.config import cfg

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

# ==============================================================================
# 登录失败限流（内存级，单实例部署足够）
# ------------------------------------------------------------------------------
# 为什么必须有：bcrypt cost=12 单次约 200ms（NAS 上更慢），没有限流时
# 几百个并发登录请求就能把 CPU 打满（DoS）；同时暴力破解毫无摩擦成本。
# 两个维度同时计数：按来源 IP（防单机扫）与按用户名（防换 IP 打同一个账号）。
# ⚠️ 走 nginx 时优先信 X-Forwarded-For 的第一个地址；直连暴露时该头可伪造，
#    但「按用户名」那一路仍然生效，不会被绕过。
# ==============================================================================

_MAX_FAILS = 5              # 连续失败到这个次数后开始封禁
_BASE_BLOCK_SECONDS = 2     # 首次封禁时长
_MAX_BLOCK_SECONDS = 60     # 封禁上限（指数退避到此为止）
_GUARD_TTL = 600            # 记录保留时间（超过就清，防内存增长）

_login_guard: dict = {}     # key -> {"fails": int, "blocked_until": float, "last": float}


def _guard_keys(request: Request, username: str) -> list:
    xff = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    ip = xff or (request.client.host if request.client else "unknown")
    return [f"ip:{ip}", f"user:{username}"]


def _guard_wait(keys: list) -> int:
    """返回需要等待的秒数（0 = 放行）；顺带清理过期记录。"""
    now = time.time()
    for k in [k for k, v in _login_guard.items() if now - v["last"] > _GUARD_TTL]:
        _login_guard.pop(k, None)
    wait = 0
    for k in keys:
        rec = _login_guard.get(k)
        if rec and rec["blocked_until"] > now:
            wait = max(wait, int(rec["blocked_until"] - now) + 1)
    return wait


def _guard_fail(keys: list) -> None:
    now = time.time()
    for k in keys:
        rec = _login_guard.setdefault(k, {"fails": 0, "blocked_until": 0.0, "last": now})
        rec["fails"] += 1
        rec["last"] = now
        if rec["fails"] >= _MAX_FAILS:
            over = rec["fails"] - _MAX_FAILS
            rec["blocked_until"] = now + min(_BASE_BLOCK_SECONDS * (2 ** over), _MAX_BLOCK_SECONDS)


def _guard_ok(keys: list) -> None:
    for k in keys:
        _login_guard.pop(k, None)


@router.post("/token")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    登录接口
    前端需要先将密码进行MD5加密后再传输
    """
    keys = _guard_keys(request, form_data.username)
    wait = _guard_wait(keys)
    if wait > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"登录尝试过于频繁，请 {wait} 秒后重试",
            headers={"Retry-After": str(wait)},
        )

    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        _guard_fail(keys)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        _guard_fail(keys)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user.hashed_password):
        _guard_fail(keys)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 登录成功 → 清掉失败计数
    _guard_ok(keys)

    # 存量记录（MD5 直传时代存的值）登录成功即升级成 bcrypt，用户无感
    if needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(form_data.password)
        db.commit()

    access_token_expires = timedelta(days=cfg.security.ACCESS_TOKEN_EXPIRE_DAYS)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "Bearer"
    }


# ⚠️ 这里曾经有一个完全开放的 `POST /register`（无鉴权、无「是否已初始化」判断）：
#    任何能访问面板端口的人都能自助创建账号，登录后即拿到全部权限。
#    前端从未调用过它（初始化由 /api/common/initialize 负责创建管理员），
#    属于纯攻击面，已于 2026-10-12 删除。
#    若将来确实需要多用户注册，必须加 Depends(get_current_user)（仅登录用户可加人）
#    并且用请求体传参（不要用 query，密码会进 access log）。