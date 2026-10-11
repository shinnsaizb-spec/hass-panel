/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/energy.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Solar, grid and battery equipment.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
import { ring } from "./common.js";
function inverter(b, w, d, h, variant) {
  const y0 = 1.1;
  const z = d / 2;
  if (variant === "slim") {
    b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.dark, C.body, EDGE_FURN);
    b.seg(-w * 0.25, y0 + h * 0.15, z + 0.004, -w * 0.25, y0 + h * 0.85, z + 0.004, EDGE_GLOW);
    b.box(-w * 0.1, w * 0.3, y0 + h * 0.7, y0 + h * 0.85, z, z + 0.005, C.dark);
    return;
  }
  if (variant === "hybrid") {
    b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
    ring(b, 0, y0 + h * 0.66, Math.min(w, h) * 0.22, z + 0.004);
    b.seg(-w * 0.08, y0 + h * 0.66, z + 0.005, w * 0.08, y0 + h * 0.66, z + 0.005, EDGE_GLOW);
    for (const s of [-1, 1]) ring(b, s * w * 0.22, y0 + h * 0.2, Math.min(w, h) * 0.1, -d / 2 - 0.002, 12);
    return;
  }
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.28, w * 0.28, y0 + h * 0.58, y0 + h * 0.82, d / 2, d / 2 + 0.006, C.dark);
  b.seg(-w * 0.3, y0 + h * 0.45, d / 2 + 0.004, w * 0.3, y0 + h * 0.45, d / 2 + 0.004, EDGE_GLOW);
  // cooling fins at the sides
  for (const s of [-1, 1]) for (let i = 1; i < 6; i++) b.seg(s * w / 2 + s * 0.002, y0 + h * i / 6, -d / 2 + 0.03, s * w / 2 + s * 0.002, y0 + h * i / 6, d / 2 - 0.03, EDGE_FAINT);
}
function gridCabinet(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.body, EDGE_FURN);
  b.box(-w / 2 - 0.01, w / 2 + 0.01, h, h + 0.03, -d / 2 - 0.01, d / 2 + 0.01, C.dark, C.body);
  b.seg(-w / 2, h + 0.032, d / 2 + 0.01, w / 2, h + 0.032, d / 2 + 0.01, EDGE_GLOW);
  b.seg(-w * 0.3, h * 0.55, d / 2 + 0.003, w * 0.3, h * 0.55, d / 2 + 0.003, EDGE_FAINT);
}
function wallbox(b, w, d, h) {
  const y0 = 1.0;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.dark, C.body, EDGE_FURN);
  const r = Math.min(w, h) * 0.28;
  const cy = y0 + h * 0.58;
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2;
    const a1 = (i + 1) / n * Math.PI * 2;
    b.seg(Math.cos(a0) * r, cy + Math.sin(a0) * r, d / 2 + 0.003, Math.cos(a1) * r, cy + Math.sin(a1) * r, d / 2 + 0.003, EDGE_GLOW);
  }
  // the coiled cable below the box
  b.box(-0.015, 0.015, y0 - 0.35, y0, d / 2 - 0.03, d / 2, C.dark);
  b.box(-0.06, 0.06, y0 - 0.42, y0 - 0.35, d / 2 - 0.05, d / 2, C.dark, C.body);
}
function meterCabinet(b, w, d, h) {
  const y0 = 0.4;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  // the door's edge and handle
  b.seg(-w / 2 + 0.025, y0 + 0.025, d / 2 + 0.003, -w / 2 + 0.025, y0 + h - 0.025, d / 2 + 0.003, EDGE_FAINT);
  b.seg(-w / 2 + 0.025, y0 + h - 0.025, d / 2 + 0.003, w / 2 - 0.025, y0 + h - 0.025, d / 2 + 0.003, EDGE_FAINT);
  b.box(w / 2 - 0.06, w / 2 - 0.035, y0 + h * 0.5 - 0.05, y0 + h * 0.5 + 0.05, d / 2, d / 2 + 0.012, C.dark);
  // the meter behind its window with the display line
  b.box(-w * 0.3, w * 0.3, y0 + h * 0.6, y0 + h * 0.8, d / 2, d / 2 + 0.005, C.dark);
  b.seg(-w * 0.22, y0 + h * 0.7, d / 2 + 0.008, w * 0.22, y0 + h * 0.7, d / 2 + 0.008, EDGE_GLOW);
}
function homeBattery(b, w, d, h, variant) {
  if (variant === "wall") {
    const y0 = 0.5;
    b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
    b.seg(-w * 0.3, y0 + h * 0.9, d / 2 + 0.004, w * 0.3, y0 + h * 0.9, d / 2 + 0.004, EDGE_GLOW);
    b.seg(-w * 0.3, y0 + h * 0.08, d / 2 + 0.003, w * 0.3, y0 + h * 0.08, d / 2 + 0.003, EDGE_FAINT);
    return;
  }
  if (variant === "cube") {
    b.box(-w / 2 + 0.01, w / 2 - 0.01, 0, 0.03, -d / 2 + 0.01, d / 2 - 0.01, C.dark);
    b.box(-w / 2, w / 2, 0.03, h, -d / 2, d / 2, C.dark, C.body, EDGE_FURN);
    b.seg(-w * 0.35, h * 0.85, d / 2 + 0.004, w * 0.35, h * 0.85, d / 2 + 0.004, EDGE_GLOW);
    b.box(-w * 0.15, w * 0.15, h, h + 0.025, -0.012, 0.012, C.dark);
    return;
  }
  b.box(-w / 2 + 0.02, w / 2 - 0.02, 0, 0.06, -d / 2 + 0.02, d / 2 - 0.02, C.dark);
  const modules = Math.max(2, Math.round((h - 0.06) / 0.3));
  const mh = (h - 0.06) / modules;
  for (let i = 0; i < modules; i++) b.box(-w / 2, w / 2, 0.06 + i * mh + 0.004, 0.06 + (i + 1) * mh, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  // charge bar: five short segments
  for (let k = 0; k < 5; k++) {
    const y = 0.06 + h * 0.18 + k * ((h - 0.3) / 5);
    b.seg(-w * 0.04, y, d / 2 + 0.003, w * 0.04, y, d / 2 + 0.003, EDGE_GLOW);
  }
}
export const ENERGY_FURNITURE_MODELS = {
  grid_point: ({
    b,
    w,
    d,
    h
  }) => (gridCabinet(b, w, d, h), 0.5),
  home_battery: ({
    b,
    w,
    d,
    h,
    variant
  }) => (homeBattery(b, w, d, h, variant), variant === "wall" ? false : 0.5),
  inverter: ({
    b,
    w,
    d,
    h,
    variant
  }) => (inverter(b, w, d, h, variant), false),
  meter: ({
    b,
    w,
    d,
    h
  }) => (meterCabinet(b, w, d, h), false),
  wallbox: ({
    b,
    w,
    d,
    h
  }) => (wallbox(b, w, d, h), false)
};