// ==============================================================================
// 户型图数据模型（v2）
// ------------------------------------------------------------------------------
// 单位统一用**毫米**（整数）：真实户型图上的尺寸就是毫米（4200 = 4.2 米），
// 编辑器网格吸附、读图标注都方便；渲染 3D 时再除以 1000 换成米。
//
// 这份模型刻意做成**引擎无关**的纯 JSON —— 编辑器、3D 渲染、以后的 2D 平面图
// 都只读它，换渲染方式不用重画。
//
// v2 相对 v1 的三处变化（参考 neonplan3d 的数据模型）：
//   ① 房间从「矩形 x/y/w/h」改成**多边形 points[]**，矩形只是 4 点的特例；
//   ② 新增 **openings[]**（门/窗），挂在「房间 + 第几条边 + 沿边偏移」上，
//      **不是绝对坐标** —— 房间一移动，门窗跟着走；
//   ③ 楼层新增墙厚（外墙/内墙），墙不再是零厚度的线。
// v1 的老数据由 normalizePlan() 自动迁移，不用手工改。
// ==============================================================================

export const PLAN_VERSION = 2;

/** 默认墙高（毫米） */
export const DEFAULT_WALL_HEIGHT = 2700;
/** 默认网格（毫米） */
export const DEFAULT_GRID = 100;
/** 默认外墙厚（毫米）—— 砖墙常见 240 */
export const DEFAULT_EXTERIOR_THICKNESS = 240;
/** 默认内墙厚（毫米）—— 常见 120 */
export const DEFAULT_INTERIOR_THICKNESS = 120;

/** 绑定的实体类型 */
export const BINDING_KINDS = [
  { value: 'light', label: '灯' },
  { value: 'switch', label: '开关/插座' },
  { value: 'cover', label: '窗帘/门窗' },
  { value: 'sensor', label: '传感器' },
  { value: 'camera', label: '摄像头' },
];

/**
 * 洞口（门 / 窗）类型。
 * sill = 窗台高（门是 0）、height = 洞高。
 * 常见尺寸：门 900×2100、窗 1500×1400（台高 900）、阳台推拉门 1800×2200。
 */
export const OPENING_TYPES = [
  { value: 'door', label: '门', defaultWidth: 900, defaultHeight: 2100, defaultSill: 0 },
  { value: 'window', label: '窗', defaultWidth: 1500, defaultHeight: 1400, defaultSill: 900 },
  { value: 'passage', label: '垭口/过道', defaultWidth: 1200, defaultHeight: 2100, defaultSill: 0 },
  { value: 'garage', label: '车库门', defaultWidth: 2400, defaultHeight: 2100, defaultSill: 0 },
];

export function openingDefaults(type) {
  return OPENING_TYPES.find((t) => t.value === type) || OPENING_TYPES[0];
}

let seq = 0;
/** 生成一个短 id（不依赖 crypto，浏览器/测试环境都能跑） */
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`;
}

// ---------------------------------------------------------------- 多边形基础

/** 多边形面积（平方毫米，恒为正）。鞋带公式。 */
export function polygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a / 2);
}

/** 多边形形心（面积加权；退化时退回顶点平均） */
export function polygonCentroid(points) {
  if (!Array.isArray(points) || points.length === 0) return [0, 0];
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    const f = p[0] * q[1] - q[0] * p[1];
    a += f;
    cx += (p[0] + q[0]) * f;
    cy += (p[1] + q[1]) * f;
  }
  if (Math.abs(a) < 1e-6) {
    const n = points.length;
    return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/** 点是否在多边形内（射线法） */
export function pointInPolygon(pt, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** 点到线段的距离 */
export function distToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}

// ---------------------------------------------------------------- 创建

export function createEmptyPlan() {
  return {
    version: PLAN_VERSION,
    name: '',
    gridSize: DEFAULT_GRID,
    background: null,
    floors: [],
    rooms: [],
    /** 不依附任何房间的独立墙段（隔断、屏风墙） */
    freeWalls: [],
    openings: [],
    bindings: [],
    /** 家具 / 灯具等摆放物（type 取自 3D 引擎的家具表） */
    furniture: [],
  };
}

export function createFloor(name = '一层', level = 0) {
  return {
    id: uid('fl'),
    name,
    level,
    wallHeight: DEFAULT_WALL_HEIGHT,
    exteriorThickness: DEFAULT_EXTERIOR_THICKNESS,
    interiorThickness: DEFAULT_INTERIOR_THICKNESS,
  };
}

/** 矩形房间的四角，顺序：左上 → 右上 → 右下 → 左下 */
export function rectPoints(x, y, w, h) {
  return [
    [Math.round(x), Math.round(y)],
    [Math.round(x + w), Math.round(y)],
    [Math.round(x + w), Math.round(y + h)],
    [Math.round(x), Math.round(y + h)],
  ];
}

/**
 * 房间。`points` 是唯一真相；矩形房间就是 4 个点的特例。
 * ⚠️ 不要再往 room 上挂 x/y/w/h —— 用 roomBounds(room) 现算，
 *    否则多边形房间会出现两套互相矛盾的坐标。
 */
export function createRoom(floorId, x, y, w, h, name = '') {
  return {
    id: uid('rm'),
    floorId,
    name,
    points: rectPoints(x, y, w, h),
    // 每条边的墙厚/墙高覆盖（null = 用楼层默认），下标与 points 的边一一对应
    wallThickness: [],
    wallHeights: [],
  };
}

/** 多边形房间（points 至少 3 点，单位毫米） */
export function createPolyRoom(floorId, points, name = '') {
  return {
    id: uid('rm'),
    floorId,
    name,
    points: points.map((p) => [Math.round(p[0]), Math.round(p[1])]),
    wallThickness: [],
    wallHeights: [],
  };
}

/**
 * 洞口（门/窗）。挂在房间的第 edge 条边上、距该边起点 offset 毫米处。
 * 用「边 + 偏移」而不是绝对坐标：房间移动/变形时洞口跟着走。
 */
export function createOpening(roomId, floorId, edge, offset, type = 'door', opts = {}) {
  const d = openingDefaults(type);
  return {
    id: uid('op'),
    roomId,
    floorId,
    edge: Math.max(0, Math.floor(edge)),
    offset: Math.round(offset),
    width: Math.round(opts.width ?? d.defaultWidth),
    height: Math.round(opts.height ?? d.defaultHeight),
    sill: Math.round(opts.sill ?? d.defaultSill),
    type,
    hinge: opts.hinge === 'right' ? 'right' : 'left',
    swing: opts.swing === 'out' ? 'out' : 'in',
  };
}

export function createBinding(roomId, entityId = '', kind = 'light') {
  return { id: uid('bd'), roomId, entityId, kind };
}

/**
 * 自由隔断墙：两个端点 + 自己的厚度/高度。
 * 和房间边生成的墙不同，它不依附任何房间，所以移动房间不会带动它。
 * 厚度以**中心线**为基准两边各一半（和房间的内墙一致）。
 */
export function createFreeWall(floorId, a, b, opts = {}) {
  return {
    id: uid('fw'),
    floorId,
    a: [Math.round(a[0]), Math.round(a[1])],
    b: [Math.round(b[0]), Math.round(b[1])],
    thickness: Math.round(Number(opts.thickness) || DEFAULT_INTERIOR_THICKNESS),
    height: Math.round(Number(opts.height) || DEFAULT_WALL_HEIGHT),
  };
}

/** 自由墙的长度（毫米） */
export function freeWallLength(fw) {
  if (!fw) return 0;
  return Math.hypot(fw.b[0] - fw.a[0], fw.b[1] - fw.a[1]);
}

// ---------------------------------------------------------------- 家具

/** 家具默认尺寸（毫米，宽 × 深 × 高）—— 只在拿不到引擎家具表时兜底 */
export const DEFAULT_FURNITURE_SIZE = [1000, 1000, 800];

/**
 * 一件家具。
 * ⚠️ `x/y` 是**中心点**（和引擎一致：引擎的 furnitureCorner 就是 `x ± w/2`），
 *    不是左上角 —— 这样旋转时只要绕中心转，不用重算锚点。
 * `rotation` 是**角度**（顺时针，0 = 朝向画布下方），`mountY` 是离地高度（null = 贴地）。
 */
export function createFurniture(floorId, type, x, y, size = DEFAULT_FURNITURE_SIZE, name = '') {
  // ⚠️ 这里只收**毫米**。引擎的家具表是米，调用方要自己 ×1000 换算再传进来。
  //    下限 100mm 是防御：尺寸传成 0 的话家具会小到点不中、看着像「没放上去」。
  const [w, d, h] = size;
  return {
    id: uid('fu'),
    floorId,
    type,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.max(100, Math.round(w)),
    d: Math.max(100, Math.round(d)),
    h: Math.max(50, Math.round(h)),
    rotation: 0,
    mountY: null,
    name: name || '',
    entityId: '',
  };
}

/** 家具的四角（毫米，已按 rotation 旋转），顺序：左上 → 右上 → 右下 → 左下 */
export function furnitureCorners(f) {
  const a = ((Number(f.rotation) || 0) * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const hw = (Number(f.w) || 0) / 2;
  const hd = (Number(f.d) || 0) / 2;
  // 局部轴：局部 x → (c, s)，局部 z → (-s, c)
  const pt = (sx, sz) => [
    Math.round(f.x + sx * hw * c - sz * hd * s),
    Math.round(f.y + sx * hw * s + sz * hd * c),
  ];
  return [pt(-1, -1), pt(1, -1), pt(1, 1), pt(-1, 1)];
}

/** 家具的轴对齐包围盒（拖动时吸附用） */
export function furnitureBounds(f) {
  const pts = furnitureCorners(f);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/** 规整一件家具：补默认值、把尺寸夹到合理范围 */
export function normalizeFurniture(raw) {
  if (!raw || typeof raw !== 'object' || !raw.type) return null;
  const num = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    ...raw,
    x: Math.round(num(raw.x, 0)),
    y: Math.round(num(raw.y, 0)),
    // 最小 10cm，避免拖成一条线之后再也点不中
    w: Math.max(100, Math.round(num(raw.w, DEFAULT_FURNITURE_SIZE[0]))),
    d: Math.max(100, Math.round(num(raw.d, DEFAULT_FURNITURE_SIZE[1]))),
    h: Math.max(50, Math.round(num(raw.h, DEFAULT_FURNITURE_SIZE[2]))),
    rotation: Math.round(num(raw.rotation, 0)),
    mountY: raw.mountY === null || raw.mountY === undefined ? null : Math.max(0, Math.round(num(raw.mountY, 0))),
    name: typeof raw.name === 'string' ? raw.name : '',
    entityId: typeof raw.entityId === 'string' ? raw.entityId : '',
  };
}

// ---------------------------------------------------------------- 单位

/** 毫米 -> 米 */
export const mmToM = (mm) => (Number(mm) || 0) / 1000;
/** 米 -> 毫米 */
export const mToMm = (m) => Math.round((Number(m) || 0) * 1000);

// ---------------------------------------------------------------- 房间几何

/** 房间的轮廓点（毫米）。points 缺失时按老数据的矩形现算。 */
export function getRoomPolygon(room) {
  if (!room) return [];
  if (Array.isArray(room.points) && room.points.length >= 3) return room.points;
  return rectPoints(room.x || 0, room.y || 0, room.w || 0, room.h || 0);
}

/** 房间的包围盒 {x, y, w, h}（毫米）。用来做标签定位、3D 取景、检查器显示。 */
export function roomBounds(room) {
  const pts = getRoomPolygon(room);
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  pts.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** 房间是不是轴对齐矩形（决定检查器里给「拉角」还是「拖顶点」） */
export function isRectRoom(room) {
  const p = getRoomPolygon(room);
  if (p.length !== 4) return false;
  return (
    p[0][1] === p[1][1] && p[2][1] === p[3][1] && p[0][0] === p[3][0] && p[1][0] === p[2][0]
  );
}

/** 把矩形房间的几何写回 points（编辑器拉框/拉角用这个，不要直接改 x/y/w/h） */
export function setRoomRect(room, x, y, w, h) {
  return { ...room, points: rectPoints(x, y, w, h) };
}

/** 房间的顶点数 = 边数 */
export const roomEdgeCount = (room) => getRoomPolygon(room).length;

/** 第 i 条边 [起点, 终点]（毫米） */
export function roomEdge(room, i) {
  const pts = getRoomPolygon(room);
  if (pts.length < 3) return null;
  const a = pts[((i % pts.length) + pts.length) % pts.length];
  const b = pts[(((i + 1) % pts.length) + pts.length) % pts.length];
  return [a, b];
}

/** 边的长度（毫米） */
export function edgeLength(room, i) {
  const e = roomEdge(room, i);
  if (!e) return 0;
  return Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]);
}

/** 边上距起点 offset 毫米处的点（洞口定位用） */
export function pointOnRoomEdge(room, edge, offset) {
  const e = roomEdge(room, edge);
  if (!e) return [0, 0];
  const [a, b] = e;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const t = offset / l;
  return [a[0] + dx * t, a[1] + dy * t];
}

/** 离某点最近的房间边：{ edge, offset, dist }；房间没有边时返回 null */
export function closestEdge(room, p) {
  const pts = getRoomPolygon(room);
  if (pts.length < 3) return null;
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const q = [a[0] + dx * t, a[1] + dy * t];
    const dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (!best || dist < best.dist) {
      best = { edge: i, offset: t * Math.sqrt(len2), dist, point: q };
    }
  }
  return best;
}

/** 房间面积（平方毫米） */
export function roomArea(room) {
  return polygonArea(getRoomPolygon(room));
}

/** 平方米（保留 1 位小数） */
export function roomAreaM2(room) {
  return Math.round((roomArea(room) / 1e6) * 10) / 10;
}

// ---------------------------------------------------------------- 规整 / 迁移

/**
 * 把一个房间规整成 v2 形状。
 * 兼容 v1：老数据只有 {x,y,w,h}，这里补出 points。
 * 兼容反向拖框：w/h 为负时先归正。
 */
export function normalizeRoom(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  let points;
  if (Array.isArray(raw.points) && raw.points.length >= 3) {
    points = raw.points.map((p) => [Math.round(Number(p[0]) || 0), Math.round(Number(p[1]) || 0)]);
  } else {
    const w = Number(raw.w) || 0;
    const h = Number(raw.h) || 0;
    const x = w < 0 ? (Number(raw.x) || 0) + w : Number(raw.x) || 0;
    const y = h < 0 ? (Number(raw.y) || 0) + h : Number(raw.y) || 0;
    points = rectPoints(x, y, Math.abs(w), Math.abs(h));
  }
  return {
    ...raw,
    points,
    wallThickness: Array.isArray(raw.wallThickness) ? raw.wallThickness : [],
    wallHeights: Array.isArray(raw.wallHeights) ? raw.wallHeights : [],
  };
}

/**
 * 补齐外部读进来的数据，避免旧版本/手工编辑缺字段导致崩溃。
 * 顺带把 v1 的矩形房间迁移成 v2 的多边形。
 */
export function normalizePlan(raw) {
  const base = createEmptyPlan();
  if (!raw || typeof raw !== 'object') {
    base.floors = [createFloor('一层', 0)];
    return base;
  }
  const plan = {
    ...base,
    ...raw,
    version: PLAN_VERSION,
    floors: Array.isArray(raw.floors) ? raw.floors.map((f) => ({
      exteriorThickness: DEFAULT_EXTERIOR_THICKNESS,
      interiorThickness: DEFAULT_INTERIOR_THICKNESS,
      wallHeight: DEFAULT_WALL_HEIGHT,
      ...f,
    })) : [],
    rooms: Array.isArray(raw.rooms) ? raw.rooms.map(normalizeRoom) : [],
    freeWalls: Array.isArray(raw.freeWalls) ? raw.freeWalls.map(normalizeFreeWall) : [],
    openings: Array.isArray(raw.openings) ? raw.openings : [],
    bindings: Array.isArray(raw.bindings) ? raw.bindings : [],
    furniture: Array.isArray(raw.furniture) ? raw.furniture.map(normalizeFurniture).filter(Boolean) : [],
  };
  if (plan.floors.length === 0) plan.floors = [createFloor('一层', 0)];
  // 房间/洞口如果没挂楼层，挂到第一层
  const firstFloor = plan.floors[0].id;
  plan.rooms = plan.rooms.map((r) => ({ ...r, floorId: r.floorId || firstFloor }));
  plan.furniture = plan.furniture.map((f) => ({ ...f, floorId: f.floorId || firstFloor }));
  plan.freeWalls = plan.freeWalls
    .filter((w) => w && freeWallLength(w) > 50)
    .map((w) => ({ ...w, floorId: w.floorId || firstFloor }));
  const roomIds = new Set(plan.rooms.map((r) => r.id));
  const freeWallIds = new Set(plan.freeWalls.map((w) => w.id));
  // 丢掉指向不存在房间/隔断墙的洞口，并把 edge/offset 夹到合法范围
  plan.openings = plan.openings
    .filter((o) => o && (o.wallId ? freeWallIds.has(o.wallId) : roomIds.has(o.roomId)))
    .map((o) => {
      if (o.wallId) {
        // 挂在隔断墙上的洞口：位置夹在墙长内
        const fw = plan.freeWalls.find((w) => w.id === o.wallId);
        const len = freeWallLength(fw);
        const width = Math.max(1, Math.round(Number(o.width) || 0));
        const offset = Math.max(0, Math.min(Math.max(0, len - width), Math.round(Number(o.offset) || 0)));
        return { ...o, floorId: o.floorId || (fw && fw.floorId) || firstFloor, offset, width };
      }
      const room = plan.rooms.find((r) => r.id === o.roomId);
      const n = roomEdgeCount(room) || 4;
      const edge = Math.max(0, Math.min(n - 1, Math.floor(Number(o.edge) || 0)));
      const len = edgeLength(room, edge);
      const width = Math.max(1, Math.round(Number(o.width) || 0));
      const offset = Math.max(0, Math.min(Math.max(0, len - width), Math.round(Number(o.offset) || 0)));
      return { ...o, floorId: o.floorId || room.floorId || firstFloor, edge, offset, width };
    });
  return plan;
}

/** 规整一条自由隔断墙 */
export function normalizeFreeWall(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const pt = (p) => [Math.round(Number(p && p[0]) || 0), Math.round(Number(p && p[1]) || 0)];
  return {
    ...raw,
    a: pt(raw.a),
    b: pt(raw.b),
    thickness: Math.round(Number(raw.thickness) || DEFAULT_INTERIOR_THICKNESS),
    height: Math.round(Number(raw.height) || DEFAULT_WALL_HEIGHT),
  };
}

// ---------------------------------------------------------------- 整体

/** 整个户型的包围盒（毫米），用于 3D 视图自动取景 */
export function planBounds(plan) {
  const rooms = (plan && plan.rooms) || [];
  if (rooms.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  rooms.forEach((r) => {
    getRoomPolygon(r).forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** 吸附到网格 */
export function snap(value, grid) {
  const g = Number(grid) || 0;
  if (g <= 0) return Math.round(value);
  return Math.round(value / g) * g;
}
