/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/fitness.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function treadmill(b, w, d, h) {
  b.pad(-w * 0.46, w * 0.46, 0, h * 0.12, -d / 2, d * 0.36, C.dark, C.body, 0.035, EDGE_FURN);
  b.box(-w * 0.36, w * 0.36, h * 0.12, h * 0.16, -d * 0.45, d * 0.27, C.fabric, C.dark, EDGE_FAINT);
  for (const x of [-w * 0.4, w * 0.4]) {
    b.box(x - 0.035, x + 0.035, h * 0.1, h * 0.88, d * 0.28, d * 0.34, C.metal, C.metal, EDGE_FAINT);
    b.box(x - 0.04, x + 0.04, h * 0.67, h * 0.72, d * 0.03, d * 0.34, C.metal, C.metal, EDGE_FAINT);
  }
  b.box(-w * 0.42, w * 0.42, h * 0.82, h, d * 0.18, d * 0.4, C.body, C.dark, EDGE_FURN);
  b.box(-w * 0.25, w * 0.25, h * 0.87, h * 0.95, d * 0.405, d * 0.42, C.glass, C.accent, EDGE_GLOW);
}
function powerRack(b, w, d, h) {
  for (const x of [-w * 0.45, w * 0.45]) for (const z of [-d * 0.43, d * 0.43]) b.box(x - 0.035, x + 0.035, 0, h, z - 0.035, z + 0.035, C.metal, C.metal, EDGE_FURN);
  for (const z of [-d * 0.43, d * 0.43]) b.box(-w * 0.48, w * 0.48, h * 0.96, h, z - 0.035, z + 0.035, C.metal, C.metal, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, h * 0.62, h * 0.66, -0.025, 0.025, C.metal, C.metal, EDGE_GLOW);
  for (const x of [-w * 0.38, w * 0.38]) for (let i = 0; i < 4; i++) b.lyingCyl("x", x, 0, h * (0.48 - i * 0.055), h * (0.62 + i * 0.055), w * 0.06, w * (0.1 + i * 0.025), C.dark, C.dark, 14, EDGE_FAINT);
  b.pad(-w * 0.25, w * 0.25, h * 0.2, h * 0.28, -d * 0.32, d * 0.34, C.fabric, C.cushion, 0.03, EDGE_FURN);
  for (const x of [-w * 0.2, w * 0.2]) b.box(x - 0.025, x + 0.025, 0, h * 0.2, -d * 0.25, d * 0.27, C.metal, C.metal, EDGE_FAINT);
}
function rower(b, w, d, h) {
  b.box(-w * 0.06, w * 0.06, h * 0.08, h * 0.14, -d * 0.45, d * 0.4, C.metal, C.metal, EDGE_FURN);
  b.pad(-w * 0.32, w * 0.32, h * 0.22, h * 0.32, -d * 0.08, d * 0.12, C.fabric, C.cushion, 0.025, EDGE_GLOW);
  b.box(-w * 0.42, w * 0.42, 0, h * 0.08, -d * 0.48, -d * 0.4, C.metal, C.metal, EDGE_FAINT);
  b.cyl(0, d * 0.37, w * 0.38, h * 0.08, h * 0.58, C.body, C.dark, 16, EDGE_FURN);
  b.box(-w * 0.18, w * 0.18, h * 0.55, h * 0.72, d * 0.31, d * 0.43, C.glass, C.accent, EDGE_GLOW);
}
function cardioBike(b, w, d, h, cross) {
  b.box(-w * 0.42, w * 0.42, 0, h * 0.05, -d * 0.45, d * 0.45, C.metal, C.metal, EDGE_FURN);
  b.cyl(0, 0, w * 0.32, h * 0.12, h * 0.55, C.dark, C.body, 18, EDGE_GLOW);
  b.box(-w * 0.045, w * 0.045, h * 0.12, h * 0.82, -d * 0.04, d * 0.04, C.metal, C.metal, EDGE_FAINT);
  if (cross) {
    for (const x of [-w * 0.34, w * 0.34]) {
      b.seg(x, h * 0.18, d * 0.16, x * 0.55, h * 0.9, -d * 0.22, EDGE_FURN);
      b.box(x - w * 0.14, x + w * 0.14, h * 0.08, h * 0.13, d * 0.12, d * 0.42, C.body, C.bodyTop, EDGE_FAINT);
    }
  } else {
    b.pad(-w * 0.23, w * 0.23, h * 0.72, h * 0.79, d * 0.1, d * 0.36, C.fabric, C.cushion, 0.02, EDGE_FURN);
    b.box(-w * 0.38, w * 0.38, h * 0.84, h * 0.89, -d * 0.38, -d * 0.28, C.metal, C.metal, EDGE_FAINT);
  }
  b.box(-w * 0.2, w * 0.2, h * 0.85, h, -d * 0.27, -d * 0.16, C.glass, C.accent, EDGE_GLOW);
}
function weightRack(b, w, d, h, kettlebells) {
  for (const x of [-w / 2, w / 2]) b.box(x - 0.035, x + 0.035, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  for (const y of [0.08, 0.48, 0.9]) b.box(-w / 2, w / 2, h * y, h * y + 0.04, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
  for (const y of [h * 0.25, h * 0.65]) for (let i = 0; i < 5; i++) {
    const x = -w * 0.38 + i * w * 0.19;
    if (kettlebells) {
      b.cyl(x, 0, w * 0.055, y - h * 0.09, y + h * 0.05, C.dark, C.dark, 10, EDGE_GLOW);
      b.cyl(x, 0, w * 0.035, y + h * 0.04, y + h * 0.12, C.metal, C.metal, 8, EDGE_FAINT);
    } else b.lyingCyl("z", x, 0, y - h * 0.06, y + h * 0.06, d * 0.55, w * 0.11, C.dark, C.metal, 12, EDGE_GLOW);
  }
}
function punchingBag(b, w, d, h) {
  const r = Math.min(w, d);
  b.cyl(0, 0, r * 0.38, 0, h * 0.05, C.metal, C.metal, 16, EDGE_FURN);
  b.box(-0.035, 0.035, h * 0.04, h, -0.035, 0.035, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.38, w * 0.38, h * 0.92, h, -0.035, 0.035, C.metal, C.metal, EDGE_FURN);
  b.cyl(0, 0, r * 0.3, h * 0.18, h * 0.78, C.fabric, C.cushion, 18, EDGE_GLOW);
  b.box(-r * 0.3, r * 0.3, h * 0.43, h * 0.47, -r * 0.3, r * 0.3, C.dark, C.dark, EDGE_FAINT);
}
function yoga(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h * 0.28, -d / 2, d / 2, C.cushion, C.accent, 0.025, EDGE_FURN);
  b.box(w * 0.12, w * 0.38, h * 0.28, h, d * 0.18, d * 0.36, C.fabric, C.cushion, EDGE_GLOW);
  b.cyl(-w * 0.3, -d * 0.33, w * 0.07, h * 0.28, h * 0.75, C.fabric, C.cushion, 12, EDGE_FAINT);
}
function wallFitness(b, w, d, h, kind) {
  if (kind !== "bars") {
    b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.glass, C.glass, EDGE_GLOW);
    if (kind === "mirror") b.seg(0, 0, d / 2 + 0.004, 0, h, d / 2 + 0.004, EDGE_FAINT);else b.box(w * 0.31, w * 0.39, h * 0.48, h * 0.54, d / 2, d / 2 + 0.012, C.accent, C.accent, EDGE_GLOW);
    return;
  }
  for (const x of [-w * 0.46, w * 0.46]) b.box(x - 0.03, x + 0.03, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  for (let i = 0; i < 10; i++) b.box(-w * 0.44, w * 0.44, h * (0.06 + i * 0.095), h * (0.075 + i * 0.095), -d / 2, d / 2, C.wood, C.woodTop, EDGE_FAINT);
}
function exerciseBall(b, w, d, h) {
  const levels = [[0.12, 0.88, 0.34], [0.05, 0.95, 0.22], [0.18, 0.82, 0.12]];
  for (const [y0, y1, inset] of levels) b.cyl(0, 0, Math.min(w, d) * (0.5 - inset), h * y0, h * y1, C.cushion, C.accent, 20, EDGE_GLOW);
}
function bikeTrainer(b, w, d, h) {
  for (const z of [-d * 0.32, d * 0.32]) b.lyingCyl("x", 0, z, h * 0.12, h * 0.72, w * 0.08, h * 0.58, C.dark, C.metal, 18, EDGE_FURN);
  b.seg(0, h * 0.42, -d * 0.32, 0, h * 0.72, d * 0.04, EDGE_GLOW);
  b.seg(0, h * 0.72, d * 0.04, 0, h * 0.42, d * 0.32, EDGE_GLOW);
  b.box(-w * 0.38, w * 0.38, 0, h * 0.06, d * 0.18, d * 0.46, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.22, w * 0.22, 0, h * 0.28, d * 0.2, d * 0.44, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.18, w * 0.18, h * 0.72, h * 0.78, -d * 0.06, d * 0.16, C.fabric, C.cushion, EDGE_FAINT);
  b.box(-w * 0.38, w * 0.38, h * 0.82, h * 0.87, -d * 0.43, -d * 0.32, C.metal, C.metal, EDGE_FAINT);
}
function sauna(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.42, w * 0.12, h * 0.08, h * 0.88, d * 0.49, d * 0.52, C.glass, C.glass, EDGE_GLOW);
  b.box(w * 0.16, w * 0.42, h * 0.12, h * 0.82, d * 0.49, d * 0.52, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.38, w * 0.34, h * 0.34, h * 0.42, -d * 0.34, d * 0.18, C.woodTop, C.woodTop, EDGE_FAINT);
}
function massageChair(b, w, d, h) {
  b.pad(-w * 0.38, w * 0.38, h * 0.18, h * 0.4, -d * 0.05, d * 0.4, C.fabric, C.cushion, 0.05, EDGE_FURN);
  b.pad(-w * 0.39, w * 0.39, h * 0.38, h, d * 0.23, d * 0.48, C.fabric, C.cushion, 0.06, EDGE_GLOW);
  for (const x of [-w * 0.48, w * 0.48]) b.pad(x - w * 0.09, x + w * 0.09, h * 0.25, h * 0.58, -d * 0.08, d * 0.38, C.body, C.bodyTop, 0.035, EDGE_FAINT);
  b.pad(-w * 0.3, w * 0.3, h * 0.08, h * 0.26, -d * 0.48, -d * 0.02, C.fabric, C.cushion, 0.04, EDGE_FURN);
  b.box(w * 0.4, w * 0.52, h * 0.47, h * 0.55, d * 0.05, d * 0.22, C.dark, C.accent, EDGE_GLOW);
}
function waterStation(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.62, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.cyl(0, 0, w * 0.34, h * 0.62, h, C.glass, C.accent, 16, EDGE_GLOW);
  b.box(-w * 0.2, w * 0.2, h * 0.28, h * 0.47, d * 0.49, d * 0.53, C.dark, C.dark, EDGE_FAINT);
  b.box(-w * 0.22, w * 0.22, h * 0.5, h * 0.56, d * 0.49, d * 0.54, C.glass, C.accent, EDGE_GLOW);
}
export const FITNESS_FURNITURE_MODELS = {
  fitness_treadmill: ({
    b,
    w,
    d,
    h
  }) => (treadmill(b, w, d, h), 0.5),
  fitness_power_rack: ({
    b,
    w,
    d,
    h
  }) => (powerRack(b, w, d, h), 0.5),
  fitness_rower: ({
    b,
    w,
    d,
    h
  }) => (rower(b, w, d, h), 0.5),
  fitness_spin_bike: ({
    b,
    w,
    d,
    h
  }) => (cardioBike(b, w, d, h, false), 0.5),
  fitness_dumbbell_rack: ({
    b,
    w,
    d,
    h
  }) => (weightRack(b, w, d, h, false), 0.5),
  fitness_punching_bag: ({
    b,
    w,
    d,
    h
  }) => (punchingBag(b, w, d, h), 0.5),
  fitness_yoga_mat: ({
    b,
    w,
    d,
    h
  }) => (yoga(b, w, d, h), 0.5),
  fitness_cross_trainer: ({
    b,
    w,
    d,
    h
  }) => (cardioBike(b, w, d, h, true), 0.5),
  fitness_mirror_wall: ({
    b,
    w,
    d,
    h
  }) => (wallFitness(b, w, d, h, "mirror"), false),
  fitness_ball: ({
    b,
    w,
    d,
    h
  }) => (exerciseBall(b, w, d, h), 0.5),
  fitness_wall_bars: ({
    b,
    w,
    d,
    h
  }) => (wallFitness(b, w, d, h, "bars"), false),
  fitness_mirror_smart: ({
    b,
    w,
    d,
    h
  }) => (wallFitness(b, w, d, h, "smart"), false),
  fitness_bike_trainer: ({
    b,
    w,
    d,
    h
  }) => (bikeTrainer(b, w, d, h), 0.5),
  fitness_sauna_cabin: ({
    b,
    w,
    d,
    h
  }) => (sauna(b, w, d, h), 0.5),
  fitness_massage_chair: ({
    b,
    w,
    d,
    h
  }) => (massageChair(b, w, d, h), 0.5),
  fitness_kettlebell_set: ({
    b,
    w,
    d,
    h
  }) => (weightRack(b, w, d, h, true), 0.5),
  fitness_water_station: ({
    b,
    w,
    d,
    h
  }) => (waterStation(b, w, d, h), 0.5)
};
export const FITNESS_FURNITURE_SCREENS = {
  fitness_mirror_smart: (w, d, h) => ({
    x0: -w * 0.47,
    x1: w * 0.47,
    y0: h * 0.03,
    y1: h * 0.97,
    z: d * 0.51
  })
};