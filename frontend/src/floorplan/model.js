// ==============================================================================
// 户型图数据模型
// ------------------------------------------------------------------------------
// 单位统一用**毫米**（整数）：真实户型图上的尺寸就是毫米（4200 = 4.2 米），
// 编辑器网格吸附、读图标注都方便；渲染 3D 时再除以 1000 换成米。
//
// 这份模型刻意做成**引擎无关**的纯 JSON —— 编辑器、3D 渲染、以后的 2D 平面图
// 都只读它，换渲染方式不用重画。
// ==============================================================================

export const PLAN_VERSION = 1;

/** 默认墙高（毫米） */
export const DEFAULT_WALL_HEIGHT = 2700;
/** 默认网格（毫米） */
export const DEFAULT_GRID = 100;

/** 绑定的实体类型 */
export const BINDING_KINDS = [
  { value: 'light', label: '灯' },
  { value: 'switch', label: '开关/插座' },
  { value: 'cover', label: '窗帘/门窗' },
  { value: 'sensor', label: '传感器' },
  { value: 'camera', label: '摄像头' },
];

let seq = 0;
/** 生成一个短 id（不依赖 crypto，浏览器/测试环境都能跑） */
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`;
}

export function createEmptyPlan() {
  return {
    version: PLAN_VERSION,
    name: '',
    gridSize: DEFAULT_GRID,
    background: null,
    floors: [],
    rooms: [],
    bindings: [],
  };
}

export function createFloor(name = '一层', level = 0) {
  return {
    id: uid('fl'),
    name,
    level,
    wallHeight: DEFAULT_WALL_HEIGHT,
  };
}

/**
 * 房间：矩形，x/y 是左上角，单位毫米。
 * 第一版只支持矩形（拖一个框 = 一个房间），以后要加自由多边形时在这里扩展
 * points 字段即可，3D 侧统一走 getRoomPolygon()。
 */
export function createRoom(floorId, x, y, w, h, name = '') {
  return {
    id: uid('rm'),
    floorId,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
    name,
  };
}

export function createBinding(roomId, entityId = '', kind = 'light') {
  return { id: uid('bd'), roomId, entityId, kind };
}

/** 毫米 -> 米 */
export const mmToM = (mm) => (Number(mm) || 0) / 1000;

/** 把房间规整成正的宽高（拖框可能反向拖） */
export function normalizeRoom(room) {
  const x = room.w < 0 ? room.x + room.w : room.x;
  const y = room.h < 0 ? room.y + room.h : room.y;
  return {
    ...room,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(Math.abs(room.w)),
    h: Math.round(Math.abs(room.h)),
  };
}

/** 房间的四角（毫米），顺序：左上 → 右上 → 右下 → 左下 */
export function roomCorners(room) {
  return [
    [room.x, room.y],
    [room.x + room.w, room.y],
    [room.x + room.w, room.y + room.h],
    [room.x, room.y + room.h],
  ];
}

/** 房间的轮廓（以后支持多边形时这里返回 points，矩形时现算） */
export function getRoomPolygon(room) {
  if (Array.isArray(room.points) && room.points.length >= 3) return room.points;
  return roomCorners(room);
}

export function roomArea(room) {
  return Math.abs((room.w || 0) * (room.h || 0));
}

/** 平方米（保留 1 位小数） */
export function roomAreaM2(room) {
  return Math.round((roomArea(room) / 1e6) * 10) / 10;
}

/**
 * 从房间生成墙段。
 * 每面墙 = 两个端点；相邻房间重合的墙会去重（否则墙会叠两层、渲染时 z-fighting）。
 * 返回 [{ a: [x,y], b: [x,y] }]，单位毫米。
 */
export function buildWalls(rooms) {
  const seen = new Map();
  const keyOf = (p, q) => {
    // 端点排序后做 key，保证 A→B 和 B→A 算同一段
    const [p1, p2] = [p, q].sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    return `${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`;
  };

  (rooms || []).forEach((room) => {
    const c = roomCorners(room);
    for (let i = 0; i < 4; i++) {
      const a = c[i];
      const b = c[(i + 1) % 4];
      const key = keyOf(a, b);
      if (!seen.has(key)) seen.set(key, { a, b });
    }
  });

  return Array.from(seen.values());
}

/** 整个户型的包围盒（毫米），用于 3D 视图自动取景 */
export function planBounds(plan) {
  const rooms = (plan && plan.rooms) || [];
  if (rooms.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  rooms.forEach((r) => {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** 吸附到网格 */
export function snap(value, grid) {
  const g = Number(grid) || 0;
  if (g <= 0) return Math.round(value);
  return Math.round(value / g) * g;
}

/** 把外部读进来的数据补齐字段，避免旧版本/手工编辑缺字段导致崩溃 */
export function normalizePlan(raw) {
  const base = createEmptyPlan();
  if (!raw || typeof raw !== 'object') return base;
  const plan = {
    ...base,
    ...raw,
    floors: Array.isArray(raw.floors) ? raw.floors : [],
    rooms: Array.isArray(raw.rooms) ? raw.rooms.map(normalizeRoom) : [],
    bindings: Array.isArray(raw.bindings) ? raw.bindings : [],
  };
  if (plan.floors.length === 0) plan.floors = [createFloor('一层', 0)];
  // 房间如果没挂楼层，挂到第一层
  const firstFloor = plan.floors[0].id;
  plan.rooms = plan.rooms.map((r) => ({ ...r, floorId: r.floorId || firstFloor }));
  return plan;
}
