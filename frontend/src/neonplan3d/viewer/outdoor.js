/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/outdoor.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Areas outside the house: lawn, terrace, path, driveway, pool, bed, wild patch, hedge, fence and
// pergola in the neon look. Covered rooms use the same geometry helpers through a separate internal type.
// Flat areas lie at ground level (the underside of the ground floor slab),
// the terrace a little higher, the pool water below; hedges are dark green blocks, fences posts with
// rails along the outline, a pergola corner posts with beams, rafters and optional X-bracing. An area
// can sit higher or lower (offset), fall along one direction (slope) and have patches cut out of it.

import { Color } from "three";
import { bounds, coveredFloorTop, coveredFrontEdge, groundLevel, isAxisRect, OUTDOOR_TOP, outdoorDrop, outdoorStanding, pointInPolygon, signedArea } from "../model.js";
import { offsetPolygon } from "../roof-sections.js";
import { ALWAYS, pushPrism, shade, triangulate } from "./geo.js";
import { NEON } from "./palette.js";
const LOOKS = {
  lawn: {
    color: 0x0d2620,
    side: 0x0b1e1a,
    edge: 0x3de0a0,
    edgeAlpha: 0.16
  },
  terrace: {
    color: 0x1d1c30,
    side: 0x151527,
    edge: 0x5b7cff,
    edgeAlpha: 0.32
  },
  path: {
    color: 0x1a2133,
    side: 0x141a28,
    edge: 0x5b7cff,
    edgeAlpha: 0.22
  },
  driveway: {
    color: 0x161c2b,
    side: 0x111624,
    edge: 0x5b7cff,
    edgeAlpha: 0.18
  },
  pool: {
    color: 0x0b3a5a,
    side: 0x0d2438,
    edge: 0x37e0ff,
    edgeAlpha: 0.6
  },
  bed: {
    color: 0x1a1512,
    side: 0x14100e,
    edge: 0x3de0a0,
    edgeAlpha: 0.2
  },
  wild: {
    color: 0x14211a,
    side: 0x0f1a14,
    edge: 0x9ad24f,
    edgeAlpha: 0.14
  },
  hedge: {
    color: 0x16402f,
    side: 0x103024,
    edge: 0x3de0a0,
    edgeAlpha: 0.35
  },
  fence: {
    color: 0x1d2946,
    side: 0x1d2946,
    edge: 0x5b7cff,
    edgeAlpha: 0.45
  },
  pergola: {
    color: 0x2a2238,
    side: 0x1f1a2c,
    edge: 0x5b7cff,
    edgeAlpha: 0.5
  }
};
const COVERED_LOOK = {
  canopy: {
    color: NEON.wallTop,
    side: NEON.wall,
    edge: NEON.edge,
    edgeAlpha: 0.5
  },
  veranda: {
    color: NEON.wallTop,
    side: NEON.wall,
    edge: NEON.edge,
    edgeAlpha: 0.58
  },
  balcony: {
    color: NEON.wallTop,
    side: NEON.wall,
    edge: NEON.edge,
    edgeAlpha: 0.58
  }
};
const CANOPY_FRONT_OVERHANG = 0.35;
const CORRUGATED_METAL = 0x315166;
const CORRUGATED_RIDGE = 0x52788c;
/** Fold kind 5 keeps canopy roofs selectable/foldable while allowing a lighter material opacity. */
const CANOPY_ROOF_KIND = 5;

/** Room-only render input; covered-room kinds no longer belong to OutdoorArea or its editor. */

const isCoveredArea = area => area.type === "canopy" || area.type === "veranda" || area.type === "balcony";
function coveredLook(a, fallback) {
  const roof = a.roof_style === "glass" ? 0x315a72 : a.roomColor ?? fallback.color;
  const under = a.roof_style === "glass" ? 0x203c50 : fallback.side;
  return {
    roof,
    under
  };
}

/** Height of the visible surface of an area (for the lighting layer), at its high edge. */
export function outdoorSurface(floor, a) {
  return groundLevel(floor) + (a.offset ?? 0) + (outdoorStanding(a.type) ? 0.01 : OUTDOOR_TOP[a.type]);
}
function ccw(points) {
  return signedArea(points) >= 0 ? points : [...points].reverse();
}

/** The areas listed after `index` that are marked "cut" and lie entirely inside area `a`: its holes. */
export function outdoorHoles(areas, index) {
  const a = areas[index];
  if (outdoorStanding(a.type) || a.type === "pool") return [];
  const holes = [];
  for (let i = index + 1; i < areas.length; i++) {
    const b = areas[i];
    if (!b.cut || b.points.length < 3) continue;
    if (b.points.every(p => pointInPolygon(p, a.points))) holes.push(ccw(b.points));
  }
  return holes;
}

/** A thin box along the segment p -> q (a beam, a rafter), `w` wide, from y0 up to y1. */
function pushBeam(buf, p, q, w, y0, y1, side, top) {
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  const l = Math.hypot(dx, dz);
  if (l < 1e-6) return;
  const nx = -dz / l * w * 0.5;
  const nz = dx / l * w * 0.5;
  pushPrism(buf, ccw([[p[0] + nx, p[1] + nz], [q[0] + nx, q[1] + nz], [q[0] - nx, q[1] - nz], [p[0] - nx, p[1] - nz]]), y0, y1, side, top, {
    aoFrom: y0 - 1
  });
}

/** A restrained neon edge on a beam so wall-coloured structure remains legible on the dark canvas. */
function outlineBeam(lines, p, q, y, edge) {
  lines.seg([p[0], y + 0.004, p[1]], [q[0], y + 0.004, q[1]], edge, ALWAYS);
}

/** Vertical corner edges make a square post read like the outlined room walls from every camera angle. */
function outlinePost(lines, x, z, half, y0, y1, edge) {
  for (const [dx, dz] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
    lines.seg([x + dx, y0, z + dz], [x + dx, y1, z + dz], edge, ALWAYS);
  }
}

/** A tall, see-through yard fence panel. */
function pushYardPanel(buf, lines, p, q, y, h, side, top, edge) {
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  if (len < 0.04 || h < 0.2) return;
  pushBeam(buf, p, q, 0.14, y, y + Math.min(0.24, h * 0.24), side, top);
  pushBeam(buf, p, q, 0.07, y + h * 0.5, y + h * 0.57, side, top);
  pushBeam(buf, p, q, 0.1, y + h - 0.1, y + h, side, top);
  outlineBeam(lines, p, q, y + Math.min(0.24, h * 0.24), edge);
  outlineBeam(lines, p, q, y + h * 0.57, edge);
  outlineBeam(lines, p, q, y + h, edge);
  const n = Math.max(2, Math.ceil(len / 0.22));
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const x = p[0] + (q[0] - p[0]) * t;
    const z = p[1] + (q[1] - p[1]) * t;
    pushPrism(buf, ccw([[x - 0.018, z - 0.018], [x + 0.018, z - 0.018], [x + 0.018, z + 0.018], [x - 0.018, z + 0.018]]), y + 0.12, y + h - 0.07, side, top);
    lines.seg([x, y + 0.12, z], [x, y + h - 0.07, z], edge, ALWAYS);
  }
}

/** Clean two-leaf gate whose arch starts at fence height and rises above it in the centre. */
function pushYardGate(buf, lines, p, q, y, h, side, top, edge) {
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.3) return;
  const ux = dx / len;
  const uz = dz / len;
  const plan = s => [p[0] + ux * s, p[1] + uz * s];
  const post = (s, half, y0, y1) => {
    const [x, z] = plan(s);
    pushPrism(buf, ccw([[x - half, z - half], [x + half, z - half], [x + half, z + half], [x - half, z + half]]), y0, y1, side, top);
  };
  const rise = Math.min(0.45, h * 0.32);
  const arch = t => y + h + rise * Math.sin(Math.PI * t);
  const bars = Math.max(8, Math.ceil(len / 0.18));
  pushBeam(buf, p, q, 0.11, y + 0.06, y + 0.16, side, top);
  pushBeam(buf, p, q, 0.08, y + h * 0.47, y + h * 0.54, side, top);
  outlineBeam(lines, p, q, y + 0.16, edge);
  outlineBeam(lines, p, q, y + h * 0.54, edge);
  for (let k = 0; k <= bars; k++) {
    const t = k / bars;
    const structural = k === 0 || k === bars || Math.abs(t - 0.5) < 0.5 / bars;
    post(len * t, structural ? 0.038 : 0.016, y + 0.08, arch(t) - 0.04);
    const [x, z] = plan(len * t);
    lines.seg([x, y + 0.08, z], [x, arch(t) - 0.04, z], edge, ALWAYS);
    if (k < bars) {
      const a = plan(len * t);
      const b = plan(len * (k + 1) / bars);
      const crown = (arch(t) + arch((k + 1) / bars)) / 2;
      pushBeam(buf, a, b, 0.075, crown - 0.045, crown + 0.02, side, top);
      outlineBeam(lines, a, b, crown + 0.02, edge);
    }
  }
}

/** A roof sheet of constant thickness whose top follows a slope. */
function pushCanopyPanel(buf, poly, topAt, thickness, side, top, fold = ALWAYS) {
  const topC = new Color(top);
  const bottomC = new Color(shade(side, 0.72));
  const sideC = new Color(side);
  for (const [i, j, k] of triangulate(poly)) {
    const a = poly[i];
    const b = poly[j];
    const c = poly[k];
    const ta = [a[0], topAt(a[0], a[1]), a[1]];
    const tb = [b[0], topAt(b[0], b[1]), b[1]];
    const tc = [c[0], topAt(c[0], c[1]), c[1]];
    const ba = [ta[0], ta[1] - thickness, ta[2]];
    const bb = [tb[0], tb[1] - thickness, tb[2]];
    const bc = [tc[0], tc[1] - thickness, tc[2]];
    buf.tri(ta, tc, tb, topC, topC, topC, undefined, fold);
    buf.tri(ba, bb, bc, bottomC, bottomC, bottomC, undefined, fold);
  }
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const pt = [p[0], topAt(p[0], p[1]), p[1]];
    const qt = [q[0], topAt(q[0], q[1]), q[1]];
    const pb = [pt[0], pt[1] - thickness, pt[2]];
    const qb = [qt[0], qt[1] - thickness, qt[2]];
    buf.tri(pb, pt, qt, sideC, sideC, sideC, undefined, fold);
    buf.tri(pb, qt, qb, sideC, sideC, sideC, undefined, fold);
  }
}

/** Cover every column/wall edge, then retain the configured total projection at the front. */
function canopyRoofPolygon(poly, openEnd, margin) {
  const front = coveredFrontEdge(poly, openEnd);
  const padded = offsetPolygon(poly, margin);
  const p = padded[front];
  const q = padded[(front + 1) % padded.length];
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return padded;
  // `poly` is counter-clockwise, so its outward normal lies to the right of this edge.
  const frontExtra = Math.max(0, CANOPY_FRONT_OVERHANG - margin);
  const ox = dz / len * frontExtra;
  const oz = -dx / len * frontExtra;
  return padded.map(([x, z], i) => i === front || i === (front + 1) % padded.length ? [x + ox, z + oz] : [x, z]);
}

/** Intersections of an oriented scan line with a polygon, paired into inside spans. */
function roofScanSpans(poly, origin, along, across, cross) {
  const hits = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const px = p[0] - origin[0];
    const pz = p[1] - origin[1];
    const qx = q[0] - origin[0];
    const qz = q[1] - origin[1];
    const pc = px * across[0] + pz * across[1];
    const qc = qx * across[0] + qz * across[1];
    if (!(pc <= cross && qc > cross || qc <= cross && pc > cross)) continue;
    const t = (cross - pc) / (qc - pc);
    const pa = px * along[0] + pz * along[1];
    const qa = qx * along[0] + qz * along[1];
    hits.push(pa + (qa - pa) * t);
  }
  hits.sort((a, b) => a - b);
  const spans = [];
  for (let i = 0; i + 1 < hits.length; i += 2) if (hits[i + 1] - hits[i] > 0.05) spans.push([hits[i], hits[i + 1]]);
  return spans;
}

/** Raised longitudinal ribs run from the house towards the front drip edge, independently of slope. */
function pushCorrugatedRoof(buf, poly, topAt, front, fold) {
  const frontP = poly[front];
  const frontQ = poly[(front + 1) % poly.length];
  const dx = frontQ[0] - frontP[0];
  const dz = frontQ[1] - frontP[1];
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return;
  const origin = frontP;
  // Across follows the front edge; along is its outward normal (house -> drip edge for a CCW polygon).
  const across = [dx / len, dz / len];
  const along = [across[1], -across[0]];
  const crossValues = poly.map(([x, z]) => (x - origin[0]) * across[0] + (z - origin[1]) * across[1]);
  const lo = Math.min(...crossValues);
  const hi = Math.max(...crossValues);
  const count = Math.max(1, Math.ceil((hi - lo) / 0.18));
  const side = new Color(CORRUGATED_METAL);
  const crest = new Color(CORRUGATED_RIDGE);
  for (let i = 0; i < count; i++) {
    const cross = lo + (i + 0.5) * (hi - lo) / count;
    for (const [from, to] of roofScanSpans(poly, origin, along, across, cross)) {
      const p = [origin[0] + along[0] * from + across[0] * cross, origin[1] + along[1] * from + across[1] * cross];
      const q = [origin[0] + along[0] * to + across[0] * cross, origin[1] + along[1] * to + across[1] * cross];
      const dx = q[0] - p[0];
      const dz = q[1] - p[1];
      const len = Math.hypot(dx, dz);
      const nx = -dz / len * 0.018;
      const nz = dx / len * 0.018;
      const tx = -dz / len * 0.007;
      const tz = dx / len * 0.007;
      const at = (v, extra) => [v[0], topAt(v[0], v[1]) + extra, v[1]];
      const p0 = at([p[0] + nx, p[1] + nz], 0.004);
      const p1 = at([p[0] - nx, p[1] - nz], 0.004);
      const q0 = at([q[0] + nx, q[1] + nz], 0.004);
      const q1 = at([q[0] - nx, q[1] - nz], 0.004);
      const pt0 = at([p[0] + tx, p[1] + tz], 0.03);
      const pt1 = at([p[0] - tx, p[1] - tz], 0.03);
      const qt0 = at([q[0] + tx, q[1] + tz], 0.03);
      const qt1 = at([q[0] - tx, q[1] - tz], 0.03);
      buf.tri(pt0, qt0, qt1, crest, crest, crest, undefined, fold);
      buf.tri(pt0, qt1, pt1, crest, crest, crest, undefined, fold);
      buf.tri(p0, q0, qt0, side, side, side, undefined, fold);
      buf.tri(p0, qt0, pt0, side, side, side, undefined, fold);
      buf.tri(pt1, qt1, q1, side, side, side, undefined, fold);
      buf.tri(pt1, q1, p1, side, side, side, undefined, fold);
    }
  }
}
function pushAreas(buf, lines, floor, areas, roofFold) {
  const ground = groundLevel(floor);
  const ranges = [];
  areas.forEach((a, index) => {
    if (a.points.length < 3) return;
    const start = buf.count;
    let roofStart;
    let roofEnd;
    // an area may sit above or below the ground (a driveway down to a lower garage) and fall along one direction
    const g = ground + (a.offset ?? 0);
    const groundAt = (x, z) => g - outdoorDrop(a, x, z);
    const lowest = g - (a.type === "pool" ? 0 : a.slope ?? 0);
    // standing structures take their own height; the outline can be switched off per area
    const covered = isCoveredArea(a);
    const own = covered ? a.height ?? 2.4 : outdoorStanding(a.type) && a.height ? a.height : OUTDOOR_TOP[a.type];
    const look = {
      ...(covered ? COVERED_LOOK[a.type] : LOOKS[a.type]),
      top: own
    };
    const poly = ccw(a.points);
    const edge = shade(look.edge, look.edgeAlpha);
    // fences, pergolas and covered rooms may leave their closing edge out against the house
    const openEnd = a.open && (a.type === "fence" || a.type === "pergola" || covered) ? poly.length - 1 : -1;
    const outline = (yAt, fold = ALWAYS) => {
      if (a.outline === false) return;
      for (let i = 0; i < poly.length; i++) {
        if (i === openEnd) continue;
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        lines.seg([p[0], yAt(p[0], p[1]), p[1]], [q[0], yAt(q[0], q[1]), q[1]], edge, fold);
      }
    };
    switch (a.type) {
      case "pool":
        {
          // rim around the water, water surface below ground
          const water = new Color(look.color);
          for (const [i, j, k] of triangulate(poly)) {
            const p = poly[i];
            const q = poly[j];
            const r = poly[k];
            buf.tri([p[0], g + look.top, p[1]], [r[0], g + look.top, r[1]], [q[0], g + look.top, q[1]], water, water, water, undefined, ALWAYS);
          }
          // inner sides from the water up to the rim, seen from inside the pool
          const sideC = new Color(look.side);
          for (let i = 0; i < poly.length; i++) {
            const p = poly[i];
            const q = poly[(i + 1) % poly.length];
            buf.tri([q[0], g + look.top, q[1]], [q[0], g + 0.06, q[1]], [p[0], g + 0.06, p[1]], sideC, sideC, sideC, undefined, ALWAYS);
            buf.tri([q[0], g + look.top, q[1]], [p[0], g + 0.06, p[1]], [p[0], g + look.top, p[1]], sideC, sideC, sideC, undefined, ALWAYS);
          }
          outline(() => g + 0.06);
          outline(() => g + look.top + 0.005);
          break;
        }
      case "fence":
        {
          // posts every ~2 m and two rails along the outline, following the ground
          for (let i = 0; i < poly.length; i++) {
            if (i === openEnd) continue;
            const p = poly[i];
            const q = poly[(i + 1) % poly.length];
            const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
            const n = Math.max(1, Math.round(len / 2));
            // an open fence also gets the post at its far end
            const last = openEnd >= 0 && i === openEnd - 1 ? n : n - 1;
            for (let k = 0; k <= last; k++) {
              const t = k / n;
              const x = p[0] + (q[0] - p[0]) * t;
              const z = p[1] + (q[1] - p[1]) * t;
              const gy = groundAt(x, z);
              pushPrism(buf, ccw([[x - 0.04, z - 0.04], [x + 0.04, z - 0.04], [x + 0.04, z + 0.04], [x - 0.04, z + 0.04]]), gy, gy + look.top, look.side, look.color);
            }
            for (const y of [0.35, 0.85]) {
              lines.seg([p[0], groundAt(p[0], p[1]) + y * look.top, p[1]], [q[0], groundAt(q[0], q[1]) + y * look.top, q[1]], edge, ALWAYS);
            }
          }
          break;
        }
      case "pergola":
        {
          // corner posts, beams along the edges, rafters across a rectangle, optional X-bracing on the sides
          const h = look.top;
          for (const [x, z] of poly) {
            const gy = groundAt(x, z);
            pushPrism(buf, ccw([[x - 0.06, z - 0.06], [x + 0.06, z - 0.06], [x + 0.06, z + 0.06], [x - 0.06, z + 0.06]]), gy, gy + h, look.side, look.color);
          }
          for (let i = 0; i < poly.length; i++) {
            if (i === openEnd) continue;
            const p = poly[i];
            const q = poly[(i + 1) % poly.length];
            const topP = groundAt(p[0], p[1]) + h;
            pushBeam(buf, p, q, 0.12, topP - 0.16, topP, look.side, look.color);
            if (a.bracing) {
              const gp = groundAt(p[0], p[1]);
              const gq = groundAt(q[0], q[1]);
              lines.seg([p[0], gp + 0.25, p[1]], [q[0], gq + h - 0.25, q[1]], edge, ALWAYS);
              lines.seg([q[0], gq + 0.25, q[1]], [p[0], gp + h - 0.25, p[1]], edge, ALWAYS);
            }
          }
          if (isAxisRect(poly)) {
            const b = bounds(poly);
            const w = b.x1 - b.x0;
            const d = b.z1 - b.z0;
            const alongX = w >= d;
            const span = alongX ? w : d;
            const n = Math.max(1, Math.round(span / 0.6));
            for (let k = 1; k < n; k++) {
              const t = (alongX ? b.x0 : b.z0) + span * k / n;
              const p = alongX ? [t, b.z0 + 0.06] : [b.x0 + 0.06, t];
              const q = alongX ? [t, b.z1 - 0.06] : [b.x1 - 0.06, t];
              const topP = groundAt(p[0], p[1]) + h;
              pushBeam(buf, p, q, 0.06, topP - 0.04, topP + 0.08, look.side, look.color);
            }
          }
          outline((x, z) => groundAt(x, z) + h + 0.004);
          break;
        }
      case "canopy":
        {
          // A complete covered yard: its own paved surface, high perimeter fence with a front gate,
          // posts, beams and a corrugated metal roof projecting past the front posts. The last edge may
          // stay open against the house.
          const h = look.top;
          const finish = coveredLook(a, look);
          const floorY = g + coveredFloorTop(a.type);
          const roofAt = (x, z) => floorY + h - outdoorDrop(a, x, z);
          const front = coveredFrontEdge(poly, openEnd);
          const canopyRoofFold = roofFold === ALWAYS ? ALWAYS : roofFold + CANOPY_ROOF_KIND * 16;
          const columnHalf = Math.min(0.4, Math.max(0.04, (a.column_size ?? 0.12) / 2));
          const roofMargin = Math.max(columnHalf, (a.wallThickness ?? 0.24) / 2);
          for (const [x, z] of poly) {
            const top = roofAt(x, z) - 0.08;
            pushPrism(buf, ccw([[x - columnHalf, z - columnHalf], [x + columnHalf, z - columnHalf], [x + columnHalf, z + columnHalf], [x - columnHalf, z + columnHalf]]), floorY, top, finish.under, finish.roof);
            outlinePost(lines, x, z, columnHalf, floorY, top, edge);
          }
          if (a.railing !== false && h >= 0.4) {
            const fenceH = Math.min(1.45, h * 0.62);
            for (let i = 0; i < poly.length; i++) {
              if (i === openEnd) continue;
              const p = poly[i];
              const q = poly[(i + 1) % poly.length];
              if (i !== front) {
                pushYardPanel(buf, lines, p, q, floorY, fenceH, finish.under, finish.roof, edge);
                continue;
              }
              const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
              if (len < 0.6) {
                pushYardPanel(buf, lines, p, q, floorY, fenceH, finish.under, finish.roof, edge);
                continue;
              }
              const gateW = Math.min(2.4, Math.max(0.9, len * 0.45), Math.max(0.3, len - 0.3));
              const t0 = Math.max(0, (len - gateW) / (2 * len));
              const t1 = Math.min(1, 1 - t0);
              const gateA = [p[0] + (q[0] - p[0]) * t0, p[1] + (q[1] - p[1]) * t0];
              const gateB = [p[0] + (q[0] - p[0]) * t1, p[1] + (q[1] - p[1]) * t1];
              pushYardPanel(buf, lines, p, gateA, floorY, fenceH, finish.under, finish.roof, edge);
              pushYardPanel(buf, lines, gateB, q, floorY, fenceH, finish.under, finish.roof, edge);
              pushYardGate(buf, lines, gateA, gateB, floorY, fenceH, finish.under, finish.roof, edge);
            }
          }
          for (let i = 0; i < poly.length; i++) {
            if (i === openEnd) continue;
            const p = poly[i];
            const q = poly[(i + 1) % poly.length];
            const y = (roofAt(p[0], p[1]) + roofAt(q[0], q[1])) / 2;
            pushBeam(buf, p, q, 0.12, y - 0.18, y - 0.08, finish.under, finish.roof);
            outlineBeam(lines, p, q, y - 0.08, edge);
          }
          const roofPoly = canopyRoofPolygon(poly, openEnd, roofMargin);
          roofStart = buf.count;
          pushCanopyPanel(buf, roofPoly, roofAt, 0.045, finish.under, CORRUGATED_METAL, canopyRoofFold);
          pushCorrugatedRoof(buf, roofPoly, roofAt, front, canopyRoofFold);
          roofEnd = buf.count;
          if (a.outline !== false) {
            for (let i = 0; i < roofPoly.length; i++) {
              if (i === openEnd) continue;
              const p = roofPoly[i];
              const q = roofPoly[(i + 1) % roofPoly.length];
              lines.seg([p[0], roofAt(p[0], p[1]) + 0.034, p[1]], [q[0], roofAt(q[0], q[1]) + 0.034, q[1]], edge, canopyRoofFold);
            }
          }
          break;
        }
      case "balcony":
      case "veranda":
        {
          // An upper-floor veranda: slab, railing around the free edges, two substantial front columns
          // and a lintel. A veranda carries its own roof; a balcony sits under the building's main roof.
          const h = look.top;
          const ownRoof = a.type === "veranda";
          const finish = coveredLook(a, look);
          const floorY = g + coveredFloorTop(a.type);
          const baseAt = (_x, _z) => floorY;
          const roofAt = (x, z) => floorY + h - outdoorDrop(a, x, z);
          const structureTopAt = ownRoof ? roofAt : (_x, _z) => floorY + h;
          const railH = Math.min(1.1, h * 0.48);
          const squarePost = (x, z, half, y0, y1, side = look.side, top = look.color) => {
            pushPrism(buf, ccw([[x - half, z - half], [x + half, z - half], [x + half, z + half], [x - half, z + half]]), y0, y1, side, top);
            outlinePost(lines, x, z, half, y0, y1, edge);
          };

          // Slim balusters and two horizontal rails around every free edge. Keep the balusters sparse
          // and give each only one neon centre line: outlining all four corners turns a long balcony
          // into a dense cyan wall and hides the rooms behind it.
          if (a.railing !== false) {
            for (let i = 0; i < poly.length; i++) {
              if (i === openEnd) continue;
              const p = poly[i];
              const q = poly[(i + 1) % poly.length];
              const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
              const n = Math.max(1, Math.ceil(len / 0.36));
              const y = floorY;
              pushBeam(buf, p, q, 0.07, y + 0.3, y + 0.38, finish.under, finish.roof);
              pushBeam(buf, p, q, 0.09, y + railH - 0.09, y + railH, finish.under, finish.roof);
              outlineBeam(lines, p, q, y + 0.38, edge);
              outlineBeam(lines, p, q, y + railH, edge);
              for (let k = 0; k <= n; k++) {
                const t = k / n;
                const x = p[0] + (q[0] - p[0]) * t;
                const z = p[1] + (q[1] - p[1]) * t;
                const gy = baseAt(x, z);
                const half = 0.012;
                pushPrism(buf, ccw([[x - half, z - half], [x + half, z - half], [x + half, z + half], [x - half, z + half]]), gy + 0.08, gy + railH - 0.07, finish.under, finish.roof);
                lines.seg([x, gy + 0.08, z], [x, gy + railH - 0.07, z], edge, ALWAYS);
              }
            }
          }
          // The front is opposite and parallel to the omitted house edge. Without one, use the longest
          // edge as the facade. This keeps the two large columns correct on wide, shallow verandas too.
          const front = coveredFrontEdge(poly, openEnd);
          const p = poly[front];
          const q = poly[(front + 1) % poly.length];
          const columns = Math.min(12, Math.max(0, Math.round(a.columns ?? 2)));
          const columnHalf = Math.min(0.4, Math.max(0.04, (a.column_size ?? 0.32) / 2));
          for (let i = 0; i < columns; i++) {
            const t = columns === 1 ? 0.5 : i / (columns - 1);
            const x = p[0] + (q[0] - p[0]) * t;
            const z = p[1] + (q[1] - p[1]) * t;
            const gy = baseAt(x, z);
            squarePost(x, z, columnHalf * 1.375, gy, gy + 0.28, finish.under, finish.roof);
            squarePost(x, z, columnHalf, gy + 0.2, structureTopAt(x, z) - 0.2, finish.under, finish.roof);
            squarePost(x, z, columnHalf * 1.375, structureTopAt(x, z) - 0.28, structureTopAt(x, z), finish.under, finish.roof);
            lines.seg([x, gy + 0.28, z], [x, structureTopAt(x, z) - 0.28, z], edge, ALWAYS);
          }
          const topY = (structureTopAt(p[0], p[1]) + structureTopAt(q[0], q[1])) / 2;
          pushBeam(buf, p, q, Math.max(0.2, columnHalf * 2.6), topY - 0.28, topY, finish.under, finish.roof);
          outlineBeam(lines, p, q, topY, edge);
          if (ownRoof) {
            roofStart = buf.count;
            pushCanopyPanel(buf, poly, roofAt, 0.1, finish.under, finish.roof, roofFold);
            roofEnd = buf.count;
            outline((x, z) => roofAt(x, z) + 0.004, roofFold);
          }
          outline((x, z) => baseAt(x, z) + (a.railing === false ? 0.004 : railH + 0.004));
          break;
        }
      default:
        {
          // a flat area is a thin prism; terrace, bed and hedge are raised blocks. A slope tilts the top,
          // the block reaches down to the lowest point; patches marked "cut" inside it become holes
          const topAt = (x, z) => groundAt(x, z) + look.top;
          const holes = outdoorHoles(areas, index);
          pushPrism(buf, poly, lowest, a.slope ? topAt : g + look.top, look.side, look.color, {
            aoFrom: lowest,
            holes
          });
          outline((x, z) => topAt(x, z) + 0.004);
          if (a.type === "hedge") outline((x, z) => groundAt(x, z) + 0.004);
          if (a.outline !== false) {
            for (const hole of holes) {
              for (let i = 0; i < hole.length; i++) {
                const p = hole[i];
                const q = hole[(i + 1) % hole.length];
                lines.seg([p[0], topAt(p[0], p[1]) + 0.004, p[1]], [q[0], topAt(q[0], q[1]) + 0.004, q[1]], edge, ALWAYS);
              }
            }
          }
        }
    }
    if (buf.count > start) ranges.push({
      id: a.id,
      start,
      end: buf.count,
      ...(roofStart !== undefined && roofEnd !== undefined ? {
        roofStart,
        roofEnd
      } : {})
    });
  });
  return ranges;
}

/** Render only actual Outdoor areas; covered structures now exist exclusively as Rooms. */
export function pushOutdoor(buf, lines, floor) {
  return pushAreas(buf, lines, floor, floor.outdoor ?? [], ALWAYS);
}

/** Render the structural shell of covered Rooms without exposing them as Outdoor area types. */
export function pushCovered(buf, lines, floor, areas, roofFold = ALWAYS) {
  return pushAreas(buf, lines, floor, areas, roofFold);
}