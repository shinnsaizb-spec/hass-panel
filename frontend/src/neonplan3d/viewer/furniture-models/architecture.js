/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/architecture.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Interior architecture and fit-out elements. Structural families stay separate from outdoor
// furniture so columns, beams and partitions can grow without another mixed renderer.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function column(b, w, d, h, style) {
  if (style === "round") b.cyl(0, 0, Math.min(w, d) / 2, 0, h, C.white, C.whiteTop, 20, EDGE_FURN);else if (style === "square") b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);else {
    b.box(-w / 2, w / 2, 0, h, -d * 0.12, d * 0.12, C.metal, C.metal, EDGE_FURN);
    b.box(-w * 0.12, w * 0.12, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
  }
}
function ceilingBeams(b, w, d, h) {
  const y = 2.7 - h;
  for (let i = 0; i < 5; i++) {
    const z = -d / 2 + d * i / 4;
    b.box(-w / 2, w / 2, y, y + h, z - 0.055, z + 0.055, C.wood, C.woodTop, EDGE_FURN);
  }
}
function downstandBeam(b, w, d, h) {
  const top = 2.7;
  b.box(-w / 2, w / 2, top - h, top, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
}
function chimney(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  for (let y = 0.24; y < h; y += 0.24) b.seg(-w / 2, y, d / 2 + 0.003, w / 2, y, d / 2 + 0.003, EDGE_FAINT);
}
function fireplace(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.38, w * 0.38, h * 0.14, h * 0.68, d / 2, d / 2 + 0.012, C.dark, C.dark, EDGE_GLOW);
  b.box(-w * 0.31, w * 0.31, h * 0.18, h * 0.24, d / 2 + 0.014, d / 2 + 0.025, C.accent, C.accent, EDGE_GLOW);
}
function slidingWall(b, w, d, h) {
  const panels = 3;
  for (let i = 0; i < panels; i++) {
    const x0 = -w / 2 + w * i / panels;
    const x1 = -w / 2 + w * (i + 1) / panels;
    const z = (i - 1) * d * 0.16;
    b.box(x0 + 0.015, x1 - 0.015, 0.04, h, z - d * 0.12, z + d * 0.12, C.body, C.bodyTop, EDGE_FURN);
    b.seg(x1 - 0.07, h * 0.42, z + d * 0.13, x1 - 0.07, h * 0.58, z + d * 0.13, EDGE_GLOW);
  }
  b.box(-w / 2, w / 2, h, h + 0.04, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
}
function shelfNiche(b, w, d, h, lit) {
  const frame = 0.06;
  b.box(-w / 2, -w / 2 + frame, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(w / 2 - frame, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - frame, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  for (const y of [h * 0.25, h * 0.5, h * 0.75]) b.box(-w / 2 + frame, w / 2 - frame, y - 0.018, y + 0.018, -d / 2, d / 2, C.wood, C.woodTop, lit ? EDGE_GLOW : EDGE_FAINT);
  if (lit) b.box(-w * 0.42, w * 0.42, h * 0.08, h * 0.12, d / 2, d / 2 + 0.012, C.accent, C.accent, EDGE_GLOW);
}
function lightCove(b, w, d, h) {
  const y = 2.7 - h;
  b.box(-w / 2, w / 2, y, y + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.44, w * 0.44, y - 0.015, y + 0.015, d * 0.22, d * 0.4, C.accent, C.accent, EDGE_GLOW);
}
function platform(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d * 0.12, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, 0, h * 0.5, d * 0.12, d / 2, C.wood, C.woodTop, EDGE_FAINT);
}
function glassRailing(b, w, d, h) {
  for (const x of [-w / 2, 0, w / 2]) b.box(x - 0.02, x + 0.02, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  b.box(-w / 2, w / 2, h - 0.045, h, -d / 2, d / 2, C.metal, C.metal, EDGE_GLOW);
  b.seg(-w / 2, h * 0.08, 0, w / 2, h * 0.08, 0, EDGE_FAINT);
}
function windowSeat(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.72, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.pad(-w * 0.47, w * 0.47, h * 0.7, h, -d * 0.46, d * 0.46, C.fabric, C.cushion, 0.035, EDGE_GLOW);
  b.seg(0, 0.06, d / 2 + 0.004, 0, h * 0.58, d / 2 + 0.004, EDGE_FAINT);
}
const fireplaceScreen = (w, d, h) => ({
  x0: -w * 0.37,
  x1: w * 0.37,
  y0: h * 0.15,
  y1: h * 0.67,
  z: d / 2 + 0.014
});
const nicheScreen = (w, d, h) => ({
  x0: -w * 0.4,
  x1: w * 0.4,
  y0: h * 0.07,
  y1: h * 0.13,
  z: d / 2 + 0.014
});
const coveScreen = (w, d, h) => ({
  x0: -w * 0.42,
  x1: w * 0.42,
  y0: 2.7 - h - 0.018,
  y1: 2.7 - h + 0.018,
  z: d * 0.32
});
export const ARCHITECTURE_FURNITURE_MODELS = {
  column_round: ({
    b,
    w,
    d,
    h
  }) => (column(b, w, d, h, "round"), 0.5),
  column_square: ({
    b,
    w,
    d,
    h
  }) => (column(b, w, d, h, "square"), 0.5),
  column_steel: ({
    b,
    w,
    d,
    h
  }) => (column(b, w, d, h, "steel"), 0.5),
  ceiling_beams: ({
    b,
    w,
    d,
    h
  }) => (ceilingBeams(b, w, d, h), false),
  downstand_beam: ({
    b,
    w,
    d,
    h
  }) => (downstandBeam(b, w, d, h), false),
  chimney_inside: ({
    b,
    w,
    d,
    h
  }) => (chimney(b, w, d, h), 0.5),
  fireplace_builtin: ({
    b,
    w,
    d,
    h
  }) => (fireplace(b, w, d, h), 0.5),
  sliding_wall: ({
    b,
    w,
    d,
    h
  }) => (slidingWall(b, w, d, h), 0.5),
  builtin_shelf_niche: ({
    b,
    w,
    d,
    h
  }) => (shelfNiche(b, w, d, h, false), false),
  led_niche: ({
    b,
    w,
    d,
    h
  }) => (shelfNiche(b, w, d, h, true), false),
  light_cove: ({
    b,
    w,
    d,
    h
  }) => (lightCove(b, w, d, h), false),
  platform_steps: ({
    b,
    w,
    d,
    h
  }) => (platform(b, w, d, h), 0.5),
  gallery_railing_glass: ({
    b,
    w,
    d,
    h
  }) => (glassRailing(b, w, d, h), 0.5),
  window_seat: ({
    b,
    w,
    d,
    h
  }) => (windowSeat(b, w, d, h), 0.5)
};
export const ARCHITECTURE_FURNITURE_SCREENS = {
  fireplace_builtin: fireplaceScreen,
  led_niche: nicheScreen,
  light_cove: coveScreen
};