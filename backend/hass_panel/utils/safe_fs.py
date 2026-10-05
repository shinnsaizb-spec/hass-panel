"""安全删除文件。

为什么需要这个：
某些运行环境（例如带「删除拦截 / 回收站」保护的安全沙箱）在删除文件时会抛出
``SystemExit``。它不是 ``Exception`` 的子类，普通的 ``except Exception`` 抓不到，
一旦发生会让**整个服务进程直接退出**（表现为前端一直卡在 loading）。

所以所有「可选的维护性删除」都应该走这里，删不掉就跳过，绝不影响主流程。
"""
import os

from loguru import logger


def safe_remove(path) -> bool:
    """删除文件，失败只记日志、绝不抛异常。返回是否真的删掉了。"""
    try:
        os.remove(path)
        return True
    except FileNotFoundError:
        # 本来就不存在，视作成功
        return True
    except BaseException as e:  # noqa: BLE001 - 见模块说明，必须连 SystemExit 一起接住
        logger.warning(f"删除文件失败（已跳过，不影响主流程）: {path} - {e}")
        return False
