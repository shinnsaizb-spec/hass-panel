/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/living.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Living-room feature pieces kept separate from the generic everyday primitives.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function mediaWall(b, w, d, h) {
  const screenW = w * 0.56;
  const screenH = h * 0.45;
  const screenY = h * 0.38;
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d / 2 + 0.06, C.wood, C.woodTop, EDGE_FURN);
  b.box(-screenW / 2, screenW / 2, screenY, screenY + screenH, d / 2 - 0.045, d / 2, C.dark, C.dark, EDGE_GLOW);
  b.box(-w / 2, w / 2, 0.04, h * 0.2, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -w / 2 : w * 0.37;
    const x1 = side < 0 ? -w * 0.37 : w / 2;
    b.box(x0, x1, h * 0.23, h * 0.92, -d / 2 + 0.04, d * 0.22, C.wood, C.woodTop, EDGE_FURN);
    for (const y of [h * 0.45, h * 0.68]) b.seg(x0 + 0.025, y, d * 0.225, x1 - 0.025, y, d * 0.225, EDGE_FAINT);
  }
}
const mediaWallScreen = (w, d, h) => ({
  x0: -w * 0.28 + 0.02,
  x1: w * 0.28 - 0.02,
  y0: h * 0.38 + 0.02,
  y1: h * 0.83 - 0.02,
  z: d / 2 + 0.004
});
function uprightPiano(b, w, d, h) {
  const bodyD = d * 0.48;
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d / 2 + bodyD, C.wood, C.woodTop, EDGE_FURN);
  const keyY = h * 0.58;
  b.box(-w * 0.43, w * 0.43, keyY, keyY + 0.055, -d / 2 + bodyD, d * 0.05, C.white, C.whiteTop, EDGE_FURN);
  for (let i = 1; i < 14; i++) {
    const x = -w * 0.43 + w * 0.86 * i / 14;
    b.seg(x, keyY + 0.057, -d / 2 + bodyD, x, keyY + 0.057, d * 0.05, EDGE_FAINT);
  }
  b.box(-w * 0.32, w * 0.32, 0, h * 0.36, d * 0.16, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.38, w * 0.38, h * 0.36, h * 0.43, d * 0.12, d / 2, C.fabric, C.cushion, EDGE_FURN);
}
function vasePampas(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.44, 0, h * 0.35, C.pot, C.pot, 12, EDGE_FURN);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const x = Math.cos(a) * r * 0.2;
    const z = Math.sin(a) * r * 0.2;
    b.seg(0, h * 0.3, 0, x, h * 0.87, z, EDGE_FAINT);
    b.cyl(x, z, r * 0.08, h * 0.72, h, C.wood, C.woodTop, 7, i < 3 ? EDGE_GLOW : null);
  }
}
function monstera(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.38, 0, h * 0.25, C.pot, C.pot, 12, EDGE_FURN);
  b.cyl(0, 0, r * 0.07, h * 0.2, h * 0.8, C.wood, C.wood, 7);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const cx = Math.cos(a) * r * 0.38;
    const cz = Math.sin(a) * r * 0.38;
    const y = h * (0.42 + i % 3 * 0.14);
    b.rotated(cx, cz, a * 180 / Math.PI).loft([-r * 0.28, r * 0.28, -0.03, 0.03], [-r * 0.08, r * 0.08, -0.02, 0.02], y, y + h * 0.12, C.plant, C.plantTop, EDGE_FAINT);
  }
}
function roundRug(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) / 2, 0, h, C.fabric, C.fabricTop, 28, EDGE_FAINT);
}
function electricFireplace(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.metal, EDGE_FURN);
  b.box(-w * 0.42, w * 0.42, h * 0.14, h * 0.82, d / 2, d / 2 + 0.012, C.glass, C.glass, EDGE_GLOW);
  for (let i = 0; i < 6; i++) {
    const x = -w * 0.34 + w * 0.68 * i / 5;
    b.loft([x - 0.045, x + 0.045, d / 2 + 0.014, d / 2 + 0.024], [x - 0.012, x + 0.012, d / 2 + 0.014, d / 2 + 0.024], h * 0.18, h * (0.43 + i % 2 * 0.1), C.accent, C.accent, EDGE_GLOW);
  }
}
export const LIVING_FURNITURE_MODELS = {
  media_wall_tv: ({
    b,
    w,
    d,
    h
  }) => (mediaWall(b, w, d, h), 0.5),
  piano_upright: ({
    b,
    w,
    d,
    h
  }) => (uprightPiano(b, w, d, h), 0.5),
  vase_pampas: ({
    b,
    w,
    d,
    h
  }) => (vasePampas(b, w, d, h), 0.35),
  plant_monstera: ({
    b,
    w,
    d,
    h
  }) => (monstera(b, w, d, h), 0.4),
  rug_round: ({
    b,
    w,
    d,
    h
  }) => (roundRug(b, w, d, h), false),
  fireplace_wall_electric: ({
    b,
    w,
    d,
    h
  }) => (electricFireplace(b, w, d, h), 0.25)
};
export const LIVING_FURNITURE_SCREENS = {
  media_wall_tv: mediaWallScreen
};