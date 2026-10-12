"""FastAPI 依赖（只保留真正在用的那两个）。

历史包袱清理（2026-10-12）：原来还有 `log_request_info` / `Logger` 两个函数，
引用未定义的 `logger`、`cfg.log.allow_log`，且全项目无人 import，已删。
"""
from sqlalchemy.orm import Session

from hass_panel.models.database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
