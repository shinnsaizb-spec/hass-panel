"""户型图（3D floorplan）的存储与读取。

户型图是一份**独立文档**，不跟卡片配置混在一起：

    {
      "version": 1,
      "name": "我的家",
      "gridSize": 100,                 # 编辑器网格（毫米）
      "background": {...},             # 上传的户型底图 + 比例标定
      "floors":   [ { id, name, level, wallHeight } ],
      "rooms":    [ { id, floorId, x, y, w, h, name } ],
      "bindings": [ { id, roomId, entityId, kind } ]
    }

坐标统一用**毫米**（整数），前端渲染 3D 时再换算成米。
存在 user_config_dir/floorplan.json，前端编辑器负责画、3D 卡片负责渲染。
"""

from fastapi import APIRouter, Body, Depends
from pathlib import Path
import json
import shutil
from datetime import datetime
from loguru import logger

from hass_panel.utils.common import generate_resp
from hass_panel.utils.config import cfg
from hass_panel.core.auth_deps import get_current_user

router = APIRouter(
    prefix="/api/floorplan",
    tags=["floorplan"],
    dependencies=[Depends(get_current_user)],
)

PLAN_DIR = Path(cfg.base.user_config_dir)
PLAN_DIR.mkdir(parents=True, exist_ok=True)
PLAN_FILE = PLAN_DIR / "floorplan.json"
BACKUP_DIR = PLAN_DIR / "floorplan_backups"

# 最多留多少份历史版本
MAX_BACKUPS = 20


def _empty_plan() -> dict:
    return {
        "version": 1,
        "name": "",
        "gridSize": 100,
        "background": None,
        "floors": [],
        "rooms": [],
        "bindings": [],
    }


@router.get("")
async def get_plan():
    """读户型图。文件不存在时返回一份空文档，前端不用处理 404。"""
    if not PLAN_FILE.exists():
        return generate_resp(data={"plan": _empty_plan()})
    try:
        plan = json.loads(PLAN_FILE.read_text(encoding="utf-8"))
        return generate_resp(data={"plan": plan})
    except Exception as e:  # noqa: BLE001
        logger.error(f"读取户型图失败: {e}")
        return generate_resp(code=500, error=f"读取户型图失败: {e}")


@router.put("")
async def save_plan(payload: dict = Body(...)):
    """整份覆盖保存。保存前把上一版留一份备份，画错了能回滚。"""
    plan = payload.get("plan") if isinstance(payload, dict) else None
    if not isinstance(plan, dict):
        return generate_resp(code=400, error="plan 必须是一个对象")

    try:
        # 先备份旧版
        if PLAN_FILE.exists():
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy2(PLAN_FILE, BACKUP_DIR / f"floorplan-{stamp}.json")
            olds = sorted(BACKUP_DIR.glob("floorplan-*.json"))
            for old in olds[:-MAX_BACKUPS]:
                try:
                    old.unlink()
                except OSError:
                    pass

        PLAN_FILE.write_text(
            json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return generate_resp(data={"ok": True, "savedAt": datetime.now().isoformat()})
    except Exception as e:  # noqa: BLE001
        logger.error(f"保存户型图失败: {e}")
        return generate_resp(code=500, error=f"保存户型图失败: {e}")


@router.get("/backups")
async def list_backups():
    """历史版本列表（新的在前）。"""
    if not BACKUP_DIR.exists():
        return generate_resp(data={"items": []})
    items = []
    for f in sorted(BACKUP_DIR.glob("floorplan-*.json"), reverse=True):
        st = f.stat()
        items.append(
            {
                "name": f.name,
                "size": st.st_size,
                "mtime": datetime.fromtimestamp(st.st_mtime).isoformat(),
            }
        )
    return generate_resp(data={"items": items})


@router.post("/backups/{name}/restore")
async def restore_backup(name: str):
    """把某个历史版本恢复成当前户型图（恢复前也会先备份当前版本）。"""
    if "/" in name or "\\" in name or not name.endswith(".json"):
        return generate_resp(code=400, error="非法的文件名")
    src = BACKUP_DIR / name
    if not src.exists():
        return generate_resp(code=404, error="找不到这个历史版本")
    try:
        if PLAN_FILE.exists():
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy2(PLAN_FILE, BACKUP_DIR / f"floorplan-{stamp}.json")
        shutil.copy2(src, PLAN_FILE)
        plan = json.loads(PLAN_FILE.read_text(encoding="utf-8"))
        return generate_resp(data={"plan": plan})
    except Exception as e:  # noqa: BLE001
        logger.error(f"恢复户型图失败: {e}")
        return generate_resp(code=500, error=f"恢复户型图失败: {e}")
