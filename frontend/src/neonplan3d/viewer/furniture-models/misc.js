/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/misc.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Small markers and robot docks that do not belong to a room-furniture family.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function worktop(b, w, d, h) {
  b.box(-w / 2, w / 2, Math.max(0, h - 0.04), h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
}
function parking(b, w, d) {
  const y = 0.012;
  const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  for (let i = 0; i < 4; i++) b.seg(corners[i][0], y, corners[i][1], corners[(i + 1) % 4][0], y, corners[(i + 1) % 4][1], EDGE_FAINT);
  b.seg(-w * 0.15, y, d / 2 - 0.45, 0, y, d / 2 - 0.2, EDGE_FURN);
  b.seg(0, y, d / 2 - 0.2, w * 0.15, y, d / 2 - 0.45, EDGE_FURN);
}
function robotVacuumDock(b, w, d, h) {
  b.box(-w * 0.38, w * 0.38, 0, h * 0.05, -d / 2 - d * 0.02, -d * 0.1, C.dark, C.body, EDGE_FAINT);
  b.box(-w * 0.32, w * 0.32, h * 0.04, h * 0.92, -d / 2, -d * 0.18, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, h * 0.9, h, -d / 2 - d * 0.01, -d * 0.17, C.metal, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.23, w * 0.23, h * 0.75, h * 0.82, -d * 0.175, -d * 0.15, C.accent, C.accent, EDGE_GLOW);
  b.box(-w * 0.22, w * 0.22, h * 0.02, h * 0.055, -d * 0.18, d * 0.17, C.dark, C.bodyTop, EDGE_FAINT);
}
function robotMowerDock(b, w, d, h) {
  const t = Math.min(0.055, w * 0.07);
  b.box(-w * 0.48, w * 0.48, 0, h * 0.045, -d * 0.48, d * 0.4, C.dark, C.bodyTop, EDGE_FAINT);
  for (const x of [-w * 0.43, w * 0.43]) b.box(x - t / 2, x + t / 2, h * 0.04, h * 0.7, -d * 0.44, d * 0.28, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.45, w * 0.45, h * 0.06, h * 0.52, -d * 0.48, -d * 0.42, C.body, C.bodyTop, EDGE_FAINT);
  b.box(-w / 2, w / 2, h * 0.69, h * 0.84, -d / 2, d * 0.42, C.body, C.metal, EDGE_FURN);
  b.loft([-w * 0.33, w * 0.33, -d * 0.17, d * 0.34], [-w * 0.27, w * 0.27, -d * 0.12, d * 0.27], h * 0.05, h * 0.31, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.23, w * 0.23, h * 0.16, h * 0.22, d * 0.325, d * 0.345, C.accent, C.accent, EDGE_GLOW);
  for (const x of [-w * 0.29, w * 0.29]) b.lyingCyl("x", x, d * 0.08, h * 0.015, h * 0.145, t * 2, h * 0.13, C.dark, C.metal, 10, EDGE_FAINT);
}
export const MISC_FURNITURE_MODELS = {
  parking: ({
    b,
    w,
    d
  }) => (parking(b, w, d), false),
  robot_mower: ({
    b,
    w,
    d,
    h
  }) => (robotMowerDock(b, w, d, h), false),
  robot_vacuum: ({
    b,
    w,
    d,
    h
  }) => (robotVacuumDock(b, w, d, h), false),
  stairwell: () => false,
  worktop: ({
    b,
    w,
    d,
    h
  }) => (worktop(b, w, d, h), false)
};