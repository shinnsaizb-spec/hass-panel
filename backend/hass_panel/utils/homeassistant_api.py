import aiohttp
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json
from zoneinfo import ZoneInfo
import time
from hass_panel.utils.singleton import singleton
from loguru import logger
from hass_panel.models.database import SessionLocal, HassConfig

@singleton
class HomeAssistantAPI:
    """Home Assistant API 客户端（单例，共用同一个 aiohttp session）。

    ⚠️ 这个类历史上踩过两个大坑，别再犯：
    1. `__init__` 里用**同步** requests 检查 token 且**没有超时**——而这个类在 async
       端点里被频繁 new，HA 一不可达就阻塞整个事件循环（表现为整个面板卡死）。
    2. 每个方法都新建 aiohttp.ClientSession——零连接复用，每次调用重新 TCP+TLS。
       现在：构造只读本地数据库；token 校验按需异步进行，且**绝不写回数据库**
       （校验失败只返回 False；清空令牌这种事只有用户显式改配置时才做）。
    """

    def __init__(self):
        self.base_url = None
        self.headers = None
        self.session = None
        # 数据类调用默认 30s；token 校验 8s（和 utils.common.check_hass_token 一致）
        self._timeout = aiohttp.ClientTimeout(total=30)
        self._check_timeout = aiohttp.ClientTimeout(total=8)
        self._init_config()

    def _init_config(self):
        """初始化时的配置加载（同步方法；只读本地 sqlite，毫秒级，不阻塞）"""
        db = SessionLocal()
        try:
            hass_config = db.query(HassConfig).first()
            if not hass_config:
                logger.error("未找到 Home Assistant 配置")
                raise Exception("Home Assistant configuration not found")

            if not hass_config.hass_token:
                logger.error("数据库中的 token 为空")
                raise Exception("No valid token found")

            self.base_url = f"{hass_config.hass_url}/api"
            self.headers = {
                "Authorization": f"Bearer {hass_config.hass_token}",
                "Content-Type": "application/json",
            }
        finally:
            db.close()

    def _get_session(self) -> aiohttp.ClientSession:
        """共用的 session：不存在或被 close 过就重建。

        调用方（如 energy 端点）用完会 close()，所以这里必须容忍 closed 状态，
        否则下次调用拿到已关闭的 session 直接报错。
        """
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(timeout=self._timeout)
        return self.session

    async def close(self):
        """关闭共享 session（下次调用会自动重建）"""
        if self.session and not self.session.closed:
            await self.session.close()

    async def check_token(self) -> bool:
        """检查 token 是否有效（异步；失败只返回 False，不动数据库）"""
        try:
            if not self.base_url or not self.headers:
                return False
            session = self._get_session()
            async with session.get(
                f"{self.base_url}", headers=self.headers, timeout=self._check_timeout
            ) as response:
                logger.info(f"check_token response: {response.status}")
                return response.status == 200
        except Exception as e:
            logger.error(f"检查 token 失败: {str(e)}")
            return False

    async def get_states(self) -> list:
        """获取所有实体的状态"""
        session = self._get_session()
        async with session.get(f"{self.base_url}/states", headers=self.headers, timeout=self._timeout) as response:
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    response.request_info,
                    response.history,
                    status=response.status,
                    message=f"HTTP Error {response.status}"
                )
            return await response.json()

    async def get_state(self, entity_id: str) -> Dict[str, Any]:
        """
        获取特定实体的状态
        
        Args:
            entity_id: 实体 ID
        """
        session = self._get_session()
        async with session.get(f"{self.base_url}/states/{entity_id}", headers=self.headers, timeout=self._timeout) as response:
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    response.request_info,
                    response.history,
                    status=response.status,
                    message=f"HTTP Error {response.status}"
                )
            return await response.json()

    async def call_service(self, domain: str, service: str, service_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        调用 Home Assistant 服务
        
        Args:
            domain: 服务域名
            service: 服务名称
            service_data: 服务参数
        """
        url = f"{self.base_url}/services/{domain}/{service}"
        session = self._get_session()
        async with session.post(url, headers=self.headers, json=service_data or {}, timeout=self._timeout) as response:
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    response.request_info,
                    response.history,
                    status=response.status,
                    message=f"HTTP Error {response.status}"
                )
            return await response.json()

    async def get_config(self) -> Dict[str, Any]:
        """获取 Home Assistant 配置信息"""
        session = self._get_session()
        async with session.get(f"{self.base_url}/config", headers=self.headers, timeout=self._timeout) as response:
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    response.request_info,
                    response.history,
                    status=response.status,
                    message=f"HTTP Error {response.status}"
                )
            return await response.json()

    async def get_history(self, entity_id: str, start_time: Optional[str] = None, end_time: Optional[str] = None) -> list:
        """
        获取实体的历史记录
        
        Args:
            entity_id: 实体 ID
            start_time: 开始时间，ISO 格式
            end_time: 结束时间，ISO 格式
        """
        params = {
            "filter_entity_id": entity_id,
            "minimal_response": "true",
            "no_attributes": "true",
        }
        if end_time:
            params["end_time"] = end_time
        
        url = f"{self.base_url}/history/period/{start_time}" if start_time else f"{self.base_url}/history/period"
        session = self._get_session()
        async with session.get(url, headers=self.headers, params=params) as response:
                
            if response.status == 404:
                logger.error(f"实体 {entity_id} 未找到或历史数据不可用")
                return []
                    
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    response.request_info,
                    response.history,
                    status=response.status,
                    message=f"HTTP Error {response.status}"
                )
                    
            try:
                return await response.json()
            except aiohttp.ContentTypeError as e:
                logger.error(f"解析响应失败: {str(e)}")
                return []

    async def calculate_energy_consumption(self, entity_id: str, start_time: str, end_time: str) -> float:
        """
        计算指定时间段内的总用电量
        
        Args:
            entity_id: 实体 ID
            start_time: 开始时间，ISO 格式
            end_time: 结束时间，ISO 格式
            
        Returns:
            时间段内的总用电量（千瓦时）
        """
        history = await self.get_history(entity_id, start_time, end_time)
        if not history or not history[0]:
            return 0
        
        data_points = []
        for record in history[0]:
            if record['state'] != 'unavailable' and record['state'] != 'unknown':
                try:
                    power = float(record['state'])
                    timestamp = datetime.fromisoformat(record['last_changed'].replace('Z', '+00:00'))
                    data_points.append((timestamp, power))
                except (ValueError, TypeError):
                    continue
        
        if len(data_points) < 2:
            return 0
        
        # 使用梯形法计算总用电量（千瓦时）
        total_energy = 0
        for i in range(len(data_points) - 1):
            t1, p1 = data_points[i]
            t2, p2 = data_points[i + 1]
            time_diff = (t2 - t1).total_seconds() / 3600  # 转换为小时
            avg_power = (p1 + p2) / 2  # 平均功率（瓦特）
            energy = (avg_power * time_diff) / 1000  # 转换为千瓦时
            total_energy += energy
        
        return round(total_energy, 2)

    async def get_energy_statistics(self, entity_id: str) -> Dict[str, float]:
        """
        获取各个时间段的用电量统计
        
        Args:
            entity_id: 实体 ID
            
        Returns:
            包含不同时间段用电量的字典
        """
        # 使用本地时区
        local_tz = ZoneInfo("Asia/Shanghai")
        now = datetime.now(local_tz)
        
        # 使用最早的开始时间和最晚的结束时间获取一次数据
        this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        this_year_end = now
        
        # 转换为ISO格式时保留时区信息
        this_year_start_iso = this_year_start.isoformat()
        this_year_end_iso = this_year_end.isoformat()
        
        # 获取一整年的数据
        history = await self.get_history(entity_id, this_year_start_iso, this_year_end_iso)
        if not history or not history[0]:
            return {
                "yesterday": 0,
                "last_month": 0,
                "this_month": 0,
                "this_year": 0
            }
        
        # 预处理所有数据点
        data_points = []
        for record in history[0]:
            if record['state'] not in ['unavailable', 'unknown']:
                try:
                    energy = float(record['state'])
                    timestamp = datetime.fromisoformat(record['last_changed'].replace('Z', '+00:00')).astimezone(local_tz)
                    data_points.append((timestamp, energy))
                except (ValueError, TypeError):
                    continue
        
        if not data_points:
            return {
                "yesterday": 0,
                "last_month": 0,
                "this_month": 0,
                "this_year": 0
            }
        
        def calculate_period_consumption(start_time: datetime, end_time: datetime, points: list) -> float:
            """计算指定时间段内的用电量差值"""
            period_points = sorted([(t, e) for t, e in points if start_time <= t <= end_time])
            if len(period_points) < 2:
                return 0
            return round(period_points[-1][1] - period_points[0][1], 2)
        
        # 定义时间范围
        yesterday_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        yesterday_end = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        last_month_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_end = now
        
        this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        this_year_end = now
        
        # 计算各时间段的用电量
        return {
            "yesterday": calculate_period_consumption(yesterday_start, yesterday_end, data_points),
            "last_month": calculate_period_consumption(last_month_start, last_month_end, data_points),
            "this_month": calculate_period_consumption(this_month_start, this_month_end, data_points),
            "this_year": calculate_period_consumption(this_year_start, this_year_end, data_points)
        }

    async def get_daily_consumption(self, entity_id: str, days: int = 7) -> Dict[str, float]:
        """
        获取指定天数的历史每日用电量
        
        Args:
            entity_id: 实体 ID
            days: 要获取的天数，默认7天
            
        Returns:
            包含每日用电量的字典，键为日期字符串(YYYY-MM-DD)，值为用电量
        """
        local_tz = ZoneInfo("Asia/Shanghai")
        now = datetime.now(local_tz)
        
        # 计算开始时间和结束时间
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(days=days)
        
        # 获取历史数据
        history = await self.get_history(entity_id, start_time.isoformat(), end_time.isoformat())
        if not history or not history[0]:
            return {}
        
        # 预处理数据点
        data_points = []
        for record in history[0]:
            if record['state'] not in ['unavailable', 'unknown']:
                try:
                    energy = float(record['state'])
                    timestamp = datetime.fromisoformat(record['last_changed'].replace('Z', '+00:00')).astimezone(local_tz)
                    data_points.append((timestamp, energy))
                except (ValueError, TypeError):
                    continue
        
        if not data_points:
            return {}
        
        # 计算每日用电量
        daily_consumption = {}
        for day in range(days):
            day_start = end_time - timedelta(days=day+1)
            day_end = end_time - timedelta(days=day)
            day_str = day_start.strftime('%Y-%m-%d')
            
            # 找到当天的数据点
            day_points = sorted([(t, e) for t, e in data_points if day_start <= t <= day_end])
            
            if len(day_points) >= 2:
                start_energy = day_points[0][1]
                end_energy = day_points[-1][1]
                daily_consumption[day_str] = round(end_energy - start_energy, 2)
            else:
                daily_consumption[day_str] = 0
        
        # 按日期排序 日期是key, 日期是字符串
        daily_consumption = dict(sorted(daily_consumption.items(), key=lambda x: x[0]))
        return daily_consumption

    async def get_all_statistics(self, entity_id: str, daily_days: int = 7) -> Dict[str, Any]:
        """
        一次性获取所有用电量统计数据
        
        Args:
            entity_id: 实体 ID
            daily_days: 要获取的每日统计天数
            
        Returns:
            包含所有统计数据的字典
        """
        local_tz = ZoneInfo("Asia/Shanghai")
        now = datetime.now(local_tz)
        
        # 找出所需数据的最早时间点
        this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        daily_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=daily_days)
        start_time = min(this_year_start, daily_start)
        
        # 只调用一次API获取所有需要的数据
        time0 = time.time()
        history = await self.get_history(entity_id, start_time.isoformat(), now.isoformat())
        time1 = time.time()
        logger.info(f"获取历史数据用时{time1-time0}秒")
        
        if not history or not history[0]:
            return {
                "summary": {
                    "yesterday": 0,
                    "last_month": 0,
                    "this_month": 0,
                    "this_year": 0
                },
                "daily": {}
            }
        
        # 预处理所有数据点
        data_points = []
        for record in history[0]:
            if record['state'] not in ['unavailable', 'unknown']:
                try:
                    energy = float(record['state'])
                    timestamp = datetime.fromisoformat(record['last_changed'].replace('Z', '+00:00')).astimezone(local_tz)
                    data_points.append((timestamp, energy))
                except (ValueError, TypeError):
                    continue
        
        if not data_points:
            return {
                "summary": {
                    "yesterday": 0,
                    "last_month": 0,
                    "this_month": 0,
                    "this_year": 0
                },
                "daily": {}
            }
        
        data_points.sort()  # 按时间排序
        
        def get_period_consumption(start_time: datetime, end_time: datetime) -> float:
            """计算指定时间段内的用电量差值"""
            period_points = [(t, e) for t, e in data_points if start_time <= t <= end_time]
            if len(period_points) < 2:
                return 0
            return round(period_points[-1][1] - period_points[0][1], 2)
        
        # 定义时间范围
        yesterday_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        yesterday_end = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        last_month_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 计算汇总统计
        summary = {
            "yesterday": get_period_consumption(yesterday_start, yesterday_end),
            "last_month": get_period_consumption(last_month_start, last_month_end),
            "this_month": get_period_consumption(this_month_start, now),
            "this_year": get_period_consumption(this_year_start, now)
        }
        
        # 计算每日用电量
        daily = {}
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        for day in range(daily_days):
            day_start = end_time - timedelta(days=day+1)
            day_end = end_time - timedelta(days=day)
            day_str = day_start.strftime('%Y-%m-%d')
            daily[day_str] = get_period_consumption(day_start, day_end)
        
        # 按日期排序 日期是key, 日期是字符串 返回结果需要是字典
        daily = dict(sorted(daily.items(), key=lambda x: x[0]))
        return {
            "summary": summary,
            "daily": daily
        }
    
    async def get_today_consumption(self, entity_id: str) -> Dict[str, float]:
        """
        获取今日用电量
        
        Args:
            entity_id: 实体 ID
            
        Returns:
            Dict[str, float]: 包含今日用电量的字典，包括：
                - total: 总用电量
        """
        local_tz = ZoneInfo("Asia/Shanghai")
        now = datetime.now(local_tz)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 获取今天的历史数据
        history = await self.get_history(entity_id, today_start.isoformat(), now.isoformat())
        if not history or not history[0]:
            return 0
        
        # 预处理数据点
        data_points = []
        for record in history[0]:
            if record['state'] not in ['unavailable', 'unknown']:
                try:
                    energy = float(record['state'])
                    timestamp = datetime.fromisoformat(record['last_changed'].replace('Z', '+00:00')).astimezone(local_tz)
                    data_points.append((timestamp, energy))
                except (ValueError, TypeError):
                    continue
        
        if not data_points:
            return 0
            
        # 按时间排序
        data_points.sort()
        
        # 计算今日总用电量（最后一个读数减去第一个读数）
        total = round(data_points[-1][1] - data_points[0][1], 2)
        
        return total
    