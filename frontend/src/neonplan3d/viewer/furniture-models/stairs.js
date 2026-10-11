/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/stairs.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Dedicated stairs and balustrades. All stair footprints are also slab openings (see build.ts).

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function straight(b, w, d, h, style) {
  const n = Math.max(8, Math.round(h / (style === "compact" ? 0.21 : 0.18)));
  const rise = h / n;
  const run = d / n;
  for (let i = 0; i < n; i++) {
    const z1 = d / 2 - run * i;
    const z0 = z1 - run;
    const y = rise * (i + 1);
    if (style === "open") b.box(-w / 2, w / 2, y - 0.055, y, z0, z1, C.wood, C.woodTop, EDGE_FURN);else b.box(-w / 2, w / 2, 0, y, z0, z1, style === "concrete" ? C.white : C.wood, style === "concrete" ? C.whiteTop : C.woodTop, EDGE_FAINT);
    b.seg(-w / 2, y, z1, w / 2, y, z1, EDGE_FURN);
  }
  if (style === "open") for (const x of [-w * 0.34, w * 0.34]) b.seg(x, 0.05, d / 2, x, h - rise, -d / 2 + run, EDGE_FAINT);
  const x = w / 2 - 0.035;
  b.seg(x, rise + 0.88, d / 2 - run / 2, x, h + 0.88 - rise * 4, -d / 2 + run * 3.5, EDGE_GLOW);
  for (let i = 0; i < n - 3; i += 3) {
    const z = d / 2 - run * (i + 0.5);
    const y = rise * (i + 1);
    b.seg(x, y, z, x, y + 0.88, z, EDGE_FAINT);
  }
}
function quarterTurn(b, w, d, h, winder) {
  const steps = Math.max(12, Math.round(h / 0.18));
  const lower = Math.floor(steps / 2);
  const upper = steps - lower;
  const rise = h / steps;
  const fw = Math.min(w, d) * 0.38;
  const landing = Math.min(w, d) * 0.38;
  const run1 = (d - landing) / lower;
  const run2 = (w - landing) / upper;
  for (let i = 0; i < lower; i++) {
    const z1 = d / 2 - run1 * i;
    b.box(w / 2 - fw, w / 2, 0, rise * (i + 1), z1 - run1, z1, C.wood, C.woodTop, EDGE_FAINT);
  }
  const ly = rise * lower;
  if (!winder) b.box(w / 2 - landing, w / 2, 0, ly, -d / 2, -d / 2 + landing, C.wood, C.woodTop, EDGE_FURN);else for (let i = 0; i < 3; i++) b.box(w / 2 - landing, w / 2 - landing * i / 3, 0, ly + rise * i, -d / 2, -d / 2 + landing, C.wood, C.woodTop, EDGE_FAINT);
  for (let i = 0; i < upper; i++) {
    const x1 = w / 2 - landing - run2 * i;
    b.box(x1 - run2, x1, 0, ly + rise * (i + 1), -d / 2, -d / 2 + fw, C.wood, C.woodTop, EDGE_FAINT);
  }
  b.seg(w / 2 - 0.03, rise + 0.88, d / 2 - run1 / 2, w / 2 - 0.03, ly + 0.88, -d / 2 + landing, EDGE_GLOW);
  b.seg(w / 2 - landing, ly + 0.88, -d / 2 + 0.03, -w / 2 + run2 * 3, h - rise * 3 + 0.88, -d / 2 + 0.03, EDGE_GLOW);
}
function spiral(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  const n = Math.max(14, Math.round(h / 0.18));
  b.cyl(0, 0, r * 0.07, 0, h, C.metal, C.metal, 12, EDGE_FURN);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const y = h * (i + 1) / n;
    const x = Math.cos(a) * r * 0.48;
    const z = Math.sin(a) * r * 0.48;
    b.box(Math.min(0, x) - 0.08, Math.max(0, x) + 0.08, y - 0.055, y, Math.min(0, z) - 0.08, Math.max(0, z) + 0.08, C.wood, C.woodTop, EDGE_FAINT);
    b.seg(Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.9, Math.cos(a) * r * 0.9, Math.min(h + 0.8, y + 0.8), Math.sin(a) * r * 0.9, EDGE_FAINT);
  }
}
function railing(b, w, d, h, style) {
  const posts = style === "wood" ? 5 : 3;
  for (let i = 0; i < posts; i++) {
    const x = -w / 2 + w * i / (posts - 1);
    b.box(x - 0.022, x + 0.022, 0, h, -d / 2, d / 2, style === "wood" ? C.wood : C.metal, style === "wood" ? C.woodTop : C.metal, EDGE_FURN);
  }
  b.box(-w / 2, w / 2, h - 0.045, h, -d / 2, d / 2, style === "wood" ? C.wood : C.metal, style === "wood" ? C.woodTop : C.metal, EDGE_GLOW);
  const rails = style === "glass" ? 1 : style === "cable" ? 5 : 3;
  for (let i = 1; i <= rails; i++) b.seg(-w / 2, h * i / (rails + 1), 0, w / 2, h * i / (rails + 1), 0, style === "glass" ? EDGE_FAINT : EDGE_FURN);
}
export const STAIR_FURNITURE_MODELS = {
  stairs_landing_l: ({
    b,
    w,
    d,
    h
  }) => (quarterTurn(b, w, d, h, false), 0.5),
  stairs_winder_l: ({
    b,
    w,
    d,
    h
  }) => (quarterTurn(b, w, d, h, true), 0.5),
  stairs_spiral: ({
    b,
    w,
    d,
    h
  }) => (spiral(b, w, d, h), 0.5),
  stairs_open: ({
    b,
    w,
    d,
    h
  }) => (straight(b, w, d, h, "open"), 0.5),
  stairs_concrete: ({
    b,
    w,
    d,
    h
  }) => (straight(b, w, d, h, "concrete"), 0.5),
  stairs_compact: ({
    b,
    w,
    d,
    h
  }) => (straight(b, w, d, h, "compact"), 0.5),
  railing_glass: ({
    b,
    w,
    d,
    h
  }) => (railing(b, w, d, h, "glass"), 0.5),
  railing_metal: ({
    b,
    w,
    d,
    h
  }) => (railing(b, w, d, h, "metal"), 0.5),
  railing_wood: ({
    b,
    w,
    d,
    h
  }) => (railing(b, w, d, h, "wood"), 0.5),
  railing_cable: ({
    b,
    w,
    d,
    h
  }) => (railing(b, w, d, h, "cable"), 0.5)
};