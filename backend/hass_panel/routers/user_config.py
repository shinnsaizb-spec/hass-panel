from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional, List
import aiohttp
import json
from datetime import datetime
import os
from pathlib import Path
import yaml
import hashlib
from loguru import logger
from pydantic import BaseModel
from hass_panel.utils.common import generate_resp,check_hass_token
from hass_panel.utils.safe_fs import safe_remove
from hass_panel.utils.config import cfg
import subprocess
from hass_panel.core.auth_deps import get_current_user
from hass_panel.models.database import User, HassConfig, SessionLocal

router = APIRouter(
    prefix="/api/user_config",
    tags=["user_config"],       
    dependencies=[Depends(get_current_user)]
)

# 配置文件存储路径
CONFIG_DIR = Path(cfg.base.user_config_dir)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/config")
async def get_config():
    """获取最新配置"""
    try:
        config_file = CONFIG_DIR / "config.json"
        if not config_file.exists():
            return generate_resp(data={
                "cards": [],
                "layouts": {},
                "defaultLayouts": {}
            })
            
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
        return generate_resp(data=config)
    except Exception as e:
        return generate_resp(code=500, error=str(e))

def generate_stream_key(text: str) -> str:
    """生成stream key的MD5哈希值（前8位）"""
    return hashlib.md5(text.encode()).hexdigest()[:8]


def stream_sources(value):
    """把 go2rtc 的 stream 值统一成「字符串列表」。

    坑：go2rtc 的 streams 值有两种形态 ——
      - 我们自己写进去的是字符串：``key: rtsp://...``
      - go2rtc 通过 API 持久化回来时会写成列表：``key:\\n  - rtsp://...``
    原来直接 `set(streams.values())` 遇到列表会抛 `unhashable type: 'list'`，
    而这个异常发生在写 config.json **之前**，导致「提示保存成功但卡片其实没存」。
    """
    if isinstance(value, str):
        return [value]
    if isinstance(value, (list, tuple)):
        return [v for v in value if isinstance(v, str)]
    return []


# go2rtc 的转码参数：视频统一转 H.264，音频转 Opus（WebRTC 两个都原生支持）
GO2RTC_TRANSCODE_SUFFIX = "#video=h264#audio=opus"


def build_go2rtc_source(raw_url: str) -> str:
    """把用户填的原始 RTSP 地址包装成 go2rtc 的**转码**源。

    为什么必须显式转码：很多摄像头（尤其国产、以及经过另一个 go2rtc 中转的）
    输出的是 H.265/HEVC，而浏览器的 WebRTC 只支持 H.264 / VP8 / VP9 / AV1，
    H265 透传过去浏览器解不出来，播放页会一直卡在 loading。

    坑点：只在 `rtsp://...` 后面加 `#video=h264` 是**没有用的** ——
    那个后缀只是「过滤器」，它只能从流已有的编码里挑一个，并不会创建新编码。
    必须用 `ffmpeg:` 前缀，go2rtc 才会真的拉起 ffmpeg 做转码
    （内置模板是 `-codec:v libx264 -preset:v superfast -tune:v zerolatency`，低延迟）。
    """
    if not raw_url:
        return raw_url
    if raw_url.startswith("ffmpeg:"):
        return raw_url
    return f"ffmpeg:{raw_url}{GO2RTC_TRANSCODE_SUFFIX}"


def unwrap_go2rtc_source(src: str) -> str:
    """从 go2rtc 的源里还原用户填的原始地址，用于判断「这条流是不是已经有了」。

    匹配要基于原始地址，否则每次保存都会因为包装形态不同而生成新 key，
    流越攒越多。
    """
    s = (src or "").strip()
    if s.startswith("ffmpeg:"):
        s = s[len("ffmpeg:"):]
    return s.split("#", 1)[0]


async def sync_go2rtc_streams(streams: dict, go2rtc_config: dict) -> bool:
    """把摄像头流通过 go2rtc 的 HTTP API 推送给它，让新配置**立刻生效**。

    为什么需要这个：原来是写配置文件后调用 `supervisorctl restart go2rtc`，
    而 supervisorctl 只在 Docker 部署里存在，Windows 本地跑 go2rtc 时没有它，
    结果新加的摄像头一直不生效。
    go2rtc 的 API 支持运行时加流，并且会把它持久化回配置文件，
    所以这条路在 Docker 和本地都适用，而且不用重启、没有中断。
    """
    if not streams:
        return True

    api_cfg = go2rtc_config.get("api") or {}
    listen = str(api_cfg.get("listen") or ":5125")
    port = listen.rsplit(":", 1)[-1] or "5125"
    base_path = str(api_cfg.get("base_path") or "").rstrip("/")
    base = f"http://127.0.0.1:{port}{base_path}"

    ok = True
    # 注意必须显式设置超时：aiohttp 默认是 5 分钟，
    # go2rtc 没起来时会让「保存配置」这个请求挂住很久。
    timeout = aiohttp.ClientTimeout(total=5)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for name, src in streams.items():
            if not src:
                continue
            try:
                async with session.put(
                    f"{base}/api/streams", params={"name": name, "src": src}
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"推送流到 go2rtc 返回 {resp.status}: {name}")
                        ok = False
            except Exception as e:
                logger.warning(f"推送流到 go2rtc 失败（go2rtc 可能没启动）: {name} - {e}")
                ok = False
    return ok


@router.post("/config")
async def save_config(
    config: dict,
    current_user: User = Depends(get_current_user)
):
    """保存配置"""
    try:
        # 生成备份文件名
        now = datetime.now()
        backup_name = f"config-{now.strftime('%Y%m%d%H%M%S')}.json"
        
        # 如果存在旧配置,创建备份
        config_file = CONFIG_DIR / "config.json"
        if config_file.exists():
            with open(config_file, "r", encoding="utf-8") as f:
                old_config = json.load(f)
            backup_file = CONFIG_DIR / backup_name
            with open(backup_file, "w", encoding="utf-8") as f:
                json.dump(old_config, f, indent=2, ensure_ascii=False)
                
            # 清理旧备份,只保留最新的5个
            # 注意用 safe_remove：清理失败绝不能影响保存结果，更不能让进程退出
            backup_files = sorted(
                [f for f in CONFIG_DIR.glob("config-*.json")],
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            for f in backup_files[5:]:
                safe_remove(f)
                
        # 更新go2rtc配置
        try:
            go2rtc_config_path = cfg.base.go2rtc_config_path
            
            with open(go2rtc_config_path, "r", encoding="utf-8") as f:
                go2rtc_config = yaml.safe_load(f) or {}
            
            # 确保streams是一个字典
            if not go2rtc_config.get("streams"):
                go2rtc_config["streams"] = {}
            
            # 确保现有的streams是一个字典
            if not isinstance(go2rtc_config["streams"], dict):
                go2rtc_config["streams"] = {}
            
            # 注意：streams 的值可能是字符串也可能是列表，必须统一处理，
            # 否则 set() 会抛 unhashable type: 'list' 把整个保存流程打断
            existing_urls = set()
            for _v in go2rtc_config["streams"].values():
                # 用还原后的原始地址比较，包装形态不同不算新流
                existing_urls.update(unwrap_go2rtc_source(v) for v in stream_sources(_v))
            existing_keys = set()
            
            if "cards" in config:
                for card in config["cards"]:
                    if card.get("type") == "CameraCard":
                        cameras = card.get("config", {}).get("cameras", [])
                        updated_cameras = []
                        for camera in cameras:
                            if camera.get("stream_url"):
                                # 生成基础key
                                base_name = camera.get("name") or camera.get("entity_id") or camera["stream_url"]
                                stream_key = generate_stream_key(base_name)
                                
                                # 检查URL是否已存在，如果存在则复用原有的key
                                # （同样要兼容值是列表的情况）
                                existing_key = None
                                for key, url in go2rtc_config["streams"].items():
                                    if camera["stream_url"] in [
                                        unwrap_go2rtc_source(v) for v in stream_sources(url)
                                    ]:
                                        existing_key = key
                                        break
                                
                                if existing_key:
                                    stream_key = existing_key
                                else:
                                    # 确保key唯一
                                    counter = 1
                                    original_key = stream_key
                                    while stream_key in existing_keys:
                                        stream_key = f"{original_key}_{counter}"
                                        counter += 1
                                    existing_keys.add(stream_key)

                                # 不管是不是已有流，都写入「转码版」源。
                                # 这样以前存的裸 rtsp（H265 播不了）在下次保存时会自动升级，
                                # 不用手工去改 go2rtc.yaml。
                                go2rtc_config["streams"][stream_key] = build_go2rtc_source(
                                    camera["stream_url"]
                                )
                                existing_urls.add(camera["stream_url"])
                                
                                # 添加播放地址到摄像头配置
                                camera["play_url"] = f"./go2rtc/stream.html?src={stream_key}"
                            
                            updated_cameras.append(camera)
                        
                        # 更新cameras列表
                        card["config"]["cameras"] = updated_cameras
            
            # 保存更新后的go2rtc配置
            logger.info(f"go2rtc_config: {go2rtc_config}")
            with open(go2rtc_config_path, "w", encoding="utf-8") as f:
                yaml.dump(go2rtc_config, f, allow_unicode=True, default_flow_style=False)
            
            # 保存更新后的用户配置（包含播放地址）
            with open(config_file, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
       
            
            # 让 go2rtc 立刻加载新配置。
            # 优先走 go2rtc 的 HTTP API 动态推送（不用重启，Windows / Docker 都适用）；
            # 推不通再退回 Docker 里的 supervisorctl 重启。
            synced = await sync_go2rtc_streams(
                go2rtc_config.get("streams") or {}, go2rtc_config
            )
            if not synced:
                try:
                    subprocess.run(["supervisorctl", "restart", "go2rtc"], check=True)
                except Exception as e:
                    logger.warning(f"重启go2rtc服务失败(配置已保存,不影响使用): {str(e)}")
            
        except Exception as e:
            logger.error(f"更新go2rtc配置失败: {str(e)}")
            return generate_resp(code=500, error=f"更新go2rtc配置失败: {str(e)}")
            
        return generate_resp(message="保存成功")
    except Exception as e:
        return generate_resp(code=500, error=str(e))

@router.get("/versions")
async def get_versions():
    """获取配置版本列表"""
    try:
        versions = []
        for f in CONFIG_DIR.glob("config*.json"):
            stat = f.stat()
            versions.append({
                "filename": f.name,
                "lastmod": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "size": f"{stat.st_size / 1024:.2f} KB"
            })
            
        versions.sort(key=lambda x: x["filename"], reverse=True)
        return generate_resp(data=versions[:5])  # 只返回最新的5个版本
    except Exception as e:
        return generate_resp(code=500, error=str(e))

@router.get("/versions/{filename}")
async def get_version(filename: str, ):
    """获取指定版本的配置"""
    try:
        config_file = CONFIG_DIR / filename
        if not config_file.exists():
            return generate_resp(code=404, error="版本不存在")
            
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
        return generate_resp(data=config)
    except Exception as e:
        return generate_resp(code=500, error=str(e))

@router.delete("/versions/{filename}")
async def delete_version(filename: str, ):
    """删除指定版本"""
    try:
        if filename == "config.json":
            return generate_resp(code=400, error="不能删除当前使用的配置文件")
            
        config_file = CONFIG_DIR / filename
        if not config_file.exists():
            return generate_resp(code=404, error="版本不存在")

        # 这里是用户主动删除，删失败要如实报错（而不是让进程退出）
        if not safe_remove(config_file):
            return generate_resp(code=500, error="删除失败，请检查文件是否被占用")
        return generate_resp(message="删除成功")
    except Exception as e:
        return generate_resp(code=500, error=str(e))
    
@router.get("/hass_config")
async def get_hass_config():
    """获取Hass配置"""
    db = SessionLocal()
    try:
        hass_config = db.query(HassConfig).first()
        if not hass_config:
            return generate_resp(code=400, error="Home Assistant configuration not found")

        # 检查hass_token是否正确
        check_result = await check_hass_token(hass_config.hass_url, hass_config.hass_token)
        if not check_result:
            # ⚠️ 这里只对「本次响应」返回空令牌，不要 commit 清空数据库里的值。
            # 原因：前端会把 hakit 的 OAuth 令牌回写进来，那是短期令牌（约30分钟过期）；
            # 一旦它过期、或只是网络抖了一下导致校验失败，原来的 commit 就会把配置
            # 永久删掉，用户只能重新授权。改成非破坏性后，下次授权成功即可自动恢复。
            logger.warning("Home Assistant token 校验未通过，本次返回空令牌（不清空数据库）")
            return generate_resp(data={
                "url": hass_config.hass_url,
                "token": ''
            })
        
        return generate_resp(data={
            "url": hass_config.hass_url,
            "token": hass_config.hass_token
        })
    except Exception as e:
        logger.error(f"获取Home Assistant配置失败: {str(e)}")
        return generate_resp(code=500, message=str(e))
    finally:
        db.close()

class HassConfigUpdate(BaseModel):
    hass_url: str
    hass_token: str

@router.put("/hass_config")
async def update_hass_config(config: HassConfigUpdate):
    """更新Hass配置"""
    db = SessionLocal()
    try:
        # 检查存在hass_url和hass_token是否正确
        check_result = await check_hass_token(config.hass_url, config.hass_token)
        logger.info(f"check_result: {check_result}")
        if not check_result:
            return generate_resp(code=400, error="Home Assistant token is invalid")

        hass_config = db.query(HassConfig).first()
        if not hass_config:
            hass_config = HassConfig()
            db.add(hass_config)
        
        hass_config.hass_url = config.hass_url
        hass_config.hass_token = config.hass_token
        
        db.commit()
        return generate_resp(message="Home Assistant configuration updated successfully")
    except Exception as e:
        db.rollback()
        logger.error(f"更新Home Assistant配置失败: {str(e)}")
        return generate_resp(code=500, message=str(e))
    finally:
        db.close()
