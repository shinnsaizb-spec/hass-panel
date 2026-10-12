from fastapi import APIRouter, Depends, UploadFile, File
from loguru import logger
from typing import Dict
import asyncio
import os
from hass_panel.utils.common import generate_resp
from hass_panel.utils.updater import get_latest_release, run_update, process_manual_update, apply_manual_update
from hass_panel.utils.config import cfg
from hass_panel.core.auth_deps import get_current_user
router = APIRouter(
    prefix='/api',
    tags=['update'],
    dependencies=[Depends(get_current_user)]
)

# ⚠️ 这个路由里的活儿全是同步重体力（requests 下载、解压、rsync subprocess），
#    直接写在 async 端点里会阻塞整个事件循环（一次手动更新能让全服务卡死几分钟）。
#    统一丢线程池，事件循环该干嘛干嘛。


@router.get("/version")
async def version():
    """
    获取最新版本信息
    """
    release = await asyncio.get_running_loop().run_in_executor(
        None, get_latest_release
    )
    return generate_resp(data={
        "version": release["version"],
        "download_url": release["download_url"],
    })

@router.get("/update")
async def update():
    """
    处理更新请求的端点
    """
    logger.info("收到更新请求")
    try:
        result = await asyncio.get_running_loop().run_in_executor(None, run_update)
        if result is None:
            return generate_resp(message="已经是最新版本")
        return generate_resp(message=f"更新成功，新版本：{result}")
    except Exception as e:
        logger.exception("更新失败")
        return generate_resp(code=500, message=str(e))

@router.post("/upload-update")
async def upload_update(package: UploadFile = File(...)):
    """
    处理手动上传更新包的端点

    Args:
        package: 上传的更新包文件

    Returns:
        Dict: 包含处理结果的响应
    """
    logger.info(f"收到更新包上传请求: {package.filename}")

    # 验证文件类型
    if not (package.filename.endswith('.zip') or package.filename.endswith('.tar.gz')):
        return generate_resp(code=400, message="不支持的文件格式，仅支持 .zip 和 .tar.gz")

    try:
        # 确保临时目录存在
        os.makedirs(cfg.update_cfg.tmp_dir, exist_ok=True)

        # 处理更新包（同步重活：读文件 + 解压 + 校验，丢线程池）
        package_info = await asyncio.get_running_loop().run_in_executor(
            None, process_manual_update, package
        )

        return generate_resp(data=package_info)
    except Exception as e:
        logger.exception("处理更新包失败")
        return generate_resp(code=500, message=str(e))

@router.post("/manual-update")
async def manual_update(package_info: Dict):
    """
    处理手动更新的端点
    """
    logger.info("收到手动更新请求")
    try:
        version = await asyncio.get_running_loop().run_in_executor(
            None, apply_manual_update, package_info
        )
        return generate_resp(message=f"更新成功，新版本：{version}")
    except Exception as e:
        logger.exception("手动更新失败")
        return generate_resp(code=500, message=str(e))
