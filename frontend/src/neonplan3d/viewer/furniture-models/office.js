/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/office.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function desk(b, w, d, h, shape) {
  const top = shape === "stand" ? h * 0.72 : h * 0.92;
  b.box(-w / 2, w / 2, top, h, -d / 2, d * 0.05, C.wood, C.woodTop, EDGE_FURN);
  if (shape !== "stand") {
    const inner = shape === "corner" ? w * 0.15 : -w * 0.08;
    b.box(-w / 2, inner, top, h, d * 0.05, d / 2, C.wood, C.woodTop, EDGE_FAINT);
  }
  for (const x of [-w * 0.44, w * 0.44]) b.box(x - 0.035, x + 0.035, 0, top, -d * 0.38, -d * 0.3, C.metal, C.metal, EDGE_FAINT);
  if (shape === "stand") {
    for (const x of [-w * 0.4, w * 0.4]) b.box(x - 0.06, x + 0.06, 0, top, -d * 0.15, d * 0.15, C.metal, C.metal, EDGE_GLOW);
    b.box(-w * 0.45, w * 0.45, 0, 0.05, -d * 0.32, d * 0.32, C.metal, C.metal, EDGE_FAINT);
  }
}
function chair(b, w, d, h, ergonomic) {
  b.pad(-w * 0.38, w * 0.38, h * 0.38, h * 0.48, -d * 0.32, d * 0.2, C.fabric, C.cushion, 0.03, EDGE_FURN);
  b.pad(-w * 0.4, w * 0.4, h * 0.48, h * (ergonomic ? 0.96 : 0.85), -d * 0.34, -d * 0.22, C.fabric, C.cushion, 0.04, EDGE_GLOW);
  if (ergonomic) {
    b.cyl(0, 0, 0.045, 0.08, h * 0.42, C.metal, C.metal, 10, EDGE_FAINT);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      b.seg(0, 0.08, 0, Math.cos(a) * w * 0.42, 0.03, Math.sin(a) * d * 0.42, EDGE_FAINT);
    }
  } else {
    for (const x of [-w * 0.34, w * 0.34]) for (const z of [-d * 0.25, d * 0.16]) b.box(x - 0.025, x + 0.025, 0, h * 0.4, z - 0.025, z + 0.025, C.metal, C.metal, EDGE_FAINT);
  }
}
function cabinet(b, w, d, h, drawers) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.metal, EDGE_FURN);
  for (let i = 1; i < drawers; i++) b.seg(-w * 0.44, h * i / drawers, d / 2 + 0.003, w * 0.44, h * i / drawers, d / 2 + 0.003, EDGE_FAINT);
}
function bookcase(b, w, d, h) {
  for (const y of [0, 0.25, 0.5, 0.75, 1]) b.box(-w / 2, w / 2, h * y, h * y + 0.035, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w / 2, w / 2]) b.box(x - 0.025, x + 0.025, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FAINT);
}
function monitors(b, w, d, h, count) {
  const each = w / count;
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + each * (i + 0.5);
    b.box(x - each * 0.44, x + each * 0.44, h * 0.25, h, -d * 0.08, d * 0.08, C.dark, C.dark, EDGE_GLOW);
  }
  b.box(-0.025, 0.025, 0, h * 0.28, -0.025, 0.025, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.18, w * 0.18, 0, 0.025, -d * 0.4, d * 0.4, C.metal, C.metal, EDGE_FAINT);
}
function pc(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.metal, EDGE_FURN);
  b.box(-w * 0.36, w * 0.36, h * 0.12, h * 0.86, d / 2, d / 2 + 0.01, C.glass, C.dark, EDGE_GLOW);
  for (let i = 0; i < 3; i++) b.cyl(0, d / 2 + 0.015, w * 0.12, h * (0.2 + i * 0.25), h * (0.32 + i * 0.25), C.accent, C.accent, 10, EDGE_GLOW);
}
function gamingChair(b, w, d, h) {
  chair(b, w, d, h, true);
  b.pad(-w * 0.3, w * 0.3, h * 0.82, h, -d * 0.36, -d * 0.2, C.dark, C.accent, 0.025, EDGE_GLOW);
  for (const x of [-w * 0.47, w * 0.47]) b.box(x - 0.025, x + 0.025, h * 0.4, h * 0.62, -d * 0.16, d * 0.2, C.metal, C.metal, EDGE_FAINT);
}
function simRig(b, w, d, h) {
  for (const x of [-w * 0.43, w * 0.43]) b.box(x - 0.035, x + 0.035, 0, 0.06, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  b.pad(-w * 0.3, w * 0.3, h * 0.22, h * 0.34, d * 0.18, d * 0.48, C.fabric, C.cushion, 0.03, EDGE_FURN);
  b.pad(-w * 0.3, w * 0.3, h * 0.33, h * 0.82, d * 0.36, d * 0.48, C.fabric, C.cushion, 0.03, EDGE_GLOW);
  b.box(-w * 0.04, w * 0.04, h * 0.08, h * 0.72, -d * 0.12, -d * 0.04, C.metal, C.metal, EDGE_FAINT);
  b.cyl(0, -d * 0.02, w * 0.15, h * 0.66, h * 0.73, C.dark, C.dark, 12, EDGE_GLOW);
  const screenW = w * 0.31;
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * screenW;
    b.box(x - screenW * 0.47, x + screenW * 0.47, h * 0.72, h, -d * 0.43, -d * 0.39, C.dark, C.dark, EDGE_GLOW);
  }
}
function serverRack(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.metal, EDGE_FURN);
  b.box(-w * 0.4, w * 0.4, h * 0.04, h * 0.96, d / 2, d / 2 + 0.012, C.glass, C.dark, EDGE_GLOW);
  for (let i = 1; i < 9; i++) b.seg(-w * 0.36, h * i / 9, d / 2 + 0.015, w * 0.36, h * i / 9, d / 2 + 0.015, EDGE_FAINT);
  for (let i = 0; i < 5; i++) b.box(w * 0.26, w * 0.34, h * (0.12 + i * 0.16), h * (0.14 + i * 0.16), d / 2 + 0.014, d / 2 + 0.02, C.accent, C.accent, EDGE_GLOW);
}
function printer3d(b, w, d, h, enclosed) {
  b.box(-w / 2, w / 2, 0, h * 0.12, -d / 2, d / 2, C.dark, C.metal, EDGE_FURN);
  if (enclosed) b.box(-w * 0.48, w * 0.48, h * 0.12, h, -d * 0.48, d * 0.48, C.glass, C.dark, EDGE_FAINT);
  for (const x of [-w * 0.44, w * 0.44]) b.box(x - 0.02, x + 0.02, h * 0.1, h, -d * 0.42, -d * 0.35, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.45, w * 0.45, h * 0.88, h, -d * 0.44, -d * 0.33, C.metal, C.metal, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, h * 0.17, h * 0.2, -d * 0.28, d * 0.3, C.metal, C.metal, EDGE_FAINT);
  b.cyl(0, 0, w * 0.12, h * 0.2, h * 0.38, C.accent, C.accent, 10, EDGE_GLOW);
  b.box(-w * 0.08, w * 0.08, h * 0.66, h * 0.76, -d * 0.1, d * 0.08, C.body, C.metal, EDGE_GLOW);
}
function whiteboard(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, 0, h * 0.045, d / 2, d / 2 + 0.08, C.metal, C.metal, EDGE_FAINT);
  b.seg(-w * 0.3, h * 0.63, d / 2 + 0.006, -w * 0.02, h * 0.52, d / 2 + 0.006, EDGE_GLOW);
  b.seg(w * 0.02, h * 0.39, d / 2 + 0.006, w * 0.34, h * 0.48, d / 2 + 0.006, EDGE_FURN);
}
function arcade(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.48, -d / 2, d / 2, C.dark, C.body, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.45, h, -d * 0.42, d * 0.28, C.body, C.dark, EDGE_FURN);
  b.box(-w * 0.4, w * 0.4, h * 0.57, h * 0.79, d * 0.285, d * 0.3, C.glass, C.dark, EDGE_GLOW);
  b.box(-w * 0.42, w * 0.42, h * 0.43, h * 0.54, d * 0.16, d / 2, C.metal, C.metal, EDGE_FAINT);
  b.cyl(-w * 0.18, d * 0.43, w * 0.035, h * 0.54, h * 0.64, C.accent, C.accent, 8, EDGE_GLOW);
  for (const x of [0, w * 0.16]) b.cyl(x, d * 0.44, w * 0.035, h * 0.535, h * 0.555, C.accent, C.accent, 8, EDGE_GLOW);
}
function laserPrinter(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.72, -d / 2, d / 2, C.body, C.metal, EDGE_FURN);
  b.box(-w * 0.42, w * 0.42, h * 0.72, h, -d * 0.35, d * 0.3, C.dark, C.bodyTop, EDGE_FAINT);
  b.box(-w * 0.34, w * 0.34, h * 0.18, h * 0.28, d / 2, d / 2 + 0.015, C.white, C.whiteTop, EDGE_GLOW);
  b.box(w * 0.28, w * 0.39, h * 0.76, h * 0.82, d * 0.31, d * 0.36, C.accent, C.accent, EDGE_GLOW);
}
function phoneBooth(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.04, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.96, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  for (const x of [-w / 2, w / 2]) b.box(x - 0.035, x + 0.035, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.46, -w * 0.42, h * 0.04, h * 0.96, -d * 0.46, d * 0.46, C.glass, C.glass, EDGE_GLOW);
  b.box(w * 0.42, w * 0.46, h * 0.04, h * 0.96, -d * 0.46, d * 0.46, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.4, w * 0.4, h * 0.48, h * 0.53, -d * 0.43, -d * 0.12, C.wood, C.woodTop, EDGE_FAINT);
}
function filamentShelf(b, w, d, h) {
  for (const y of [0, 0.48, 0.96]) b.box(-w / 2, w / 2, h * y, h * y + 0.035, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  for (const x of [-w / 2, w / 2]) b.box(x - 0.025, x + 0.025, 0, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
  for (const y of [h * 0.25, h * 0.73]) for (let i = 0; i < 4; i++) {
    const x = -w * 0.36 + i * w * 0.24;
    b.lyingCyl("z", x, 0, y - h * 0.13, y + h * 0.13, d * 0.65, w * 0.16, i % 2 ? C.accent : C.cushion, C.dark, 10, EDGE_GLOW);
  }
}
export const OFFICE_FURNITURE_MODELS = {
  desk_l: ({
    b,
    w,
    d,
    h
  }) => (desk(b, w, d, h, "l"), 0.5),
  desk_corner: ({
    b,
    w,
    d,
    h
  }) => (desk(b, w, d, h, "corner"), 0.5),
  desk_sit_stand: ({
    b,
    w,
    d,
    h
  }) => (desk(b, w, d, h, "stand"), 0.5),
  chair_ergonomic: ({
    b,
    w,
    d,
    h
  }) => (chair(b, w, d, h, true), 0.5),
  chair_visitor: ({
    b,
    w,
    d,
    h
  }) => (chair(b, w, d, h, false), 0.5),
  filing_cabinet: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, 4), 0.5),
  drawer_unit_office: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, 3), 0.5),
  bookcase_office: ({
    b,
    w,
    d,
    h
  }) => (bookcase(b, w, d, h), 0.5),
  monitor_single: ({
    b,
    w,
    d,
    h
  }) => (monitors(b, w, d, h, 1), false),
  monitor_dual: ({
    b,
    w,
    d,
    h
  }) => (monitors(b, w, d, h, 2), false),
  pc_tower: ({
    b,
    w,
    d,
    h
  }) => (pc(b, w, d, h), 0.5),
  gaming_chair: ({
    b,
    w,
    d,
    h
  }) => (gamingChair(b, w, d, h), 0.5),
  sim_racing_cockpit: ({
    b,
    w,
    d,
    h
  }) => (simRig(b, w, d, h), 0.5),
  server_rack_42u: ({
    b,
    w,
    d,
    h
  }) => (serverRack(b, w, d, h), 0.5),
  printer_3d_open: ({
    b,
    w,
    d,
    h
  }) => (printer3d(b, w, d, h, false), false),
  whiteboard_office: ({
    b,
    w,
    d,
    h
  }) => (whiteboard(b, w, d, h), false),
  monitor_triple: ({
    b,
    w,
    d,
    h
  }) => (monitors(b, w, d, h, 3), false),
  arcade_cabinet: ({
    b,
    w,
    d,
    h
  }) => (arcade(b, w, d, h), 0.5),
  laser_printer: ({
    b,
    w,
    d,
    h
  }) => (laserPrinter(b, w, d, h), false),
  phone_booth_office: ({
    b,
    w,
    d,
    h
  }) => (phoneBooth(b, w, d, h), 0.5),
  printer_3d_enclosed: ({
    b,
    w,
    d,
    h
  }) => (printer3d(b, w, d, h, true), false),
  filament_shelf_wall: ({
    b,
    w,
    d,
    h
  }) => (filamentShelf(b, w, d, h), false)
};
const monitorScreen = (w, d, h) => ({
  x0: -w * 0.44,
  x1: w * 0.44,
  y0: h * 0.3,
  y1: h * 0.94,
  z: d * 0.081
});
export const OFFICE_FURNITURE_SCREENS = {
  monitor_single: monitorScreen,
  monitor_dual: monitorScreen,
  monitor_triple: monitorScreen,
  arcade_cabinet: (w, d, h) => ({
    x0: -w * 0.36,
    x1: w * 0.36,
    y0: h * 0.59,
    y1: h * 0.77,
    z: d * 0.301
  })
};