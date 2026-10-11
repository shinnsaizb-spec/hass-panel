/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/everyday.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Everyday living, bedroom and storage furniture.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
import { cabinet, fronts, legs } from "./common.js";
function sofa(b, w, d, h, seats) {
  const x0 = -w / 2;
  const x1 = w / 2;
  const z0 = -d / 2;
  const z1 = d / 2;
  const arm = Math.min(0.2, w * 0.12);
  const seatH = h * 0.5;
  const back = Math.min(0.24, d * 0.28);
  legs(b, w, d, 0.07, 0.05, 0.05, C.wood, true);
  b.pad(x0, x1, 0.07, seatH - 0.08, z0 + 0.02, z1, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  // the back leans a little: its top is thinner than its base
  b.loft([x0, x1, z0, z0 + back], [x0 + 0.01, x1 - 0.01, z0, z0 + back * 0.5], seatH - 0.08, h, C.fabric, C.fabricTop, EDGE_FURN);
  b.pad(x0, x0 + arm, seatH - 0.08, h * 0.72, z0 + 0.02, z1 - 0.02, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(x1 - arm, x1, seatH - 0.08, h * 0.72, z0 + 0.02, z1 - 0.02, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  // seat cushions with a small gap, and back cushions leaning against the back
  const inner = x1 - arm - (x0 + arm);
  const cw = inner / seats;
  for (let i = 0; i < seats; i++) {
    const cx0 = x0 + arm + cw * i + 0.02;
    const cx1 = cx0 + cw - 0.04;
    b.pad(cx0, cx1, seatH - 0.08, seatH + 0.05, z0 + back + 0.02, z1 - 0.06, C.cushion, C.cushion, 0.04);
    b.loft([cx0 + 0.01, cx1 - 0.01, z0 + back * 0.55, z0 + back + 0.14], [cx0 + 0.03, cx1 - 0.03, z0 + back * 0.4, z0 + back * 0.4 + 0.06], seatH + 0.03, h * 0.93, C.cushion);
  }
}
function bed(b, w, d, h) {
  const z0 = -d / 2;
  const z1 = d / 2;
  const x0 = -w / 2;
  const x1 = w / 2;
  const frame = Math.min(0.32, h * 0.36);
  legs(b, w, d, 0.08, 0.06, 0.03, C.wood, true);
  b.box(x0, x1, 0.08, frame, z0 + 0.06, z1, C.wood, C.woodTop, EDGE_FURN);
  b.pad(x0 + 0.03, x1 - 0.03, frame, frame + 0.2, z0 + 0.08, z1 - 0.03, C.white, C.whiteTop, 0.03);
  b.box(x0, x1, 0.08, h - 0.05, z0, z0 + 0.07, C.wood, C.woodTop, EDGE_FURN);
  b.box(x0, x1, h - 0.05, h, z0, z0 + 0.09, C.wood, C.woodTop, EDGE_FAINT);
  // duvet over the lower two thirds with a folded-back edge, puffy pillows at the head
  const top = frame + 0.2;
  const fold = z0 + (d - 0.1) * 0.36;
  b.pad(x0 + 0.01, x1 - 0.01, top - 0.1, top + 0.05, fold, z1 - 0.01, C.cushion, C.fabricTop, 0.025, EDGE_FAINT);
  b.lyingCyl("x", 0, fold + 0.05, top - 0.02, top + 0.09, w - 0.02, 0.1, C.cushion, C.fabricTop, 8);
  const pillows = w > 1.2 ? 2 : 1;
  const pw = (w - 0.2) / pillows;
  for (let i = 0; i < pillows; i++) {
    const px = x0 + 0.1 + pw * i;
    const pz = z0 + 0.12;
    const pd = Math.min(0.42, d * 0.2);
    const k = 0.1;
    b.loft([px + 0.03 + k, px + pw - 0.03 - k, pz + k * 0.5, pz + pd - k * 0.5], [px + 0.03, px + pw - 0.03, pz, pz + pd], top, top + 0.06, C.whiteTop);
    b.loft([px + 0.03, px + pw - 0.03, pz, pz + pd], [px + 0.03 + k, px + pw - 0.03 - k, pz + k * 0.5, pz + pd - k * 0.5], top + 0.06, top + 0.12, C.whiteTop, C.whiteTop, EDGE_FAINT);
  }
}
function chair(b, w, d, h) {
  const seat = Math.min(0.46, h * 0.52);
  legs(b, w, d, seat - 0.04, 0.035, 0.02, C.wood, true);
  b.box(-w / 2, w / 2, seat - 0.04, seat, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.pad(-w / 2 + 0.02, w / 2 - 0.02, seat, seat + 0.04, -d / 2 + 0.05, d / 2 - 0.03, C.cushion, C.cushion, 0.015);
  b.loft([-w / 2, w / 2, -d / 2 + 0.02, -d / 2 + 0.07], [-w / 2 + 0.02, w / 2 - 0.02, -d / 2, -d / 2 + 0.03], seat, h, C.wood, C.woodTop, EDGE_FURN);
}
function table(b, w, d, h) {
  legs(b, w, d, h - 0.04, 0.06, 0.05, C.wood, true);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_GLOW);
  b.box(-w / 2 + 0.08, w / 2 - 0.08, h - 0.1, h - 0.04, -d / 2 + 0.08, d / 2 - 0.08, C.body);
}
function desk(b, w, d, h) {
  const x0 = -w / 2;
  const x1 = w / 2;
  b.box(x0, x1, h - 0.035, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(x0, x0 + 0.03, 0, h - 0.035, -d / 2 + 0.03, d / 2 - 0.03, C.metal);
  const dw = Math.min(0.42, w * 0.32);
  b.box(x1 - dw, x1, 0, h - 0.035, -d / 2 + 0.03, d / 2 - 0.02, C.body, C.bodyTop, EDGE_FURN);
  const zf = d / 2 - 0.02;
  for (const y of [h * 0.35, h * 0.66]) b.seg(x1 - dw, y, zf, x1, y, zf, EDGE_FAINT);
  for (const y of [h * 0.2, h * 0.5, h * 0.82]) b.seg(x1 - dw / 2 - 0.07, y, zf + 0.012, x1 - dw / 2 + 0.07, y, zf + 0.012, EDGE_GLOW);
  // screen
  b.box(-0.3, 0.3, h + 0.08, h + 0.42, -d / 2 + 0.08, -d / 2 + 0.11, C.dark, C.dark, EDGE_GLOW);
  b.box(-0.03, 0.03, h, h + 0.1, -d / 2 + 0.09, -d / 2 + 0.13, C.metal);
}
function shelf(b, w, d, h) {
  const t = 0.025;
  b.box(-w / 2, -w / 2 + t, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(w / 2 - t, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + t, w / 2 - t, 0, h, -d / 2, -d / 2 + 0.015, C.body);
  const n = Math.max(2, Math.round(h / 0.38));
  for (let i = 0; i <= n; i++) {
    const y = Math.min(h - t, h / n * i);
    b.box(-w / 2 + t, w / 2 - t, y, y + t, -d / 2 + 0.015, d / 2, C.wood, C.woodTop, EDGE_FAINT);
    // a few books on every shelf except the top
    if (i < n) {
      let x = -w / 2 + t + 0.04;
      let k = i * 3;
      while (x < w / 2 - t - 0.12) {
        const bw = 0.03 + k * 7 % 5 * 0.008;
        const bh = h / n - t - 0.08 - k * 5 % 4 * 0.025;
        if (k * 11 % 7 !== 0) b.box(x, x + bw, y + t, y + t + bh, -d / 2 + 0.04, d / 2 - 0.05, k % 3 ? C.fabric : C.cushion, C.fabricTop);
        x += bw + 0.006;
        k++;
      }
    }
  }
}
function tvBoard(b, w, d, h) {
  cabinet(b, w, d, h, Math.max(2, Math.round(w / 0.6)), h * 0.55, true);
  const tw = Math.min(w * 0.8, 1.45);
  const th = tw * 0.56;
  b.box(-0.1, 0.1, h, h + 0.02, -d / 2 + 0.08, -d / 2 + 0.24, C.metal);
  b.box(-0.02, 0.02, h + 0.02, h + 0.12, -d / 2 + 0.14, -d / 2 + 0.18, C.metal);
  b.box(-tw / 2, tw / 2, h + 0.1, h + 0.1 + th, -d / 2 + 0.12, -d / 2 + 0.16, C.dark, C.dark, EDGE_GLOW);
}
function plant(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  const potH = Math.min(0.4, h * 0.34);
  b.cyl(0, 0, r * 0.62, 0, potH, C.pot, C.pot, 10, EDGE_FURN);
  b.cyl(0, 0, r * 0.08, potH, h * 0.55, C.wood, C.wood, 6);
  // foliage as stacked, slightly rotated octagonal layers
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const lr = r * (0.95 - 0.55 * t);
    const y0 = potH + (h - potH) * (0.18 + 0.2 * i);
    b.cyl(Math.sin(i * 2.1) * 0.03, Math.cos(i * 1.7) * 0.03, lr, y0, y0 + (h - potH) * 0.16, C.plant, C.plantTop, 8, i === layers - 1 ? EDGE_FAINT : null);
  }
}
function rug(b, w, d) {
  b.box(-w / 2, w / 2, 0, 0.012, -d / 2, d / 2, C.fabric, C.fabricTop);
  const i = Math.min(0.12, Math.min(w, d) * 0.08);
  for (const [xa, za, xb, zb] of [[-w / 2 + i, -d / 2 + i, w / 2 - i, -d / 2 + i], [w / 2 - i, -d / 2 + i, w / 2 - i, d / 2 - i], [w / 2 - i, d / 2 - i, -w / 2 + i, d / 2 - i], [-w / 2 + i, d / 2 - i, -w / 2 + i, -d / 2 + i]]) {
    b.seg(xa, 0.014, za, xb, 0.014, zb, EDGE_FURN);
  }
}
function sideboard(b, w, d, h) {
  legs(b, w, d, 0.12, 0.03, 0.04, C.metal);
  b.box(-w / 2, w / 2, 0.12, h, -d / 2, d / 2 - 0.02, C.wood, C.woodTop, EDGE_FURN);
  fronts(b, -w / 2, w / 2, 0.12, h, d / 2 - 0.02, Math.max(2, Math.round(w / 0.45)), h - 0.1, true);
}
function dresser(b, w, d, h) {
  b.box(-w / 2, w / 2, 0.06, h, -d / 2, d / 2 - 0.02, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + 0.02, w / 2 - 0.02, 0, 0.06, -d / 2 + 0.02, d / 2 - 0.06, C.dark);
  const n = Math.max(3, Math.round((h - 0.06) / 0.22));
  const z = d / 2 - 0.02;
  for (let i = 1; i < n; i++) {
    const y = 0.06 + (h - 0.06) / n * i;
    b.seg(-w / 2, y, z, w / 2, y, z, EDGE_FAINT);
  }
  for (let i = 0; i < n; i++) {
    const y = 0.06 + (h - 0.06) / n * (i + 0.5);
    b.seg(-0.08, y, z + 0.012, 0.08, y, z + 0.012, EDGE_GLOW);
  }
}
function coatRack(b, w, d, h) {
  // shoe bench, back panel with hooks, hat shelf
  b.box(-w / 2, w / 2, 0, 0.45, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  fronts(b, -w / 2, w / 2, 0.02, 0.45, d / 2, Math.max(2, Math.round(w / 0.5)), 0.38, true);
  b.box(-w / 2, w / 2, 0.45, h, -d / 2, -d / 2 + 0.03, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const hooks = Math.max(2, Math.round(w / 0.25));
  for (let i = 0; i < hooks; i++) {
    const x = -w / 2 + w / hooks * (i + 0.5);
    b.box(x - 0.015, x + 0.015, h - 0.32, h - 0.28, -d / 2 + 0.03, -d / 2 + 0.1, C.metal, C.metal);
  }
}
function bench(b, w, d, h, corner) {
  const seat = 0.45;
  const depth = Math.min(0.5, corner ? d * 0.4 : d);
  const back = 0.08;
  // rear arm
  b.box(-w / 2, w / 2, 0, seat - 0.06, -d / 2, -d / 2 + depth, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d / 2 + back, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + (corner ? depth : 0.02), w / 2 - 0.02, seat - 0.06, seat + 0.02, -d / 2 + back, -d / 2 + depth, C.cushion, C.cushion, EDGE_FAINT);
  if (corner) {
    // side arm along -x, meeting the rear arm in the corner
    b.box(-w / 2, -w / 2 + depth, 0, seat - 0.06, -d / 2 + depth, d / 2, C.wood, C.woodTop, EDGE_FURN);
    b.box(-w / 2, -w / 2 + back, 0, h, -d / 2 + back, d / 2, C.wood, C.woodTop, EDGE_FURN);
    b.box(-w / 2 + back, -w / 2 + depth, seat - 0.06, seat + 0.02, -d / 2 + back, d / 2 - 0.02, C.cushion, C.cushion, EDGE_FAINT);
  }
}
function barStool(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.8, 0, 0.02, C.metal, C.metal, 12);
  b.cyl(0, 0, 0.025, 0.02, h - 0.05, C.metal, C.metal, 6);
  b.cyl(0, 0, r * 0.75, h * 0.35, h * 0.35 + 0.015, C.metal, C.metal, 12, EDGE_FAINT);
  b.cyl(0, 0, r, h - 0.05, h, C.cushion, C.fabricTop, 14, EDGE_FURN);
}
function officeChair(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  // five-star base as two crossed bars and a hub, gas lift, seat and back
  b.box(-r, r, 0.04, 0.08, -0.03, 0.03, C.metal);
  b.box(-0.03, 0.03, 0.04, 0.08, -r, r, C.metal);
  b.cyl(0, 0, 0.06, 0.02, 0.1, C.dark, C.dark, 8);
  b.cyl(0, 0, 0.025, 0.1, 0.44, C.metal, C.metal, 6);
  b.box(-r * 0.75, r * 0.75, 0.44, 0.52, -r * 0.7, r * 0.75, C.fabric, C.cushion, EDGE_FURN);
  b.box(-r * 0.7, r * 0.7, 0.58, h, -r * 0.78, -r * 0.62, C.fabric, C.fabricTop, EDGE_FURN);
  b.box(-0.03, 0.03, 0.5, 0.62, -r * 0.72, -r * 0.62, C.metal);
}
function stool(b, w, d, h) {
  legs(b, w, d, 0.08, 0.04, 0.05, C.wood);
  b.box(-w / 2, w / 2, 0.08, h, -d / 2, d / 2, C.fabric, C.cushion, EDGE_FURN);
}
function bunkBed(b, w, d, h) {
  const t = 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * (w / 2) - (sx > 0 ? t : 0), sx * (w / 2) + (sx < 0 ? t : 0), 0, h, sz * (d / 2) - (sz > 0 ? t : 0), sz * (d / 2) + (sz < 0 ? t : 0), C.wood, C.woodTop);
  for (const y of [0.25, h - 0.55]) {
    b.box(-w / 2, w / 2, y, y + 0.08, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
    b.box(-w / 2 + 0.04, w / 2 - 0.04, y + 0.08, y + 0.24, -d / 2 + 0.05, d / 2 - 0.05, C.white, C.whiteTop, EDGE_FAINT);
    b.box(-w / 2 + 0.05, w / 2 - 0.05, y + 0.24, y + 0.33, -d / 2 + 0.08, -d / 2 + 0.4, C.whiteTop, C.whiteTop);
  }
  // guard rail on top and a ladder at the front
  b.box(-w / 2, w / 2, h - 0.2, h - 0.15, d / 2 - t, d / 2, C.wood, C.woodTop);
  const lx = w / 2 - 0.35;
  for (const x of [lx - 0.18, lx + 0.18]) b.seg(x, 0, d / 2 + 0.02, x, h - 0.15, d / 2 + 0.02, EDGE_FURN);
  for (let y = 0.3; y < h - 0.2; y += 0.28) b.seg(lx - 0.18, y, d / 2 + 0.02, lx + 0.18, y, d / 2 + 0.02, EDGE_FAINT);
}
function roundTable(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.4, 0, 0.03, C.metal, C.metal, 12);
  b.cyl(0, 0, 0.05, 0.03, h - 0.04, C.wood, C.wood, 8);
  b.cyl(0, 0, r, h - 0.04, h, C.wood, C.woodTop, 20, EDGE_FURN);
}
function coffeeTable(b, w, d, h) {
  legs(b, w, d, h - 0.03, 0.04, 0.03, C.wood);
  b.box(-w / 2, w / 2, h - 0.03, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + 0.05, w / 2 - 0.05, 0.1, 0.13, -d / 2 + 0.05, d / 2 - 0.05, C.body, C.bodyTop, EDGE_FAINT);
}
function roundCoffeeTable(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.42, 0, 0.035, C.dark, C.dark, 14);
  b.cyl(0, 0, Math.min(0.075, r * 0.18), 0.03, h - 0.045, C.metal, C.metal, 10);
  b.cyl(0, 0, r, h - 0.045, h, C.wood, C.woodTop, 24, EDGE_FURN);
}
function glassCoffeeTable(b, w, d, h) {
  const inset = Math.min(0.1, Math.min(w, d) * 0.15);
  legs(b, w - inset, d - inset, h - 0.035, 0.025, 0.03, C.metal);
  b.box(-w / 2, w / 2, h - 0.035, h, -d / 2, d / 2, C.glass, C.glass, EDGE_GLOW);
  b.box(-w / 2 + inset, w / 2 - inset, h * 0.28, h * 0.31, -d / 2 + inset, d / 2 - inset, C.glass, C.glass, EDGE_FAINT);
}
function nestingTables(b, w, d, h) {
  const specs = [[-w * 0.22, -d * 0.12, w * 0.58, d * 0.72, h], [w * 0.22, d * 0.12, w * 0.48, d * 0.62, h * 0.82]];
  for (const [cx, cz, tw, td, th] of specs) {
    const leg = 0.025;
    for (const x of [cx - tw / 2 + leg, cx + tw / 2 - leg]) for (const z of [cz - td / 2 + leg, cz + td / 2 - leg]) b.box(x - leg, x + leg, 0, th - 0.03, z - leg, z + leg, C.metal);
    b.box(cx - tw / 2, cx + tw / 2, th - 0.03, th, cz - td / 2, cz + td / 2, C.wood, C.woodTop, EDGE_FURN);
  }
}
function cubeShelf(b, w, d, h, cols, rows) {
  const t = Math.min(0.035, Math.min(w / cols, h / rows) * 0.12);
  for (let col = 0; col <= cols; col++) {
    const x = -w / 2 + w * col / cols;
    b.box(x - t / 2, x + t / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, col === 0 || col === cols ? EDGE_FURN : EDGE_FAINT);
  }
  for (let row = 0; row <= rows; row++) {
    const y = h * row / rows;
    b.box(-w / 2, w / 2, Math.max(0, y - t / 2), Math.min(h, y + t / 2), -d / 2, d / 2, C.wood, C.woodTop, row === 0 || row === rows ? EDGE_FURN : EDGE_FAINT);
  }
}
function floatingShelf(b, w, d, h) {
  const y = 1.35;
  b.box(-w / 2, w / 2, y, y + h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.34, w * 0.34]) b.box(x - 0.018, x + 0.018, y, y + h, -d / 2 - 0.012, -d * 0.12, C.metal, C.metal, EDGE_FAINT);
}
function altarTable(b, w, d, h) {
  const top = h * 0.72;
  legs(b, w, d, top - 0.06, 0.055, 0.04, C.wood, true);
  b.box(-w / 2, w / 2, top - 0.07, top, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, top - h * 0.22, top - 0.07, d / 2 - 0.045, d / 2, C.wood, C.woodTop, EDGE_FAINT);
  b.cyl(0, d * 0.06, Math.min(w, d) * 0.085, top, top + h * 0.07, C.accent, C.woodTop, 12, EDGE_GLOW);
  b.box(-w * 0.2, w * 0.2, top + h * 0.04, h, -d * 0.35, -d * 0.29, C.wood, C.woodTop, EDGE_FURN);
}
function altarCabinet(b, w, d, h) {
  const top = h * 0.7;
  cabinet(b, w, d, top, 3, top * 0.58, true);
  const front = d / 2 + 0.006;
  for (const x of [-w * 0.27, 0, w * 0.27]) b.seg(x, top * 0.18, front, x, top * 0.82, front, EDGE_FAINT);
  b.cyl(0, d * 0.08, Math.min(w, d) * 0.08, top, top + h * 0.06, C.accent, C.woodTop, 12, EDGE_GLOW);
  b.box(-w * 0.19, w * 0.19, top + h * 0.04, h * 0.9, -d * 0.36, -d * 0.3, C.wood, C.woodTop, EDGE_FURN);
  b.loft([-w * 0.28, w * 0.28, -d * 0.4, -d * 0.25], [-w * 0.22, w * 0.22, -d * 0.37, -d * 0.28], h * 0.9, h, C.wood, C.woodTop, EDGE_FURN);
}
function tvWall(b, w, d, h) {
  // flat screen on a wall bracket, centred at 1.3 m
  const y0 = 1.3 - h / 2;
  b.box(-0.12, 0.12, y0 + h * 0.3, y0 + h * 0.7, -d / 2, -d / 2 + 0.03, C.metal);
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2 + 0.03, d / 2, C.dark, C.dark, EDGE_GLOW);
}
function altar(b, w, d, h) {
  const top = h * 0.68;
  const leg = Math.min(0.09, w * 0.08);
  // Four legs and the carved front apron leave the base open like a traditional tủ thờ.
  for (const x of [-w / 2 + leg, w / 2 - leg]) {
    for (const z of [-d / 2 + leg, d / 2 - leg]) b.loft([x - leg * 0.36, x + leg * 0.36, z - leg * 0.36, z + leg * 0.36], [x - leg / 2, x + leg / 2, z - leg / 2, z + leg / 2], 0, top - 0.03, C.wood, C.woodTop);
  }
  b.box(-w / 2, w / 2, top - 0.08, top, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, h * 0.18, top - 0.1, d / 2 - 0.065, d / 2, C.wood, C.woodTop, EDGE_FURN);
  // Repeating panel lines and a central diamond suggest carved timber without costly meshes.
  for (const x of [-w * 0.28, 0, w * 0.28]) b.seg(x, h * 0.23, d / 2 + 0.004, x, top - 0.16, d / 2 + 0.004, EDGE_FAINT);
  b.seg(-w * 0.12, h * 0.4, d / 2 + 0.006, 0, h * 0.52, d / 2 + 0.006, EDGE_GLOW);
  b.seg(0, h * 0.52, d / 2 + 0.006, w * 0.12, h * 0.4, d / 2 + 0.006, EDGE_GLOW);
  b.seg(w * 0.12, h * 0.4, d / 2 + 0.006, 0, h * 0.28, d / 2 + 0.006, EDGE_GLOW);
  b.seg(0, h * 0.28, d / 2 + 0.006, -w * 0.12, h * 0.4, d / 2 + 0.006, EDGE_GLOW);
  // Incense bowl, three incense sticks and two brass candle holders.
  b.cyl(0, d * 0.06, Math.min(w, d) * 0.09, top, top + h * 0.075, C.accent, C.woodTop, 14, EDGE_GLOW);
  for (const x of [-w * 0.035, 0, w * 0.035]) b.box(x - 0.006, x + 0.006, top + h * 0.06, top + h * 0.2, d * 0.05, d * 0.065, C.accent);
  for (const x of [-w * 0.28, w * 0.28]) {
    b.cyl(x, d * 0.02, Math.min(w, d) * 0.035, top, top + h * 0.035, C.metal, C.metal, 10);
    b.cyl(x, d * 0.02, Math.min(w, d) * 0.017, top + h * 0.035, top + h * 0.15, C.metal, C.metal, 8);
  }
  // Ancestral tablet/back panel and a layered canopy.
  b.box(-w * 0.18, w * 0.18, top + h * 0.04, h * 0.85, -d * 0.33, -d * 0.27, C.wood, C.woodTop, EDGE_GLOW);
  b.box(-w * 0.46, w * 0.46, h * 0.875, h * 0.92, -d * 0.42, d * 0.36, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w * 0.4, w * 0.4]) b.box(x - leg / 2, x + leg / 2, top, h * 0.92, -d * 0.36, -d * 0.26, C.wood, C.woodTop, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, d * 0.42], [-w * 0.42, w * 0.42, -d * 0.42, d * 0.31], h * 0.92, h, C.wood, C.woodTop, EDGE_FURN);
}
function wallAltar(b, w, d, h) {
  const shelf = h * 0.18;
  b.box(-w / 2, w / 2, shelf, shelf + h * 0.14, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, shelf + h * 0.14, h * 0.86, -d / 2, -d / 2 + Math.min(0.05, d * 0.18), C.wood, C.woodTop, EDGE_FURN);
  // Two angled braces support the shelf against the wall.
  for (const x of [-w * 0.36, w * 0.36]) {
    b.box(x - 0.025, x + 0.025, 0, shelf, -d / 2, -d * 0.18, C.wood, C.woodTop, EDGE_FURN);
    b.seg(x, h * 0.02, -d * 0.18, x, shelf, d * 0.34, EDGE_FURN);
  }
  b.loft([-w / 2, w / 2, -d / 2, d / 2], [-w * 0.42, w * 0.42, -d * 0.42, d * 0.36], h * 0.86, h, C.wood, C.woodTop, EDGE_FURN);
  b.cyl(0, d * 0.08, Math.min(w, d) * 0.09, shelf + h * 0.14, shelf + h * 0.28, C.accent, C.woodTop, 12, EDGE_GLOW);
  for (const x of [-w * 0.03, 0, w * 0.03]) b.box(x - 0.005, x + 0.005, shelf + h * 0.25, shelf + h * 0.5, d * 0.075, d * 0.09, C.accent);
}
function shoeCabinet(b, w, d, h) {
  // Recessed plinth and shallow ventilation gaps keep it from reading as one solid block.
  b.box(-w * 0.43, w * 0.43, 0, h * 0.06, -d * 0.34, d * 0.34, C.dark);
  cabinet(b, w, d, h - 0.025, Math.max(2, Math.round(w / 0.45)), h * 0.55, true);
  for (const y of [h * 0.32, h * 0.63]) b.seg(-w / 2 + 0.03, y, d / 2 + 0.003, w / 2 - 0.03, y, d / 2 + 0.003, EDGE_FAINT);
  for (const x of [-w * 0.25, w * 0.25]) {
    for (let i = -1; i <= 1; i++) b.seg(x - w * 0.07, h * (0.32 + i * 0.018), d / 2 + 0.006, x + w * 0.07, h * (0.32 + i * 0.018), d / 2 + 0.006, EDGE_FAINT);
  }
  b.box(-w / 2, w / 2, h - 0.025, h, -d / 2, d / 2, C.woodTop, C.woodTop, EDGE_GLOW);
}
function shoeBench(b, w, d, h) {
  const frame = Math.min(0.045, w * 0.04);
  for (const x of [-w / 2 + frame, w / 2 - frame]) b.box(x - frame, x + frame, 0, h * 0.64, -d / 2 + frame, d / 2 - frame, C.wood, C.woodTop, EDGE_FURN);
  for (const y of [h * 0.18, h * 0.4]) b.box(-w / 2 + frame, w / 2 - frame, y - frame / 2, y + frame / 2, -d / 2 + frame, d / 2 - frame, C.wood, C.woodTop, EDGE_FAINT);
  const n = Math.max(2, Math.round(w / 0.35));
  for (let i = 1; i < n; i++) b.seg(-w / 2 + w * i / n, h * 0.08, d / 2 + 0.003, -w / 2 + w * i / n, h * 0.58, d / 2 + 0.003, EDGE_FAINT);
  b.pad(-w / 2, w / 2, h * 0.62, h, -d / 2, d / 2, C.cushion, C.fabricTop, 0.025, EDGE_FURN);
}
function roomDivider(b, w, d, h) {
  const frame = Math.min(0.05, w * 0.035);
  b.box(-w / 2, w / 2, 0, frame, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - frame, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const n = Math.max(5, Math.round(w / 0.22));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + w * (i + 0.5) / n;
    b.box(x - frame / 2, x + frame / 2, frame, h - frame, -d / 2, d / 2, i % 2 ? C.wood : C.body, C.woodTop, EDGE_FAINT);
  }
}
function vanity(b, w, d, h) {
  const tableH = Math.min(0.76, h * 0.52);
  b.box(-w / 2, w / 2, tableH - 0.06, tableH, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) b.box(x - 0.025, x + 0.025, 0, tableH - 0.06, -d / 2 + 0.04, d / 2 - 0.04, C.wood);
  b.box(-w * 0.32, w * 0.32, tableH + 0.12, h, -d / 2, -d / 2 + 0.025, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.2, w * 0.2, tableH - 0.01, tableH + 0.09, -d * 0.1, d * 0.18, C.body, C.bodyTop, EDGE_FURN);
}
function crib(b, w, d, h) {
  const rail = Math.min(0.045, w * 0.06);
  b.box(-w / 2, w / 2, h * 0.24, h * 0.32, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.pad(-w / 2 + rail, w / 2 - rail, h * 0.32, h * 0.42, -d / 2 + rail, d / 2 - rail, C.white, C.whiteTop, 0.025);
  for (const z of [-d / 2, d / 2]) {
    for (let i = 0; i < 7; i++) {
      const x = -w / 2 + rail + (w - 2 * rail) * i / 6;
      b.box(x - rail / 2, x + rail / 2, h * 0.3, h, z - rail / 2, z + rail / 2, C.wood, C.woodTop, EDGE_FAINT);
    }
    b.box(-w / 2, w / 2, h - rail, h, z - rail, z + rail, C.wood, C.woodTop, EDGE_FURN);
  }
  for (const x of [-w / 2, w / 2]) b.box(x - rail, x + rail, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
}
function cornerSofa(b, w, d, h, side = "left") {
  const depth = Math.min(0.9, d * 0.53);
  const chaise = Math.min(0.9, w * 0.38);
  const seat = h * 0.52;
  const chaiseX0 = side === "left" ? -w / 2 : w / 2 - chaise;
  const chaiseX1 = side === "left" ? -w / 2 + chaise : w / 2;
  const outerX0 = side === "left" ? -w / 2 : w / 2 - Math.min(0.2, chaise * 0.25);
  const outerX1 = side === "left" ? -w / 2 + Math.min(0.2, chaise * 0.25) : w / 2;
  const seamX = side === "left" ? chaiseX1 : chaiseX0;
  b.pad(-w / 2, w / 2, 0.08, seat, -d / 2, -d / 2 + depth, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(chaiseX0, chaiseX1, 0.08, seat, -d / 2 + depth, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.box(-w / 2, w / 2, seat, h, -d / 2, -d / 2 + Math.min(0.2, depth * 0.25), C.fabric, C.fabricTop, EDGE_FURN);
  b.box(outerX0, outerX1, seat, h, -d / 2 + depth, d / 2, C.fabric, C.fabricTop, EDGE_FURN);
  b.seg(seamX, seat + 0.01, -d / 2 + depth * 0.1, seamX, seat + 0.01, -d / 2 + depth * 0.9, EDGE_FAINT);
}
function chesterfieldSofa(b, w, d, h) {
  sofa(b, w, d, h, 3);
  const y = h * 0.73;
  const z = -d / 2 + Math.min(0.22, d * 0.28) + 0.006;
  for (let row = 0; row < 2; row++) for (let col = 0; col < 7; col++) {
    const x = -w * 0.34 + w * 0.68 * col / 6 + (row ? w * 0.035 : 0);
    b.seg(x - 0.012, y + row * h * 0.12, z, x + 0.012, y + row * h * 0.12, z, EDGE_GLOW);
  }
}
function armlessSofa(b, w, d, h) {
  const seat = h * 0.5;
  legs(b, w, d, 0.08, 0.045, 0.035, C.wood, true);
  b.pad(-w / 2, w / 2, 0.08, seat, -d / 2 + d * 0.18, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, -d / 2 + d * 0.22], [-w / 2 + 0.03, w / 2 - 0.03, -d / 2, -d / 2 + d * 0.1], seat, h, C.fabric, C.fabricTop, EDGE_FURN);
  for (let i = 1; i < 3; i++) b.seg(-w / 2 + w * i / 3, seat + 0.006, -d * 0.18, -w / 2 + w * i / 3, seat + 0.006, d / 2 - 0.04, EDGE_FAINT);
}
function chaiseSofa(b, w, d, h) {
  const seat = h * 0.5;
  const chaise = Math.min(w * 0.36, 0.88);
  const rear = Math.min(d * 0.52, 0.82);
  b.pad(-w / 2, w / 2, 0.08, seat, -d / 2, -d / 2 + rear, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(-w / 2, -w / 2 + chaise, 0.08, seat, -d / 2 + rear, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.box(-w / 2, w / 2, seat, h, -d / 2, -d / 2 + 0.18, C.fabric, C.fabricTop, EDGE_FURN);
  b.pad(-w / 2, -w / 2 + 0.18, seat, h * 0.72, -d / 2 + 0.03, d / 2, C.fabric, C.fabricTop, 0.035, EDGE_FURN);
  b.pad(w / 2 - 0.18, w / 2, seat, h * 0.72, -d / 2 + 0.03, -d / 2 + rear, C.fabric, C.fabricTop, 0.035, EDGE_FURN);
}
function uSofa(b, w, d, h) {
  const seat = h * 0.5;
  const wing = Math.min(w * 0.27, 0.82);
  const rear = Math.min(d * 0.48, 0.82);
  b.pad(-w / 2, w / 2, 0.08, seat, -d / 2, -d / 2 + rear, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  for (const [x0, x1] of [[-w / 2, -w / 2 + wing], [w / 2 - wing, w / 2]]) b.pad(x0, x1, 0.08, seat, -d / 2 + rear, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.box(-w / 2, w / 2, seat, h, -d / 2, -d / 2 + 0.18, C.fabric, C.fabricTop, EDGE_FURN);
  for (const x of [-w / 2, w / 2 - 0.18]) b.box(x, x + 0.18, seat, h * 0.76, -d / 2 + 0.18, d / 2, C.fabric, C.fabricTop, EDGE_FURN);
}
function clubChair(b, w, d, h) {
  const seat = h * 0.48;
  b.pad(-w / 2, w / 2, 0.06, seat, -d / 2, d / 2, C.fabric, C.fabricTop, 0.06, EDGE_FURN);
  b.pad(-w / 2, -w * 0.28, seat, h * 0.78, -d / 2, d / 2, C.fabric, C.cushion, 0.05, EDGE_FURN);
  b.pad(w * 0.28, w / 2, seat, h * 0.78, -d / 2, d / 2, C.fabric, C.cushion, 0.05, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, -d * 0.2], [-w * 0.42, w * 0.42, -d / 2, -d * 0.34], seat, h, C.fabric, C.cushion, EDGE_FURN);
}
function wingbackChair(b, w, d, h) {
  clubChair(b, w, d, h * 0.72);
  b.loft([-w * 0.42, w * 0.42, -d / 2, -d * 0.3], [-w / 2, w / 2, -d / 2, -d * 0.34], h * 0.48, h, C.fabric, C.cushion, EDGE_FURN);
  for (const x of [-w / 2, w / 2 - w * 0.14]) b.pad(x, x + w * 0.14, h * 0.68, h, -d / 2, -d * 0.02, C.fabric, C.cushion, 0.04, EDGE_FURN);
}
function rockingChair(b, w, d, h) {
  chair(b, w * 0.86, d * 0.72, h);
  const y = 0.035;
  for (const x of [-w * 0.38, w * 0.38]) {
    b.seg(x, y, -d / 2, x, 0.005, d * 0.3, EDGE_FURN);
    b.seg(x, 0.005, d * 0.3, x, y, d / 2, EDGE_FURN);
  }
  for (const z of [-d * 0.25, d * 0.25]) b.seg(-w * 0.38, 0.05, z, w * 0.38, 0.05, z, EDGE_FAINT);
}
function roomDividerShelf(b, w, d, h) {
  cubeShelf(b, w, d, h, 5, 4);
  const cellW = w / 5;
  const cellH = h / 4;
  for (const [col, row] of [[0, 0], [2, 0], [4, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2]]) {
    const x = -w / 2 + cellW * (col + 0.5);
    b.box(x - cellW * 0.28, x + cellW * 0.28, cellH * row + 0.04, cellH * (row + 1) - 0.05, -d * 0.18, d * 0.18, C.body, C.bodyTop, EDGE_FAINT);
  }
}
function consoleTable(b, w, d, h) {
  legs(b, w, d, h - 0.12, 0.035, 0.035, C.wood, true);
  b.box(-w / 2, w / 2, h - 0.12, h - 0.035, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - 0.035, h, -d / 2, d / 2, C.woodTop, C.woodTop, EDGE_GLOW);
  b.seg(0, h - 0.115, d / 2 + 0.004, 0, h - 0.04, d / 2 + 0.004, EDGE_FAINT);
  for (const x of [-w * 0.25, w * 0.25]) b.seg(x - 0.045, h - 0.077, d / 2 + 0.008, x + 0.045, h - 0.077, d / 2 + 0.008, EDGE_GLOW);
}
function chaiseLongue(b, w, d, h) {
  const seat = h * 0.42;
  legs(b, w, d, 0.09, 0.04, 0.04, C.wood, true);
  b.pad(-w / 2, w / 2, 0.09, seat, -d / 2 + d * 0.28, d / 2, C.fabric, C.fabricTop, 0.05, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, -d / 2 + d * 0.4], [-w * 0.44, w * 0.44, -d / 2, -d / 2 + d * 0.2], seat * 0.85, h, C.fabric, C.cushion, EDGE_FURN);
  b.pad(-w / 2, -w / 2 + w * 0.13, seat, h * 0.62, -d / 2 + d * 0.22, d / 2 - 0.04, C.fabric, C.cushion, 0.035, EDGE_FAINT);
}
function cocktailChair(b, w, d, h) {
  const seat = h * 0.46;
  b.cyl(0, 0, Math.min(w, d) * 0.42, 0.04, seat, C.fabric, C.cushion, 14, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, d * 0.08], [-w * 0.38, w * 0.38, -d * 0.44, -d * 0.18], seat * 0.7, h, C.fabric, C.cushion, EDGE_FURN);
  b.pad(-w * 0.34, w * 0.34, seat, seat + h * 0.08, -d * 0.12, d * 0.34, C.cushion, C.fabricTop, 0.03, EDGE_FAINT);
}
function recliner(b, w, d, h) {
  const chairD = d * 0.58;
  const seat = h * 0.43;
  const rear = -d / 2;
  b.pad(-w / 2, w / 2, 0.08, seat, rear, rear + chairD, C.fabric, C.cushion, 0.05, EDGE_FURN);
  b.loft([-w * 0.46, w * 0.46, rear, rear + chairD * 0.32], [-w * 0.4, w * 0.4, rear, rear + chairD * 0.16], seat, h, C.fabric, C.cushion, EDGE_FURN);
  for (const x of [-w / 2, w / 2 - w * 0.14]) b.pad(x, x + w * 0.14, seat, h * 0.64, rear + 0.03, rear + chairD, C.fabric, C.cushion, 0.04, EDGE_FURN);
  const footZ = d * 0.31;
  b.box(-w * 0.34, w * 0.34, 0, seat * 0.55, footZ - d * 0.14, footZ + d * 0.14, C.dark, C.dark);
  b.pad(-w * 0.4, w * 0.4, seat * 0.5, seat * 0.72, footZ - d * 0.16, footZ + d * 0.16, C.fabric, C.cushion, 0.04, EDGE_FURN);
}
function beanBag(b, w, d, h) {
  const r = Math.min(w, d) / 2;
  b.cyl(0, 0, r * 0.92, 0, h * 0.28, C.fabric, C.cushion, 16, EDGE_FURN);
  b.loft([-r * 0.92, r * 0.92, -r * 0.92, r * 0.92], [-r * 0.58, r * 0.58, -r * 0.62, r * 0.62], h * 0.28, h * 0.78, C.fabric, C.cushion, EDGE_FAINT);
  b.loft([-r * 0.58, r * 0.58, -r * 0.62, r * 0.62], [-r * 0.18, r * 0.18, -r * 0.2, r * 0.2], h * 0.78, h, C.cushion, C.cushion, EDGE_FURN);
}
function upholsteredChair(b, w, d, h) {
  chair(b, w, d, h);
  const seat = Math.min(0.46, h * 0.52);
  b.pad(-w / 2 + 0.035, w / 2 - 0.035, seat, seat + 0.055, -d / 2 + 0.08, d / 2 - 0.025, C.fabric, C.cushion, 0.018, EDGE_FAINT);
  b.pad(-w / 2 + 0.04, w / 2 - 0.04, seat + 0.08, h - 0.04, -d / 2, -d / 2 + 0.065, C.fabric, C.cushion, 0.025, EDGE_FURN);
}
function shellChair(b, w, d, h) {
  const seat = h * 0.5;
  b.cyl(0, 0, Math.min(w, d) * 0.34, 0, 0.025, C.metal, C.metal, 12);
  b.cyl(0, 0, 0.035, 0.025, seat, C.metal, C.metal, 8);
  b.loft([-w * 0.46, w * 0.46, -d * 0.38, d * 0.4], [-w * 0.4, w * 0.4, -d * 0.46, d * 0.2], seat, h * 0.66, C.body, C.bodyTop, EDGE_FURN);
  b.loft([-w * 0.4, w * 0.4, -d * 0.46, -d * 0.18], [-w * 0.3, w * 0.3, -d * 0.42, -d * 0.28], h * 0.66, h, C.body, C.bodyTop, EDGE_FURN);
}
function lowboard(b, w, d, h) {
  const legH = Math.min(0.1, h * 0.2);
  legs(b, w, d, legH, 0.025, 0.04, C.metal);
  b.box(-w / 2, w / 2, legH, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const compartments = Math.max(2, Math.round(w / 0.55));
  const front = d / 2 + 0.005;
  for (let i = 1; i < compartments; i++) {
    const x = -w / 2 + w * i / compartments;
    b.seg(x, legH + 0.03, front, x, h - 0.03, front, EDGE_FAINT);
  }
  b.seg(-w / 2 + 0.03, legH + (h - legH) * 0.52, front, w / 2 - 0.03, legH + (h - legH) * 0.52, front, EDGE_FAINT);
  for (let i = 0; i < compartments; i++) {
    const x = -w / 2 + w * (i + 0.5) / compartments;
    b.seg(x - 0.045, h * 0.58, front + 0.004, x + 0.045, h * 0.58, front + 0.004, EDGE_GLOW);
  }
}
function highboard(b, w, d, h) {
  cabinet(b, w, d, h, 3, h * 0.58, true);
  const front = d / 2 + 0.005;
  for (const y of [h * 0.34, h * 0.68]) b.seg(-w / 2 + 0.03, y, front, w / 2 - 0.03, y, front, EDGE_FAINT);
}
function velvetSofa(b, w, d, h) {
  sofa(b, w, d, h, 3);
  const back = -d / 2 + Math.min(0.24, d * 0.28) + 0.008;
  for (let i = 1; i < 6; i++) {
    const x = -w * 0.4 + w * 0.8 * i / 6;
    b.seg(x, h * 0.56, back, x, h * 0.9, back, EDGE_FAINT);
  }
}
function modularSofa(b, w, d, h) {
  const gap = Math.min(0.025, w * 0.01);
  const mw = (w - gap * 2) / 3;
  const rearD = d * 0.58;
  const seat = h * 0.52;
  for (let i = 0; i < 3; i++) {
    const x0 = -w / 2 + i * (mw + gap);
    const x1 = x0 + mw;
    b.pad(x0, x1, 0.07, seat, -d / 2, -d / 2 + rearD, C.fabric, C.fabricTop, 0.045, EDGE_FURN);
    b.pad(x0, x1, seat, h, -d / 2, -d / 2 + d * 0.14, C.fabric, C.cushion, 0.04, EDGE_FURN);
  }
  for (const i of [0, 2]) {
    const x0 = -w / 2 + i * (mw + gap);
    b.pad(x0, x0 + mw, 0.07, seat, -d / 2 + rearD + gap, d / 2, C.fabric, C.fabricTop, 0.045, EDGE_FURN);
  }
}
function fixedDiningTable(b, w, d, h, solid) {
  const top = solid ? 0.075 : 0.045;
  legs(b, w, d, h - top, solid ? 0.085 : 0.055, 0.05, C.wood, true);
  b.box(-w / 2, w / 2, h - top, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  if (solid) {
    b.box(-w * 0.38, w * 0.38, h - top - 0.1, h - top, -d * 0.36, d * 0.36, C.wood, C.woodTop, EDGE_FAINT);
    b.seg(-w * 0.38, h + 0.003, -d * 0.05, w * 0.38, h + 0.003, d * 0.04, EDGE_GLOW);
  }
}
function diningBench(b, w, d, h) {
  legs(b, w, d, h - 0.08, 0.055, 0.045, C.wood, true);
  b.pad(-w / 2, w / 2, h - 0.08, h, -d / 2, d / 2, C.fabric, C.cushion, 0.025, EDGE_FURN);
}
function tvStand(b, w, d, h) {
  const tw = w * 0.9;
  const th = Math.min(h * 0.56, tw * 0.56);
  const y0 = h - th;
  b.box(-w * 0.32, w * 0.32, 0, 0.035, -d * 0.34, d * 0.34, C.metal, C.metal, EDGE_FURN);
  b.box(-0.045, 0.045, 0.035, y0 + th * 0.45, -d * 0.08, d * 0.08, C.metal, C.metal);
  b.box(-tw / 2, tw / 2, y0, h, -0.035, 0.035, C.dark, C.dark, EDGE_GLOW);
}
const tvStandScreen = (w, _d, h) => {
  const tw = w * 0.9;
  const th = Math.min(h * 0.56, tw * 0.56);
  return {
    x0: -tw / 2 + 0.02,
    x1: tw / 2 - 0.02,
    y0: h - th + 0.02,
    y1: h - 0.02,
    z: 0.039
  };
};
function woodStove(b, w, d, h) {
  const bodyTop = h * 0.75;
  legs(b, w, d, h * 0.1, 0.035, 0.035, C.dark);
  b.box(-w / 2, w / 2, h * 0.1, bodyTop, -d / 2, d / 2, C.dark, C.metal, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, h * 0.25, h * 0.62, d / 2, d / 2 + 0.012, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.25, w * 0.25, h * 0.28, h * 0.35, d / 2 + 0.014, d / 2 + 0.02, C.accent, C.accent, EDGE_GLOW);
  b.cyl(0, 0, Math.min(w, d) * 0.13, bodyTop, h, C.dark, C.dark, 12, EDGE_FAINT);
}
function ottoman(b, w, d, h) {
  b.box(-w * 0.42, w * 0.42, 0, h * 0.14, -d * 0.4, d * 0.4, C.dark, C.dark);
  b.pad(-w / 2, w / 2, h * 0.12, h, -d / 2, d / 2, C.fabric, C.cushion, 0.06, EDGE_FURN);
  b.seg(0, h + 0.002, -d * 0.42, 0, h + 0.002, d * 0.42, EDGE_FAINT);
  b.seg(-w * 0.42, h + 0.002, 0, w * 0.42, h + 0.002, 0, EDGE_FAINT);
}
function tvConsole(b, w, d, h) {
  const legH = Math.min(0.12, h * 0.22);
  legs(b, w, d, legH, 0.025, 0.04, C.metal);
  b.box(-w / 2, w / 2, legH, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  const nicheW = Math.min(w * 0.38, 0.72);
  const front = d / 2 + 0.004;
  b.box(-nicheW / 2, nicheW / 2, legH + h * 0.13, h - h * 0.1, -d / 2 + 0.04, d / 2 + 0.008, C.dark, C.dark, EDGE_FAINT);
  b.seg(-nicheW / 2, legH + (h - legH) * 0.52, front, nicheW / 2, legH + (h - legH) * 0.52, front, EDGE_FAINT);
  for (const x of [-nicheW / 2, nicheW / 2]) b.seg(x, legH + 0.03, front, x, h - 0.03, front, EDGE_FURN);
  for (const x of [-w * 0.34, w * 0.34]) b.seg(x - 0.055, h * 0.53, front, x + 0.055, h * 0.53, front, EDGE_GLOW);
}
function displayCabinet(b, w, d, h) {
  const frame = Math.min(0.055, w * 0.06);
  const front = d / 2;
  b.box(-w / 2, w / 2, 0, frame, -d / 2, front, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - frame, h, -d / 2, front, C.wood, C.woodTop, EDGE_FURN);
  for (const x of [-w / 2, w / 2 - frame]) b.box(x, x + frame, frame, h - frame, -d / 2, front, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2 + frame, w / 2 - frame, frame, h - frame, -d / 2, -d / 2 + 0.025, C.body, C.bodyTop);
  const shelves = Math.max(3, Math.round(h / 0.45));
  for (let i = 1; i < shelves; i++) {
    const y = h * i / shelves;
    b.box(-w / 2 + frame, w / 2 - frame, y - 0.018, y + 0.018, -d / 2 + 0.025, front - 0.025, C.glass, C.glass, EDGE_FAINT);
  }
  b.box(-w / 2 + frame, -0.012, frame, h - frame, front - 0.025, front, C.glass, C.glass, EDGE_GLOW);
  b.box(0.012, w / 2 - frame, frame, h - frame, front - 0.025, front, C.glass, C.glass, EDGE_GLOW);
  for (const x of [-0.035, 0.035]) b.box(x - 0.008, x + 0.008, h * 0.46, h * 0.59, front, front + 0.018, C.metal, C.metal);
}
function sofaBed(b, w, d, h) {
  const seat = h * 0.5;
  b.pad(-w / 2, w / 2, 0.08, seat, -d / 2 + d * 0.12, d / 2, C.fabric, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(-w / 2 + 0.05, w / 2 - 0.05, seat, seat + 0.1, -d / 2 + d * 0.3, d / 2 - 0.04, C.cushion, C.fabricTop, 0.03, EDGE_FAINT);
  b.loft([-w / 2, w / 2, -d / 2, -d / 2 + d * 0.22], [-w / 2 + 0.03, w / 2 - 0.03, -d / 2, -d / 2 + d * 0.1], seat, h, C.fabric, C.fabricTop, EDGE_FURN);
  b.seg(0, seat + 0.105, -d * 0.05, 0, seat + 0.105, d / 2 - 0.06, EDGE_FAINT);
}
export const EVERYDAY_FURNITURE_MODELS = {
  altar: ({
    b,
    w,
    d,
    h
  }) => (altar(b, w, d, h), 0.5),
  altar_table: ({
    b,
    w,
    d,
    h
  }) => (altarTable(b, w, d, h), 0.5),
  altar_cabinet: ({
    b,
    w,
    d,
    h
  }) => (altarCabinet(b, w, d, h), 0.5),
  altar_wall: ({
    b,
    w,
    d,
    h
  }) => (wallAltar(b, w, d, h), false),
  armchair: ({
    b,
    w,
    d,
    h
  }) => (sofa(b, w, d, h, 1), 0.5),
  club_chair: ({
    b,
    w,
    d,
    h
  }) => (clubChair(b, w, d, h), 0.5),
  cocktail_chair: ({
    b,
    w,
    d,
    h
  }) => (cocktailChair(b, w, d, h), 0.5),
  wingback_chair: ({
    b,
    w,
    d,
    h
  }) => (wingbackChair(b, w, d, h), 0.5),
  recliner: ({
    b,
    w,
    d,
    h
  }) => (recliner(b, w, d, h), 0.5),
  rocking_chair: ({
    b,
    w,
    d,
    h
  }) => (rockingChair(b, w, d, h), 0.5),
  chaise_longue: ({
    b,
    w,
    d,
    h
  }) => (chaiseLongue(b, w, d, h), 0.5),
  bean_bag: ({
    b,
    w,
    d,
    h
  }) => (beanBag(b, w, d, h), 0.5),
  chair_upholstered: ({
    b,
    w,
    d,
    h
  }) => (upholsteredChair(b, w, d, h), 0.5),
  chair_shell: ({
    b,
    w,
    d,
    h
  }) => (shellChair(b, w, d, h), 0.5),
  bar_stool: ({
    b,
    w,
    d,
    h
  }) => (barStool(b, w, d, h), 0.5),
  bed: ({
    b,
    w,
    d,
    h
  }) => (bed(b, w, d, h), 0.5),
  bed_double: ({
    b,
    w,
    d,
    h
  }) => (bed(b, w, d, h), 0.5),
  bed_single: ({
    b,
    w,
    d,
    h
  }) => (bed(b, w, d, h), 0.5),
  bench: ({
    b,
    w,
    d,
    h
  }) => (bench(b, w, d, h, false), 0.5),
  bunk_bed: ({
    b,
    w,
    d,
    h
  }) => (bunkBed(b, w, d, h), 0.5),
  chair: ({
    b,
    w,
    d,
    h
  }) => (chair(b, w, d, h), 0.5),
  coat_rack: ({
    b,
    w,
    d,
    h
  }) => (coatRack(b, w, d, h), 0.5),
  coffee_table: ({
    b,
    w,
    d,
    h
  }) => (coffeeTable(b, w, d, h), 0.5),
  coffee_table_round: ({
    b,
    w,
    d,
    h
  }) => (roundCoffeeTable(b, w, d, h), 0.5),
  coffee_table_glass: ({
    b,
    w,
    d,
    h
  }) => (glassCoffeeTable(b, w, d, h), 0.5),
  nesting_tables: ({
    b,
    w,
    d,
    h
  }) => (nestingTables(b, w, d, h), 0.5),
  side_table_round: ({
    b,
    w,
    d,
    h
  }) => (roundCoffeeTable(b, w, d, h), 0.5),
  console_table: ({
    b,
    w,
    d,
    h
  }) => (consoleTable(b, w, d, h), 0.5),
  lowboard_120: ({
    b,
    w,
    d,
    h
  }) => (lowboard(b, w, d, h), 0.5),
  lowboard_160: ({
    b,
    w,
    d,
    h
  }) => (lowboard(b, w, d, h), 0.5),
  lowboard_200: ({
    b,
    w,
    d,
    h
  }) => (lowboard(b, w, d, h), 0.5),
  highboard: ({
    b,
    w,
    d,
    h
  }) => (highboard(b, w, d, h), 0.5),
  chest_drawers_3: ({
    b,
    w,
    d,
    h
  }) => (dresser(b, w, d, h), 0.5),
  corner_bench: ({
    b,
    w,
    d,
    h
  }) => (bench(b, w, d, h, true), 0.5),
  crib: ({
    b,
    w,
    d,
    h
  }) => (crib(b, w, d, h), 0.5),
  desk: ({
    b,
    w,
    d,
    h
  }) => (desk(b, w, d, h), 0.5),
  dresser: ({
    b,
    w,
    d,
    h
  }) => (dresser(b, w, d, h), 0.5),
  nightstand: ({
    b,
    w,
    d,
    h
  }) => {
    cabinet(b, w, d, h, 1, h * 0.72, true);
    b.seg(-w / 2, h * 0.5, d / 2 - 0.02, w / 2, h * 0.5, d / 2 - 0.02, EDGE_FAINT);
    return 0.5;
  },
  office_chair: ({
    b,
    w,
    d,
    h
  }) => (officeChair(b, w, d, h), 0.5),
  plant: ({
    b,
    w,
    d,
    h
  }) => (plant(b, w, d, h), 0.35),
  planter_large: ({
    b,
    w,
    d,
    h
  }) => (plant(b, w, d, h), 0.5),
  room_divider: ({
    b,
    w,
    d,
    h
  }) => (roomDivider(b, w, d, h), 0.5),
  rug: ({
    b,
    w,
    d
  }) => (rug(b, w, d), false),
  shelf: ({
    b,
    w,
    d,
    h
  }) => (shelf(b, w, d, h), 0.5),
  bookshelf_wide: ({
    b,
    w,
    d,
    h
  }) => (shelf(b, w, d, h), 0.5),
  cube_shelf_2x2: ({
    b,
    w,
    d,
    h
  }) => (cubeShelf(b, w, d, h, 2, 2), 0.5),
  cube_shelf_4x2: ({
    b,
    w,
    d,
    h
  }) => (cubeShelf(b, w, d, h, 4, 2), 0.5),
  cube_shelf_4x4: ({
    b,
    w,
    d,
    h
  }) => (cubeShelf(b, w, d, h, 4, 4), 0.5),
  room_divider_shelf: ({
    b,
    w,
    d,
    h
  }) => (roomDividerShelf(b, w, d, h), 0.5),
  floating_shelf: ({
    b,
    w,
    d,
    h
  }) => (floatingShelf(b, w, d, h), false),
  shoe_bench: ({
    b,
    w,
    d,
    h
  }) => (shoeBench(b, w, d, h), 0.5),
  shoe_cabinet: ({
    b,
    w,
    d,
    h
  }) => (shoeCabinet(b, w, d, h), 0.5),
  sideboard: ({
    b,
    w,
    d,
    h
  }) => (sideboard(b, w, d, h), 0.5),
  sofa: ({
    b,
    w,
    d,
    h
  }) => (sofa(b, w, d, h, Math.max(1, Math.round((w - 0.4) / 0.62))), 0.5),
  sofa_2: ({
    b,
    w,
    d,
    h
  }) => (sofa(b, w, d, h, 2), 0.5),
  sofa_3: ({
    b,
    w,
    d,
    h
  }) => (sofa(b, w, d, h, 3), 0.5),
  sofa_4: ({
    b,
    w,
    d,
    h
  }) => (sofa(b, w, d, h, 4), 0.5),
  sofa_bed: ({
    b,
    w,
    d,
    h
  }) => (sofaBed(b, w, d, h), 0.5),
  sofa_l: ({
    b,
    w,
    d,
    h
  }) => (cornerSofa(b, w, d, h), 0.5),
  sofa_corner_left: ({
    b,
    w,
    d,
    h
  }) => (cornerSofa(b, w, d, h, "left"), 0.5),
  sofa_corner_right: ({
    b,
    w,
    d,
    h
  }) => (cornerSofa(b, w, d, h, "right"), 0.5),
  sofa_chesterfield: ({
    b,
    w,
    d,
    h
  }) => (chesterfieldSofa(b, w, d, h), 0.5),
  sofa_velvet_3: ({
    b,
    w,
    d,
    h
  }) => (velvetSofa(b, w, d, h), 0.5),
  sofa_modular_5: ({
    b,
    w,
    d,
    h
  }) => (modularSofa(b, w, d, h), 0.5),
  sofa_armless: ({
    b,
    w,
    d,
    h
  }) => (armlessSofa(b, w, d, h), 0.5),
  sofa_chaise: ({
    b,
    w,
    d,
    h
  }) => (chaiseSofa(b, w, d, h), 0.5),
  sofa_u: ({
    b,
    w,
    d,
    h
  }) => (uSofa(b, w, d, h), 0.5),
  ottoman: ({
    b,
    w,
    d,
    h
  }) => (ottoman(b, w, d, h), 0.5),
  tv_console: ({
    b,
    w,
    d,
    h
  }) => (tvConsole(b, w, d, h), 0.5),
  display_cabinet: ({
    b,
    w,
    d,
    h
  }) => (displayCabinet(b, w, d, h), 0.5),
  stool: ({
    b,
    w,
    d,
    h
  }) => (stool(b, w, d, h), 0.5),
  table: ({
    b,
    w,
    d,
    h
  }) => (table(b, w, d, h), 0.5),
  table_120: ({
    b,
    w,
    d,
    h
  }) => (fixedDiningTable(b, w, d, h, false), 0.5),
  table_160: ({
    b,
    w,
    d,
    h
  }) => (fixedDiningTable(b, w, d, h, false), 0.5),
  table_200: ({
    b,
    w,
    d,
    h
  }) => (fixedDiningTable(b, w, d, h, false), 0.5),
  table_solid_220: ({
    b,
    w,
    d,
    h
  }) => (fixedDiningTable(b, w, d, h, true), 0.5),
  bench_dining_160: ({
    b,
    w,
    d,
    h
  }) => (diningBench(b, w, d, h), 0.5),
  table_round: ({
    b,
    w,
    d,
    h
  }) => (roundTable(b, w, d, h), 0.5),
  tall_cabinet: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, 1, h * 0.5), 0.5),
  tv_board: ({
    b,
    w,
    d,
    h
  }) => (tvBoard(b, w, d, h), 0.5),
  tv_stand: ({
    b,
    w,
    d,
    h
  }) => (tvStand(b, w, d, h), 0.5),
  tv_wall: ({
    b,
    w,
    d,
    h
  }) => (tvWall(b, w, d, h), false),
  wood_stove: ({
    b,
    w,
    d,
    h
  }) => (woodStove(b, w, d, h), 0.5),
  vanity: ({
    b,
    w,
    d,
    h
  }) => (vanity(b, w, d, h), 0.5),
  wardrobe: ({
    b,
    w,
    d,
    h
  }) => (cabinet(b, w, d, h, Math.max(2, Math.round(w / 0.5)), h * 0.5), 0.5)
};
export const EVERYDAY_FURNITURE_SCREENS = {
  tv_stand: tvStandScreen
};