from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from loguru import logger

from hass_panel.core.deps import get_db
from hass_panel.core.auth_deps import get_current_user
from hass_panel.models.database import Entity, User, HassConfig
from hass_panel.utils.common import generate_resp
from hass_panel.utils.homeassistant_api import HomeAssistantAPI
from hass_panel.utils.cache import FileCache

router = APIRouter(
    prefix="/api/hass",
    tags=["hass"],
    dependencies=[Depends(get_current_user)]
)
file_cache = FileCache()

# 对外的统一错误文案：细节（HA 地址、异常栈）只进日志，不回显给前端
_HA_ERROR_MSG = "获取 Home Assistant 数据失败，请检查 HA 地址与访问令牌是否有效"

@router.get("/energy/statistics/{entity_id}")
async def get_energy_statistics(entity_id: str, db: Session = Depends(get_db)):
    """获取用电量统计数据"""
    cache_key = f"energy_statistics_{entity_id}"
    
    # 尝试从缓存获取数据
    cached_data = file_cache.get(cache_key)
    if cached_data is not None:
        return generate_resp(data=cached_data)
    
    try:
        api = HomeAssistantAPI()
        data = await api.get_all_statistics(entity_id)
        await api.close()
        
        # 将数据存入缓存，有效期1小时
        file_cache.set(cache_key, data, ttl=3600)
        # 将entity_id存入数据库 先判断是否存在
        entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if entity is None:
            entity = Entity(entity_id=entity_id,name='total_usage')
            db.add(entity)
            db.commit()
            db.refresh(entity)
        
        return generate_resp(data=data)
    except Exception as e:
        # 细节只进日志：对外不回显内部信息（HA 地址、异常栈等）
        logger.error(f"获取用电量统计失败: {str(e)}")
        return generate_resp(code=500, message=_HA_ERROR_MSG)


@router.get("/energy/today/{entity_id}")
async def get_today_consumption(entity_id: str):
    """获取今日用电量数据"""
    try:
        api = HomeAssistantAPI()
        total = await api.get_today_consumption(entity_id)
        await api.close()
        return generate_resp(data={'total':total})
    except Exception as e:
        # 原来没有 try/except：HA 令牌失效时直接 500 + traceback 抛给前端
        logger.error(f"获取今日用电量失败: {str(e)}")
        return generate_resp(code=500, message=_HA_ERROR_MSG)

@router.get("/energy/daily/{entity_id}")
async def get_daily_consumption(entity_id: str, days: int = 7):
    """获取每日用电量数据"""
    cache_key = f"energy_daily_{entity_id}_{days}"
    cached_data = file_cache.get(cache_key)
    if cached_data is not None:
        return generate_resp(data=cached_data)

    try:
        api = HomeAssistantAPI()
        data = await api.get_daily_consumption(entity_id, days)
        await api.close()

        # 将数据存入缓存，有效期1小时
        file_cache.set(cache_key, data, ttl=3600)

        return generate_resp(data=data)
    except Exception as e:
        logger.error(f"获取每日用电量失败: {str(e)}")
        return generate_resp(code=500, message=_HA_ERROR_MSG)
