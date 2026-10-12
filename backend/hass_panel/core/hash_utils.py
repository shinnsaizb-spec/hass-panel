import hashlib
import hmac
import re

import bcrypt

# ==============================================================================
# 密码哈希
# ------------------------------------------------------------------------------
# 历史问题（本次修复的核心）：前端把密码 MD5 后传给后端，后端**原样存库、== 比较**。
# 后果：① 无盐 MD5 可被彩虹表反查；② **哈希即口令**——拿到数据库（备份、sqlite 文件、
# 曾经的任意文件读取漏洞）就能直接登录，无需破解。
#
# 现在的方案：库里存 **bcrypt(前端传来的 MD5)**。
#   - 前端依旧先 MD5（传输层不暴露明文，前端零改动）；
#   - 数据库里不再有可反查的 MD5，pass-the-hash 失效；
#   - 存量记录（32 位 MD5 或早年手建的明文）在**下次成功登录时自动升级**成 bcrypt，
#     无需批量迁移脚本，用户无感。
#
# ⚠️ 不用 passlib：1.7.4 与 bcrypt>=4.1 有已知兼容问题（__about__ 被删 +
#    72 字节 ValueError），直接用它会在 hash 时炸。bcrypt 库本身 API 足够简单。
# ==============================================================================

# bcrypt 只处理前 72 字节（MD5 是 32 字符，远小于；防御性截断而已）
_BCRYPT_MAX_BYTES = 72

# bcrypt 哈希的识别前缀：$2a$ / $2b$ / $2y$
_BCRYPT_PREFIX = re.compile(r'^\$2[aby]\$')


def _to_bytes(password) -> bytes:
    return str(password or '').encode('utf-8')[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """生成 bcrypt 哈希（入参是前端 MD5 后的值）。"""
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode('utf-8')


def is_bcrypt_hash(hashed_password: str) -> bool:
    """判断库里这条是不是 bcrypt 哈希（用来区分存量记录）。"""
    return bool(hashed_password) and bool(_BCRYPT_PREFIX.match(str(hashed_password)))


def needs_rehash(hashed_password: str) -> bool:
    """存量记录（非 bcrypt）需要在下次成功登录后升级。"""
    return bool(hashed_password) and not is_bcrypt_hash(hashed_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """校验密码。

    - 新格式（bcrypt）：正常校验；
    - 存量格式（MD5 直传时代的记录，或早年手建的明文）：**常量时间**比较
      （hmac.compare_digest，避免时序侧信道），通过后由调用方升级成 bcrypt。
    """
    if not plain_password or not hashed_password:
        return False
    if is_bcrypt_hash(hashed_password):
        try:
            return bcrypt.checkpw(_to_bytes(plain_password), str(hashed_password).encode('utf-8'))
        except Exception:
            return False
    # 存量：MD5 直传时代
    return hmac.compare_digest(str(plain_password), str(hashed_password))


def md5_hash(text: str) -> str:
    """MD5哈希函数(提供给前端参考，后端不使用)"""
    return hashlib.md5(text.encode()).hexdigest()
