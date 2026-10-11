/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/garden.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Garden and patio furniture. Keep planting, leisure and outdoor structures in this family so
// the legacy mixed architecture-outdoor renderer does not grow with every catalog batch.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function gasGrill(b, w, d, h) {
  b.box(-w * 0.38, w * 0.38, h * 0.42, h * 0.72, -d * 0.4, d * 0.36, C.dark, C.metal, EDGE_FURN);
  b.loft([-w * 0.38, w * 0.38, -d * 0.4, d * 0.36], [-w * 0.34, w * 0.34, -d * 0.34, d * 0.3], h * 0.72, h * 0.9, C.metal, C.bodyTop, EDGE_FURN);
  for (const x of [-w * 0.3, w * 0.3]) b.box(x - 0.025, x + 0.025, 0.08, h * 0.42, -d * 0.28, d * 0.24, C.metal, C.metal, EDGE_FAINT);
  for (const x of [-w * 0.48, w * 0.38]) b.box(x, x + w * 0.1, h * 0.62, h * 0.68, -d * 0.34, d * 0.28, C.metal, C.metal, EDGE_FAINT);
  for (const x of [-w * 0.22, 0, w * 0.22]) b.cyl(x, d * 0.375, 0.035, h * 0.55, h * 0.63, C.dark, C.accent, 10, EDGE_GLOW);
}
function loungeSet(b, w, d, h) {
  const seat = (cx, cz, sw, sd, angle = 0) => {
    const r = b.rotated(cx, cz, angle);
    r.box(cx - sw / 2, cx + sw / 2, 0.08, h * 0.32, cz - sd / 2, cz + sd / 2, C.wood, C.woodTop, EDGE_FAINT);
    r.pad(cx - sw * 0.46, cx + sw * 0.46, h * 0.32, h * 0.47, cz - sd * 0.42, cz + sd * 0.32, C.fabric, C.cushion, 0.035, EDGE_FURN);
    r.box(cx - sw / 2, cx + sw / 2, h * 0.4, h, cz - sd / 2, cz - sd * 0.42, C.wood, C.woodTop, EDGE_FURN);
  };
  seat(0, -d * 0.3, w * 0.58, d * 0.3);
  seat(-w * 0.34, d * 0.18, w * 0.28, d * 0.28, 90);
  seat(w * 0.34, d * 0.18, w * 0.28, d * 0.28, -90);
  b.box(-w * 0.2, w * 0.2, h * 0.24, h * 0.32, d * 0.05, d * 0.35, C.wood, C.woodTop, EDGE_FURN);
}
function sunLounger(b, w, d, h) {
  b.box(-w * 0.42, w * 0.42, 0.08, h * 0.28, -d * 0.46, d * 0.18, C.wood, C.woodTop, EDGE_FAINT);
  b.rotated(0, d * 0.18, -20).pad(-w * 0.4, w * 0.4, h * 0.24, h * 0.37, d * 0.08, d * 0.48, C.fabric, C.cushion, 0.025, EDGE_FURN);
  for (const x of [-w * 0.34, w * 0.34]) for (const z of [-d * 0.36, d * 0.34]) b.box(x - 0.025, x + 0.025, 0, h * 0.25, z - 0.025, z + 0.025, C.metal, C.metal);
}
function parasol(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, Math.min(w, d) * 0.04, 0.08, h * 0.88, C.metal, C.metal, 12, EDGE_FAINT);
  b.cyl(0, 0, r * 0.22, 0, 0.1, C.body, C.bodyTop, 16, EDGE_FURN);
  b.loft([-r * 0.08, r * 0.08, -r * 0.08, r * 0.08], [-r, r, -r, r], h * 0.88, h, C.fabric, C.fabricTop, EDGE_FURN);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    b.seg(0, h * 0.89, 0, Math.cos(a) * r, h, Math.sin(a) * r, EDGE_FAINT);
  }
}
function pergola(b, w, d, h) {
  const p = Math.min(w, d) * 0.035;
  for (const x of [-w / 2 + p, w / 2 - p]) for (const z of [-d / 2 + p, d / 2 - p]) b.box(x - p, x + p, 0, h, z - p, z + p, C.wood, C.woodTop, EDGE_FURN);
  for (let i = 0; i < 7; i++) {
    const x = -w / 2 + w * i / 6;
    b.box(x - p * 0.45, x + p * 0.45, h * 0.93, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FAINT);
  }
  for (const z of [-d / 2 + p, d / 2 - p]) b.box(-w / 2, w / 2, h * 0.86, h * 0.94, z - p, z + p, C.wood, C.woodTop, EDGE_FURN);
}
function raisedBed(b, w, d, h) {
  const rim = Math.min(0.1, w * 0.08, d * 0.08);
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d / 2 + rim, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, 0, h, d / 2 - rim, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, -w / 2 + rim, 0, h, -d / 2 + rim, d / 2 - rim, C.wood, C.woodTop, EDGE_FURN);
  b.box(w / 2 - rim, w / 2, 0, h, -d / 2 + rim, d / 2 - rim, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + rim, w / 2 - rim, h * 0.72, h * 0.8, -d / 2 + rim, d / 2 - rim, C.plant, C.plantTop);
  for (const x of [-w * 0.28, 0, w * 0.28]) b.cyl(x, 0, Math.min(w, d) * 0.07, h * 0.8, h, C.plant, C.plantTop, 7, EDGE_FAINT);
}
function greenhouse(b, w, d, h) {
  const p = Math.min(w, d) * 0.025;
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) b.box(x - p, x + p, 0, h * 0.68, z - p, z + p, C.metal, C.metal, EDGE_FURN);
  for (const x of [-w / 2, w / 2]) b.seg(x, h * 0.68, -d / 2, 0, h, -d / 2, EDGE_FURN), b.seg(x, h * 0.68, d / 2, 0, h, d / 2, EDGE_FURN);
  b.seg(0, h, -d / 2, 0, h, d / 2, EDGE_GLOW);
  for (const z of [-d / 2, d / 2]) b.seg(-w / 2, h * 0.68, z, w / 2, h * 0.68, z, EDGE_FAINT);
  b.box(-w * 0.15, w * 0.15, 0, h * 0.62, d / 2 - p, d / 2 + p, C.glass, C.glass, EDGE_GLOW);
}
function outdoorHotTub(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r, 0, h, C.body, C.bodyTop, 20, EDGE_FURN);
  b.cyl(0, 0, r * 0.8, h * 0.78, h * 0.9, C.glass, C.accent, 20, EDGE_GLOW);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    b.cyl(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.04, h * 0.89, h * 0.93, C.white, C.accent, 8);
  }
}
function fireBowl(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r, h * 0.22, h * 0.38, C.dark, C.metal, 18, EDGE_FURN);
  b.cyl(0, 0, r * 0.78, h * 0.35, h * 0.4, C.accent, C.accent, 16, EDGE_GLOW);
  for (const x of [-r * 0.58, r * 0.58]) b.seg(x, h * 0.25, 0, x * 0.82, 0, 0, EDGE_FAINT);
}
function gardenTorch(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.16, 0, h * 0.75, C.wood, C.woodTop, 10, EDGE_FAINT);
  b.loft([-r * 0.35, r * 0.35, -r * 0.35, r * 0.35], [-r * 0.55, r * 0.55, -r * 0.55, r * 0.55], h * 0.68, h * 0.9, C.metal, C.metal, EDGE_FURN);
  b.loft([-r * 0.3, r * 0.3, -r * 0.3, r * 0.3], [-r * 0.08, r * 0.08, -r * 0.08, r * 0.08], h * 0.9, h, C.accent, C.accent, EDGE_GLOW);
}
function playTower(b, w, d, h) {
  const deckY = h * 0.48;
  for (const x of [-w * 0.28, w * 0.28]) for (const z of [-d * 0.28, d * 0.08]) b.box(x - 0.04, x + 0.04, 0, h * 0.78, z - 0.04, z + 0.04, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.32, w * 0.32, deckY, deckY + 0.08, -d * 0.34, d * 0.14, C.wood, C.woodTop, EDGE_FURN);
  b.loft([-w * 0.38, w * 0.38, -d * 0.38, d * 0.18], [-w * 0.05, w * 0.05, -d * 0.32, d * 0.12], h * 0.75, h, C.fabric, C.fabricTop, EDGE_GLOW);
  b.loft([-w * 0.23, w * 0.23, d * 0.12, d * 0.28], [-w * 0.32, w * 0.32, d * 0.42, d * 0.5], deckY * 0.78, deckY, C.accent, C.accent, EDGE_FURN);
  for (const x of [-w * 0.27, w * 0.27]) b.seg(x, 0, -d * 0.38, x, deckY, -d * 0.38, EDGE_FAINT);
  for (let y = h * 0.12; y < deckY; y += h * 0.11) b.seg(-w * 0.27, y, -d * 0.385, w * 0.27, y, -d * 0.385, EDGE_FAINT);
}
function gardenShed(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.75, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.loft([-w * 0.54, w * 0.54, -d * 0.54, d * 0.54], [-w * 0.08, w * 0.08, -d * 0.54, d * 0.54], h * 0.75, h, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.2, w * 0.2, 0, h * 0.64, d / 2, d / 2 + 0.025, C.dark, C.bodyTop, EDGE_GLOW);
  b.seg(w * 0.13, h * 0.3, d / 2 + 0.03, w * 0.17, h * 0.3, d / 2 + 0.03, EDGE_GLOW);
}
function trampoline(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r, h * 0.34, h * 0.42, C.metal, C.dark, 24, EDGE_FURN);
  b.cyl(0, 0, r * 0.82, h * 0.41, h * 0.43, C.dark, C.dark, 24, EDGE_FAINT);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const x = Math.cos(a) * r * 0.9;
    const z = Math.sin(a) * r * 0.9;
    b.seg(x, 0, z, x, h, z, EDGE_FURN);
  }
  for (let i = 0; i < 24; i++) {
    const a0 = i * Math.PI * 2 / 24;
    const a1 = (i + 1) * Math.PI * 2 / 24;
    b.seg(Math.cos(a0) * r * 0.9, h, Math.sin(a0) * r * 0.9, Math.cos(a1) * r * 0.9, h, Math.sin(a1) * r * 0.9, EDGE_FAINT);
  }
}
function flowerPots(b, w, d, h) {
  const pots = [[-w * 0.28, 0, 0.24], [0, d * 0.08, 0.32], [w * 0.3, -d * 0.05, 0.2]];
  for (const [x, z, scale] of pots) {
    const r = Math.min(w, d) * scale;
    b.loft([x - r * 0.72, x + r * 0.72, z - r * 0.72, z + r * 0.72], [x - r, x + r, z - r, z + r], 0, h * (0.35 + scale), C.pot, C.bodyTop, EDGE_FURN);
    b.cyl(x, z, r * 0.65, h * (0.35 + scale), h * (0.72 + scale * 0.5), C.plant, C.plantTop, 7, EDGE_FAINT);
  }
}
function lawnSprinkler(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.2, 0, h * 0.45, C.metal, C.metal, 12, EDGE_FURN);
  b.box(-w * 0.38, w * 0.38, h * 0.42, h * 0.55, -d * 0.06, d * 0.06, C.metal, C.metal, EDGE_FAINT);
  for (const x of [-w * 0.33, w * 0.33]) b.seg(x, h * 0.52, 0, x, h, x > 0 ? d * 0.35 : -d * 0.35, EDGE_GLOW);
}
function irrigationBox(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.plant, C.plantTop, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, h, h + 0.035, -d * 0.43, d * 0.43, C.dark, C.bodyTop, EDGE_GLOW);
  b.cyl(-w * 0.18, 0, Math.min(w, d) * 0.08, h * 0.7, h * 0.98, C.accent, C.metal, 10, EDGE_FAINT);
  b.cyl(w * 0.18, 0, Math.min(w, d) * 0.08, h * 0.7, h * 0.98, C.accent, C.metal, 10, EDGE_FAINT);
}
function rainBarrel(b, w, d, h) {
  const r = Math.min(w, d) * 0.46;
  b.cyl(0, 0, r, 0, h * 0.94, C.body, C.bodyTop, 18, EDGE_FURN);
  for (const y of [h * 0.16, h * 0.48, h * 0.8]) for (let i = 0; i < 18; i++) {
    const a0 = i * Math.PI * 2 / 18;
    const a1 = (i + 1) * Math.PI * 2 / 18;
    b.seg(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r, EDGE_FAINT);
  }
  b.box(r * 0.72, r * 1.02, h * 0.16, h * 0.24, -0.035, 0.035, C.metal, C.metal, EDGE_GLOW);
  b.cyl(0, 0, r * 0.78, h * 0.94, h, C.dark, C.bodyTop, 18, EDGE_FURN);
}
function gardenLantern(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.22, 0, h * 0.58, C.metal, C.metal, 10, EDGE_FAINT);
  b.cyl(0, 0, r * 0.46, h * 0.55, h * 0.64, C.metal, C.metal, 10, EDGE_FURN);
  b.loft([-r * 0.34, r * 0.34, -r * 0.34, r * 0.34], [-r * 0.48, r * 0.48, -r * 0.48, r * 0.48], h * 0.64, h * 0.9, C.glass, C.accent, EDGE_GLOW);
  b.loft([-r * 0.5, r * 0.5, -r * 0.5, r * 0.5], [-r * 0.08, r * 0.08, -r * 0.08, r * 0.08], h * 0.9, h, C.metal, C.metal, EDGE_FURN);
}
function outdoorKitchen(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h * 0.86, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h * 0.86, h, -d / 2, d / 2, C.metal, C.metal, EDGE_GLOW);
  b.box(-w * 0.38, -w * 0.05, h * 0.82, h * 0.99, -d * 0.32, d * 0.18, C.dark, C.metal, EDGE_FAINT);
  b.cyl(w * 0.24, -d * 0.05, Math.min(w, d) * 0.18, h * 0.92, h * 1.01, C.dark, C.metal, 14, EDGE_FURN);
  for (const x of [-w * 0.25, 0, w * 0.25]) b.seg(x, 0.08, d / 2 + 0.003, x, h * 0.76, d / 2 + 0.003, EDGE_FAINT);
}
function patioHeater(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.5, 0, h * 0.08, C.body, C.bodyTop, 16, EDGE_FURN);
  b.cyl(0, 0, r * 0.14, h * 0.08, h * 0.77, C.metal, C.metal, 12, EDGE_FAINT);
  b.cyl(0, 0, r * 0.42, h * 0.76, h * 0.86, C.dark, C.accent, 16, EDGE_GLOW);
  b.loft([-r * 0.65, r * 0.65, -r * 0.65, r * 0.65], [-r, r, -r, r], h * 0.86, h, C.metal, C.metal, EDGE_FURN);
}
function tree(b, w, d, h, crown) {
  const r = Math.min(w, d) / 2;
  const trunkH = h * (crown === "tiered" ? 0.3 : 0.38);
  b.cyl(0, 0, r * 0.12, 0, trunkH, C.wood, C.woodTop, 10, EDGE_FAINT);
  if (crown === "tiered") {
    for (let i = 0; i < 4; i++) {
      const y0 = h * (0.2 + i * 0.16);
      const radius = r * (1 - i * 0.16);
      b.loft([-radius, radius, -radius, radius], [-r * 0.08, r * 0.08, -r * 0.08, r * 0.08], y0, Math.min(h, y0 + h * 0.34), C.plant, C.plantTop, i === 3 ? EDGE_FURN : EDGE_FAINT);
    }
    return;
  }
  const layers = crown === "column" ? 4 : 3;
  for (let i = 0; i < layers; i++) {
    const y = trunkH + (h - trunkH) * (i / (layers + 0.3));
    const radius = crown === "column" ? r * (0.52 - i * 0.06) : r * (0.72 - i * 0.08);
    const zScale = crown === "oval" ? 0.72 : 1;
    b.loft([-radius, radius, -radius * zScale, radius * zScale], [-radius * 0.62, radius * 0.62, -radius * zScale * 0.62, radius * zScale * 0.62], y, Math.min(h, y + h * 0.28), C.plant, C.plantTop, i === layers - 1 ? EDGE_FURN : EDGE_FAINT);
  }
  if (crown === "fruit") for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    b.cyl(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.4, r * 0.045, h * (0.55 + i % 3 * 0.08), h * (0.58 + i % 3 * 0.08), C.accent, C.accent, 7, EDGE_GLOW);
  }
}
function shrub(b, w, d, h, flowering) {
  const r = Math.min(w, d) / 2;
  for (const [x, z, s] of [[-0.25, -0.12, 0.58], [0.18, -0.18, 0.7], [-0.08, 0.24, 0.64], [0.3, 0.2, 0.48]]) {
    b.cyl(x * w, z * d, r * s, 0.04, h * (0.7 + s * 0.3), C.plant, C.plantTop, 9, EDGE_FAINT);
    if (flowering) b.cyl(x * w + r * 0.08, z * d, r * 0.09, h * (0.68 + s * 0.3), h * (0.72 + s * 0.3), C.accent, C.accent, 7, EDGE_GLOW);
  }
}
function wildBrush(b, w, d, h) {
  for (let i = 0; i < 13; i++) {
    const x = (i * 37 % 13 / 12 - 0.5) * w * 0.88;
    const z = (i * 17 % 11 / 10 - 0.5) * d * 0.88;
    const top = h * (0.45 + i % 5 * 0.12);
    b.seg(x, 0, z, x + (i % 3 - 1) * 0.06, top, z + (i % 4 - 1.5) * 0.04, i % 3 === 0 ? EDGE_GLOW : EDGE_FAINT);
  }
}
function treeGroup(b, w, d, h) {
  for (const [x, z, scale] of [[-0.27, -0.12, 0.78], [0.22, -0.2, 1], [0.05, 0.28, 0.86]]) {
    const cx = x * w;
    const cz = z * d;
    const r = Math.min(w, d) * 0.16 * scale;
    const top = h * scale;
    b.cyl(cx, cz, r * 0.18, 0, top * 0.4, C.wood, C.woodTop, 9, EDGE_FAINT);
    for (let i = 0; i < 3; i++) {
      const y = top * (0.34 + i * 0.16);
      const cr = r * (1 - i * 0.12);
      b.loft([cx - cr, cx + cr, cz - cr, cz + cr], [cx - cr * 0.58, cx + cr * 0.58, cz - cr * 0.58, cz + cr * 0.58], y, Math.min(top, y + top * 0.3), C.plant, C.plantTop, i === 2 ? EDGE_FURN : EDGE_FAINT);
    }
  }
}
export const GARDEN_FURNITURE_MODELS = {
  gas_grill: ({
    b,
    w,
    d,
    h
  }) => (gasGrill(b, w, d, h), 0.5),
  lounge_set_outdoor: ({
    b,
    w,
    d,
    h
  }) => (loungeSet(b, w, d, h), 0.5),
  sun_lounger: ({
    b,
    w,
    d,
    h
  }) => (sunLounger(b, w, d, h), 0.5),
  parasol: ({
    b,
    w,
    d,
    h
  }) => (parasol(b, w, d, h), 0.5),
  pergola: ({
    b,
    w,
    d,
    h
  }) => (pergola(b, w, d, h), 0.5),
  raised_bed: ({
    b,
    w,
    d,
    h
  }) => (raisedBed(b, w, d, h), 0.5),
  greenhouse: ({
    b,
    w,
    d,
    h
  }) => (greenhouse(b, w, d, h), 0.5),
  hot_tub_outdoor: ({
    b,
    w,
    d,
    h
  }) => (outdoorHotTub(b, w, d, h), 0.5),
  fire_bowl: ({
    b,
    w,
    d,
    h
  }) => (fireBowl(b, w, d, h), 0.5),
  garden_torch: ({
    b,
    w,
    d,
    h
  }) => (gardenTorch(b, w, d, h), 0.5),
  play_tower_slide: ({
    b,
    w,
    d,
    h
  }) => (playTower(b, w, d, h), 0.5),
  garden_shed: ({
    b,
    w,
    d,
    h
  }) => (gardenShed(b, w, d, h), 0.5),
  trampoline: ({
    b,
    w,
    d,
    h
  }) => (trampoline(b, w, d, h), 0.5),
  flower_pots_3: ({
    b,
    w,
    d,
    h
  }) => (flowerPots(b, w, d, h), 0.5),
  lawn_sprinkler: ({
    b,
    w,
    d,
    h
  }) => (lawnSprinkler(b, w, d, h), 0.5),
  irrigation_valve_box: ({
    b,
    w,
    d,
    h
  }) => (irrigationBox(b, w, d, h), 0.5),
  rain_barrel: ({
    b,
    w,
    d,
    h
  }) => (rainBarrel(b, w, d, h), 0.5),
  garden_lantern: ({
    b,
    w,
    d,
    h
  }) => (gardenLantern(b, w, d, h), 0.5),
  outdoor_kitchen: ({
    b,
    w,
    d,
    h
  }) => (outdoorKitchen(b, w, d, h), 0.5),
  patio_heater: ({
    b,
    w,
    d,
    h
  }) => (patioHeater(b, w, d, h), 0.5),
  tree_oak: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "round"), 0.5),
  tree_lime: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "oval"), 0.5),
  tree_birch: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "column"), 0.5),
  tree_maple: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "round"), 0.5),
  tree_fruit: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "fruit"), 0.5),
  tree_spruce: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "tiered"), 0.5),
  tree_pine: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "tiered"), 0.5),
  tree_thuja: ({
    b,
    w,
    d,
    h
  }) => (tree(b, w, d, h, "column"), 0.5),
  shrub: ({
    b,
    w,
    d,
    h
  }) => (shrub(b, w, d, h, false), 0.5),
  shrub_flowering: ({
    b,
    w,
    d,
    h
  }) => (shrub(b, w, d, h, true), 0.5),
  brush_wild: ({
    b,
    w,
    d,
    h
  }) => (wildBrush(b, w, d, h), 0.5),
  trees_group_3: ({
    b,
    w,
    d,
    h
  }) => (treeGroup(b, w, d, h), 0.5)
};