/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/climate.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Heating, cooling, water and airflow equipment.

import { Color } from "three";
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW, FurnitureBuilder as Builder } from "../furniture-builder.js";
import { ALWAYS } from "../geo.js";
import { ring } from "./common.js";
export const RADIATOR_Y = 0.12;
export const AIR_CONDITIONER_Y = 1.9;
function radiator(b, w, d, h) {
  const y0 = RADIATOR_Y;
  b.box(-w / 2 + 0.05, -w / 2 + 0.08, 0, y0, -d / 2, -d / 2 + 0.03, C.metal);
  b.box(w / 2 - 0.08, w / 2 - 0.05, 0, y0, -d / 2, -d / 2 + 0.03, C.metal);
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2 + 0.02, d / 2, C.white, C.whiteTop, EDGE_FURN);
  const n = Math.max(3, Math.round(w / 0.1));
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + w / n * i;
    b.seg(x, y0 + 0.03, d / 2 + 0.002, x, y0 + h - 0.03, d / 2 + 0.002, EDGE_FAINT);
  }
}
function airConditioner(b, w, d, h) {
  const y0 = AIR_CONDITIONER_Y;
  const front = d / 2;
  // brackets against the wall
  b.box(-w * 0.34, -w * 0.27, y0 + h * 0.2, y0 + h * 0.75, -d / 2 - 0.015, -d / 2 + 0.025, C.metal);
  b.box(w * 0.27, w * 0.34, y0 + h * 0.2, y0 + h * 0.75, -d / 2 - 0.015, -d / 2 + 0.025, C.metal);
  // main white indoor unit and its front cover
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, front, C.white, C.whiteTop, EDGE_FURN);
  b.seg(-w * 0.42, y0 + h * 0.82, front + 0.003, w * 0.42, y0 + h * 0.82, front + 0.003, EDGE_FAINT);
  // outlet, flap and vertical vanes along the underside/front
  const ventY0 = y0 + h * 0.08;
  const ventY1 = y0 + h * 0.27;
  b.box(-w * 0.43, w * 0.43, ventY0, ventY1, front - 0.018, front + 0.006, C.dark, C.dark, EDGE_FAINT);
  b.seg(-w * 0.42, ventY0 + h * 0.04, front + 0.009, w * 0.42, ventY1 - h * 0.025, front + 0.009, EDGE_GLOW);
  for (let i = 1; i < 8; i++) {
    const x = -w * 0.4 + w * 0.8 * (i / 8);
    b.seg(x, ventY0 + h * 0.025, front + 0.011, x + w * 0.018, ventY1 - h * 0.025, front + 0.011, EDGE_FAINT);
  }
  // small status LED
  b.seg(w * 0.37, y0 + h * 0.67, front + 0.006, w * 0.4, y0 + h * 0.67, front + 0.006, EDGE_GLOW);
}
function waterPump(b, w, d, h) {
  const base = Math.min(0.045, h * 0.12);
  const motorDia = Math.min(w * 0.42, h * 0.48);
  const motorY0 = base + h * 0.13;
  const motorY1 = motorY0 + motorDia;
  // rubber feet and a weatherproof base plate
  for (const x of [-w * 0.32, w * 0.32]) b.box(x - w * 0.055, x + w * 0.055, 0, base, -d * 0.34, d * 0.3, C.dark);
  b.box(-w * 0.43, w * 0.43, base, base + h * 0.06, -d * 0.4, d * 0.36, C.metal, C.metal, EDGE_FURN);
  // electric motor, rear fan cover and cooling ribs
  b.lyingCyl("z", 0, -d * 0.13, motorY0, motorY1, d * 0.46, motorDia, C.body, C.bodyTop, 14, EDGE_FURN);
  b.lyingCyl("z", 0, -d * 0.39, motorY0 + motorDia * 0.08, motorY1 - motorDia * 0.08, d * 0.1, motorDia * 0.84, C.dark, C.metal, 12, EDGE_FAINT);
  for (let i = -2; i <= 2; i++) {
    const z = -d * 0.23 + i * d * 0.055;
    b.box(-motorDia * 0.54, motorDia * 0.54, motorY0 + motorDia * 0.43, motorY0 + motorDia * 0.57, z - d * 0.012, z + d * 0.012, C.metal, C.metal);
  }
  // round pump chamber at the front and the suction pipe facing forwards
  const headDia = Math.min(w * 0.55, h * 0.65);
  const headY0 = base + h * 0.08;
  b.lyingCyl("z", 0, d * 0.17, headY0, headY0 + headDia, d * 0.22, headDia, C.accent, C.bodyTop, 16, EDGE_FURN);
  b.lyingCyl("z", 0, d * 0.39, headY0 + headDia * 0.34, headY0 + headDia * 0.66, d * 0.22, headDia * 0.32, C.metal, C.dark, 12, EDGE_GLOW);
  // delivery outlet on top, with a short collar
  const outletX = w * 0.16;
  const outletZ = d * 0.13;
  const outletR = Math.min(w, d) * 0.075;
  b.cyl(outletX, outletZ, outletR * 1.35, headY0 + headDia * 0.72, headY0 + headDia * 0.82, C.accent, C.accent, 12, EDGE_FURN);
  b.cyl(outletX, outletZ, outletR, headY0 + headDia * 0.82, h, C.metal, C.metal, 12, EDGE_GLOW);
  // small live status window on the front of the pump head
  b.box(-w * 0.11, w * 0.11, headY0 + headDia * 0.58, headY0 + headDia * 0.72, d * 0.285, d * 0.3, C.dark, C.dark, EDGE_GLOW);
}
function ceilingFan(b, w, d, h) {
  const y = h * 0.18;
  const r = Math.min(w, d);
  // Low round motor, short downrod and a broad ceiling canopy match the pack reference silhouette.
  b.cyl(0, 0, r * 0.105, y, h * 0.34, C.dark, C.bodyTop, 18, EDGE_GLOW);
  b.cyl(0, 0, r * 0.035, h * 0.3, h * 0.76, C.metal, C.bodyTop, 10, EDGE_FURN);
  b.cyl(0, 0, r * 0.075, h * 0.74, h * 0.94, C.body, C.bodyTop, 16, EDGE_FURN);
  b.cyl(0, 0, r * 0.095, h * 0.92, h, C.body, C.bodyTop, 16, EDGE_FAINT);
}
function floorFan(b, w, d, h) {
  b.loft([-w * 0.4, w * 0.4, -d * 0.33, d * 0.33], [-w * 0.34, w * 0.34, -d * 0.28, d * 0.28], 0, h * 0.045, C.body, C.metal, EDGE_FURN);
  b.cyl(0, 0, Math.min(w, d) * 0.055, h * 0.04, h * 0.62, C.metal, C.metal, 10);
  b.box(-w * 0.13, w * 0.13, h * 0.06, h * 0.14, -d * 0.2, d * 0.2, C.body, C.bodyTop, EDGE_FAINT);
  for (const x of [-w * 0.07, 0, w * 0.07]) b.cyl(x, d * 0.12, w * 0.018, h * 0.14, h * 0.155, C.accent, C.accent, 8, EDGE_GLOW);
  const cy = h * 0.78;
  const r = Math.min(w, h * 0.42) * 0.46;
  const cageZ = d * 0.075;
  // A short neck and rear motor make the head read as a domestic pedestal fan, not two floating rings.
  b.box(-w * 0.085, w * 0.085, h * 0.58, cy - r * 0.18, -d * 0.1, d * 0.015, C.body, C.bodyTop, EDGE_FURN);
  b.lyingCyl("z", 0, -d * 0.11, cy - r * 0.3, cy + r * 0.3, d * 0.24, r * 0.6, C.body, C.bodyTop, 16, EDGE_FURN);
  // Shallow front and rear guards, joined at four points, keep the cage visually thin.
  for (const z of [-cageZ, cageZ]) {
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      b.seg(Math.cos(a) * r * 0.18, cy + Math.sin(a) * r * 0.18, z, Math.cos(a) * r, cy + Math.sin(a) * r, z, EDGE_FAINT);
    }
    ring(b, 0, cy, r, z, 32);
    ring(b, 0, cy, r * 0.86, z, 32);
    ring(b, 0, cy, r * 0.18, z, 18);
  }
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]) {
    const x = Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    b.seg(x, y, -cageZ, x, y, cageZ, EDGE_FURN);
  }
}
function wallFan(b, w, d, h) {
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.46;
  const cageZ = d * 0.16;
  // Rear plate, short articulated arm and motor visibly anchor the fan to a wall.
  b.box(-w * 0.15, w * 0.15, h * 0.28, h * 0.72, -d / 2, -d * 0.4, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.06, w * 0.06, cy - h * 0.06, cy + h * 0.06, -d * 0.42, -d * 0.18, C.metal, C.metal, EDGE_FURN);
  b.lyingCyl("z", 0, -d * 0.12, cy - r * 0.3, cy + r * 0.3, d * 0.24, r * 0.6, C.body, C.bodyTop, 16, EDGE_FURN);
  for (const z of [-cageZ, cageZ]) {
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      b.seg(Math.cos(a) * r * 0.18, cy + Math.sin(a) * r * 0.18, z, Math.cos(a) * r, cy + Math.sin(a) * r, z, EDGE_FAINT);
    }
    ring(b, 0, cy, r, z, 32);
    ring(b, 0, cy, r * 0.86, z, 32);
    ring(b, 0, cy, r * 0.18, z, 18);
  }
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]) {
    const x = Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    b.seg(x, y, -cageZ, x, y, cageZ, EDGE_FURN);
  }
}
export function pushFanRotor(buf, lines, type, w, d, h, variant = null) {
  if (type === "fan_ceiling" || type === "fan_ceiling_light") {
    const b = new Builder(buf, lines, (x, z) => [x, z]);
    const span = Math.min(w, d);
    const bladeW = span * 0.115;
    const blades = variant === "3" ? 3 : variant === "4" ? 4 : 5;
    // The official pack reference uses five straight, dark paddles; 3/4 remain optional variants.
    for (let i = 0; i < blades; i++) {
      const a = i / blades * 360;
      b.rotated(0, 0, a).loft([span * 0.08, span * 0.48, -bladeW * 0.42, bladeW * 0.42], [span * 0.105, span * 0.465, -bladeW * 0.52, bladeW * 0.52], 0, h * 0.06, C.fabric, C.fabricTop, EDGE_FURN);
    }
    b.cyl(0, 0, span * 0.115, -h * 0.025, h * 0.07, C.dark, C.bodyTop, 18, EDGE_GLOW);
    return;
  }
  const r = Math.min(w, h * 0.42) * 0.46;
  const z0 = -Math.max(0.006, d * 0.012);
  const z1 = -z0;
  const front = new Color(C.bodyTop);
  const side = new Color(C.body);
  const P = (radius, angle) => [Math.cos(angle) * radius, Math.sin(angle) * radius];
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    const poly = [P(r * 0.14, a - 0.12), P(r * 0.46, a - 0.34), P(r * 0.84, a - 0.16), P(r * 0.72, a + 0.22), P(r * 0.24, a + 0.34)];
    const V = (p, z) => [p[0], p[1], z];
    // Three broad swept blades are closer to a common household fan than the old star shape.
    for (let j = 1; j < poly.length - 1; j++) {
      buf.tri(V(poly[0], z1), V(poly[j], z1), V(poly[j + 1], z1), front);
      buf.tri(V(poly[0], z0), V(poly[j + 1], z0), V(poly[j], z0), side);
    }
    for (let j = 0; j < poly.length; j++) {
      const k = (j + 1) % poly.length;
      buf.tri(V(poly[j], z0), V(poly[k], z1), V(poly[k], z0), side);
      buf.tri(V(poly[j], z0), V(poly[j], z1), V(poly[k], z1), side);
      lines.seg(V(poly[j], z1), V(poly[k], z1), EDGE_FURN, ALWAYS);
    }
  }
  const b = new Builder(buf, lines, (x, z) => [x, z]);
  b.lyingCyl("z", 0, 0, -r * 0.14, r * 0.14, d * 0.1, r * 0.28, C.body, C.bodyTop, 14, EDGE_GLOW);
}
function waterHeater(b, w, d, h) {
  const dia = Math.min(d * 0.88, h * 0.92);
  const y0 = (h - dia) / 2;
  b.lyingCyl("x", 0, 0, y0, y0 + dia, w * 0.9, dia, C.white, C.whiteTop, 22, EDGE_FURN);
  // End caps, wall brackets, hot/cold pipes and a small thermostat panel.
  for (const x of [-w * 0.46, w * 0.46]) b.lyingCyl("x", x, 0, y0 + dia * 0.04, y0 + dia * 0.96, w * 0.035, dia * 0.92, C.white, C.whiteTop, 18, EDGE_FAINT);
  for (const x of [-w * 0.28, w * 0.28]) b.box(x - 0.025, x + 0.025, 0, y0 + dia * 0.25, -d * 0.42, -d * 0.28, C.metal, C.metal);
  for (const [x, color] of [[-w * 0.2, C.accent], [w * 0.2, C.fabricTop]]) {
    b.cyl(x, d * 0.05, Math.min(w, d) * 0.025, 0, y0 + dia * 0.18, color, color, 10, EDGE_FAINT);
    b.cyl(x, d * 0.05, Math.min(w, d) * 0.04, y0 + dia * 0.14, y0 + dia * 0.2, C.metal, C.metal, 10);
  }
  b.box(w * 0.18, w * 0.4, y0 + dia * 0.38, y0 + dia * 0.68, d * 0.43, d * 0.48, C.body, C.glass, EDGE_GLOW);
  b.seg(w * 0.24, y0 + dia * 0.53, d * 0.485, w * 0.35, y0 + dia * 0.53, d * 0.485, EDGE_GLOW);
}
function dryingRack(b, w, d, h) {
  const t = Math.min(0.035, w * 0.025);
  const x = w / 2 - t;
  for (const sx of [-1, 1]) {
    b.box(sx * x - t, sx * x + t, 0, h, -d / 2, -d / 2 + t * 2, C.metal, C.metal, EDGE_FURN);
    b.box(sx * x - t, sx * x + t, 0, h, d / 2 - t * 2, d / 2, C.metal, C.metal, EDGE_FURN);
    for (const z of [-d / 2 + t, d / 2 - t]) b.box(sx * x - t * 2.2, sx * x + t * 2.2, 0, t * 1.2, z - t * 2.5, z + t * 2.5, C.dark, C.dark);
  }
  for (let i = 0; i < 7; i++) {
    const z = -d / 2 + t + (d - 2 * t) * i / 6;
    b.box(-w / 2 + t, w / 2 - t, h - t * 2, h, z - t / 2, z + t / 2, C.metal, C.metal, EDGE_FAINT);
  }
  b.seg(-w / 2, 0.05, -d / 2, w / 2, h - 0.05, -d / 2, EDGE_FAINT);
  b.seg(w / 2, 0.05, -d / 2, -w / 2, h - 0.05, -d / 2, EDGE_FAINT);
  b.seg(-w / 2, 0.05, d / 2, w / 2, h - 0.05, d / 2, EDGE_FAINT);
  b.seg(w / 2, 0.05, d / 2, -w / 2, h - 0.05, d / 2, EDGE_FAINT);
}
export const CLIMATE_FURNITURE_MODELS = {
  air_conditioner: ({
    b,
    w,
    d,
    h
  }) => (airConditioner(b, w, d, h), false),
  drying_rack: ({
    b,
    w,
    d,
    h
  }) => (dryingRack(b, w, d, h), 0.5),
  fan_ceiling: ({
    b,
    w,
    d,
    h
  }) => (ceilingFan(b, w, d, h), false),
  fan_ceiling_light: ({
    b,
    w,
    d,
    h
  }) => (ceilingFan(b, w, d, h), false),
  fan_floor: ({
    b,
    w,
    d,
    h
  }) => (floorFan(b, w, d, h), 0.5),
  fan_wall: ({
    b,
    w,
    d,
    h
  }) => (wallFan(b, w, d, h), false),
  radiator: ({
    b,
    w,
    d,
    h
  }) => (radiator(b, w, d, h), false),
  water_heater: ({
    b,
    w,
    d,
    h
  }) => (waterHeater(b, w, d, h), false),
  water_pump: ({
    b,
    w,
    d,
    h
  }) => (waterPump(b, w, d, h), 0.5)
};