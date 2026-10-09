from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import aiohttp
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
        logger.error(f"获取用电量统计失败: {str(e)}")
        return generate_resp(code=500, message=str(e))


@router.get("/energy/today/{entity_id}")
async def get_today_consumption(entity_id: str):
    """获取今日用电量数据"""
    api = HomeAssistantAPI()
    total = await api.get_today_consumption(entity_id)
    await api.close()
    return generate_resp(data={'total':total})

@router.get("/energy/daily/{entity_id}")
async def get_daily_consumption(entity_id: str, days: int = 7):
    """获取每日用电量数据"""
    cache_key = f"energy_daily_{entity_id}_{days}"
    cached_data = file_cache.get(cache_key)
    if cached_data is not None:
        return generate_resp(data=cached_data)
    
    api = HomeAssistantAPI()
    data = await api.get_daily_consumption(entity_id, days)
    await api.close()

    # 将数据存入缓存，有效期1小时
    file_cache.set(cache_key, data, ttl=3600)
    
    return generate_resp(data=data)



        

@router.get("/camera_snapshot/{entity_id}")
async def get_camera_snapshot(entity_id: str):
    """取摄像头的一帧定格画面（转给 HA 的 camera_proxy）。

    为什么由后端代取：HA 的 /api/camera_proxy/<entity_id> 必须带长期令牌，前端直接请求
    会有两个问题 —— ① 跨域；② 令牌会暴露在 URL / network 面板里。后端拿数据库里存着的
    令牌代取一次，回一个 JPEG 给前端，前端只管显示。
    """
    if not entity_id.startswith("camera."):
        raise HTTPException(status_code=400, detail="entity_id 必须是 camera.*")

    try:
        api = HomeAssistantAPI()
        async with aiohttp.ClientSession() as session:
            url = f"{api.base_url}/api/camera_proxy/{entity_id}"
            async with session.get(url, headers=api.headers) as resp:
                if resp.status != 200:
                    body = (await resp.text())[:160]
                    logger.warning(f"取摄像头定格画面失败 {entity_id}: {resp.status} {body}")
                    raise HTTPException(status_code=502, detail=f"HA 返回 {resp.status}")
                data = await resp.read()
                ctype = resp.headers.get("Content-Type", "image/jpeg")
        return Response(
            content=data,
            media_type=ctype,
            # 定格画面要实时，别让浏览器缓存
            headers={"Cache-Control": "no-store, max-age=0"},
        )
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.error(f"取摄像头定格画面异常 {entity_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
