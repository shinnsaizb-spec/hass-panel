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
import aiohttp
import json
import re
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
# 新版编辑器（neonplan3d 移植版）里的图片：底图 + 家具上的屏显图。
# 上游把图片存在 HA 的 storage 里（`neonplan3d/image/get|set` 两个 WS 命令），
# 这里改成存文件 —— **刻意放在户型图文档之外**：
#   ① 文档本身保持小（dataURL 动辄几百 KB），
#   ② 每次保存都会复制一份历史版本，图片塞进文档会把备份目录撑爆。
# 内容就是前端给的 dataURL 原文（`data:image/jpeg;base64,...`），前端拿回来直接当 `img.src`。
IMAGE_DIR = PLAN_DIR / "floorplan_images"

# 最多留多少份历史版本
MAX_BACKUPS = 20

# image_id 由前端生成（`img_xxx` / `pic_xxx`），只允许这种安全字符，避免路径穿越
IMAGE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

# 单张图片（dataURL 原文）的大小上限：base64 长度 14MB ≈ 解码后 10MB。
# 户型底图和家具屏显图都到不了这个量级；没有上限时一个几十 MB 的 dataURL
# 会被整个读进内存再落盘。
MAX_IMAGE_DATAURL_LEN = 14 * 1024 * 1024

# ---------------------------------------------------------------------------
# 「自动生成户型」用的多模态模型配置
# ---------------------------------------------------------------------------
# 面板自己**不带模型**，由用户填自己的（任何兼容 OpenAI 接口规范的多模态服务都行：
# 阿里云百炼的通义千问 VL、智谱 GLM-4V、OpenAI 等，只要改 base_url/model 就行）。
#
# ⚠️ 这个文件里有 API Key —— 它落在 `user_config_dir`（`data/` 下，已在 .gitignore 里），
#    **不要**把它挪到仓库里，也**不要**通过接口回传前端（见 `_public_ai_config`）。
AI_CONFIG_FILE = PLAN_DIR / "floorplan_ai.json"

# 给模型的提示词。
# ⚠️ 关键设计：要它返回**归一化坐标 0..1**而不是毫米/像素 —— 多模态模型对绝对坐标的
#    估计非常不准，但对「在图的左三分之一、上四分之一」这种相对位置的判断可靠得多。
#    拿到归一化坐标后，我们再用标定好的比例换算成真实尺寸，误差小一个数量级。
ANALYZE_PROMPT = """You are a floor plan parser. The image is an architectural floor plan.

Return ONLY a JSON object (no markdown fence, no explanation) shaped exactly like this:

{
  "rooms": [
    {"name": "<room name, in the language used in the image>",
     "points": [[x1,y1],[x2,y2],[x3,y3]]}
  ],
  "walls": [ {"a":[x1,y1], "b":[x2,y2]} ]
}

Rules:
- Every coordinate is NORMALIZED to 0..1 relative to the image: x=0 is the left edge,
  x=1 the right edge, y=0 the top edge, y=1 the bottom edge.
- "points" is the closed outline of one room, following the INNER face of its walls,
  listed in order (clockwise or counter-clockwise). Use 3 to 12 points.
- Include every enclosed space: bedrooms, living room, kitchen, bathrooms, balconies,
  corridors, closets, shafts. Use the label printed in the image as "name".
- Ignore everything outside the building outline: dimension lines, numbers, the compass,
  the logo, the total-area caption.
- "walls" is OPTIONAL. Only list free-standing partitions that are NOT already an edge of
  any room you returned. Use [] when there are none.
- Do not invent rooms. When a small space is hard to read, still return your best guess.
"""


def _load_ai_config() -> dict:
    if not AI_CONFIG_FILE.exists():
        return {}
    try:
        return json.loads(AI_CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        logger.warning(f"读取模型配置失败: {e}")
        return {}


def _public_ai_config(cfg: dict) -> dict:
    """给前端的版本。

    ⚠️ **绝不回传 api_key** —— 只回一个 `has_key` 标记。前端拿不到原 Key，
    所以保存时「api_key 留空」必须解释成「不改动」，不能解释成「删掉」。
    """
    return {
        "base_url": cfg.get("base_url") or "",
        "model": cfg.get("model") or "",
        "has_key": bool((cfg.get("api_key") or "").strip()),
    }


def _extract_json(text: str):
    """从模型回复里抠出 JSON 对象。

    模型经常裹一层 ```json 围栏，或者在前后加一句客套话，所以不能直接 json.loads。
    """
    if not isinstance(text, str):
        return None
    s = text.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        return json.loads(s)
    except Exception:  # noqa: BLE001
        pass
    i, j = s.find("{"), s.rfind("}")
    if i >= 0 and j > i:
        try:
            return json.loads(s[i : j + 1])
        except Exception:  # noqa: BLE001
            return None
    return None


def _mock_analyze() -> dict:
    """`base_url` 填 `mock` 时返回的示例结果。

    用途：**没有 API Key 也能把「点按钮 → 后端 → 回填到画布」这整条链走通**
    （也方便做自动化验证）。坐标是归一化的，随便摆的几个房间，不对应任何真实户型。
    """
    return {
        "rooms": [
            {"name": "房间 A", "points": [[0.10, 0.15], [0.45, 0.15], [0.45, 0.45], [0.10, 0.45]]},
            {"name": "房间 B", "points": [[0.45, 0.15], [0.80, 0.15], [0.80, 0.45], [0.45, 0.45]]},
            {"name": "房间 C", "points": [[0.10, 0.45], [0.80, 0.45], [0.80, 0.80], [0.10, 0.80]]},
        ],
        "walls": [{"a": [0.30, 0.20], "b": [0.30, 0.40]}],
    }


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


def _safe_backup_name(name: str) -> bool:
    return bool(name) and "/" not in name and "\\" not in name and name.endswith(".json")


@router.get("/backups/{name}")
async def get_backup(name: str):
    """读某份历史版本的**原始文档**。

    新版编辑器要显示「这个还原点里有几个房间 / 几件家具」，而房间数的算法
    两种格式（旧 plan / 新版 Building 包络）不一样 —— 与其在后端猜格式，
    不如把文档原样给前端，让它用现成的适配器去数。
    """
    if not _safe_backup_name(name):
        return generate_resp(code=400, error="非法的文件名")
    src = BACKUP_DIR / name
    if not src.exists():
        return generate_resp(code=404, error="找不到这个历史版本")
    try:
        return generate_resp(data={"plan": json.loads(src.read_text(encoding="utf-8"))})
    except Exception as e:  # noqa: BLE001
        logger.error(f"读取历史版本失败: {e}")
        return generate_resp(code=500, error=f"读取历史版本失败: {e}")


# ---------------------------------------------------------------------------
# 图片存储（新版编辑器的底图 / 家具屏显图）
# 对应上游 HA 侧的 `neonplan3d/image/get` 与 `neonplan3d/image/set` 两个 WS 命令。
# ---------------------------------------------------------------------------


def _image_file(image_id: str) -> Path:
    return IMAGE_DIR / f"{image_id}.txt"


@router.get("/images/{image_id}")
async def get_image(image_id: str):
    """取一张图，返回 dataURL 原文（前端直接当 `img.src` 用）。"""
    if not IMAGE_ID_RE.match(image_id):
        return generate_resp(code=400, error="非法的 image_id")
    f = _image_file(image_id)
    if not f.exists():
        return generate_resp(code=404, error="找不到这张图")
    try:
        return generate_resp(data={"data": f.read_text(encoding="utf-8")})
    except Exception as e:  # noqa: BLE001
        logger.error(f"读取图片失败: {e}")
        return generate_resp(code=500, error=f"读取图片失败: {e}")


@router.put("/images/{image_id}")
async def put_image(image_id: str, payload: dict = Body(...)):
    """存一张图。body: {"data": "data:image/jpeg;base64,..."}"""
    if not IMAGE_ID_RE.match(image_id):
        return generate_resp(code=400, error="非法的 image_id")
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, str) or not data:
        return generate_resp(code=400, error="data 必须是非空的 dataURL 字符串")
    if not data.startswith("data:image/"):
        return generate_resp(code=400, error="data 必须是图片 dataURL")
    if len(data) > MAX_IMAGE_DATAURL_LEN:
        return generate_resp(
            code=400,
            error=f"图片过大：上限约 {MAX_IMAGE_DATAURL_LEN * 3 // 4 // 1024 // 1024}MB",
        )
    try:
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        _image_file(image_id).write_text(data, encoding="utf-8")
        return generate_resp(data={"ok": True})
    except Exception as e:  # noqa: BLE001
        logger.error(f"保存图片失败: {e}")
        return generate_resp(code=500, error=f"保存图片失败: {e}")


@router.delete("/images/{image_id}")
async def delete_image(image_id: str):
    """删一张图。图不存在也算成功（幂等）。"""
    if not IMAGE_ID_RE.match(image_id):
        return generate_resp(code=400, error="非法的 image_id")
    try:
        _image_file(image_id).unlink(missing_ok=True)
        return generate_resp(data={"ok": True})
    except Exception as e:  # noqa: BLE001
        logger.error(f"删除图片失败: {e}")
        return generate_resp(code=500, error=f"删除图片失败: {e}")


# ---------------------------------------------------------------------------
# 自动生成户型（多模态模型）
# ---------------------------------------------------------------------------


@router.get("/ai-config")
async def get_ai_config():
    """读模型配置。**不回传 api_key**，只给 has_key 标记。"""
    return generate_resp(data=_public_ai_config(_load_ai_config()))


@router.put("/ai-config")
async def put_ai_config(payload: dict = Body(...)):
    """存模型配置。

    ⚠️ `api_key` 只在**传了非空值**时才覆盖 —— 前端根本拿不到原 Key，
    输入框空着提交是「我没改」，不能当成「清空 Key」。要清空请显式传 `clear_key: true`。
    """
    cfg = _load_ai_config()
    if "base_url" in payload:
        cfg["base_url"] = str(payload.get("base_url") or "").strip()
    if "model" in payload:
        cfg["model"] = str(payload.get("model") or "").strip()
    key = payload.get("api_key")
    if isinstance(key, str) and key.strip():
        cfg["api_key"] = key.strip()
    if payload.get("clear_key") is True:
        cfg["api_key"] = ""
    try:
        AI_CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
        return generate_resp(data=_public_ai_config(cfg))
    except Exception as e:  # noqa: BLE001
        logger.error(f"保存模型配置失败: {e}")
        return generate_resp(code=500, error=f"保存模型配置失败: {e}")


@router.post("/analyze")
async def analyze_plan(payload: dict = Body(...)):
    """把户型图交给多模态模型，让它识别出房间多边形。

    入参：`{"image": "<dataURL>"}`。
    出参：`{"result": {"rooms": [...], "walls": [...]}, "model": "..."}`，
    **坐标是归一化的 0..1**，换算成真实尺寸由前端按标定好的比例做。
    """
    cfg = _load_ai_config()
    base_url = (cfg.get("base_url") or "").strip().rstrip("/")
    api_key = (cfg.get("api_key") or "").strip()
    model = (cfg.get("model") or "").strip()
    is_mock = base_url == "mock"
    if not base_url or not model or (not api_key and not is_mock):
        return generate_resp(
            code=400, error="还没配置模型：请先填写 base_url / api_key / model"
        )

    image = payload.get("image") if isinstance(payload, dict) else None
    if not isinstance(image, str) or not image.startswith("data:image/"):
        return generate_resp(code=400, error="image 必须是一个图片 dataURL")

    if is_mock:
        return generate_resp(data={"result": _mock_analyze(), "model": "mock"})

    url = f"{base_url}/chat/completions"
    body = {
        "model": model,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": ANALYZE_PROMPT},
                    {"type": "image_url", "image_url": {"url": image}},
                ],
            }
        ],
    }
    try:
        timeout = aiohttp.ClientTimeout(total=180)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.post(
                url, json=body, headers={"Authorization": f"Bearer {api_key}"}
            ) as resp:
                text = await resp.text()
                if resp.status != 200:
                    logger.error(f"模型返回 {resp.status}: {text[:500]}")
                    return generate_resp(code=502, error=f"模型返回 {resp.status}：{text[:300]}")
                data = json.loads(text)
    except Exception as e:  # noqa: BLE001
        logger.error(f"调用模型失败: {e}")
        return generate_resp(code=502, error=f"调用模型失败：{e}")

    choices = data.get("choices") or []
    content = ((choices[0] if choices else {}).get("message") or {}).get("content") or ""
    result = _extract_json(content)
    if not isinstance(result, dict) or not isinstance(result.get("rooms"), list):
        logger.error(f"模型没返回合法 JSON: {content[:500]}")
        return generate_resp(code=502, error=f"模型没有返回可用的 JSON：{content[:300]}")

    return generate_resp(data={"result": result, "model": model})


