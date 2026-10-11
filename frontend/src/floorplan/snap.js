// ==============================================================================
// 画图吸附
// ------------------------------------------------------------------------------
// 编辑器里所有的取点都走这里，优先级从高到低：
//   ① 顶点吸附 —— 贴到别的房间的角上（这样两个房间才能严丝合缝地拼起来）
//   ② 边吸附   —— 贴到别的房间的边上（共用一面墙）
//   ③ 正交约束 —— 正在拉框时，让这个点与起点在同一水平/垂直线（按住 Shift 可临时关掉）
//   ④ 网格吸附 —— 兜底
// 返回里带 `guides`，编辑器据此画出对齐辅助线。
//
// 单位：毫米。`threshold` 也是毫米，调用方按当前缩放把「屏幕像素」换算过来
// （见 editor 里的 pxToMm()）—— 这样放大后吸附依然跟手。
// ==============================================================================

import { getRoomPolygon, roomEdge, pointOnRoomEdge, snap as gridSnap } from './model';

/** 屏幕上的吸附半径（像素）——调用方负责换算成毫米 */
export const SNAP_PX = 8;

/**
 * 求一个点的吸附结果。
 *
 * @param {[number,number]} pt            原始点（毫米）
 * @param {Object} ctx
 *   grid      网格（毫米）
 *   rooms     房间数组（用于顶点/边吸附）
 *   threshold 吸附半径（毫米）
 *   from      拖拽起点；给了就会做正交约束（拉框时用）
 *   ortho     是否启用正交约束（默认 true；按住 Shift 传 false）
 *   skipId    排除的房间 id（拖动房间自己时，别吸附到自己身上）
 * @returns {{x:number, y:number, kind:string, guides:Array}}
 */
export function snapPoint(pt, ctx = {}) {
  const grid = Number(ctx.grid) > 0 ? Number(ctx.grid) : 100;
  const thr = Number(ctx.threshold) > 0 ? Number(ctx.threshold) : grid * 1.5;
  const rooms = (ctx.rooms || []).filter((r) => r.id !== ctx.skipId);
  const [px, py] = pt;
  const guides = [];

  // ① 顶点吸附
  let bestVert = null;
  rooms.forEach((room) => {
    getRoomPolygon(room).forEach((v) => {
      const d = Math.hypot(v[0] - px, v[1] - py);
      if (d <= thr && (!bestVert || d < bestVert.d)) bestVert = { d, v };
    });
  });
  if (bestVert) {
    return {
      x: bestVert.v[0],
      y: bestVert.v[1],
      kind: 'vertex',
      guides: [
        { axis: 'x', value: bestVert.v[0] },
        { axis: 'y', value: bestVert.v[1] },
      ],
    };
  }

  // ② 边吸附：找最近的房间边，投影上去
  let bestEdge = null;
  rooms.forEach((room) => {
    const n = getRoomPolygon(room).length;
    for (let i = 0; i < n; i++) {
      const e = roomEdge(room, i);
      if (!e) continue;
      const [a, b] = e;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
      const q = [a[0] + dx * t, a[1] + dy * t];
      const d = Math.hypot(q[0] - px, q[1] - py);
      if (d <= thr && (!bestEdge || d < bestEdge.d)) {
        bestEdge = { d, q, a, b };
      }
    }
  });
  if (bestEdge) {
    const isAxis = Math.abs(bestEdge.a[0] - bestEdge.b[0]) < 1;
    const isHoriz = Math.abs(bestEdge.a[1] - bestEdge.b[1]) < 1;
    return {
      x: Math.round(bestEdge.q[0]),
      y: Math.round(bestEdge.q[1]),
      kind: 'edge',
      guides: isHoriz
        ? [{ axis: 'y', value: Math.round(bestEdge.q[1]) }]
        : isAxis
          ? [{ axis: 'x', value: Math.round(bestEdge.q[0]) }]
          : [],
    };
  }

  // ③ 正交约束（拉框时用：让这个点和起点对齐）
  let x = px;
  let y = py;
  let kind = 'free';
  if (ctx.from && ctx.ortho !== false) {
    const [fx, fy] = ctx.from;
    if (Math.abs(px - fx) >= Math.abs(py - fy)) {
      y = fy;
      kind = 'ortho';
      guides.push({ axis: 'y', value: fy });
    } else {
      x = fx;
      kind = 'ortho';
      guides.push({ axis: 'x', value: fx });
    }
  }

  // ④ 网格
  x = gridSnap(x, grid);
  y = gridSnap(y, grid);
  if (kind === 'free') kind = 'grid';
  return { x, y, kind, guides };
}

/**
 * 把一个矩形按吸附结果归整（画完/拖完时用）。
 * 返回 { x, y, w, h }，保证 w/h 为正。
 */
export function snapRect(x0, y0, x1, y1, ctx = {}) {
  const a = snapPoint([x0, y0], { ...ctx, from: null, ortho: false });
  const b = snapPoint([x1, y1], { ...ctx, from: null, ortho: false });
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

/** 找离某点最近的房间边（门窗落位用）：返回 { roomId, edge, offset, dist, point }
 *  ⚠️ pt 接受 [x, y] 或 {x, y} 两种写法 —— 曾经因为传了对象而静默算出 NaN。 */
export function nearestRoomEdge(pt, rooms, maxDist = Infinity) {
  const px = Array.isArray(pt) ? pt[0] : pt && pt.x;
  const py = Array.isArray(pt) ? pt[1] : pt && pt.y;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  let best = null;
  (rooms || []).forEach((room) => {
    const n = getRoomPolygon(room).length;
    for (let i = 0; i < n; i++) {
      const e = roomEdge(room, i);
      if (!e) continue;
      const [a, b] = e;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
      const q = [a[0] + dx * t, a[1] + dy * t];
      const d = Math.hypot(q[0] - px, q[1] - py);
      if (!Number.isFinite(d) || d > maxDist) continue;
      if (!best || d < best.dist) {
        best = { roomId: room.id, edge: i, offset: t * Math.sqrt(len2), dist: d, point: q };
      }
    }
  });
  return best;
}

/** 把洞口沿墙挪到某个位置（夹在墙内，且不越过相邻洞口） */
export function clampOpeningOffset(room, edge, offset, width, openings, selfId) {
  const e = roomEdge(room, edge);
  if (!e) return 0;
  const len = Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]);
  if (!Number.isFinite(len)) return 0;
  const off = Number.isFinite(offset) ? offset : 0;
  const w = Number.isFinite(width) && width > 0 ? width : 1;
  const others = (openings || [])
    .filter((o) => o.id !== selfId && o.roomId === room.id && o.edge === edge)
    .sort((a, b) => a.offset - b.offset);
  let lo = 0;
  let hi = Math.max(0, len - w);
  others.forEach((o) => {
    if (o.offset + o.width <= off + w / 2) lo = Math.max(lo, o.offset + o.width);
    else if (o.offset >= off + w / 2) hi = Math.min(hi, o.offset - w);
  });
  if (hi < lo) hi = lo;
  return Math.max(lo, Math.min(hi, off));
}

export { pointOnRoomEdge };
