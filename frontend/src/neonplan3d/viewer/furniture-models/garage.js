/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/garage.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Garage and workshop fixtures, built from shared low-poly primitives.
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function bench(b, w, d, h, board) {
  b.box(-w / 2, w / 2, h * 0.43, h * 0.49, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.44, w * 0.44]) for (const z of [-d * 0.38, d * 0.38]) b.box(x - 0.035, x + 0.035, 0, h * 0.43, z - 0.035, z + 0.035, C.metal, C.metal, EDGE_FAINT);
  if (board) {
    b.box(-w / 2, w / 2, h * 0.5, h, -d / 2, -d / 2 + 0.035, C.body, C.bodyTop, EDGE_FURN);
    for (let i = 0; i < 6; i++) b.seg(-w * 0.42 + i * w * 0.168, h * 0.58, -d / 2 - 0.003, -w * 0.42 + i * w * 0.168, h * 0.9, -d / 2 - 0.003, EDGE_FAINT);
  }
}
function cabinet(b, w, d, h, chest) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.metal, EDGE_FURN);
  const n = chest ? 6 : 2;
  for (let i = 1; i < n; i++) b.seg(-w * 0.46, h * i / n, d / 2 + 0.003, w * 0.46, h * i / n, d / 2 + 0.003, EDGE_FAINT);
  if (!chest) b.seg(0, 0.06, d / 2 + 0.004, 0, h - 0.06, d / 2 + 0.004, EDGE_FAINT);
}
function shelves(b, w, d, h, wall) {
  for (const y of [0, h / 3, h * 2 / 3, h]) b.box(-w / 2, w / 2, y, y + 0.035, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  if (!wall) for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) b.box(x - 0.025, x + 0.025, 0, h, z - 0.025, z + 0.025, C.metal, C.metal, EDGE_FAINT);
}
function cylinderMachine(b, w, d, h, vacuum) {
  const r = Math.min(w, d) * (vacuum ? 0.36 : 0.28);
  if (vacuum) b.cyl(0, 0, r, 0.08, h * 0.72, C.body, C.bodyTop, 14, EDGE_FURN);else b.lyingCyl("x", 0, 0, h * 0.24, r, w * 0.72, r, C.body, C.bodyTop, 14, EDGE_FURN);
  b.box(-w * 0.18, w * 0.18, h * 0.68, h * 0.9, -d * 0.12, d * 0.12, C.dark, C.metal, EDGE_GLOW);
  for (const x of [-w * 0.3, w * 0.3]) b.cyl(x, d * 0.28, 0.06, 0, 0.12, C.dark, C.dark, 10, EDGE_FAINT);
}
function ladder(b, w, d, h, step) {
  const spread = step ? d * 0.42 : d * 0.22;
  for (const x of [-w * 0.42, w * 0.42]) {
    b.seg(x, 0, spread, x, h, -spread, EDGE_FURN);
    if (step) b.seg(x, 0, -spread, x, h, -spread, EDGE_FAINT);
  }
  for (let i = 1; i < 8; i++) b.seg(-w * 0.42, h * i / 8, spread - spread * 2 * i / 8, w * 0.42, h * i / 8, spread - spread * 2 * i / 8, EDGE_GLOW);
}
function boxes(b, w, d, h, bins) {
  const cols = bins ? 4 : 2,
    rows = bins ? 5 : 2;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const x0 = -w / 2 + w * x / cols + 0.015,
      x1 = -w / 2 + w * (x + 1) / cols - 0.015;
    const y0 = h * y / rows,
      y1 = h * (y + 1) / rows - 0.018;
    b.box(x0, x1, y0, y1, -d / 2, d / 2, bins ? C.body : C.wood, bins ? C.bodyTop : C.woodTop, EDGE_FAINT);
  }
}
function tires(b, w, d, h) {
  for (let i = 0; i < 4; i++) b.cyl(0, 0, Math.min(w, d) * 0.46, h * i / 4, h * (i + 1) / 4 - 0.02, C.dark, C.metal, 16, EDGE_FURN);
}
function bikeRack(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, 0.06, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.38 + i * w * 0.25;
    b.seg(x, 0.05, -d * 0.35, x, h, 0, EDGE_GLOW);
    b.seg(x, h, 0, x, 0.05, d * 0.35, EDGE_GLOW);
  }
}
function stand(b, w, d, h) {
  b.box(-w * 0.4, w * 0.4, 0, 0.06, -d * 0.4, d * 0.4, C.metal, C.metal, EDGE_FURN);
  b.box(-0.035, 0.035, 0, h, -0.035, 0.035, C.metal, C.metal, EDGE_FURN);
  b.seg(0, h * 0.85, 0, w * 0.35, h * 0.85, 0, EDGE_GLOW);
}
function sink(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.72, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.4, w * 0.4, h * 0.72, h * 0.82, -d * 0.38, d * 0.38, C.metal, C.metal, EDGE_GLOW);
  b.seg(0, h * 0.82, -d * 0.2, 0, h, -d * 0.2, EDGE_FURN);
}
function charge(b, w, d, h) {
  b.box(-w * 0.28, w * 0.28, 0, h, -d * 0.3, d * 0.3, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.18, w * 0.18, h * 0.62, h * 0.78, d * 0.31, d * 0.34, C.dark, C.dark, EDGE_GLOW);
  b.seg(w * 0.28, h * 0.7, 0, w * 0.48, h * 0.25, d * 0.25, EDGE_GLOW);
}
export const GARAGE_FURNITURE_MODELS = {
  workbench: ({
    b,
    w,
    d,
    h
  }) => (bench(b, w, d, h, false), 0.5),
  workbench_pegboard: ({
    b,
    w,
    d,
    h
  }) => (bench(b, w, d, h, true), 0.5),
  tool_cabinet: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, false), 0.5),
  tool_chest: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, true), 0.5),
  storage_rack_garage: ({
    b,
    w,
    d,
    h
  }) => (shelves(b, w, d, h, false), 0.5),
  wall_shelf_garage: ({
    b,
    w,
    d,
    h
  }) => (shelves(b, w, d, h, true), false),
  air_compressor: ({
    b,
    w,
    d,
    h
  }) => (cylinderMachine(b, w, d, h, false), 0.5),
  shop_vacuum: ({
    b,
    w,
    d,
    h
  }) => (cylinderMachine(b, w, d, h, true), 0.5),
  ladder_step: ({
    b,
    w,
    d,
    h
  }) => (ladder(b, w, d, h, true), 0.5),
  ladder_extension: ({
    b,
    w,
    d,
    h
  }) => (ladder(b, w, d, h, false), 0.5),
  storage_boxes: ({
    b,
    w,
    d,
    h
  }) => (boxes(b, w, d, h, false), 0.5),
  parts_bin: ({
    b,
    w,
    d,
    h
  }) => (boxes(b, w, d, h, true), 0.5),
  tire_stack: ({
    b,
    w,
    d,
    h
  }) => (tires(b, w, d, h), 0.5),
  bike_rack: ({
    b,
    w,
    d,
    h
  }) => (bikeRack(b, w, d, h), 0.5),
  repair_stand: ({
    b,
    w,
    d,
    h
  }) => (stand(b, w, d, h), 0.5),
  utility_sink_garage: ({
    b,
    w,
    d,
    h
  }) => (sink(b, w, d, h), 0.5),
  charging_bay: ({
    b,
    w,
    d,
    h
  }) => (charge(b, w, d, h), 0.5)
};