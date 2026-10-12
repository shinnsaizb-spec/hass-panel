from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import time
import ipaddress
from onvif import ONVIFCamera
import zeep
import asyncio
from loguru import logger

from hass_panel.core.auth_deps import get_current_user

# 创建路由器
# ⚠️ 必须挂 router 级鉴权：这个路由能**转云台 / 重启摄像头 / 读设备信息**，
#    而且 `stream_url` 完全由客户端给 → 没鉴权时还是个未授权 SSRF 跳板。
router = APIRouter(
    prefix="/api/onvif",
    tags=["onvif"],
    dependencies=[Depends(get_current_user)],
)

# SSRF 面收敛：摄像头一定在局域网，这些地址不可能是摄像头，
# 却能让「面板代为访问」变成探测内部敏感服务的跳板。
# ⚠️ 只拦字面量 IP / 已知主机名；域名解析后的 IP 不拦（自用工具够用，
#    ONVIFCamera 不支持注入自定义解析器，要较真得在连接前自己解析一轮）。
_BLOCKED_HOSTS = {'localhost', 'metadata.google.internal', 'metadata.goog'}
_BLOCKED_NETS = [
    ipaddress.ip_network(n)
    for n in ('127.0.0.0/8', '::1/128', '169.254.0.0/16', '0.0.0.0/8')
]


def _assert_host_allowed(ip: str) -> None:
    host = (ip or '').strip().lower()
    if not host:
        raise HTTPException(status_code=400, detail='摄像头地址为空')
    if host in _BLOCKED_HOSTS:
        raise HTTPException(status_code=400, detail=f'不允许连接内部地址：{host}')
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return  # 是主机名（如 cam.local），放行
    if any(addr in net for net in _BLOCKED_NETS):
        raise HTTPException(status_code=400, detail=f'不允许连接内部地址：{host}')


# 活动的PTZ会话跟踪
active_ptz_sessions = {}
DEFAULT_TIMEOUT = 30  # 默认30秒超时

# 用于处理zeep数据类型的辅助函数
def zeep_pythonvalue(self, xmlvalue):
    return xmlvalue

# 替换zeep默认的数据类型处理方法
zeep.xsd.simple.AnySimpleType.pythonvalue = zeep_pythonvalue

# PTZ控制请求模型
class PTZRequest(BaseModel):
    entity_id: str
    stream_url: Optional[str] = None  # ONVIF URL格式：onvif://user:pass@ip:port/onvif/device_service
    move_mode: str  # 'ContinuousMove', 'RelativeMove', 'AbsoluteMove', 'Stop'
    pan: Optional[str] = None  # 'LEFT', 'RIGHT'
    tilt: Optional[str] = None  # 'UP', 'DOWN'
    zoom: Optional[str] = None  # 'ZOOM_IN', 'ZOOM_OUT'
    speed: Optional[float] = 0.5
    distance: Optional[float] = 0.5
    preset: Optional[int] = None
    timeout: Optional[float] = None

# 摄像头连接缓存（含明文口令，所以必须限量 + 过期即删，不能只覆盖不删）
camera_cache = {}
MAX_CAMERA_CACHE = 16


def _prune_camera_cache(now: float) -> None:
    """清掉过期项；仍然超量就丢最旧的。防止无限增长（也少留点明文口令在内存里）。"""
    for k in [k for k, v in camera_cache.items() if now - v['timestamp'] >= 3600]:
        camera_cache.pop(k, None)
    overflow = len(camera_cache) - MAX_CAMERA_CACHE
    if overflow > 0:
        oldest = sorted(camera_cache.items(), key=lambda kv: kv[1]['timestamp'])[:overflow]
        for k, _ in oldest:
            camera_cache.pop(k, None)


# 获取ONVIF摄像头实例
def get_onvif_camera(ip, port, username, password):
    """获取ONVIF摄像头实例，使用缓存避免重复创建连接"""
    cache_key = f"{ip}:{port}:{username}:{password}"

    if cache_key in camera_cache:
        # 检查缓存是否过期（1小时）
        if time.time() - camera_cache[cache_key]['timestamp'] < 3600:
            return camera_cache[cache_key]['camera']

    try:
        # 创建ONVIF摄像头实例
        camera = ONVIFCamera(ip, port, username, password)

        # 缓存摄像头实例（先清扫再写入，控制总量）
        _prune_camera_cache(time.time())
        camera_cache[cache_key] = {
            'camera': camera,
            'timestamp': time.time()
        }

        return camera
    except Exception as e:
        logger.error(f"Failed to connect to ONVIF camera: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to ONVIF camera: {str(e)}")

# 解析摄像头URL
def parse_camera_url(entity_id, stream_url=None):
    """从 stream_url 解析摄像头 URL，得到 IP / 端口 / 用户名 / 密码。

    必须显式提供 onvif:// 地址——原来不给 stream_url 时会静默连到写死的
    192.168.1.100 + admin/admin（无谓的探测面，还会误导用户）。
    """
    try:
        if not (stream_url and str(stream_url).startswith('onvif://')):
            raise HTTPException(
                status_code=400,
                detail='缺少摄像头 ONVIF 地址（stream_url 需为 onvif:// 开头）',
            )

        # 移除协议前缀
        url_without_protocol = str(stream_url)[8:]

        # 解析用户名和密码
        username = None
        password = None
        if '@' in url_without_protocol:
            auth_part, url_without_protocol = url_without_protocol.split('@', 1)
            if ':' in auth_part:
                username, password = auth_part.split(':', 1)
            else:
                username = auth_part

        # 解析IP和端口
        ip = url_without_protocol
        port = 80  # 默认端口

        if '/' in ip:
            ip = ip.split('/', 1)[0]

        if ':' in ip:
            ip, port_str = ip.split(':', 1)
            try:
                port = int(port_str)
            except ValueError:
                port = 80

        if not 1 <= port <= 65535:
            raise HTTPException(status_code=400, detail=f'非法的端口：{port}')

        # SSRF 收敛：环回 / 链路本地 / 云元数据地址不可能是摄像头
        _assert_host_allowed(ip)

        return {
            "ip": ip,
            "port": port,
            "username": username or "admin",
            "password": password or "admin"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse camera URL: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid camera URL: {stream_url or entity_id}")

# ==============================================================================
# 同步「干活」层
# ------------------------------------------------------------------------------
# ONVIF（zeep SOAP）全是同步阻塞调用。这些函数只允许在**线程池**里跑——
# async 端点通过 loop.run_in_executor 调它们，事件循环绝不被相机 I/O 卡住。
# ==============================================================================


def _connect_camera(stream_url):
    """解析地址 + 取（或建）摄像头实例。"""
    camera_info = parse_camera_url('camera', stream_url)
    return get_onvif_camera(
        camera_info["ip"],
        camera_info["port"],
        camera_info["username"],
        camera_info["password"]
    )


def _ptz_move_sync(request: PTZRequest) -> dict:
    """执行云台移动，返回模式描述（ContinuousMove 时带上自动停止任务需要的参数）。"""
    camera = _connect_camera(request.stream_url)
    ptz = camera.create_ptz_service()
    media = camera.create_media_service()
    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    if request.move_mode == "Stop":
        # 停止所有移动
        ptz.Stop({'ProfileToken': profile_token})
        return {"mode": "stop"}

    elif request.move_mode == "ContinuousMove":
        # 连续移动
        request_obj = {
            'ProfileToken': profile_token,
            'Velocity': {
                'PanTilt': {'x': 0, 'y': 0},
                'Zoom': {'x': 0}
            }
        }

        # 设置平移速度
        if request.pan == "LEFT":
            request_obj['Velocity']['PanTilt']['x'] = -request.speed
        elif request.pan == "RIGHT":
            request_obj['Velocity']['PanTilt']['x'] = request.speed

        # 设置倾斜速度
        if request.tilt == "UP":
            request_obj['Velocity']['PanTilt']['y'] = request.speed
        elif request.tilt == "DOWN":
            request_obj['Velocity']['PanTilt']['y'] = -request.speed

        # 设置缩放速度
        if request.zoom == "ZOOM_IN":
            request_obj['Velocity']['Zoom']['x'] = request.speed
        elif request.zoom == "ZOOM_OUT":
            request_obj['Velocity']['Zoom']['x'] = -request.speed

        # 执行连续移动
        ptz.ContinuousMove(request_obj)

        return {
            "mode": "continuous",
            "timeout": request.timeout if request.timeout is not None else DEFAULT_TIMEOUT,
            "camera_info": parse_camera_url('camera', request.stream_url),
            "profile_token": profile_token,
        }

    elif request.move_mode == "RelativeMove":
        # 相对移动
        request_obj = {
            'ProfileToken': profile_token,
            'Translation': {
                'PanTilt': {'x': 0, 'y': 0},
                'Zoom': {'x': 0}
            },
            'Speed': {
                'PanTilt': {'x': request.speed, 'y': request.speed},
                'Zoom': {'x': request.speed}
            }
        }

        # 设置平移距离
        if request.pan == "LEFT":
            request_obj['Translation']['PanTilt']['x'] = -request.distance
        elif request.pan == "RIGHT":
            request_obj['Translation']['PanTilt']['x'] = request.distance

        # 设置倾斜距离
        if request.tilt == "UP":
            request_obj['Translation']['PanTilt']['y'] = request.distance
        elif request.tilt == "DOWN":
            request_obj['Translation']['PanTilt']['y'] = -request.distance

        # 设置缩放距离
        if request.zoom == "ZOOM_IN":
            request_obj['Translation']['Zoom']['x'] = request.distance
        elif request.zoom == "ZOOM_OUT":
            request_obj['Translation']['Zoom']['x'] = -request.distance

        # 执行相对移动
        ptz.RelativeMove(request_obj)
        return {"mode": "relative"}

    elif request.move_mode == "AbsoluteMove":
        # 绝对移动（通常用于预设位置）
        # 获取当前位置
        status = ptz.GetStatus({'ProfileToken': profile_token})

        request_obj = {
            'ProfileToken': profile_token,
            'Position': status.Position,
            'Speed': {
                'PanTilt': {'x': request.speed, 'y': request.speed},
                'Zoom': {'x': request.speed}
            }
        }

        # 设置平移位置
        if request.pan == "LEFT":
            request_obj['Position']['PanTilt']['x'] = -1.0
        elif request.pan == "RIGHT":
            request_obj['Position']['PanTilt']['x'] = 1.0

        # 设置倾斜位置
        if request.tilt == "UP":
            request_obj['Position']['PanTilt']['y'] = 1.0
        elif request.tilt == "DOWN":
            request_obj['Position']['PanTilt']['y'] = -1.0

        # 设置缩放位置
        if request.zoom == "ZOOM_IN":
            request_obj['Position']['Zoom']['x'] = 1.0
        elif request.zoom == "ZOOM_OUT":
            request_obj['Position']['Zoom']['x'] = 0.0

        # 执行绝对移动
        ptz.AbsoluteMove(request_obj)
        return {"mode": "absolute"}

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported move mode: {request.move_mode}")


def _get_presets_sync(entity_id, stream_url):
    """获取摄像头预设位置列表"""
    camera = _connect_camera(stream_url)
    ptz = camera.create_ptz_service()

    # 获取配置文件
    media = camera.create_media_service()
    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    # 获取预设位置
    presets = ptz.GetPresets({'ProfileToken': profile_token})

    # 格式化预设位置列表
    preset_list = []
    for preset in presets:
        preset_list.append({
            "token": preset.token,
            "name": preset.Name if hasattr(preset, 'Name') else f"Preset {preset.token}"
        })

    return preset_list[:8]


def _goto_preset_sync(entity_id, preset_token, speed, stream_url):
    """移动到预设位置"""
    camera = _connect_camera(stream_url)
    ptz = camera.create_ptz_service()

    # 获取配置文件
    media = camera.create_media_service()
    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    # 移动到预设位置
    request_obj = {
        'ProfileToken': profile_token,
        'PresetToken': preset_token,
        'Speed': {
            'PanTilt': {'x': speed, 'y': speed},
            'Zoom': {'x': speed}
        }
    }

    ptz.GotoPreset(request_obj)
    return {"status": "success", "message": f"Moved to preset {preset_token}"}


def _set_preset_sync(entity_id, preset_name, stream_url):
    """设置当前位置为预设位置"""
    camera = _connect_camera(stream_url)
    ptz = camera.create_ptz_service()

    # 获取配置文件
    media = camera.create_media_service()
    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    # 设置预设位置
    preset_token = ptz.SetPreset({
        'ProfileToken': profile_token,
        'PresetName': preset_name
    })

    return {"status": "success", "message": f"Preset {preset_name} set", "token": preset_token}


def _remove_preset_sync(entity_id, preset_token, stream_url):
    """删除预设位置"""
    camera = _connect_camera(stream_url)
    ptz = camera.create_ptz_service()

    # 获取配置文件
    media = camera.create_media_service()
    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    # 删除预设位置
    ptz.RemovePreset({
        'ProfileToken': profile_token,
        'PresetToken': preset_token
    })

    return {"status": "success", "message": f"Preset {preset_token} removed"}


def _camera_info_sync(entity_id, stream_url):
    """获取摄像头信息"""
    camera = _connect_camera(stream_url)

    # 获取设备信息
    device_info = camera.devicemgmt.GetDeviceInformation()

    # 获取网络接口
    network_interfaces = camera.devicemgmt.GetNetworkInterfaces()

    # 获取系统日期和时间
    system_datetime = camera.devicemgmt.GetSystemDateAndTime()

    # 获取能力
    capabilities = camera.devicemgmt.GetCapabilities()

    # 格式化返回信息
    info = {
        "device": {
            "manufacturer": device_info.Manufacturer,
            "model": device_info.Model,
            "firmware_version": device_info.FirmwareVersion,
            "serial_number": device_info.SerialNumber,
            "hardware_id": device_info.HardwareId
        },
        "network": [],
        "datetime": {
            "type": system_datetime.DateTimeType,
            "timezone": system_datetime.TimeZone.TZ if hasattr(system_datetime, 'TimeZone') and hasattr(system_datetime.TimeZone, 'TZ') else None
        },
        "capabilities": {
            "ptz": hasattr(capabilities, 'PTZ')
        }
    }

    # 添加网络接口信息
    for interface in network_interfaces:
        if hasattr(interface, 'IPv4'):
            for ipv4 in interface.IPv4.Config.Manual:
                info["network"].append({
                    "name": interface.Info.Name,
                    "hw_address": interface.Info.HwAddress,
                    "ip": ipv4.Address,
                    "prefix_length": ipv4.PrefixLength
                })

    return info


def _reboot_camera_sync(entity_id, stream_url):
    """重启摄像头"""
    camera = _connect_camera(stream_url)

    # 重启设备
    camera.devicemgmt.SystemReboot()

    return {"status": "success", "message": "Camera reboot initiated"}


# ==============================================================================
# async 端点层：只做「线程池调度 + 会话管理」，不直接碰相机
# ==============================================================================

def _run_sync(fn, *args):
    """把同步相机操作丢进默认线程池，避免阻塞事件循环。"""
    loop = asyncio.get_running_loop()
    return loop.run_in_executor(None, fn, *args)


@router.post("/ptz")
async def ptz_control(request: PTZRequest):
    """PTZ摄像头控制接口"""
    global active_ptz_sessions

    # 生成会话ID
    session_id = f"{request.entity_id}_{request.stream_url}"

    try:
        result = await _run_sync(_ptz_move_sync, request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PTZ control error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PTZ control error: {str(e)}")

    if result["mode"] == "stop":
        # 同步层已经让相机停了；这里取消自动停止任务
        if session_id in active_ptz_sessions:
            task = active_ptz_sessions.pop(session_id)
            if not task.done():
                task.cancel()
        return {"status": "success", "message": "PTZ movement stopped"}

    if result["mode"] == "relative":
        return {"status": "success", "message": "Relative move executed"}

    if result["mode"] == "absolute":
        return {"status": "success", "message": "Absolute move executed"}

    # ContinuousMove：如果存在之前的活动会话，取消它
    if session_id in active_ptz_sessions:
        old = active_ptz_sessions[session_id]
        if not old.done():
            old.cancel()

    timeout = result["timeout"]
    camera_info = result["camera_info"]
    profile_token = result["profile_token"]

    async def auto_stop():
        current = asyncio.current_task()
        try:
            await asyncio.sleep(timeout)
            # 重新获取摄像头实例，因为原来的可能已经关闭；
            # Stop 是同步 SOAP 调用，同样丢线程池
            def _stop():
                cam = get_onvif_camera(
                    camera_info["ip"],
                    camera_info["port"],
                    camera_info["username"],
                    camera_info["password"]
                )
                ptz = cam.create_ptz_service()
                ptz.Stop({'ProfileToken': profile_token})
            await asyncio.get_running_loop().run_in_executor(None, _stop)
            logger.info(f"Auto-stopped PTZ movement for {session_id} after {timeout} seconds")
        except asyncio.CancelledError:
            # 任务被取消，不需要做任何事情
            pass
        except Exception as e:
            logger.error(f"Failed to auto-stop PTZ movement for {session_id}: {str(e)}")
        finally:
            # ⚠️ 只在「槽位里还是自己」时才移除：被新的 ContinuousMove 顶掉时，
            #    槽位已经是新任务了，无判断地 pop 会把新任务误删。
            if active_ptz_sessions.get(session_id) is current:
                active_ptz_sessions.pop(session_id, None)

    # 启动后台任务并保存引用
    task = asyncio.create_task(auto_stop())
    active_ptz_sessions[session_id] = task

    return {"status": "success", "message": f"Continuous move executed with auto-stop after {timeout} seconds"}


# 预设位置相关API
@router.get("/presets/{entity_id}")
async def get_presets(entity_id: str, stream_url: Optional[str] = None):
    """获取摄像头预设位置列表"""
    try:
        return await _run_sync(_get_presets_sync, entity_id, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get presets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get presets: {str(e)}")


@router.post("/preset/{entity_id}/{preset_token}")
async def goto_preset(entity_id: str, preset_token: str, speed: Optional[float] = 0.5, stream_url: Optional[str] = None):
    """移动到预设位置"""
    try:
        return await _run_sync(_goto_preset_sync, entity_id, preset_token, speed, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to goto preset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to goto preset: {str(e)}")


@router.post("/preset/set/{entity_id}/{preset_name}")
async def set_preset(entity_id: str, preset_name: str, stream_url: Optional[str] = None):
    """设置当前位置为预设位置"""
    try:
        return await _run_sync(_set_preset_sync, entity_id, preset_name, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to set preset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to set preset: {str(e)}")


@router.delete("/preset/{entity_id}/{preset_token}")
async def remove_preset(entity_id: str, preset_token: str, stream_url: Optional[str] = None):
    """删除预设位置"""
    try:
        return await _run_sync(_remove_preset_sync, entity_id, preset_token, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove preset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove preset: {str(e)}")


# 获取摄像头信息
@router.get("/info/{entity_id}")
async def get_camera_info(entity_id: str, stream_url: Optional[str] = None):
    """获取摄像头信息"""
    try:
        return await _run_sync(_camera_info_sync, entity_id, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get camera info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get camera info: {str(e)}")


# 摄像头重启
@router.post("/reboot/{entity_id}")
async def reboot_camera(entity_id: str, stream_url: Optional[str] = None):
    """重启摄像头"""
    try:
        return await _run_sync(_reboot_camera_sync, entity_id, stream_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reboot camera: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reboot camera: {str(e)}")
