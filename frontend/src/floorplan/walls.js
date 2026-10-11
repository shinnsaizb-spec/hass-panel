// ==============================================================================
// 墙生成（从房间多边形）
// ------------------------------------------------------------------------------
// 设计参考 neonplan3d 的 frontend/src/geometry/walls.ts（MIT），按本项目的模型简化：
//
//   · 房间画在**墙的中心线**上。两个房间共用的边 → 一条居中内墙；
//     只有一侧有房间的边 → 外墙，从房间边向外长。
//   · 边会在**别的房间的顶点**处切开，所以 T 型接头、部分共用的边都能处理。
//   · 每条墙记 `left` / `right`（两个墙面到中心线的距离）而不是一个厚度 ——
//     这样内墙（两侧各 t/2）和外墙（一侧 0、一侧 t）能用同一套数据结构表达。
//   · 墙保留 `sources`（这条墙由哪些「房间 + 第几条边」组成），
//     门窗才能靠「房间 + 边 + 沿边偏移」挂上去，房间移动时跟着走。
//
// ⚠️ 和 neonplan3d 的一处**有意简化**：它把墙端做成「斜接」（求相邻墙面线的交点）。
//    这里改成**两端各外延半个厚度**，转角处两段墙自然叠在一起。
//    矩形户型看不出差别，3D 里是实体盒子相交、不会 z-fighting，代码却简单一个数量级。
//    以后要做斜接，只需要改 footprintOf() 一个函数。
//
// 单位：毫米（与 model.js 一致）
// ==============================================================================

import { getRoomPolygon } from './model';

/** 顶点合并阈值（毫米）：比这近的点当成同一个点 */
const EPS = 1;
/** 判断「这一侧有没有房间」时，从墙中线往两侧探的距离（毫米） */
const SIDE_PROBE = 20;

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
const vlen = (p) => Math.hypot(p[0], p[1]);
const unit = (p) => {
  const l = vlen(p) || 1;
  return [p[0] / l, p[1] / l];
};
/** a→b 方向的左侧法线 */
const leftNormal = (d) => [-d[1], d[0]];

/** 点是否落在矩形包围盒内（快速排除） */
const inBox = (p, box) => p[0] >= box[0] && p[0] <= box[2] && p[1] >= box[1] && p[1] <= box[3];

function boxOf(points) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  points.forEach(([x, y]) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  });
  return [x0, y0, x1, y1];
}

function pointInPolygon(pt, points) {
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

/**
 * 生成墙。
 *
 * @param {Array} rooms   房间数组（用 getRoomPolygon 取轮廓）
 * @param {Object} opts   { exterior, interior, wallHeight, extendEnds }
 *                        exterior/interior = 外墙/内墙厚（毫米）
 * @param {Array} openings 洞口数组（用来算每面墙上有哪些洞，可选）
 * @param {Array} freeWalls 自由隔断墙数组（可选）
 * @returns {Array} walls
 */
export function generateWalls(rooms, opts = {}, openings = [], freeWalls = []) {
  const exterior = Number(opts.exterior) > 0 ? Number(opts.exterior) : 240;
  const interior = Number(opts.interior) > 0 ? Number(opts.interior) : 120;
  const floorHeight = Number(opts.wallHeight) > 0 ? Number(opts.wallHeight) : 2700;
  const extendEnds = opts.extendEnds !== false;

  const list = (rooms || []).filter((r) => getRoomPolygon(r).length >= 3);
  const freeList = (freeWalls || []).filter(
    (w) => w && Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) > 50
  );
  if (list.length === 0 && freeList.length === 0) return [];

  const roomById = new Map(list.map((r) => [r.id, r]));

  // ---- 1. 顶点归一化（比 EPS 近的点合并成一个）
  const verts = [];
  const vertexIndex = (p) => {
    for (let i = 0; i < verts.length; i++) {
      if (Math.hypot(verts[i][0] - p[0], verts[i][1] - p[1]) < EPS) return i;
    }
    verts.push([p[0], p[1]]);
    return verts.length - 1;
  };

  const polys = list.map((room) => {
    const pts = getRoomPolygon(room);
    return {
      room,
      id: room.id,
      pts,
      idx: pts.map(vertexIndex),
      box: boxOf(pts),
    };
  });

  // ---- 2. 每条房间边 → 一条线段
  //      t0/t1 = 沿这条边的参数区间（毫米，从 points[edge] 起算）
  let segments = [];
  polys.forEach((poly) => {
    for (let e = 0; e < poly.pts.length; e++) {
      const a = poly.pts[e];
      const b = poly.pts[(e + 1) % poly.pts.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < EPS) continue;
      segments.push({
        u: poly.idx[e],
        v: poly.idx[(e + 1) % poly.pts.length],
        roomId: poly.id,
        edge: e,
        t0: 0,
        t1: len,
        a,
        b,
      });
    }
  });

  // ---- 3. 在「别的房间的顶点」处把边切开
  //      这样两个房间部分共边（T 型接头）时，共用段才能被识别出来
  const split = [];
  segments.forEach((seg) => {
    const d = unit(sub(seg.b, seg.a));
    const len = seg.t1;
    const cuts = [0, len];
    verts.forEach((p) => {
      const rel = sub(p, seg.a);
      const t = dot(rel, d);
      if (t <= EPS || t >= len - EPS) return;
      const off = Math.abs(cross(rel, d));
      if (off > EPS) return; // 不在这条线上
      cuts.push(t);
    });
    cuts.sort((x, y) => x - y);
    for (let i = 1; i < cuts.length; i++) {
      if (cuts[i] - cuts[i - 1] < EPS) continue;
      const t0 = cuts[i - 1];
      const t1 = cuts[i];
      split.push({
        ...seg,
        t0,
        t1,
        a: add(seg.a, mul(d, t0)),
        b: add(seg.a, mul(d, t1)),
      });
    }
  });

  // ---- 4. 配对：同一条线上重叠的两段 → 内墙；只有一段 → 外墙
  //      用一个「已处理」集合，避免同一条边被算两次
  const used = new Array(split.length).fill(false);
  const walls = [];

  const sameLine = (s, t) => {
    // 方向平行（含反向）且距离足够近
    const ds = unit(sub(s.b, s.a));
    const dt = unit(sub(t.b, t.a));
    if (Math.abs(Math.abs(cross(ds, dt))) > 0.02) return false; // 夹角 > ~1°
    return Math.abs(cross(sub(t.a, s.a), ds)) < EPS * 2;
  };

  /** 沿 s 的方向，把 t 投影到 s 上的区间（可能反向） */
  const projectOnto = (s, t) => {
    const ds = unit(sub(s.b, s.a));
    const p = (q) => dot(sub(q, s.a), ds);
    const a = p(t.a);
    const b = p(t.b);
    return [Math.min(a, b), Math.max(a, b)];
  };

  for (let i = 0; i < split.length; i++) {
    if (used[i]) continue;
    const s = split[i];
    const sLen = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    if (sLen < EPS) {
      used[i] = true;
      continue;
    }

    // 找同一段上、来自别的房间的段
    const parts = [{ seg: s, t0: 0, t1: sLen }];
    for (let j = i + 1; j < split.length; j++) {
      if (used[j]) continue;
      const t = split[j];
      if (t.roomId === s.roomId) continue;
      if (!sameLine(s, t)) continue;
      const [o0, o1] = projectOnto(s, t);
      const lo = Math.max(0, o0);
      const hi = Math.min(sLen, o1);
      if (hi - lo < EPS) continue; // 不重叠
      parts.push({ seg: t, t0: lo, t1: hi });
      used[j] = true;
    }
    used[i] = true;

    // 按重叠区间把这条线切成若干段：每段两侧有没有房间决定是内墙还是外墙
    const bounds = new Set([0, sLen]);
    parts.forEach((p) => {
      bounds.add(p.t0);
      bounds.add(p.t1);
    });
    const cuts = [...bounds].sort((x, y) => x - y);
    const dir = unit(sub(s.b, s.a));
    const nrm = leftNormal(dir);

    for (let k = 1; k < cuts.length; k++) {
      const t0 = cuts[k - 1];
      const t1 = cuts[k];
      if (t1 - t0 < EPS) continue;
      const mid = add(s.a, mul(dir, (t0 + t1) / 2));

      // 两侧各探一下，看有没有房间
      const leftPt = add(mid, mul(nrm, SIDE_PROBE));
      const rightPt = add(mid, mul(nrm, -SIDE_PROBE));
      const roomAt = (pt) =>
        polys.find((poly) => inBox(pt, poly.box) && pointInPolygon(pt, poly.pts))?.id || null;
      const roomLeft = roomAt(leftPt);
      const roomRight = roomAt(rightPt);
      if (!roomLeft && !roomRight) continue; // 两边都没房间，这条线不该存在

      // 谁提供了这段的「来源」信息
      const sources = [];
      parts.forEach((p) => {
        const lo = Math.max(p.t0, t0);
        const hi = Math.min(p.t1, t1);
        if (hi - lo < EPS) return;
        const seg = p.seg;
        const segLen = Math.hypot(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]) || 1;
        // 把「这条线上的区间」映射回「房间边的参数区间」
        const f = (v) => (v / sLen) * segLen;
        sources.push({
          roomId: seg.roomId,
          edge: seg.edge,
          t0: Math.round(f(lo)),
          t1: Math.round(f(hi)),
        });
      });

      // 每条边可以单独覆盖厚度/高度（room.wallThickness[edge] / room.wallHeights[edge]）。
      // 共用墙两侧各有一份设置时的规则：
      //   · 厚度取**较厚**的那个（结构上更保守）
      //   · 高度取**较矮**的那个
      //   · 任一侧设成 0 = 那边没有墙 → 整条墙不生成（两个房间连成一个空间）
      const specs = sources
        .map((s) => {
          const r = roomById.get(s.roomId);
          if (!r) return null;
          return {
            thickness: (r.wallThickness || [])[s.edge],
            height: (r.wallHeights || [])[s.edge],
          };
        })
        .filter(Boolean);
      const thSpecs = specs.map((x) => x.thickness).filter((v) => Number(v) > 0);
      const hSpecs = specs.map((x) => x.height).filter((v) => v != null);
      if (hSpecs.some((v) => Number(v) === 0)) continue; // 标了「无墙」
      const thOverride = thSpecs.length ? Math.max(...thSpecs.map(Number)) : null;
      const hOverride = hSpecs.length ? Math.min(...hSpecs.map(Number)) : null;

      const isExterior = !roomLeft || !roomRight;
      const th = thOverride != null ? thOverride : isExterior ? exterior : interior;
      // left/right = 两个墙面到中心线的距离（都是正数）
      let left;
      let right;
      if (isExterior) {
        if (roomLeft) {
          left = 0;
          right = th;
        } else {
          left = th;
          right = 0;
        }
      } else {
        left = th / 2;
        right = th / 2;
      }

      const a = add(s.a, mul(dir, t0));
      const b = add(s.a, mul(dir, t1));
      walls.push({
        id: `w_${s.roomId}_${s.edge}_${Math.round(t0)}`,
        a,
        b,
        dir,
        normal: nrm,
        left,
        right,
        thickness: left + right,
        exterior: isExterior,
        roomLeft,
        roomRight,
        sources,
        length: Math.round(t1 - t0),
        height: hOverride != null ? hOverride : floorHeight,
      });
    }
  }

  // ---- 4b. 自由隔断墙：不依附房间，不参与配对，永远以中心线居中、用自己的厚度/高度
  freeList.forEach((fw) => {
    const dir = unit(sub(fw.b, fw.a));
    const th = Number(fw.thickness) > 0 ? Number(fw.thickness) : interior;
    walls.push({
      id: `fw_${fw.id}`,
      free: fw.id,
      a: [fw.a[0], fw.a[1]],
      b: [fw.b[0], fw.b[1]],
      dir,
      normal: leftNormal(dir),
      left: th / 2,
      right: th / 2,
      thickness: th,
      exterior: false,
      roomLeft: null,
      roomRight: null,
      sources: [],
      length: Math.round(Math.hypot(fw.b[0] - fw.a[0], fw.b[1] - fw.a[1])),
      height: Number(fw.height) > 0 ? Number(fw.height) : floorHeight,
    });
  });

  // ---- 5. 算 footprint（4 个角，逆时针），两端按厚度外延补转角
  walls.forEach((w) => {
    const ext = extendEnds ? w.thickness / 2 : 0;
    const a = add(w.a, mul(w.dir, -ext));
    const b = add(w.b, mul(w.dir, ext));
    const nl = mul(w.normal, w.left);
    const nr = mul(w.normal, -w.right);
    w.footprint = [add(a, nl), add(b, nl), add(b, nr), add(a, nr)];
    w.extendedA = a;
    w.extendedB = b;
  });

  // ---- 6. 每面墙挂上它承载的洞口（靠 sources 匹配）
  if (openings && openings.length) {
    walls.forEach((w) => {
      w.openings = openings
        .map((o) => openingOnWall(w, o))
        .filter(Boolean)
        .sort((x, y) => x.from - y.from);
    });
  } else {
    walls.forEach((w) => {
      w.openings = [];
    });
  }

  return walls;
}

/**
 * 判断一个洞口是不是落在这面墙上；是的话返回它在这面墙上的位置。
 * 洞口挂的是「房间 + 第几条边 + 沿边偏移」，而墙记的是 sources（哪些房间边的哪一段），
 * 所以这里要把洞口的区间映射到墙自己的坐标（从 wall.a 起算）。
 */
export function openingOnWall(wall, opening) {
  const wallSpan = Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]) || 1;

  // ① 挂在自由隔断墙上的洞口：offset 就是沿这面墙从 a 起算的距离，直接用
  if (opening.wallId) {
    if (wall.free !== opening.wallId) return null;
    const from = Math.max(0, opening.offset);
    const to = Math.min(wallSpan, opening.offset + opening.width);
    if (to - from < 1) return null;
    return { ...opening, from: Math.round(from), to: Math.round(to), width: Math.round(to - from) };
  }

  // ② 挂在房间边上的洞口：靠 sources 找到「这条墙覆盖了那条边的哪一段」再映射
  const src = (wall.sources || []).find(
    (s) => s.roomId === opening.roomId && s.edge === opening.edge
  );
  if (!src) return null;
  const o0 = opening.offset;
  const o1 = opening.offset + opening.width;
  const lo = Math.max(src.t0, o0);
  const hi = Math.min(src.t1, o1);
  if (hi - lo < 1) return null; // 完全在墙外

  // sources 的 t0/t1 就是「沿这条墙、从 a 起算」的距离（见生成时的 f() 映射），
  // 所以这里不需要再翻转方向，直接线性换算即可。
  const srcSpan = src.t1 - src.t0 || 1;
  const scale = wallSpan / srcSpan;
  let from = (o0 - src.t0) * scale;
  let to = (o1 - src.t0) * scale;
  if (from > to) [from, to] = [to, from];
  from = Math.max(0, from);
  to = Math.min(wallSpan, to);
  if (to - from < 1) return null;
  return {
    ...opening,
    from: Math.round(from),
    to: Math.round(to),
    width: Math.round(to - from),
  };
}

/**
 * 把一面墙按它上面的洞口切成若干段。
 * 返回 [{ from, to, sill, height }]，sill/height 描述这段墙在竖向占的区间（毫米）：
 *   · 洞口两侧的墙段：sill = 0，height = 墙高（整面）
 *   · 洞口正上方（过梁）：sill = 洞口顶，height = 墙高 − 洞口顶
 *   · 门下面没有墙，所以门洞不产生下方的段；窗洞下面有墙（窗台墙）
 */
export function splitWallByOpenings(wall) {
  const len = Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]);
  const wallH = wall.height;
  const ops = (wall.openings || [])
    .filter((o) => o.to > o.from)
    .sort((x, y) => x.from - y.from);

  if (ops.length === 0) {
    return [{ from: 0, to: len, sill: 0, height: wallH, kind: 'full' }];
  }

  const out = [];
  let cursor = 0;
  ops.forEach((o) => {
    const from = Math.max(0, Math.min(len, o.from));
    const to = Math.max(0, Math.min(len, o.to));
    if (from > cursor) {
      out.push({ from: cursor, to: from, sill: 0, height: wallH, kind: 'pier' });
    }
    // 洞下方（窗台墙 / 门就没有）
    if (o.sill > 0) {
      out.push({ from, to, sill: 0, height: Math.min(o.sill, wallH), kind: 'sill' });
    }
    // 洞上方（过梁）
    const top = o.sill + o.height;
    if (top < wallH) {
      out.push({ from, to, sill: top, height: wallH - top, kind: 'lintel' });
    }
    cursor = Math.max(cursor, to);
  });
  if (cursor < len) {
    out.push({ from: cursor, to: len, sill: 0, height: wallH, kind: 'pier' });
  }
  return out.filter((s) => s.to - s.from > 0.5 && s.height > 0.5);
}

/** 墙的净开口面积（平方米）—— 检查器里显示用 */
export function wallOpeningArea(wall) {
  return (wall.openings || []).reduce((s, o) => s + (o.width * o.height) / 1e6, 0);
}
