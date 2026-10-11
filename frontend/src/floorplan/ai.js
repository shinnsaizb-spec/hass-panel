import { axiosInstance } from '../utils/api';
import { uid } from '../neonplan3d/model.js';

// ============================================================================
// 「自动生成户型」的前后端桥 + 坐标换算
// ----------------------------------------------------------------------------
// 分工：
//   后端  POST /api/floorplan/analyze  → 拿图片去问多模态模型，回**归一化坐标 0..1**
//   这里  把归一化坐标换算成 Building 要的**米制**房间/自由墙
//
// ⚠️ 为什么让模型给归一化坐标而不是毫米：多模态模型对「绝对坐标/尺寸」的估计非常不准，
//    但对「在图的左三分之一、上四分之一」这种相对位置判断可靠得多。比例由我们自己按
//    标定好的底图宽度换算，误差小一个数量级。
//
// ⚠️ 底图的摆放规则必须和编辑器 `renderBackground()` 完全一致（抄它的）：
//      图片**左上角**落在 (bg.x, bg.z)，绕**图片中心**旋转 bg.rotation 度，
//      真实宽度 = bg.width（米），高度 = bg.width × (图高/图宽)。
//    对不上的话生成出来的房间会整体偏移/旋转 —— 改这里前先回去看那个函数。
// ============================================================================

function unwrap(resp) {
  const body = resp && resp.data;
  if (!body || body.code !== 200) {
    const msg = (body && (body.error || body.message)) || '请求失败';
    throw new Error(msg);
  }
  return body.data;
}

export const aiApi = {
  /** 读模型配置（后端**不会**回传 api_key，只给 has_key）。 */
  async getConfig() {
    return unwrap(await axiosInstance.get('/floorplan/ai-config'));
  },

  /**
   * 存模型配置。
   * ⚠️ `api_key` 留空 = **不改动**（前端本来就拿不到原 Key）。
   *    要清空请传 `{ clear_key: true }`。
   */
  async putConfig(cfg) {
    return unwrap(await axiosInstance.put('/floorplan/ai-config', cfg));
  },

  /** 把底图交给模型识别。`imageDataUrl` 是 `data:image/...;base64,...`。 */
  async analyze(imageDataUrl) {
    return unwrap(await axiosInstance.post('/floorplan/analyze', { image: imageDataUrl }, { timeout: 200000 }));
  },
};

// ---------------------------------------------------------------------------
// 纯函数（标定 + 坐标换算）—— 不依赖 React / DOM，方便单测
// ---------------------------------------------------------------------------

/** 标定：已知图上一条线的真实长度 → 每像素多少毫米。 */
export function mmPerPixel(realMm, pixelLength) {
  const mm = Number(realMm);
  const px = Number(pixelLength);
  if (!Number.isFinite(mm) || !Number.isFinite(px) || mm <= 0 || px <= 0) return null;
  return mm / px;
}

/** 标定结果 → 底图应该被设成多宽（米）。 */
export function backgroundWidthMeters(imageWidthPx, mmPerPx) {
  const w = Number(imageWidthPx);
  const m = Number(mmPerPx);
  if (!Number.isFinite(w) || !Number.isFinite(m) || w <= 0 || m <= 0) return null;
  return (w * m) / 1000;
}

/** 米制保留毫米精度（和编辑器里 `round()` 一致）。 */
function r3(v) {
  return Math.round(v * 1000) / 1000;
}

/**
 * 归一化坐标 (0..1，相对底图) → 平面米制坐标。
 * 复刻 `renderBackground()`：左上角在 (bg.x, bg.z)，绕中心旋转 rotation 度。
 */
export function normalizedToPlan(u, v, bg, aspect) {
  const W = Number(bg && bg.width) || 0;
  const a = Number(aspect) || 0;
  const H = W * a;
  const cx = W / 2;
  const cz = H / 2;
  const dx = u * W;
  const dz = v * H;
  const rad = ((Number(bg && bg.rotation) || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // y 轴向下，所以正向旋转在屏幕上表现为顺时针 —— 和 SVG 的 rotate() 一致
  const rx = cx + (dx - cx) * cos - (dz - cz) * sin;
  const rz = cz + (dx - cx) * sin + (dz - cz) * cos;
  return [(Number(bg && bg.x) || 0) + rx, (Number(bg && bg.z) || 0) + rz];
}

/**
 * 把模型返回的归一化结果转成 Building 能直接吃的房间 / 自由墙。
 * ⚠️ id 在**这里**生成（不能在 setState 的 updater 里生成：StrictMode 会把 updater 跑两次，
 *    每次都拿到不同的随机 id）。
 */
export function aiResultToBuildingParts(result, bg, aspect) {
  const rooms = [];
  const walls = [];

  for (const raw of (result && result.rooms) || []) {
    const pts = Array.isArray(raw && raw.points) ? raw.points : [];
    const poly = pts
      .filter(
        (p) =>
          Array.isArray(p) &&
          p.length >= 2 &&
          Number.isFinite(Number(p[0])) &&
          Number.isFinite(Number(p[1]))
      )
      .map((p) => normalizedToPlan(Number(p[0]), Number(p[1]), bg, aspect).map(r3));
    if (poly.length < 3) continue;
    rooms.push({
      id: uid('room'),
      name: (raw && typeof raw.name === 'string' ? raw.name : '').trim() || '房间',
      area_id: null,
      points: poly,
      floor_material: 'wood',
    });
  }

  for (const raw of (result && result.walls) || []) {
    const a = Array.isArray(raw && raw.a) ? raw.a : null;
    const b = Array.isArray(raw && raw.b) ? raw.b : null;
    if (!a || !b) continue;
    const pa = normalizedToPlan(Number(a[0]), Number(a[1]), bg, aspect).map(r3);
    const pb = normalizedToPlan(Number(b[0]), Number(b[1]), bg, aspect).map(r3);
    // 太短的当噪声丢掉（和编辑器 addFreeWall 的 0.2m 门槛一致）
    if (!Number.isFinite(pa[0]) || Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < 0.2) continue;
    walls.push({ id: uid('wall'), a: pa, b: pb, thickness: null });
  }

  return { rooms, walls };
}
