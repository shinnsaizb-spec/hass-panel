/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-builder.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Shared low-poly primitives for built-in furniture families. Model modules only describe shapes;
// transforms, winding, palette and line styling live here so adding a family does not grow the
// central furniture dispatcher.

import { Color } from "three";
import { ALWAYS, DEG, GeoBuffer, LineBuffer, pushLoft, pushLyingCyl, pushPrism, shade } from "./geo.js";
export const C = {
  body: 0x172238,
  bodyTop: 0x1d2b47,
  fabric: 0x1a2644,
  fabricTop: 0x22325a,
  cushion: 0x243661,
  wood: 0x19233c,
  woodTop: 0x202d4b,
  white: 0x1d2946,
  whiteTop: 0x26375e,
  metal: 0x2a3a60,
  dark: 0x0b111f,
  glass: 0x1c3a52,
  plant: 0x12302e,
  plantTop: 0x1a4540,
  pot: 0x1d2640,
  accent: 0x2b8fb3
};
export const EDGE_FURN = shade(0x5b7cff, 0.3);
export const EDGE_FAINT = shade(0x5b7cff, 0.17);
export const EDGE_GLOW = shade(0x37e0ff, 0.45);
export class FurnitureBuilder {
  /** The transform mirrors (negative determinant): parts not wound by ccw() come out inside out. */

  constructor(buf, lines, tf) {
    this.buf = buf;
    this.lines = lines;
    this.tf = tf;
    this.mirrored = transformMirrors(tf);
  }

  /** The same buffers with local coordinates turned around `(cx, cz)`. */
  rotated(cx, cz, deg) {
    const a = deg * DEG;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const tf = this.tf;
    return new FurnitureBuilder(this.buf, this.lines, (x, z) => tf(cx + (x - cx) * c - (z - cz) * s, cz + (x - cx) * s + (z - cz) * c));
  }
  box(x0, x1, y0, y1, z0, z1, side, top = side, edges = null) {
    if (x1 - x0 < 1e-4 || z1 - z0 < 1e-4 || y1 - y0 < 1e-4) return;
    const poly = [this.tf(x0, z0), this.tf(x0, z1), this.tf(x1, z1), this.tf(x1, z0)];
    pushPrism(this.buf, ccw(poly), y0, y1, side, top, {
      aoFrom: 0,
      bottom: y0 > 0.05
    });
    if (edges) this.outline(poly, y0, y1, edges);
  }
  loft(b, t, y0, y1, side, top = side, edges = null) {
    if (y1 - y0 < 1e-4) return;
    const lo = [this.tf(b[0], b[2]), this.tf(b[0], b[3]), this.tf(b[1], b[3]), this.tf(b[1], b[2])];
    const hi = [this.tf(t[0], t[2]), this.tf(t[0], t[3]), this.tf(t[1], t[3]), this.tf(t[1], t[2])];
    if (lo !== ccw(lo)) {
      lo.reverse();
      hi.reverse();
    }
    pushLoft(this.buf, lo, hi, y0, y1, side, top);
    if (edges) {
      for (let i = 0; i < 4; i++) {
        this.line(hi[i], hi[(i + 1) % 4], y1, y1, edges);
        this.line(lo[i], hi[i], y0, y1, edges);
      }
    }
  }
  pad(x0, x1, y0, y1, z0, z1, side, top = side, r = 0.03, edges = null) {
    r = Math.min(r, (x1 - x0) / 2 - 0.005, (z1 - z0) / 2 - 0.005, (y1 - y0) / 2);
    if (r < 0.008) return this.box(x0, x1, y0, y1, z0, z1, side, top, edges);
    this.loft([x0 + r, x1 - r, z0 + r, z1 - r], [x0, x1, z0, z1], y0, y0 + r, side);
    if (y1 - y0 - 2 * r > 0.005) this.box(x0, x1, y0 + r, y1 - r, z0, z1, side, side, edges);
    this.loft([x0, x1, z0, z1], [x0 + r, x1 - r, z0 + r, z1 - r], y1 - r, y1, side, top);
  }
  lyingCyl(axis, cx, cz, y0, y1, len, dia, side, cap = side, n = 12, edges = null) {
    const r = Math.min(dia, y1 - y0) / 2;
    if (r < 1e-4 || len < 1e-4) return;
    const cy = (y0 + y1) / 2;
    const along = axis === "x" ? cx : cz;
    const across = axis === "x" ? cz : cx;
    const at = (a, c) => axis === "x" ? this.tf(a, c) : this.tf(c, a);
    const p0 = this.buf.p.length;
    pushLyingCyl(this.buf, at, along - len / 2, along + len / 2, across, cy, r, side, cap, n);
    if (this.mirrored) flipWinding(this.buf, p0);
    if (edges) {
      for (const a of [along - len / 2, along + len / 2]) {
        for (let i = 0; i < n; i++) {
          const t0 = i / n * Math.PI * 2;
          const t1 = (i + 1) / n * Math.PI * 2;
          this.line(at(a, across + Math.sin(t0) * r), at(a, across + Math.sin(t1) * r), cy + Math.cos(t0) * r, cy + Math.cos(t1) * r, edges);
        }
      }
    }
  }
  cyl(cx, cz, r, y0, y1, side, top = side, n = 10, edges = null) {
    const poly = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      poly.push(this.tf(cx + Math.cos(a) * r, cz + Math.sin(a) * r));
    }
    pushPrism(this.buf, ccw(poly), y0, y1, side, top, {
      aoFrom: 0,
      bottom: y0 > 0.05
    });
    if (edges) for (let i = 0; i < n; i++) this.line(poly[i], poly[(i + 1) % n], y1, y1, edges);
  }
  tubeYZ(x, path, r, side, n = 8, edges = null) {
    if (path.length < 2 || r < 1e-4) return;
    const rings = path.map(([y, z], i) => {
      const prev = path[Math.max(0, i - 1)];
      const next = path[Math.min(path.length - 1, i + 1)];
      const dy = next[0] - prev[0];
      const dz = next[1] - prev[1];
      const len = Math.hypot(dy, dz) || 1;
      return Array.from({
        length: n
      }, (_, j) => {
        const a = j / n * Math.PI * 2;
        const p = this.tf(x + Math.cos(a) * r, z + dy / len * Math.sin(a) * r);
        return [p[0], y - dz / len * Math.sin(a) * r, p[1]];
      });
    });
    const p0 = this.buf.p.length;
    const color = new Color(side);
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      this.buf.tri(rings[i][j], rings[i + 1][j], rings[i + 1][k], color);
      this.buf.tri(rings[i][j], rings[i + 1][k], rings[i][k], color);
    }
    const cap = (i, reverse) => {
      const p = this.tf(x, path[i][1]);
      const centre = [p[0], path[i][0], p[1]];
      for (let j = 0; j < n; j++) {
        const k = (j + 1) % n;
        this.buf.tri(centre, rings[i][reverse ? k : j], rings[i][reverse ? j : k], color);
      }
    };
    cap(0, true);
    cap(path.length - 1, false);
    if (this.mirrored) flipWinding(this.buf, p0);
    if (edges) for (let i = 0; i < path.length - 1; i++) this.seg(x, path[i][0], path[i][1], x, path[i + 1][0], path[i + 1][1], edges);
  }
  seg(xa, ya, za, xb, yb, zb, color = EDGE_FURN) {
    this.line(this.tf(xa, za), this.tf(xb, zb), ya, yb, color);
  }
  line(a, b, ya, yb, color) {
    this.lines.seg([a[0], ya, a[1]], [b[0], yb, b[1]], color, ALWAYS);
  }
  outline(poly, y0, y1, color) {
    for (let i = 0; i < 4; i++) {
      const a = poly[i];
      this.line(a, poly[(i + 1) % 4], y1, y1, color);
      this.line(a, a, y0, y1, color);
    }
  }
}
export function transformMirrors(tf) {
  const o = tf(0, 0);
  const ex = tf(1, 0);
  const ez = tf(0, 1);
  return (ex[0] - o[0]) * (ez[1] - o[1]) - (ex[1] - o[1]) * (ez[0] - o[0]) < 0;
}
function ccw(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a >= 0 ? poly : [...poly].reverse();
}

/** Swap the second and third vertex of every triangle from `from` on. */
export function flipWinding(buf, from) {
  const swap = (arr, start, n) => {
    if (!arr) return;
    for (let k = 0; k < n; k++) {
      const i = start + n + k;
      const j = start + 2 * n + k;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  for (let i = from; i < buf.p.length; i += 9) {
    const tri = i / 9;
    swap(buf.p, i, 3);
    swap(buf.c, i, 3);
    swap(buf.f, tri * 3, 1);
    swap(buf.uv, tri * 6, 2);
    swap(buf.tile, tri * 6, 2);
  }
}