/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/bathroom.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Bathroom fixtures live in their own family so new sanitary variants do not grow the kitchen
// renderer. Fixed-size products share a few parameterized builders and keep their own stable IDs.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
import { cabinet } from "./common.js";
function vanity(b, w, d, h, bowls) {
  cabinet(b, w, d - 0.02, h - 0.12, Math.max(1, Math.round(w / 0.48)), h - 0.3);
  b.box(-w / 2, w / 2, h - 0.12, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  for (let i = 0; i < bowls; i++) {
    const x = -w / 2 + w * (i + 0.5) / bowls;
    const bw = Math.min(w / bowls * 0.34, 0.24);
    b.cyl(x, 0.03, bw, h - 0.006, h + 0.004, C.glass, C.glass, 18, EDGE_GLOW);
    b.cyl(x, -d * 0.3, 0.018, h, h + 0.2, C.metal, C.metal, 8);
    b.box(x - 0.015, x + 0.015, h + 0.16, h + 0.2, -d * 0.3, -d * 0.08, C.metal, C.metal);
  }
}
function pedestalBasin(b, w, d, h) {
  b.loft([-w * 0.18, w * 0.18, -d * 0.2, d * 0.18], [-w * 0.28, w * 0.28, -d * 0.36, d * 0.36], 0, h * 0.78, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.76, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.cyl(0, 0.04, Math.min(w, d) * 0.3, h - 0.006, h + 0.004, C.glass, C.glass, 18, EDGE_GLOW);
  b.cyl(0, -d * 0.3, 0.018, h, h + 0.2, C.metal, C.metal, 8);
}
function rectangularTub(b, w, d, h, freestanding) {
  const rim = freestanding ? 0.09 : 0.07;
  b.box(-w / 2, w / 2, 0, h - 0.02, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - 0.02, h, -d / 2, -d / 2 + rim, C.whiteTop);
  b.box(-w / 2, w / 2, h - 0.02, h, d / 2 - rim, d / 2, C.whiteTop);
  b.box(-w / 2, -w / 2 + rim, h - 0.02, h, -d / 2 + rim, d / 2 - rim, C.whiteTop);
  b.box(w / 2 - rim, w / 2, h - 0.02, h, -d / 2 + rim, d / 2 - rim, C.whiteTop);
  b.box(-w / 2 + rim, w / 2 - rim, h - 0.03, h - 0.02, -d / 2 + rim, d / 2 - rim, C.glass, C.glass, EDGE_GLOW);
  b.cyl(-w / 2 + rim * 0.7, 0, 0.02, h, h + 0.12, C.metal, C.metal, 8);
}
function cornerTub(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.cyl(w * 0.08, d * 0.08, Math.min(w, d) * 0.38, h - 0.018, h + 0.003, C.glass, C.glass, 24, EDGE_GLOW);
  b.box(-w * 0.42, w * 0.42, h - 0.02, h + 0.004, -d / 2, -d * 0.34, C.whiteTop, C.whiteTop);
  b.box(-w / 2, -w * 0.34, h - 0.02, h + 0.004, -d * 0.42, d * 0.42, C.whiteTop, C.whiteTop);
}
function shower(b, w, d, h, style) {
  b.box(-w / 2, w / 2, 0, 0.045, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
  b.cyl(0, 0, 0.04, 0.045, 0.05, C.metal, C.metal, 10);
  const panels = style === "corner" ? [[-w / 2, d / 2, w / 2, d / 2], [w / 2, -d / 2, w / 2, d / 2]] : style === "niche" ? [[-w / 2, d / 2, w / 2, d / 2]] : [[-w * 0.05, d / 2, w / 2, d / 2], [w * 0.12, -d / 2, w * 0.12, d / 2]];
  for (const [x0, z0, x1, z1] of panels) {
    b.seg(x0, 0.05, z0, x1, 0.05, z1, EDGE_GLOW);
    b.seg(x0, h, z0, x1, h, z1, EDGE_GLOW);
    b.seg(x0, 0.05, z0, x0, h, z0, EDGE_FAINT);
    b.seg(x1, 0.05, z1, x1, h, z1, EDGE_GLOW);
  }
  b.cyl(-w / 2 + 0.07, -d / 2 + 0.07, 0.015, 0.05, h - 0.08, C.metal, C.metal, 7);
  b.cyl(-w / 2 + 0.2, -d / 2 + 0.2, 0.1, h - 0.1, h - 0.07, C.metal, C.metal, 14, EDGE_GLOW);
}
function showerScreen(b, w, d, h) {
  const t = Math.min(0.025, Math.max(0.01, d * 0.35));
  b.box(-w / 2, w / 2, 0, 0.025, -t, t, C.metal, C.metal, EDGE_GLOW);
  for (const x of [-w / 2, 0, w / 2]) b.box(x - t, x + t, 0, h, -t, t, C.metal, C.metal, EDGE_GLOW);
  b.seg(-w / 2, h, 0, w / 2, h, 0, EDGE_GLOW);
  b.seg(w * 0.32, h * 0.42, t + 0.003, w * 0.32, h * 0.62, t + 0.003, EDGE_FURN);
}
function toilet(b, w, d, h) {
  const tankD = Math.min(0.18, d * 0.3);
  b.box(-w / 2, w / 2, 0.45, h, -d / 2, -d / 2 + tankD, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.3, w * 0.3, 0, 0.36, -d / 2 + tankD - 0.02, d / 2 - 0.12, C.white, C.whiteTop);
  b.cyl(0, d / 2 - 0.26, Math.min(w / 2, 0.19), 0.36, 0.41, C.white, C.whiteTop, 12, EDGE_FURN);
}
function wallToilet(b, w, d, h, bidet = false) {
  const y0 = bidet ? 0 : 0.18;
  b.loft([-w * 0.34, w * 0.34, -d / 2, d * 0.22], [-w / 2, w / 2, -d / 2, d / 2], y0, h * 0.82, C.white, C.whiteTop, EDGE_FURN);
  b.cyl(0, d * 0.08, w * 0.36, h * 0.8, h, C.white, C.whiteTop, 18, EDGE_FURN);
  if (bidet) {
    b.cyl(0, -d * 0.26, 0.016, h, h + 0.17, C.metal, C.metal, 8);
    b.box(-0.012, 0.012, h + 0.13, h + 0.17, -d * 0.26, -d * 0.04, C.metal, C.metal);
  }
}
function bathroomCabinet(b, w, d, h) {
  b.box(-w / 2, w / 2, 0.06, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.004;
  const rows = h > 1.5 ? 4 : 3;
  for (let i = 1; i < rows; i++) b.seg(-w / 2 + 0.02, h * i / rows, front, w / 2 - 0.02, h * i / rows, front, EDGE_FAINT);
  b.seg(0, 0.08, front, 0, h - 0.04, front, EDGE_FAINT);
  b.seg(-w * 0.08, h * 0.5, front + 0.004, w * 0.08, h * 0.5, front + 0.004, EDGE_GLOW);
}
function litMirror(b, w, d, h, round) {
  const y0 = 1.12;
  if (round) b.lyingCyl("z", 0, 0, y0, y0 + h, d, Math.min(w, h), C.glass, C.glass, 28, EDGE_GLOW);else b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.glass, C.glass, EDGE_GLOW);
}
function wallShelf(b, w, d, h) {
  const y0 = 1.15;
  for (const y of [y0, y0 + h * 0.48, y0 + h]) b.box(-w / 2, w / 2, y - 0.018, y + 0.018, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w / 2, w / 2]) b.box(x - 0.018, x + 0.018, y0, y0 + h, -d / 2, -d / 2 + 0.04, C.metal, C.metal, EDGE_FAINT);
}
function towelRail(b, w, d, h) {
  const y0 = 0.85;
  for (const x of [-w * 0.46, w * 0.46]) b.box(x - 0.018, x + 0.018, y0, y0 + h, -d * 0.1, d * 0.1, C.metal, C.metal, EDGE_FURN);
  for (let i = 0; i < 5; i++) {
    const y = y0 + h * i / 4;
    b.box(-w * 0.46, w * 0.46, y - 0.012, y + 0.012, -d * 0.1, d * 0.1, C.metal, C.metal, EDGE_GLOW);
  }
  b.pad(-w * 0.32, w * 0.32, y0 + h * 0.23, y0 + h * 0.66, 0, d / 2, C.fabric, C.cushion, 0.018, EDGE_FAINT);
}
function sauna(b, w, d, h) {
  const t = 0.06;
  b.box(-w / 2, -w / 2 + t, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(w / 2 - t, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d / 2 + t, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - t, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.42, w * 0.42, h * 0.18, h * 0.38, -d * 0.32, d * 0.3, C.wood, C.woodTop, EDGE_FAINT);
  b.box(-w * 0.18, w * 0.18, 0, h * 0.2, d * 0.12, d * 0.42, C.dark, C.metal, EDGE_GLOW);
}
function towelHeater(b, w, d, h, electric) {
  const y0 = 0.55;
  for (const x of [-w * 0.46, w * 0.46]) b.box(x - 0.018, x + 0.018, y0, y0 + h, -d * 0.1, d * 0.1, C.metal, C.metal, EDGE_FURN);
  for (let i = 0; i < 8; i++) {
    const y = y0 + h * i / 7;
    b.box(-w * 0.46, w * 0.46, y - 0.012, y + 0.012, -d * 0.1, d * 0.1, electric ? C.accent : C.metal, C.metal, electric ? EDGE_GLOW : EDGE_FAINT);
  }
}
function whirlpool(b, w, d, h) {
  rectangularTub(b, w, d, h, true);
  for (const x of [-w * 0.28, 0, w * 0.28]) for (const z of [-d * 0.25, d * 0.25]) b.cyl(x, z, 0.025, h - 0.012, h + 0.006, C.accent, C.accent, 8, EDGE_GLOW);
}
function applianceCabinet(b, w, d, h, withBasket) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.006;
  b.cyl(0, front, w * 0.31, 0.12, Math.min(h * 0.38, 0.68), C.dark, C.glass, 20, EDGE_GLOW);
  b.seg(-w * 0.42, h * 0.5, front, w * 0.42, h * 0.5, front, EDGE_FAINT);
  if (withBasket) b.box(-w * 0.38, w * 0.38, h * 0.56, h * 0.86, -d * 0.34, d * 0.38, C.fabric, C.fabricTop, EDGE_FURN);
}
function laundryBasket(b, w, d, h) {
  b.loft([-w * 0.42, w * 0.42, -d * 0.42, d * 0.42], [-w / 2, w / 2, -d / 2, d / 2], 0, h, C.fabric, C.fabricTop, EDGE_FURN);
  for (const x of [-w * 0.28, 0, w * 0.28]) b.seg(x, h * 0.12, d / 2 + 0.002, x, h * 0.88, d / 2 + 0.002, EDGE_FAINT);
}
function ladderShelf(b, w, d, h) {
  for (const x of [-w * 0.45, w * 0.45]) b.box(x - 0.025, x + 0.025, 0, h, -d * 0.18, d * 0.18, C.wood, C.wood, EDGE_FURN);
  for (let i = 1; i < 5; i++) {
    const y = h * i / 5;
    b.box(-w * 0.45, w * 0.45, y - 0.018, y + 0.018, -d * 0.18, d * 0.18, C.wood, C.wood, EDGE_FAINT);
  }
  b.pad(-w * 0.32, w * 0.32, h * 0.52, h * 0.76, 0, d / 2, C.fabric, C.cushion, 0.015, EDGE_GLOW);
}
function mirrorCabinet(b, w, d, h) {
  const y0 = 1.05;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.46, w * 0.46, y0 + h * 0.06, y0 + h * 0.94, d / 2, d / 2 + 0.012, C.glass, C.glass, EDGE_GLOW);
  b.seg(0, y0 + h * 0.08, d / 2 + 0.014, 0, y0 + h * 0.92, d / 2 + 0.014, EDGE_FAINT);
}
function bathroomFan(b, w, d, h) {
  const y0 = 1.75;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.lyingCyl("z", 0, d * 0.51, y0 + h * 0.12, y0 + h * 0.88, d * 0.08, h * 0.76, C.dark, C.metal, 16, EDGE_GLOW);
}
function washerVanity(b, w, d, h) {
  const washerW = Math.min(0.62, w * 0.5);
  b.box(-w / 2, -w / 2 + washerW, 0, h - 0.05, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.lyingCyl("z", -w / 2 + washerW / 2, d / 2 + 0.006, h * 0.18, h * 0.72, 0.03, washerW * 0.54, C.dark, C.glass, 18, EDGE_GLOW);
  vanity(b, w - washerW, d, h, 1);
  b.box(-w / 2, w / 2, h - 0.05, h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
}
function rainShower(b, w, d, h) {
  b.cyl(0, -d * 0.35, 0.018, 0.1, h, C.metal, C.metal, 8, EDGE_FURN);
  b.box(-w * 0.38, w * 0.38, h - 0.035, h, -d * 0.35, d * 0.25, C.metal, C.metal, EDGE_GLOW);
  b.box(-w * 0.32, w * 0.32, h - 0.041, h - 0.035, -d * 0.29, d * 0.19, C.accent, C.accent, EDGE_GLOW);
}
const roundMirrorScreen = (w, d, h) => ({
  x0: -w * 0.46,
  x1: w * 0.46,
  y0: 1.12 + h * 0.04,
  y1: 1.12 + h * 0.96,
  z: d / 2 + 0.004
});
const rectangularMirrorScreen = (w, d, h) => ({
  x0: -w * 0.47,
  x1: w * 0.47,
  y0: 1.12 + h * 0.03,
  y1: 1.12 + h * 0.97,
  z: d / 2 + 0.004
});
const mirrorCabinetScreen = (w, d, h) => ({
  x0: -w * 0.44,
  x1: w * 0.44,
  y0: 1.05 + h * 0.08,
  y1: 1.05 + h * 0.92,
  z: d / 2 + 0.016
});
const heaterScreen = (w, d, h) => ({
  x0: -w * 0.44,
  x1: w * 0.44,
  y0: 0.55 + h * 0.08,
  y1: 0.55 + h * 0.92,
  z: d / 2 + 0.004
});
const fanScreen = (w, d, h) => ({
  x0: -w * 0.36,
  x1: w * 0.36,
  y0: 1.75 + h * 0.14,
  y1: 1.75 + h * 0.86,
  z: d / 2 + 0.008
});
const showerLightScreen = (w, d, h) => ({
  x0: -w * 0.3,
  x1: w * 0.3,
  y0: h - 0.045,
  y1: h - 0.032,
  z: d * 0.18
});
export const BATHROOM_FURNITURE_MODELS = {
  bathtub: ({
    b,
    w,
    d,
    h
  }) => (rectangularTub(b, w, d, h, true), 0.5),
  bathtub_builtin: ({
    b,
    w,
    d,
    h
  }) => (rectangularTub(b, w, d, h, false), 0.5),
  bathtub_corner: ({
    b,
    w,
    d,
    h
  }) => (cornerTub(b, w, d, h), 0.5),
  shower: ({
    b,
    w,
    d,
    h
  }) => (shower(b, w, d, h, "corner"), 0.5),
  shower_corner_90: ({
    b,
    w,
    d,
    h
  }) => (shower(b, w, d, h, "corner"), 0.5),
  shower_niche_120: ({
    b,
    w,
    d,
    h
  }) => (shower(b, w, d, h, "niche"), 0.5),
  shower_walkin_140: ({
    b,
    w,
    d,
    h
  }) => (shower(b, w, d, h, "walkin"), 0.5),
  shower_screen: ({
    b,
    w,
    d,
    h
  }) => (showerScreen(b, w, d, h), 0.5),
  wc: ({
    b,
    w,
    d,
    h
  }) => (toilet(b, w, d, h), 0.5),
  washbasin: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h, 1), 0.5),
  vanity_60: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h, 1), 0.5),
  vanity_80: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h, 1), 0.5),
  vanity_100: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h, 1), 0.5),
  double_vanity_120: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h, 2), 0.5),
  pedestal_basin: ({
    b,
    w,
    d,
    h
  }) => (pedestalBasin(b, w, d, h), 0.5),
  toilet_close_coupled: ({
    b,
    w,
    d,
    h
  }) => (toilet(b, w, d, h), 0.5),
  toilet_wall_hung: ({
    b,
    w,
    d,
    h
  }) => (wallToilet(b, w, d, h), false),
  bidet: ({
    b,
    w,
    d,
    h
  }) => (wallToilet(b, w, d, h, true), 0.5),
  bathroom_cabinet_tall: ({
    b,
    w,
    d,
    h
  }) => (bathroomCabinet(b, w, d, h), 0.5),
  bathroom_cabinet_mid: ({
    b,
    w,
    d,
    h
  }) => (bathroomCabinet(b, w, d, h), 0.5),
  mirror_round_light: ({
    b,
    w,
    d,
    h
  }) => (litMirror(b, w, d, h, true), false),
  mirror_80_light: ({
    b,
    w,
    d,
    h
  }) => (litMirror(b, w, d, h, false), false),
  bathroom_wall_shelf: ({
    b,
    w,
    d,
    h
  }) => (wallShelf(b, w, d, h), false),
  towel_rail: ({
    b,
    w,
    d,
    h
  }) => (towelRail(b, w, d, h), false),
  bathtub_freestanding: ({
    b,
    w,
    d,
    h
  }) => (rectangularTub(b, w, d, h, true), 0.5),
  sauna: ({
    b,
    w,
    d,
    h
  }) => (sauna(b, w, d, h), 0.5),
  towel_radiator: ({
    b,
    w,
    d,
    h
  }) => (towelHeater(b, w, d, h, false), false),
  whirlpool_indoor: ({
    b,
    w,
    d,
    h
  }) => (whirlpool(b, w, d, h), 0.5),
  washing_machine_cabinet: ({
    b,
    w,
    d,
    h
  }) => (applianceCabinet(b, w, d, h, false), 0.5),
  laundry_basket: ({
    b,
    w,
    d,
    h
  }) => (laundryBasket(b, w, d, h), 0.5),
  ladder_shelf_towels: ({
    b,
    w,
    d,
    h
  }) => (ladderShelf(b, w, d, h), 0.5),
  mirror_cabinet_light: ({
    b,
    w,
    d,
    h
  }) => (mirrorCabinet(b, w, d, h), false),
  electric_towel_heater: ({
    b,
    w,
    d,
    h
  }) => (towelHeater(b, w, d, h, true), false),
  bathroom_fan: ({
    b,
    w,
    d,
    h
  }) => (bathroomFan(b, w, d, h), false),
  washer_vanity: ({
    b,
    w,
    d,
    h
  }) => (washerVanity(b, w, d, h), 0.5),
  rain_shower_led: ({
    b,
    w,
    d,
    h
  }) => (rainShower(b, w, d, h), false),
  mirror_led_clock: ({
    b,
    w,
    d,
    h
  }) => (litMirror(b, w, d, h, false), false),
  laundry_cabinet_basket: ({
    b,
    w,
    d,
    h
  }) => (applianceCabinet(b, w, d, h, true), 0.5)
};
export const BATHROOM_FURNITURE_SCREENS = {
  mirror_round_light: roundMirrorScreen,
  mirror_80_light: rectangularMirrorScreen,
  mirror_cabinet_light: mirrorCabinetScreen,
  electric_towel_heater: heaterScreen,
  bathroom_fan: fanScreen,
  rain_shower_led: showerLightScreen,
  mirror_led_clock: rectangularMirrorScreen
};