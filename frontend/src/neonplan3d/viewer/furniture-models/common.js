/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/common.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Shared primitives used by multiple built-in furniture families.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
export function legs(b, w, d, h, t, inset, color = C.metal, taper = false) {
  const x = w / 2 - inset - t;
  const z = d / 2 - inset - t;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * x;
      const cz = sz * z;
      if (taper) b.loft([cx - t * 0.3, cx + t * 0.3, cz - t * 0.3, cz + t * 0.3], [cx - t / 2, cx + t / 2, cz - t / 2, cz + t / 2], 0, h, color);else b.box(cx - t / 2, cx + t / 2, 0, h, cz - t / 2, cz + t / 2, color);
    }
  }
}
export function fronts(b, x0, x1, y0, y1, z, count, handleY = null, horizontal = false) {
  const w = (x1 - x0) / count;
  for (let i = 1; i < count; i++) {
    const x = x0 + w * i;
    b.seg(x, y0, z, x, y1, z, EDGE_FAINT);
  }
  for (let i = 0; i < count; i++) {
    const cx = x0 + w * (i + 0.5);
    const hy = handleY ?? y1 - 0.08;
    if (horizontal) b.seg(cx - Math.min(0.1, w / 4), hy, z + 0.012, cx + Math.min(0.1, w / 4), hy, z + 0.012, EDGE_GLOW);else {
      const hx = count > 1 ? cx + (i % 2 ? -w / 2 + 0.06 : w / 2 - 0.06) : cx + w / 2 - 0.06;
      b.seg(hx, hy - 0.08, z + 0.012, hx, hy + 0.08, z + 0.012, EDGE_GLOW);
    }
  }
}
export function cabinet(b, w, d, h, doors, handleY = null, horizontal = false) {
  b.box(-w / 2, w / 2, 0.02, h, -d / 2, d / 2 - 0.02, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2 + 0.02, w / 2 - 0.02, 0, 0.08, -d / 2 + 0.02, d / 2 - 0.06, C.dark);
  fronts(b, -w / 2, w / 2, 0.08, h, d / 2 - 0.02, doors, handleY, horizontal);
}
export function ring(b, cx, cy, r, z, n = 20) {
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2;
    const a1 = (i + 1) / n * Math.PI * 2;
    b.seg(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z, EDGE_GLOW);
  }
}