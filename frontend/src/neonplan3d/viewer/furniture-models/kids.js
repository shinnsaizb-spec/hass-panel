/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/kids.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function tipi(b, w, d, h) {
  b.loft([-w / 2, w / 2, -d / 2, d / 2], [-w * 0.08, w * 0.08, -d * 0.08, d * 0.08], 0, h * 0.9, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.14, w * 0.14, 0, h * 0.58, d * 0.49, d * 0.51, C.dark, C.dark, EDGE_GLOW);
  for (const x of [-w * 0.08, w * 0.08]) b.seg(x, h * 0.86, 0, x * 2.2, h, 0, EDGE_FAINT);
}
function playKitchen(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.58, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.58, h, -d / 2, -d * 0.42, C.body, C.metal, EDGE_FAINT);
  b.cyl(-w * 0.22, d * 0.1, w * 0.09, h * 0.59, h * 0.61, C.dark, C.dark, 10, EDGE_GLOW);
  b.cyl(w * 0.2, d * 0.1, w * 0.08, h * 0.59, h * 0.61, C.dark, C.dark, 10, EDGE_GLOW);
  b.seg(0, 0, d / 2 + 0.004, 0, h * 0.55, d / 2 + 0.004, EDGE_FAINT);
}
function kidsDesk(b, w, d, h) {
  b.box(-w / 2, w / 2, h * 0.68, h * 0.76, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.42, w * 0.42]) b.box(x - 0.025, x + 0.025, 0, h * 0.68, -d * 0.4, d * 0.38, C.metal, C.metal, EDGE_FAINT);
  b.box(-w / 2, w / 2, h * 0.76, h, -d / 2, -d * 0.44, C.accent, C.accent, EDGE_GLOW);
  b.box(-w * 0.36, -w * 0.16, h * 0.61, h * 0.68, d * 0.1, d * 0.45, C.body, C.bodyTop, EDGE_FAINT);
}
function toyShelf(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d * 0.36, C.body, C.bodyTop, EDGE_FURN);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const x0 = -w * 0.44 + col * w * 0.3;
    const y0 = h * (0.08 + row * 0.43);
    b.box(x0, x0 + w * 0.26, y0, y0 + h * 0.35, -d * 0.32, d * 0.46, (row + col) % 2 ? C.accent : C.cushion, C.bodyTop, EDGE_GLOW);
  }
}
function cushionCorner(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h * 0.18, -d / 2, d / 2, C.fabric, C.cushion, 0.04, EDGE_FURN);
  b.pad(-w / 2, w / 2, h * 0.18, h * 0.55, -d / 2, -d * 0.32, C.fabric, C.cushion, 0.04, EDGE_FAINT);
  b.pad(-w / 2, -w * 0.32, h * 0.18, h * 0.55, -d / 2, d / 2, C.fabric, C.cushion, 0.04, EDGE_FAINT);
  for (const [x, z] of [[-0.18, -0.15], [0.12, -0.12], [-0.12, 0.14]]) b.cyl(x * w, z * d, w * 0.08, h * 0.18, h * 0.48, C.accent, C.accent, 8, EDGE_GLOW);
}
function rockingHorse(b, w, d, h) {
  for (const z of [-d * 0.38, d * 0.38]) {
    b.seg(-w * 0.42, h * 0.05, z, 0, 0, z, EDGE_FURN);
    b.seg(0, 0, z, w * 0.42, h * 0.05, z, EDGE_FURN);
  }
  b.box(-w * 0.3, w * 0.25, h * 0.32, h * 0.55, -d * 0.3, d * 0.3, C.white, C.whiteTop, EDGE_FURN);
  b.box(w * 0.16, w * 0.36, h * 0.5, h * 0.82, -d * 0.24, d * 0.24, C.white, C.whiteTop, EDGE_GLOW);
  b.box(-w * 0.08, w * 0.12, h * 0.55, h * 0.62, -d * 0.34, d * 0.34, C.wood, C.woodTop, EDGE_FAINT);
}
function playRug(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.75, -d / 2, d / 2, C.plant, C.plantTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.75, h, -d * 0.12, d * 0.12, C.dark, C.dark, EDGE_FAINT);
  b.box(-w * 0.12, w * 0.12, h * 0.75, h, -d / 2, d / 2, C.dark, C.dark, EDGE_FAINT);
}
function kidsTable(b, w, d, h) {
  b.box(-w * 0.25, w * 0.25, h * 0.52, h * 0.62, -d * 0.32, d * 0.32, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.2, w * 0.2]) for (const z of [-d * 0.25, d * 0.25]) b.box(x - 0.02, x + 0.02, 0, h * 0.52, z - 0.02, z + 0.02, C.metal, C.metal, EDGE_FAINT);
  for (const x of [-w * 0.4, w * 0.4]) {
    b.pad(x - w * 0.11, x + w * 0.11, h * 0.28, h * 0.36, -d * 0.18, d * 0.18, C.cushion, C.accent, 0.02, EDGE_GLOW);
    b.box(x - w * 0.1, x + w * 0.1, h * 0.36, h * 0.72, -d * 0.2, -d * 0.14, C.cushion, C.accent, EDGE_FAINT);
  }
}
function ballPit(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.48, 0, h * 0.62, C.body, C.bodyTop, 18, EDGE_FURN);
  const balls = [[-0.24, -0.12], [-0.08, 0.13], [0.12, -0.18], [0.25, 0.1], [0, -0.02], [-0.2, 0.22], [0.2, 0.25]];
  balls.forEach(([x, z], i) => b.cyl(x * w, z * d, w * 0.065, h * 0.62, h * (0.82 + i % 2 * 0.08), i % 2 ? C.accent : C.cushion, C.bodyTop, 8, EDGE_GLOW));
}
function houseBed(b, w, d, h) {
  b.pad(-w * 0.46, w * 0.46, h * 0.08, h * 0.24, -d * 0.46, d * 0.46, C.white, C.whiteTop, 0.04, EDGE_FURN);
  for (const x of [-w * 0.46, w * 0.46]) for (const z of [-d * 0.46, d * 0.46]) b.box(x - 0.025, x + 0.025, 0, h * 0.72, z - 0.025, z + 0.025, C.wood, C.woodTop, EDGE_FAINT);
  for (const z of [-d * 0.46, d * 0.46]) {
    b.seg(-w * 0.46, h * 0.72, z, 0, h, z, EDGE_FURN);
    b.seg(0, h, z, w * 0.46, h * 0.72, z, EDGE_FURN);
  }
  b.seg(0, h, -d * 0.46, 0, h, d * 0.46, EDGE_FURN);
}
function babyMonitor(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.48, 0, h, C.body, C.bodyTop, 12, EDGE_FURN);
  b.box(-w * 0.3, w * 0.3, h * 0.38, h * 0.66, d * 0.46, d * 0.52, C.dark, C.dark, EDGE_GLOW);
  b.box(-w * 0.18, w * 0.18, h * 0.12, h * 0.18, d * 0.48, d * 0.53, C.accent, C.accent, EDGE_GLOW);
}
function cabinet(b, w, d, h, kind) {
  if (kind === "boxes") {
    for (let i = 0; i < 3; i++) b.box(-w / 2 + w * i / 3 + 0.015, -w / 2 + w * (i + 1) / 3 - 0.015, 0, h, -d / 2, d / 2, i === 1 ? C.accent : C.cushion, C.bodyTop, EDGE_FURN);
    return;
  }
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  if (kind === "change") {
    b.pad(-w * 0.46, w * 0.46, h * 0.92, h, -d * 0.46, d * 0.46, C.white, C.whiteTop, 0.025, EDGE_GLOW);
    for (let i = 1; i < 4; i++) b.seg(-w * 0.43, h * i / 4, d / 2 + 0.004, w * 0.43, h * i / 4, d / 2 + 0.004, EDGE_FAINT);
  } else {
    b.seg(0, h * 0.04, d / 2 + 0.004, 0, h * 0.96, d / 2 + 0.004, EDGE_FAINT);
    for (const x of [-w * 0.06, w * 0.06]) b.box(x - 0.012, x + 0.012, h * 0.45, h * 0.62, d / 2 + 0.004, d / 2 + 0.018, C.accent, C.accent, EDGE_GLOW);
  }
}
export const KIDS_FURNITURE_MODELS = {
  tipi_kids: ({
    b,
    w,
    d,
    h
  }) => (tipi(b, w, d, h), 0.5),
  play_kitchen_kids: ({
    b,
    w,
    d,
    h
  }) => (playKitchen(b, w, d, h), 0.5),
  desk_kids: ({
    b,
    w,
    d,
    h
  }) => (kidsDesk(b, w, d, h), 0.5),
  toy_shelf_boxes: ({
    b,
    w,
    d,
    h
  }) => (toyShelf(b, w, d, h), 0.5),
  cushion_corner_kids: ({
    b,
    w,
    d,
    h
  }) => (cushionCorner(b, w, d, h), 0.5),
  rocking_horse: ({
    b,
    w,
    d,
    h
  }) => (rockingHorse(b, w, d, h), 0.5),
  play_rug_road: ({
    b,
    w,
    d,
    h
  }) => (playRug(b, w, d, h), 0.25),
  table_chairs_kids: ({
    b,
    w,
    d,
    h
  }) => (kidsTable(b, w, d, h), 0.5),
  ball_pit: ({
    b,
    w,
    d,
    h
  }) => (ballPit(b, w, d, h), 0.5),
  bed_house: ({
    b,
    w,
    d,
    h
  }) => (houseBed(b, w, d, h), 0.5),
  baby_monitor: ({
    b,
    w,
    d,
    h
  }) => (babyMonitor(b, w, d, h), 0.5),
  changing_dresser: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, "change"), 0.5),
  wardrobe_kids: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, "wardrobe"), 0.5),
  toy_boxes_3: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, "boxes"), 0.5)
};
export const KIDS_FURNITURE_SCREENS = {
  baby_monitor: (w, d, h) => ({
    x0: -w * 0.28,
    x1: w * 0.28,
    y0: h * 0.4,
    y1: h * 0.64,
    z: d * 0.521
  })
};