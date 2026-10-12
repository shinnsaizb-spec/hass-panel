import os
import secrets
from pathlib import Path

import toml
from omegaconf import OmegaConf


def is_running_in_docker():
    return os.path.exists('/.dockerenv') or os.path.exists('/run/.containerenv')


cfg_type = 'prod' if is_running_in_docker() else 'dev'

config_path = f'config/{cfg_type}.toml'


def read_config(config_path):
    with open(config_path, "r") as cfg_fp:
        cfg = toml.load(cfg_fp)
    return OmegaConf.create(cfg)


cfg = read_config(config_path)


# ==============================================================================
# JWT 签名密钥解析
# ------------------------------------------------------------------------------
# 背景：config/*.toml 里的 SECRET_KEY 原本是**硬编码的同一个值**（还是 FastAPI
# 教程示例串，公开可查）—— 任何人拿到仓库就能给任意用户名伪造有效 JWT，再配合
# `/api/user_config/hass_config` 明文回传 HA 长期令牌，等于直接控制智能家居。
#
# 现在的解析优先级（从高到低）：
#   1. 环境变量 HASS_PANEL_SECRET_KEY（>=32 位，给高级用户/多实例部署用）
#   2. 数据目录下的 .secret_key 文件（首次启动时自动生成并落盘，重启保持同一个）
#   3. toml 里的值 —— **仅当用户自己改过**（非占位值且 >=32 位）才尊重
#   4. 都不满足 → 生成随机密钥（secrets.token_hex(32)）并原子落盘
#
# ⚠️ 升级影响：老部署的 toml 值是占位串，升级后首次启动会换成随机密钥，
#    **所有已签发的 JWT 立即失效，用户需要重新登录一次**（仅此一次）。
# ==============================================================================

# 已知的硬编码占位密钥（公开可查，绝不能再当签名密钥用）
_KNOWN_PLACEHOLDER_SECRETS = {
    '09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7',
}

# 环境变量名
_SECRET_ENV = 'HASS_PANEL_SECRET_KEY'
# 落盘文件名（放在 sqlite / 上传文件所在的数据根目录）
_SECRET_FILE_NAME = '.secret_key'
# 可接受的最短长度（HS256 至少 256 bit）
_MIN_SECRET_LEN = 32


def _secret_file_path() -> Path:
    """数据根目录（user_config_dir 的上一级）下的 .secret_key。"""
    base = Path(cfg.base.user_config_dir).resolve().parent
    return base / _SECRET_FILE_NAME


def _read_persisted_secret():
    try:
        p = _secret_file_path()
        if p.is_file():
            v = p.read_text(encoding='utf-8').strip()
            if len(v) >= _MIN_SECRET_LEN:
                return v
    except OSError:
        pass
    return None


def _persist_secret(value: str) -> None:
    """把密钥写进数据目录。

    用 O_EXCL 原子创建：多个进程同时首启时只有一个能创建成功，
    输家走到 FileExistsError 后重新读文件，保证所有进程用同一个密钥
    （否则 uvicorn 多 worker 下会出现「这本 Token 换个进程就 401」）。
    """
    p = _secret_file_path()
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            os.write(fd, value.encode('utf-8'))
        finally:
            os.close(fd)
    except FileExistsError:
        pass  # 别的进程先写了，读它的即可
    except OSError as e:
        # 只读文件系统等极端情况：不阻塞启动，本次运行用内存里的随机值
        try:
            from loguru import logger
            logger.warning(f'密钥无法落盘（本次运行使用临时随机值，重启后会变）: {e}')
        except Exception:
            pass


def _resolve_secret_key() -> str:
    env = (os.environ.get(_SECRET_ENV) or '').strip()
    if len(env) >= _MIN_SECRET_LEN:
        return env

    persisted = _read_persisted_secret()
    if persisted:
        return persisted

    current = str(cfg.security.SECRET_KEY or '').strip()
    if current and len(current) >= _MIN_SECRET_LEN and current not in _KNOWN_PLACEHOLDER_SECRETS:
        # 用户自己改过 toml：尊重它
        return current

    # 空值 / 已知占位值 → 生成随机密钥并落盘
    new_secret = secrets.token_hex(32)
    _persist_secret(new_secret)
    try:
        from loguru import logger
        logger.warning(
            'SECRET_KEY 为空或仍是公开的占位值，已生成随机密钥并写入 '
            f'{_secret_file_path()}（所有旧登录态已失效，需重新登录一次）'
        )
    except Exception:
        pass
    return new_secret


cfg.security.SECRET_KEY = _resolve_secret_key()


# ==============================================================================
# 通知 webhook 令牌解析（与 SECRET_KEY 同一套思路）
# ------------------------------------------------------------------------------
# 两个 toml 里都是同一个弱默认值 "hasspanel"。拿到它能干的事：向面板推送伪造通知，
# 以及把 /api/notify/image 当 SSRF 代理用。所以首次启动换成随机值并落盘。
#
# ⚠️ 升级影响：老部署的 webhook 令牌会变。HA 自动化 / n8n 里配了旧地址的，
#    需要从面板「通知」设置里复制新的完整 webhook 地址（/api/notify/info 会返回）。
# ==============================================================================

_KNOWN_WEAK_NOTIFY_TOKENS = {'hasspanel', ''}
_NOTIFY_TOKEN_ENV = 'HASS_PANEL_NOTIFY_TOKEN'
_NOTIFY_TOKEN_FILE_NAME = '.notify_token'
_MIN_NOTIFY_TOKEN_LEN = 8


def _notify_token_file_path() -> Path:
    base = Path(cfg.base.user_config_dir).resolve().parent
    return base / _NOTIFY_TOKEN_FILE_NAME


def _resolve_notify_token() -> str:
    env = (os.environ.get(_NOTIFY_TOKEN_ENV) or '').strip()
    if len(env) >= _MIN_NOTIFY_TOKEN_LEN:
        return env

    try:
        p = _notify_token_file_path()
        if p.is_file():
            v = p.read_text(encoding='utf-8').strip()
            if len(v) >= _MIN_NOTIFY_TOKEN_LEN:
                return v
    except OSError:
        pass

    current = str(cfg.base.notify_token or '').strip()
    if current and current not in _KNOWN_WEAK_NOTIFY_TOKENS and len(current) >= _MIN_NOTIFY_TOKEN_LEN:
        # 用户自己改过 toml：尊重它
        return current

    # 弱默认值 → 生成随机令牌并落盘
    new_token = secrets.token_hex(12)  # 24 位十六进制
    try:
        p = _notify_token_file_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            os.write(fd, new_token.encode('utf-8'))
        finally:
            os.close(fd)
    except FileExistsError:
        pass
    except OSError as e:
        try:
            from loguru import logger
            logger.warning(f'通知令牌无法落盘（本次运行使用临时随机值）: {e}')
        except Exception:
            pass
    try:
        from loguru import logger
        logger.warning(
            'notify_token 仍是公开的弱默认值，已生成随机令牌并写入 '
            f'{_notify_token_file_path()}（HA 自动化里的旧 webhook 地址需同步更新）'
        )
    except Exception:
        pass
    return new_token


cfg.base.notify_token = _resolve_notify_token()
