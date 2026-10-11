/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/architecture-outdoor.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Stairs, circulation objects and outdoor furniture.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function stairs(b, w, d, h) {
  const n = Math.max(3, Math.round(h / 0.18));
  const rise = h / n;
  const run = d / n;
  for (let i = 0; i < n; i++) {
    const z1 = d / 2 - run * i;
    const z0 = z1 - run;
    const y1 = rise * (i + 1);
    b.box(-w / 2, w / 2, 0, y1, z0, z1, C.wood, C.woodTop);
    b.seg(-w / 2, y1, z1, w / 2, y1, z1, EDGE_FURN);
  }
  b.seg(-w / 2, 0, d / 2, -w / 2, rise, d / 2, EDGE_FURN);
  // stringer lines along both sides
  for (const x of [-w / 2, w / 2]) b.seg(x, rise, d / 2, x, h, -d / 2 + run, EDGE_FAINT);
  // handrail and posts
  const rail = 0.9;
  const xr = w / 2 - 0.03;
  // the rail ends where the stair passes through the ceiling opening
  const last = Math.max(1, n - 4);
  b.seg(xr, rise + rail, d / 2 - run / 2, xr, rise * last + rail, d / 2 - run * (last - 0.5), EDGE_GLOW);
  for (let i = 0; i < last; i += 3) {
    const z = d / 2 - run * (i + 0.5);
    const y = rise * (i + 1);
    b.seg(xr, y, z, xr, y + rail, z, EDGE_FAINT);
  }
}
function stairsLanding(b, w, d, h) {
  const steps = Math.max(6, Math.round(h / 0.18));
  const lowerSteps = Math.floor(steps / 2);
  const upperSteps = steps - lowerSteps;
  const rise = h / steps;
  const landingY = rise * lowerSteps;
  const gap = Math.min(0.16, w * 0.12);
  const flightW = (w - gap) / 2;
  // A landing roughly as deep as one flight is wide, while small custom sizes stay well formed.
  const landingD = Math.min(d * 0.34, Math.max(d * 0.22, flightW));
  const landingFront = -d / 2 + landingD;
  const runD = d - landingD;
  const lowerRun = runD / lowerSteps;
  const upperRun = runD / upperSteps;
  const left0 = -w / 2;
  const left1 = -gap / 2;
  const right0 = gap / 2;
  const right1 = w / 2;

  // First flight: from the front towards the landing at half-height.
  for (let i = 0; i < lowerSteps; i++) {
    const z1 = d / 2 - lowerRun * i;
    const z0 = z1 - lowerRun;
    const y1 = rise * (i + 1);
    b.box(left0, left1, 0, y1, z0, z1, C.white, C.whiteTop);
    b.seg(left0, y1, z1, left1, y1, z1, EDGE_FURN);
  }

  // Full-width chiếu nghỉ joins both flights.
  b.box(-w / 2, w / 2, 0, landingY, -d / 2, landingFront, C.white, C.whiteTop, EDGE_FURN);

  // Second flight turns 180° and rises from the landing back towards the front.
  for (let i = 0; i < upperSteps; i++) {
    const z0 = landingFront + upperRun * i;
    const z1 = z0 + upperRun;
    const y1 = landingY + rise * (i + 1);
    b.box(right0, right1, 0, y1, z0, z1, C.white, C.whiteTop);
    b.seg(right0, y1, z0, right1, y1, z0, EDGE_FURN);
  }
  const rail = Math.min(0.9, Math.max(0.55, h * 0.32));
  const lowerRails = [left0 + 0.03, left1 - 0.03];
  const upperRails = [right0 + 0.03, right1 - 0.03];
  // Rails on both sides make the central stairwell and the outer edges easy to read in 3D.
  for (const x of lowerRails) {
    // Meet the landing at its edge instead of stopping halfway across the last tread.
    b.seg(x, rise + rail, d / 2 - lowerRun / 2, x, landingY + rail, landingFront, EDGE_GLOW);
    for (let i = 0; i < lowerSteps; i += 3) {
      const z = d / 2 - lowerRun * (i + 0.5);
      const y = rise * (i + 1);
      b.seg(x, y, z, x, y + rail, z, EDGE_FAINT);
    }
  }
  const railSteps = Math.max(1, upperSteps - 3);
  for (const x of upperRails) {
    // Start at landing height so the rail rises smoothly from the horizontal landing guard.
    b.seg(x, landingY + rail, landingFront, x, landingY + rise * railSteps + rail, landingFront + upperRun * (railSteps - 0.5), EDGE_GLOW);
    for (let i = 0; i < railSteps; i += 3) {
      const z = landingFront + upperRun * (i + 0.5);
      const y = landingY + rise * (i + 1);
      b.seg(x, y, z, x, y + rail, z, EDGE_FAINT);
    }
  }

  // The inner rails join across the central opening. The outer rails continue around the back of
  // the landing, making both handrail runs one uninterrupted path through the half-turn.
  const lowerOuter = lowerRails[0];
  const lowerInner = lowerRails[1];
  const upperInner = upperRails[0];
  const upperOuter = upperRails[1];
  const landingBack = -d / 2 + 0.03;
  b.seg(lowerInner, landingY + rail, landingFront, upperInner, landingY + rail, landingFront, EDGE_GLOW);
  b.seg(lowerOuter, landingY + rail, landingFront, lowerOuter, landingY + rail, landingBack, EDGE_GLOW);
  b.seg(lowerOuter, landingY + rail, landingBack, upperOuter, landingY + rail, landingBack, EDGE_GLOW);
  b.seg(upperOuter, landingY + rail, landingBack, upperOuter, landingY + rail, landingFront, EDGE_GLOW);
  for (const [x, z] of [[lowerInner, landingFront], [upperInner, landingFront], [lowerOuter, landingFront], [lowerOuter, landingBack], [upperOuter, landingBack], [upperOuter, landingFront]]) {
    b.seg(x, landingY, z, x, landingY + rail, z, EDGE_FAINT);
  }
}
function motorbike(b, w, d, h) {
  const wheel = Math.min(w * 0.58, d * 0.22, h * 0.42);
  const axle = w * 0.66;
  const frontZ = d * 0.34;
  const rearZ = -d * 0.34;
  for (const z of [rearZ, frontZ]) {
    b.lyingCyl("x", 0, z, 0, wheel, axle, wheel, C.dark, C.metal, 14, EDGE_FURN);
    b.lyingCyl("x", 0, z, wheel * 0.16, wheel * 0.84, axle + 0.012, wheel * 0.46, C.metal, C.metal, 12, EDGE_FAINT);
  }
  // Step-through fairing, footboard and rear engine casing.
  b.loft([-w * 0.3, w * 0.3, rearZ, d * 0.12], [-w * 0.2, w * 0.2, -d * 0.18, d * 0.06], wheel * 0.45, h * 0.58, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.3, w * 0.3, wheel * 0.37, wheel * 0.44, -d * 0.08, d * 0.22, C.dark, C.metal, EDGE_FAINT);
  b.lyingCyl("z", w * 0.24, rearZ - d * 0.04, wheel * 0.2, wheel * 0.47, d * 0.4, wheel * 0.25, C.metal, C.dark, 10, EDGE_FAINT);
  b.pad(-w * 0.3, w * 0.3, h * 0.52, h * 0.62, -d * 0.25, d * 0.05, C.dark, C.fabricTop, 0.025, EDGE_FURN);
  // Fork, suspension and wheel guards make the two wheels read as one vehicle.
  b.seg(-w * 0.18, h * 0.48, d * 0.02, -w * 0.08, h * 0.86, frontZ, EDGE_FURN);
  b.seg(w * 0.18, h * 0.48, d * 0.02, w * 0.08, h * 0.86, frontZ, EDGE_FURN);
  b.seg(-w * 0.19, wheel * 0.63, rearZ, -w * 0.21, h * 0.54, -d * 0.12, EDGE_FAINT);
  b.seg(w * 0.19, wheel * 0.63, rearZ, w * 0.21, h * 0.54, -d * 0.12, EDGE_FAINT);
  b.seg(-w * 0.36, h * 0.9, frontZ, w * 0.36, h * 0.9, frontZ, EDGE_GLOW);
  b.box(-w * 0.23, w * 0.23, h * 0.72, h * 0.98, frontZ - d * 0.07, frontZ + d * 0.07, C.body, C.bodyTop, EDGE_FURN);
  b.cyl(0, frontZ + d * 0.075, Math.min(w, d) * 0.07, h * 0.82, h * 0.94, C.white, C.accent, 12, EDGE_GLOW);
  // Mirrors and rear rack, common on everyday Vietnamese step-through bikes.
  for (const sx of [-1, 1]) {
    b.seg(sx * w * 0.22, h * 0.9, frontZ, sx * w * 0.39, h, frontZ - d * 0.04, EDGE_FURN);
    b.cyl(sx * w * 0.39, frontZ - d * 0.04, w * 0.045, h * 0.97, h, C.glass, C.metal, 10, EDGE_GLOW);
  }
  b.seg(-w * 0.31, h * 0.66, -d * 0.31, w * 0.31, h * 0.66, -d * 0.31, EDGE_FURN);
}
function hammock(b, w, d, h) {
  const post = Math.min(0.07, w * 0.035);
  for (const x of [-w / 2 + post, w / 2 - post]) {
    b.box(x - post / 2, x + post / 2, 0, h, -post, post, C.metal, C.metal, EDGE_FURN);
    b.box(x - d * 0.25, x + d * 0.25, 0, post, -d * 0.36, d * 0.36, C.metal, C.metal, EDGE_FURN);
  }
  const x0 = -w / 2 + post;
  const x1 = w / 2 - post;
  b.loft([x0, -w * 0.14, -d * 0.34, d * 0.34], [x0 + 0.08, -w * 0.14, -d * 0.3, d * 0.3], h * 0.36, h * 0.42, C.fabric, C.fabricTop, EDGE_FAINT);
  b.loft([-w * 0.14, w * 0.14, -d * 0.34, d * 0.34], [-w * 0.13, w * 0.13, -d * 0.3, d * 0.3], h * 0.25, h * 0.31, C.fabric, C.fabricTop, EDGE_FAINT);
  b.loft([w * 0.14, x1, -d * 0.34, d * 0.34], [w * 0.14, x1 - 0.08, -d * 0.3, d * 0.3], h * 0.36, h * 0.42, C.fabric, C.fabricTop, EDGE_FAINT);
  b.seg(x0, h * 0.8, 0, -w * 0.14, h * 0.42, 0, EDGE_FURN);
  b.seg(w * 0.14, h * 0.42, 0, x1, h * 0.8, 0, EDGE_FURN);
}
function stoneTableSet(b, w, d, h) {
  const r = Math.min(w, d);
  b.cyl(0, 0, r * 0.08, 0, h - 0.07, C.metal, C.metal, 12);
  b.cyl(0, 0, r * 0.22, h - 0.07, h, C.body, C.bodyTop, 16, EDGE_FURN);
  for (const [x, z] of [[0, -0.38], [0.38, 0], [0, 0.38], [-0.38, 0]]) {
    b.cyl(x * w, z * d, r * 0.065, 0, h * 0.52, C.metal, C.metal, 10);
    b.cyl(x * w, z * d, r * 0.105, h * 0.52, h * 0.61, C.body, C.bodyTop, 12, EDGE_FAINT);
  }
}
function waterTank(b, w, d, h) {
  const r = Math.min(w, d) * 0.46;
  b.cyl(0, 0, r * 0.84, 0, h * 0.08, C.metal, C.metal, 12, EDGE_FURN);
  b.cyl(0, 0, r, h * 0.08, h * 0.92, C.metal, C.whiteTop, 20, EDGE_FURN);
  for (const y of [h * 0.28, h * 0.5, h * 0.72]) {
    for (let i = 0; i < 24; i++) {
      const a0 = i / 24 * Math.PI * 2;
      const a1 = (i + 1) / 24 * Math.PI * 2;
      b.seg(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r, EDGE_FAINT);
    }
  }
  b.cyl(0, 0, r * 0.18, h * 0.92, h, C.dark, C.bodyTop, 12, EDGE_FAINT);
}
function gateOrFence(b, w, d, h, gate) {
  const post = Math.min(0.12, w * 0.05);
  for (const x of [-w / 2 + post / 2, w / 2 - post / 2]) b.box(x - post / 2, x + post / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const panels = gate ? 2 : Math.max(3, Math.round(w / 0.4));
  const inner = w - 2 * post;
  for (let i = 0; i < panels; i++) {
    const x0 = -inner / 2 + inner * i / panels + post * 0.25;
    const x1 = -inner / 2 + inner * (i + 1) / panels - post * 0.25;
    b.box(x0, x1, h * 0.08, h * 0.92, -d * 0.18, d * 0.18, gate ? C.metal : C.wood, gate ? C.metal : C.woodTop, EDGE_FAINT);
    if (gate) b.seg(i === 0 ? x1 : x0, h * 0.46, d * 0.2, i === 0 ? x1 - 0.08 : x0 + 0.08, h * 0.46, d * 0.2, EDGE_GLOW);
  }
  if (!gate) for (const y of [h * 0.22, h * 0.76]) b.box(-inner / 2, inner / 2, y - 0.025, y + 0.025, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
}
export const ARCHITECTURE_OUTDOOR_FURNITURE_MODELS = {
  fence: ({
    b,
    w,
    d,
    h
  }) => (gateOrFence(b, w, d, h, false), 0.5),
  gate: ({
    b,
    w,
    d,
    h
  }) => (gateOrFence(b, w, d, h, true), 0.5),
  hammock: ({
    b,
    w,
    d,
    h
  }) => (hammock(b, w, d, h), 0.5),
  motorbike: ({
    b,
    w,
    d,
    h
  }) => (motorbike(b, w, d, h), 0.5),
  stairs: ({
    b,
    w,
    d,
    h
  }) => (stairs(b, w, d, h), 0.5),
  stairs_landing: ({
    b,
    w,
    d,
    h
  }) => (stairsLanding(b, w, d, h), 0.5),
  stone_table_set: ({
    b,
    w,
    d,
    h
  }) => (stoneTableSet(b, w, d, h), 0.5),
  water_tank: ({
    b,
    w,
    d,
    h
  }) => (waterTank(b, w, d, h), 0.5)
};