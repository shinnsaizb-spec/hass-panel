/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/bedroom.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Parameterized bedroom furniture: fixed mattress widths and wardrobe door counts.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function fixedBed(b, w, d, h, style) {
  const head = style === "futon" ? h * 0.72 : h;
  const mattressY = style === "boxspring" ? h * 0.42 : style === "futon" ? h * 0.22 : h * 0.3;
  const mattressH = style === "boxspring" ? h * 0.34 : Math.min(0.24, h * 0.3);
  const frame = style === "upholstered" ? C.fabric : C.wood;
  b.box(-w / 2, w / 2, 0.08, mattressY, -d / 2, d / 2, frame, style === "upholstered" ? C.fabricTop : C.woodTop, EDGE_FURN);
  if (style === "boxspring") b.pad(-w / 2, w / 2, 0.08, mattressY, -d / 2, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(-w * 0.48, w * 0.48, mattressY, mattressY + mattressH, -d * 0.47, d * 0.47, C.white, C.whiteTop, 0.035, EDGE_FAINT);
  const headDepth = style === "upholstered" ? 0.12 : 0.075;
  if (style === "upholstered") b.pad(-w / 2, w / 2, 0.08, head, -d / 2, -d / 2 + headDepth, C.fabric, C.cushion, 0.045, EDGE_FURN);else b.box(-w / 2, w / 2, 0.08, head, -d / 2, -d / 2 + headDepth, frame, style === "futon" ? C.woodTop : C.wood, EDGE_FURN);
  const pillows = w < 1.2 ? 1 : 2;
  const pw = w * 0.84 / pillows;
  for (let i = 0; i < pillows; i++) {
    const x0 = -w * 0.42 + pw * i + 0.035;
    b.pad(x0, x0 + pw - 0.07, mattressY + mattressH, mattressY + mattressH + 0.08, -d * 0.4, -d * 0.22, C.cushion, C.whiteTop, 0.025, EDGE_FAINT);
  }
  if (style === "upholstered") {
    for (const x of [-w * 0.24, 0, w * 0.24]) b.seg(x, h * 0.48, -d / 2 - 0.002, x, h * 0.92, -d / 2 - 0.002, EDGE_GLOW);
  }
}
function wardrobe(b, w, d, h, doors, mirror = false) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const front = d / 2 + 0.004;
  for (let i = 1; i < doors; i++) {
    const x = -w / 2 + w * i / doors;
    b.seg(x, 0.04, front, x, h - 0.04, front, EDGE_FAINT);
  }
  for (let i = 0; i < doors; i++) {
    const centre = -w / 2 + w * (i + 0.5) / doors;
    const side = i < doors / 2 ? 1 : -1;
    b.seg(centre + side * w / doors * 0.3, h * 0.45, front, centre + side * w / doors * 0.3, h * 0.58, front, EDGE_GLOW);
  }
  if (mirror) b.box(-w * 0.14, w * 0.14, h * 0.08, h * 0.92, d / 2 + 0.006, d / 2 + 0.012, C.glass, C.glass, EDGE_GLOW);
}
function cornerWardrobe(b, w, d, h) {
  const wing = Math.min(w, d) * 0.48;
  b.box(-w / 2, -w / 2 + wing, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + wing, w / 2, 0, h, -d / 2, -d / 2 + wing, C.wood, C.woodTop, EDGE_FURN);
  b.seg(-w / 2 + wing, 0.04, d / 2, -w / 2 + wing, h - 0.04, d / 2, EDGE_FAINT);
  b.seg(w / 2, 0.04, -d / 2 + wing, w / 2, h - 0.04, -d / 2 + wing, EDGE_FAINT);
}
function drawerCabinet(b, w, d, h, rows, cols = 1) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const front = d / 2 + 0.004;
  for (let row = 1; row < rows; row++) b.seg(-w / 2 + 0.025, h * row / rows, front, w / 2 - 0.025, h * row / rows, front, EDGE_FAINT);
  for (let col = 1; col < cols; col++) b.seg(-w / 2 + w * col / cols, 0.03, front, -w / 2 + w * col / cols, h - 0.03, front, EDGE_FAINT);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = -w / 2 + w * (col + 0.5) / cols;
      const y = h * (row + 0.5) / rows;
      b.seg(x - Math.min(0.06, w / cols * 0.16), y, front, x + Math.min(0.06, w / cols * 0.16), y, front, EDGE_GLOW);
    }
  }
  for (const x of [-w * 0.4, w * 0.4]) b.box(x - 0.02, x + 0.02, 0, 0.06, -d * 0.4, d * 0.4, C.dark, C.dark);
}
function floatingNightstand(b, w, d, h) {
  const y = 0.48;
  b.box(-w / 2, w / 2, y, y + h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.seg(-w / 2 + 0.025, y + h * 0.55, d / 2 + 0.004, w / 2 - 0.025, y + h * 0.55, d / 2 + 0.004, EDGE_FAINT);
  b.seg(-w * 0.08, y + h * 0.28, d / 2 + 0.006, w * 0.08, y + h * 0.28, d / 2 + 0.006, EDGE_GLOW);
}
function clothesRail(b, w, d, h) {
  for (const x of [-w * 0.44, w * 0.44]) b.box(x - 0.025, x + 0.025, 0, h, -0.025, 0.025, C.metal, C.metal, EDGE_FURN);
  b.box(-w * 0.46, w * 0.46, h * 0.82, h * 0.86, -0.025, 0.025, C.metal, C.metal, EDGE_GLOW);
  b.box(-w / 2, w / 2, 0, 0.045, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FAINT);
}
function canopyBed(b, w, d, h) {
  fixedBed(b, w, d, h * 0.46, "frame");
  for (const x of [-w * 0.47, w * 0.47]) for (const z of [-d * 0.47, d * 0.47]) b.box(x - 0.025, x + 0.025, 0, h, z - 0.025, z + 0.025, C.wood, C.wood, EDGE_FURN);
  b.box(-w * 0.48, w * 0.48, h * 0.94, h, -d * 0.48, -d * 0.45, C.wood, C.wood, EDGE_FAINT);
  b.box(-w * 0.48, w * 0.48, h * 0.94, h, d * 0.45, d * 0.48, C.wood, C.wood, EDGE_FAINT);
}
function slidingWardrobe(b, w, d, h, lit = false) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const front = d / 2 + 0.005;
  b.seg(0, 0.04, front, 0, h - 0.04, front, EDGE_FURN);
  b.seg(-w * 0.46, h * 0.04, front, w * 0.46, h * 0.04, front, EDGE_FAINT);
  b.seg(-w * 0.46, h * 0.96, front, w * 0.46, h * 0.96, front, EDGE_FAINT);
  if (lit) b.box(-w * 0.42, w * 0.42, h * 0.86, h * 0.89, front, front + 0.012, C.accent, C.accent, EDGE_GLOW);
}
function walkinCloset(b, w, d, h) {
  const t = Math.min(0.38, Math.min(w, d) * 0.24);
  b.box(-w / 2, -w / 2 + t, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + t, w / 2, 0, h, -d / 2, -d / 2 + t, C.wood, C.woodTop, EDGE_FURN);
  for (const y of [h * 0.32, h * 0.65]) {
    b.seg(-w / 2, y, d / 2, -w / 2 + t, y, d / 2, EDGE_FAINT);
    b.seg(w / 2, y, -d / 2, w / 2, y, -d / 2 + t, EDGE_FAINT);
  }
}
function vanityUnit(b, w, d, h, lit) {
  const top = h * 0.48;
  b.box(-w / 2, w / 2, top - 0.06, top, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.43, w * 0.43]) b.box(x - 0.025, x + 0.025, 0, top, -d * 0.38, d * 0.38, C.wood, C.wood);
  b.box(-w * 0.32, w * 0.32, top + 0.08, h, -d / 2, -d / 2 + 0.035, C.glass, C.glass, lit ? EDGE_GLOW : EDGE_FURN);
}
function paddedBench(b, w, d, h) {
  for (const x of [-w * 0.4, w * 0.4]) b.box(x - 0.025, x + 0.025, 0, h * 0.72, -d * 0.35, d * 0.35, C.wood, C.wood);
  b.pad(-w / 2, w / 2, h * 0.68, h, -d / 2, d / 2, C.fabric, C.cushion, 0.035, EDGE_FURN);
}
function changingTable(b, w, d, h) {
  drawerCabinet(b, w, d, h * 0.78, 3);
  b.pad(-w / 2, w / 2, h * 0.78, h, -d / 2, d / 2, C.white, C.whiteTop, 0.04, EDGE_FURN);
}
function floorMirror(b, w, d, h) {
  b.box(-w * 0.46, w * 0.46, 0.08, h, -0.035, 0.035, C.glass, C.glass, EDGE_GLOW);
  b.box(-w / 2, w / 2, 0, 0.06, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
}
function readingNook(b, w, d, h) {
  b.pad(-w * 0.42, w * 0.42, 0.12, h * 0.45, -d * 0.3, d * 0.42, C.fabric, C.fabricTop, 0.05, EDGE_FURN);
  b.pad(-w * 0.38, w * 0.38, h * 0.42, h, -d * 0.42, -d * 0.25, C.fabric, C.cushion, 0.04, EDGE_FURN);
  b.box(w * 0.38, w / 2, 0, h * 0.52, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FAINT);
}
function sunriseAlarm(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.28, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
  b.cyl(0, 0, Math.min(w, d) * 0.42, h * 0.28, h, C.white, C.whiteTop, 18, EDGE_GLOW);
}
const ambientBedScreen = (w, d, h) => ({
  x0: -w * 0.44,
  x1: w * 0.44,
  y0: h * 0.22,
  y1: h * 0.27,
  z: d / 2 + 0.006
});
const wardrobeLightScreen = (w, d, h) => ({
  x0: -w * 0.42,
  x1: w * 0.42,
  y0: h * 0.86,
  y1: h * 0.89,
  z: d / 2 + 0.018
});
const alarmScreen = (w, d, h) => ({
  x0: -w * 0.3,
  x1: w * 0.3,
  y0: h * 0.42,
  y1: h * 0.8,
  z: d * 0.43
});
const vanityLightScreen = (w, d, h) => ({
  x0: -w * 0.33,
  x1: w * 0.33,
  y0: h * 0.55,
  y1: h * 0.96,
  z: -d / 2 - 0.004
});
export const BEDROOM_FURNITURE_MODELS = {
  bed_90: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "frame"), 0.5),
  bed_140: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "frame"), 0.5),
  bed_160: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "frame"), 0.5),
  bed_180: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "frame"), 0.5),
  bed_200: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "frame"), 0.5),
  bed_upholstered_180: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "upholstered"), 0.5),
  bed_boxspring_180: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "boxspring"), 0.5),
  bed_futon_160: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "futon"), 0.5),
  wardrobe_2door: ({
    b,
    w,
    d,
    h
  }) => (wardrobe(b, w, d, h, 2), 0.5),
  wardrobe_3door: ({
    b,
    w,
    d,
    h
  }) => (wardrobe(b, w, d, h, 3), 0.5),
  wardrobe_4door: ({
    b,
    w,
    d,
    h
  }) => (wardrobe(b, w, d, h, 4), 0.5),
  wardrobe_6door: ({
    b,
    w,
    d,
    h
  }) => (wardrobe(b, w, d, h, 6), 0.5),
  wardrobe_mirror: ({
    b,
    w,
    d,
    h
  }) => (wardrobe(b, w, d, h, 3, true), 0.5),
  wardrobe_corner: ({
    b,
    w,
    d,
    h
  }) => (cornerWardrobe(b, w, d, h), 0.5),
  nightstand_drawer: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 1), 0.5),
  nightstand_slim: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 2), 0.5),
  nightstand_floating: ({
    b,
    w,
    d,
    h
  }) => (floatingNightstand(b, w, d, h), false),
  dresser_80_3: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 3), 0.5),
  dresser_140_6: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 3, 2), 0.5),
  chest_tall_5: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 5), 0.5),
  clothes_rail: ({
    b,
    w,
    d,
    h
  }) => (clothesRail(b, w, d, h), 0.35),
  bed_canopy: ({
    b,
    w,
    d,
    h
  }) => (canopyBed(b, w, d, h), 0.5),
  wardrobe_sliding: ({
    b,
    w,
    d,
    h
  }) => (slidingWardrobe(b, w, d, h), 0.5),
  closet_walkin: ({
    b,
    w,
    d,
    h
  }) => (walkinCloset(b, w, d, h), 0.5),
  vanity_mirror: ({
    b,
    w,
    d,
    h
  }) => (vanityUnit(b, w, d, h, false), 0.5),
  bed_bench: ({
    b,
    w,
    d,
    h
  }) => (paddedBench(b, w, d, h), 0.5),
  changing_table: ({
    b,
    w,
    d,
    h
  }) => (changingTable(b, w, d, h), 0.5),
  mirror_floor: ({
    b,
    w,
    d,
    h
  }) => (floorMirror(b, w, d, h), 0.35),
  chest_tall: ({
    b,
    w,
    d,
    h
  }) => (drawerCabinet(b, w, d, h, 4), 0.5),
  reading_nook: ({
    b,
    w,
    d,
    h
  }) => (readingNook(b, w, d, h), 0.5),
  bed_ambient_180: ({
    b,
    w,
    d,
    h
  }) => (fixedBed(b, w, d, h, "upholstered"), 0.5),
  wardrobe_light: ({
    b,
    w,
    d,
    h
  }) => (slidingWardrobe(b, w, d, h, true), 0.5),
  alarm_sunrise: ({
    b,
    w,
    d,
    h
  }) => (sunriseAlarm(b, w, d, h), 0.35),
  vanity_light: ({
    b,
    w,
    d,
    h
  }) => (vanityUnit(b, w, d, h, true), 0.5)
};
export const BEDROOM_FURNITURE_SCREENS = {
  bed_ambient_180: ambientBedScreen,
  wardrobe_light: wardrobeLightScreen,
  alarm_sunrise: alarmScreen,
  vanity_light: vanityLightScreen
};