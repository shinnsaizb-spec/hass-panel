/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/kitchen-bath.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Kitchen appliances, cabinetry and bathroom fixtures.

import { Color } from "three";
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW, FurnitureBuilder as Builder, flipWinding } from "../furniture-builder.js";
import { DEG } from "../geo.js";
import { cabinet, fronts } from "./common.js";
export const FRIDGE_DOOR = 0.06;
function kitchen(b, w, d, h) {
  const doors = Math.max(1, Math.round(w / 0.6));
  cabinet(b, w, d - 0.02, h - 0.04, doors, h - 0.2);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
}
function fridge(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  const split = h * 0.62;
  b.seg(-w / 2, split, d / 2, w / 2, split, d / 2, EDGE_FAINT);
  const hx = w / 2 - 0.06;
  b.seg(hx, split + 0.08, d / 2 + 0.015, hx, split + 0.4, d / 2 + 0.015, EDGE_GLOW);
  b.seg(hx, split - 0.4, d / 2 + 0.015, hx, split - 0.08, d / 2 + 0.015, EDGE_GLOW);
}
function fridgeSmart(b, w, d, h) {
  const front = d / 2 - FRIDGE_DOOR;
  b.box(-w / 2, w / 2, 0.02, h, -d / 2, front, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2 + 0.05, w / 2 - 0.05, 0, 0.02, -d / 2 + 0.05, front - 0.05, C.dark);
  // shelves of both compartments, seen when a door stands open
  for (const y of [0.35, 0.7, 1.05, 1.4]) {
    if (y > h - 0.15) continue;
    b.seg(-w / 2 + 0.03, y, front + 0.001, -0.03, y, front + 0.001, EDGE_FAINT);
    b.seg(0.03, y, front + 0.001, w / 2 - 0.03, y, front + 0.001, EDGE_FAINT);
  }
}
export function pushFridgeDoors(buf, f, base, left, right) {
  const p0 = buf.p.length;
  pushFridgeDoorsUnflipped(buf, f, base, left, right);
  if (f.mirror) flipWinding(buf, p0);
}
function pushFridgeDoorsUnflipped(buf, f, base, left, right) {
  const a = f.rotation * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const mx = f.mirror ? -1 : 1;
  const tf = (lx, lz) => [f.x + mx * lx * c - lz * s, f.z + mx * lx * s + lz * c];
  const y0 = base + 0.05;
  const y1 = base + f.h - 0.02;
  const red = new Color(0.75, 0.1, 0.14);
  const dark = new Color(C.dark);
  const accent = new Color(C.accent);
  const dw = f.w / 2 - 0.006;
  // a door: u runs from the hinge along the door (positive to the right), v through its thickness (0 = front face)
  const door = (hx, sign, angle) => {
    const open = angle / opening;
    const front = new Color(0x1f2d4c).lerp(red, open);
    const side = new Color(C.body).lerp(red, open * 0.8);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const at = (u, v) => tf(hx + sign * (u * ca - v * sa), f.d / 2 + u * sa + v * ca);
    const quad = (p, ya, yb, col) => {
      const [p0, p1, p2, p3] = p;
      buf.tri([p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p2[0], yb, p2[1]], col);
      buf.tri([p0[0], ya, p0[1]], [p2[0], yb, p2[1]], [p3[0], yb, p3[1]], col);
    };
    const box = (u0, u1, ya, yb, v0, v1, col, face = col) => {
      const q = [at(u0, v1), at(u1, v1), at(u1, v0), at(u0, v0)];
      // front (v1 side), back, sides, top and bottom
      quad([q[0], q[1], q[1], q[0]], ya, yb, face);
      quad([q[3], q[2], q[2], q[3]], ya, yb, col);
      quad([q[0], q[3], q[3], q[0]], ya, yb, col);
      quad([q[1], q[2], q[2], q[1]], ya, yb, col);
      quad([q[0], q[1], q[2], q[3]], yb, yb, col);
      quad([q[3], q[2], q[1], q[0]], ya, ya, col);
    };
    box(0, dw, y0, y1, -FRIDGE_DOOR, 0, side, front);
    // handle at the free edge
    box(dw - 0.05, dw - 0.03, base + f.h * 0.45, base + f.h * 0.75, 0.005, 0.025, accent);
    return box;
  };
  const opening = 1.83; // ~105°
  const leftBox = door(-f.w / 2, 1, left * opening);
  // water dispenser: a dark recess in the left door
  leftBox(0.12, 0.3, base + f.h * 0.5, base + f.h * 0.68, 0.001, 0.005, dark);
  const rightBox = door(f.w / 2, -1, right * opening);
  // the screen: a dark panel on the right door (a picture rule puts its picture over it)
  rightBox(0.06, dw - 0.06, base + f.h * 0.52, base + f.h * 0.86, 0.001, 0.005, dark);
}
function stove(b, w, d, h) {
  cabinet(b, w, d - 0.02, h - 0.04, 1, h - 0.24, true);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
  for (const [x, z, r] of [[-0.14, -0.13, 0.09], [0.14, -0.13, 0.07], [-0.14, 0.13, 0.07], [0.14, 0.13, 0.09]]) {
    const sx = x * w / 0.6;
    const sz = z * d / 0.62;
    b.cyl(sx, sz, r, h, h + 0.004, C.dark, 0x16263f, 12, EDGE_GLOW);
  }
}
function sink(b, w, d, h) {
  cabinet(b, w, d - 0.02, h - 0.04, Math.max(1, Math.round(w / 0.45)), h - 0.2);
  const bw = Math.min(0.5, w - 0.2);
  b.box(-w / 2, -bw / 2, h - 0.04, h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
  b.box(bw / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
  b.box(-bw / 2, bw / 2, h - 0.04, h, -d / 2, -d / 2 + 0.1, C.whiteTop, C.whiteTop);
  b.box(-bw / 2, bw / 2, h - 0.04, h, d / 2 - 0.08, d / 2, C.whiteTop, C.whiteTop);
  b.box(-bw / 2, bw / 2, h - 0.2, h - 0.17, -d / 2 + 0.1, d / 2 - 0.08, C.metal, C.metal, EDGE_GLOW);
  b.cyl(0, -d / 2 + 0.05, 0.02, h, h + 0.28, C.metal, C.metal, 8);
  b.box(-0.015, 0.015, h + 0.24, h + 0.28, -d / 2 + 0.05, -d / 2 + 0.22, C.metal);
}
function kitchenWall(b, w, d, h) {
  // hangs above the worktop
  const y0 = 1.45;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2 - 0.02, C.body, C.bodyTop, EDGE_FURN);
  fronts(b, -w / 2, w / 2, y0, y0 + h, d / 2 - 0.02, Math.max(1, Math.round(w / 0.5)), y0 + 0.08);
}
function kitchenTall(b, w, d, h) {
  b.box(-w / 2, w / 2, 0.02, h, -d / 2, d / 2 - 0.02, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2 + 0.02, w / 2 - 0.02, 0, 0.08, -d / 2 + 0.02, d / 2 - 0.06, C.dark);
  const z = d / 2 - 0.02;
  // oven with a dark glass door and a glowing handle, fronts above and below
  b.box(-w / 2 + 0.03, w / 2 - 0.03, 0.85, 1.45, z, z + 0.01, C.dark, C.dark, EDGE_GLOW);
  b.seg(-w / 2 + 0.08, 1.4, z + 0.02, w / 2 - 0.08, 1.4, z + 0.02, EDGE_GLOW);
  for (const y of [0.85, 1.45]) b.seg(-w / 2, y, z, w / 2, y, z, EDGE_FAINT);
  b.seg(w / 2 - 0.06, 0.5, z + 0.012, w / 2 - 0.06, 0.7, z + 0.012, EDGE_GLOW);
  b.seg(w / 2 - 0.06, 1.6, z + 0.012, w / 2 - 0.06, 1.8, z + 0.012, EDGE_GLOW);
}
function kitchenDisplay(b, w, d, h) {
  const frame = Math.min(0.055, w * 0.075);
  const front = d / 2;
  const rear = -d / 2;
  const lower = Math.min(0.62, h * 0.3);
  // carcass and a closed lower cupboard
  b.box(-w / 2, w / 2, 0.02, h, rear, rear + 0.035, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, -w / 2 + frame, 0.02, h, rear, front, C.body, C.bodyTop, EDGE_FURN);
  b.box(w / 2 - frame, w / 2, 0.02, h, rear, front, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - frame, h, rear, front, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, 0.02, lower, rear, front - 0.015, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2 + 0.02, w / 2 - 0.02, 0, 0.08, rear + 0.02, front - 0.04, C.dark);
  // lit display chamber: glass fronts, slim frames and three shelves
  b.box(-w / 2 + frame, w / 2 - frame, lower, h - frame, rear + 0.036, rear + 0.05, C.dark, C.dark);
  for (const y of [lower + (h - lower) * 0.25, lower + (h - lower) * 0.5, lower + (h - lower) * 0.75]) {
    b.box(-w / 2 + frame, w / 2 - frame, y - 0.012, y + 0.012, rear + 0.05, front - 0.025, C.glass, C.glass, EDGE_GLOW);
  }
  b.box(-w / 2 + frame, -frame * 0.35, lower + frame, h - frame * 1.5, front - 0.012, front, C.glass, C.glass, EDGE_FAINT);
  b.box(frame * 0.35, w / 2 - frame, lower + frame, h - frame * 1.5, front - 0.012, front, C.glass, C.glass, EDGE_FAINT);
  b.box(-frame * 0.35, frame * 0.35, lower, h - frame, front - 0.02, front + 0.005, C.metal, C.metal, EDGE_FURN);
  b.box(-w / 2, w / 2, lower - frame * 0.5, lower + frame * 0.5, front - 0.02, front + 0.005, C.body, C.bodyTop, EDGE_FURN);
  b.seg(-frame * 1.4, lower + (h - lower) * 0.46, front + 0.012, -frame * 1.4, lower + (h - lower) * 0.62, front + 0.012, EDGE_GLOW);
  b.seg(frame * 1.4, lower + (h - lower) * 0.46, front + 0.012, frame * 1.4, lower + (h - lower) * 0.62, front + 0.012, EDGE_GLOW);
  b.seg(0, 0.12, front + 0.012, 0, lower - 0.12, front + 0.012, EDGE_FAINT);
}
function island(b, w, d, h) {
  const inner = d - 0.3;
  b.box(-w / 2 + 0.05, w / 2 - 0.05, 0.08, h - 0.04, -d / 2 + 0.02, -d / 2 + inner, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2 + 0.07, w / 2 - 0.07, 0, 0.08, -d / 2 + 0.04, -d / 2 + inner - 0.04, C.dark);
  fronts(b, -w / 2 + 0.05, w / 2 - 0.05, 0.08, h - 0.04, -d / 2 + inner, Math.max(2, Math.round(w / 0.6)), h - 0.2);
  // worktop overhangs on the front for bar stools
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
}
function rangeHood(b, w, d, h) {
  b.box(-w * 0.16, w * 0.16, h * 0.42, h, -d / 2, -d * 0.18, C.metal, C.metal, EDGE_FURN);
  b.loft([-w / 2, w / 2, -d / 2, d / 2], [-w * 0.18, w * 0.18, -d / 2, -d * 0.1], 0, h * 0.48, C.metal, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.4, w * 0.4, 0, h * 0.06, d * 0.18, d / 2, C.dark, C.dark, EDGE_GLOW);
}
function microwave(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.4, w * 0.18, h * 0.17, h * 0.82, d / 2, d / 2 + 0.006, C.dark, C.glass, EDGE_GLOW);
  b.cyl(w * 0.34, d / 2 + 0.008, Math.min(w, h) * 0.055, h * 0.58, h * 0.69, C.accent, C.accent, 10, EDGE_GLOW);
  b.seg(w * 0.28, h * 0.34, d / 2 + 0.009, w * 0.4, h * 0.34, d / 2 + 0.009, EDGE_FAINT);
}
function waterPurifier(b, w, d, h) {
  // Upright RO cabinet with a glass front and a single small faucet on its top, common in domestic
  // Sunhouse-style purifiers. `h` includes the faucet; the cabinet itself is roughly one metre high.
  const cabinetH = h * 0.8;
  const front = d / 2;
  b.box(-w * 0.46, w * 0.46, 0.025, cabinetH, -d / 2, front, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.48, w * 0.48, 0, 0.035, -d * 0.44, d * 0.44, C.dark, C.dark);
  // Bright glass-front door, split subtly into service and branding panels.
  b.box(-w * 0.42, w * 0.42, 0.055, cabinetH - 0.035, front, front + 0.012, C.white, C.whiteTop, EDGE_FURN);
  b.seg(-w * 0.4, cabinetH * 0.28, front + 0.014, w * 0.4, cabinetH * 0.28, front + 0.014, EDGE_FAINT);
  b.seg(-w * 0.28, cabinetH * 0.58, front + 0.015, w * 0.28, cabinetH * 0.58, front + 0.015, EDGE_GLOW);
  b.seg(-w * 0.2, cabinetH * 0.62, front + 0.015, w * 0.2, cabinetH * 0.62, front + 0.015, EDGE_FAINT);
  // Bright glass top and a subtle circular drip area directly under the outlet.
  b.box(-w / 2, w / 2, cabinetH - 0.025, cabinetH, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);

  // A solid gooseneck faucet. Its curved tube is deliberately larger than a line outline so the
  // water outlet stays obvious in the normal isometric demo view.
  const pipe = Math.min(0.012, w * 0.03);
  const faucetX = w * 0.1;
  const stemZ = -d * 0.16;
  const tipZ = d * 0.08;
  const silver = 0x6684ad;
  b.cyl(faucetX, stemZ, pipe * 1.55, cabinetH, cabinetH + pipe * 1.8, silver, silver, 12, EDGE_FURN);
  b.cyl(faucetX, tipZ, w * 0.16, cabinetH, cabinetH + 0.01, C.whiteTop, C.whiteTop, 18, EDGE_FAINT);
  b.seg(faucetX - w * 0.1, cabinetH + 0.012, tipZ, faucetX + w * 0.1, cabinetH + 0.012, tipZ, EDGE_FAINT);
  b.seg(faucetX, cabinetH + 0.012, tipZ - d * 0.11, faucetX, cabinetH + 0.012, tipZ + d * 0.11, EDGE_FAINT);
  const archY = h * 0.925;
  const archRise = h * 0.055;
  const centreZ = (stemZ + tipZ) / 2;
  const radiusZ = (tipZ - stemZ) / 2;
  const path = [[cabinetH + pipe, stemZ], [archY, stemZ]];
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI - Math.PI * i / 8;
    path.push([archY + Math.sin(a) * archRise, centreZ + Math.cos(a) * radiusZ]);
  }
  // The free outlet ends well above the top instead of closing into a handle-like loop.
  path.push([h * 0.89, tipZ]);
  b.tubeYZ(faucetX, path, pipe, silver, 10);
  b.cyl(faucetX, tipZ, pipe * 1.25, h * 0.89 - pipe, h * 0.905, C.dark, silver, 10, EDGE_FAINT);
  // Short solid lever beside the faucet base.
  b.lyingCyl("x", faucetX + w * 0.055, stemZ, cabinetH + pipe * 1.6, cabinetH + pipe * 2.5, w * 0.15, pipe * 0.9, C.dark, silver, 8);
}
function kitchenCorner(b, w, d, h) {
  const arm = Math.max(0.42, Math.min(w, d) * 0.46);
  b.box(-w / 2, w / 2, 0, h - 0.04, -d / 2, -d / 2 + arm, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, -w / 2 + arm, 0, h - 0.04, -d / 2 + arm, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, -d / 2 + arm, C.whiteTop, C.whiteTop, EDGE_GLOW);
  b.box(-w / 2, -w / 2 + arm, h - 0.04, h, -d / 2 + arm, d / 2, C.whiteTop, C.whiteTop, EDGE_GLOW);
  b.seg(-w / 2 + arm, 0.08, -d / 2 + arm, -w / 2 + arm, h - 0.08, -d / 2 + arm, EDGE_FAINT);
  // cabinet fronts follow both arms so the corner reads clearly in 3D
  const zFront = -d / 2 + arm + 0.006;
  const xFront = -w / 2 + arm + 0.006;
  for (let i = 1; i < 3; i++) {
    const x = -w / 2 + arm + (w - arm) * i / 3;
    b.seg(x, 0.08, zFront, x, h - 0.08, zFront, EDGE_FAINT);
    const z = -d / 2 + arm + (d - arm) * i / 3;
    b.seg(xFront, 0.08, z, xFront, h - 0.08, z, EDGE_FAINT);
  }
  b.seg(-w / 2 + arm + 0.08, h * 0.72, zFront + 0.004, -w / 2 + arm + 0.22, h * 0.72, zFront + 0.004, EDGE_GLOW);
  b.seg(xFront + 0.004, h * 0.72, -d / 2 + arm + 0.08, xFront + 0.004, h * 0.72, -d / 2 + arm + 0.22, EDGE_GLOW);
}
function coffeeMachine(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.006;
  b.box(-w * 0.34, w * 0.34, h * 0.34, h * 0.76, front, front + 0.012, C.body, C.bodyTop, EDGE_GLOW);
  b.box(-w * 0.36, w * 0.36, h * 0.08, h * 0.17, d * 0.12, d / 2 + 0.03, C.metal, C.metal, EDGE_FAINT);
  b.cyl(-w * 0.13, d * 0.37, w * 0.025, h * 0.28, h * 0.48, C.metal, C.metal, 8, EDGE_GLOW);
  b.cyl(w * 0.13, d * 0.37, w * 0.025, h * 0.28, h * 0.48, C.metal, C.metal, 8, EDGE_GLOW);
  b.cyl(w * 0.3, d / 2 + 0.014, w * 0.035, h * 0.83, h * 0.9, C.accent, C.accent, 10, EDGE_GLOW);
}
function glassCooler(b, w, d, h, shelves) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.006;
  b.box(-w * 0.42, w * 0.42, h * 0.08, h * 0.92, front, front + 0.012, C.glass, C.dark, EDGE_GLOW);
  for (let i = 1; i < shelves; i++) {
    const y = h * (0.08 + 0.84 * i / shelves);
    b.seg(-w * 0.38, y, front + 0.014, w * 0.38, y, front + 0.014, EDGE_FAINT);
  }
  b.seg(w * 0.34, h * 0.55, front + 0.018, w * 0.34, h * 0.82, front + 0.018, EDGE_GLOW);
}
function islandBar(b, w, d, h) {
  const workH = h * 0.86;
  b.box(-w * 0.46, w * 0.46, 0.06, workH, -d / 2, d * 0.12, C.body, C.bodyTop, EDGE_FURN);
  fronts(b, -w * 0.46, w * 0.46, 0.08, workH, d * 0.12, 4, workH * 0.72);
  b.box(-w / 2, w / 2, workH, workH + 0.05, -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_GLOW);
  b.box(-w / 2, w / 2, h - 0.05, h, d * 0.1, d / 2, C.whiteTop, C.whiteTop, EDGE_GLOW);
  for (const x of [-w * 0.43, w * 0.43]) b.box(x - 0.035, x + 0.035, workH, h, d * 0.34, d * 0.43, C.metal, C.metal, EDGE_FURN);
}
function recyclingStation(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.008;
  for (let i = 0; i < 3; i++) {
    const x0 = -w / 2 + w * i / 3 + 0.02;
    const x1 = -w / 2 + w * (i + 1) / 3 - 0.02;
    b.box(x0, x1, h * 0.12, h * 0.76, front, front + 0.012, i === 0 ? C.accent : i === 1 ? C.metal : C.dark, C.bodyTop, EDGE_FAINT);
    b.seg(x0 + w * 0.04, h * 0.68, front + 0.016, x1 - w * 0.04, h * 0.68, front + 0.016, EDGE_GLOW);
  }
}
function pantryPullout(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.008;
  b.box(-w * 0.43, w * 0.43, h * 0.03, h * 0.97, front, front + 0.012, C.white, C.whiteTop, EDGE_FAINT);
  for (let i = 1; i < 6; i++) b.seg(-w * 0.34, h * i / 6, front + 0.016, w * 0.34, h * i / 6, front + 0.016, EDGE_FAINT);
  b.seg(w * 0.32, h * 0.38, front + 0.02, w * 0.32, h * 0.64, front + 0.02, EDGE_GLOW);
}
function cornerCarousel(b, w, d, h) {
  const r = Math.min(w, d) * 0.43;
  b.box(-w / 2, w / 2, 0, h, -d / 2, -d * 0.06, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w / 2, -w * 0.06, 0, h, -d * 0.06, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.cyl(-w * 0.06, -d * 0.06, r, h * 0.08, h * 0.12, C.metal, C.whiteTop, 24, EDGE_GLOW);
  b.cyl(-w * 0.06, -d * 0.06, r * 0.94, h * 0.47, h * 0.51, C.metal, C.whiteTop, 24, EDGE_GLOW);
  b.cyl(-w * 0.06, -d * 0.06, 0.025, h * 0.08, h * 0.84, C.metal, C.metal, 10, EDGE_FAINT);
  b.box(-w / 2, w / 2, h - 0.04, h, -d / 2, -d * 0.06, C.whiteTop, C.whiteTop, EDGE_FURN);
  b.box(-w / 2, -w * 0.06, h - 0.04, h, -d * 0.06, d / 2, C.whiteTop, C.whiteTop, EDGE_FURN);
}
function ovenTower(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const front = d / 2 + 0.006;
  for (const [y0, y1] of [[h * 0.18, h * 0.45], [h * 0.5, h * 0.76]]) {
    b.box(-w * 0.43, w * 0.43, y0, y1, front, front + 0.012, C.dark, C.glass, EDGE_GLOW);
    b.seg(-w * 0.34, y1 - h * 0.045, front + 0.017, w * 0.34, y1 - h * 0.045, front + 0.017, EDGE_GLOW);
  }
}
function openShelf(b, w, d, h, plateRack = false) {
  const side = Math.min(0.045, w * 0.06);
  b.box(-w / 2, -w / 2 + side, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(w / 2 - side, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  for (let i = 0; i <= 3; i++) {
    const y = h * i / 3;
    b.box(-w / 2, w / 2, Math.max(0, y - 0.018), Math.min(h, y + 0.018), -d / 2, d / 2, C.whiteTop, C.whiteTop, EDGE_FAINT);
  }
  if (plateRack) for (let i = -3; i <= 3; i++) b.seg(w * i / 9, h * 0.1, d * 0.15, w * i / 9, h * 0.48, d * 0.15, EDGE_GLOW);
}
function spiceRack(b, w, d, h) {
  openShelf(b, w, d, h);
  for (const y of [h * 0.22, h * 0.52, h * 0.82]) for (const x of [-w * 0.28, 0, w * 0.28]) b.cyl(x, d * 0.08, w * 0.055, y - h * 0.1, y, C.accent, C.whiteTop, 10, EDGE_FAINT);
}
function kitchenCart(b, w, d, h) {
  for (const y of [h * 0.18, h * 0.5, h * 0.84]) b.box(-w * 0.46, w * 0.46, y, y + 0.045, -d * 0.43, d * 0.43, C.whiteTop, C.whiteTop, EDGE_FURN);
  for (const x of [-w * 0.42, w * 0.42]) for (const z of [-d * 0.38, d * 0.38]) b.box(x - 0.025, x + 0.025, h * 0.08, h * 0.86, z - 0.025, z + 0.025, C.metal, C.metal, EDGE_FAINT);
  for (const x of [-w * 0.42, w * 0.42]) for (const z of [-d * 0.38, d * 0.38]) b.cyl(x, z, Math.min(w, d) * 0.07, 0, h * 0.1, C.dark, C.dark, 10, EDGE_FURN);
}
export const KITCHEN_BATH_FURNITURE_MODELS = {
  fridge: ({
    b,
    w,
    d,
    h
  }) => (fridge(b, w, d, h), 0.5),
  fridge_smart: ({
    b,
    w,
    d,
    h
  }) => (fridgeSmart(b, w, d, h), 0.5),
  island: ({
    b,
    w,
    d,
    h
  }) => (island(b, w, d, h), 0.5),
  kitchen: ({
    b,
    w,
    d,
    h
  }) => (kitchen(b, w, d, h), 0.5),
  kitchen_corner: ({
    b,
    w,
    d,
    h
  }) => (kitchenCorner(b, w, d, h), 0.5),
  kitchen_display: ({
    b,
    w,
    d,
    h
  }) => (kitchenDisplay(b, w, d, h), 0.5),
  kitchen_coffee_machine: ({
    b,
    w,
    d,
    h
  }) => (coffeeMachine(b, w, d, h), false),
  kitchen_wine_fridge: ({
    b,
    w,
    d,
    h
  }) => (glassCooler(b, w, d, h, 5), 0.5),
  kitchen_island_bar: ({
    b,
    w,
    d,
    h
  }) => (islandBar(b, w, d, h), 0.5),
  kitchen_recycling_station: ({
    b,
    w,
    d,
    h
  }) => (recyclingStation(b, w, d, h), 0.5),
  kitchen_pantry_pullout: ({
    b,
    w,
    d,
    h
  }) => (pantryPullout(b, w, d, h), 0.5),
  kitchen_corner_carousel: ({
    b,
    w,
    d,
    h
  }) => (cornerCarousel(b, w, d, h), 0.5),
  kitchen_oven_tower: ({
    b,
    w,
    d,
    h
  }) => (ovenTower(b, w, d, h), 0.5),
  kitchen_open_shelf: ({
    b,
    w,
    d,
    h
  }) => (openShelf(b, w, d, h), false),
  kitchen_spice_rack_wall: ({
    b,
    w,
    d,
    h
  }) => (spiceRack(b, w, d, h), false),
  kitchen_cart: ({
    b,
    w,
    d,
    h
  }) => (kitchenCart(b, w, d, h), 0.5),
  kitchen_plate_rack_wall: ({
    b,
    w,
    d,
    h
  }) => (openShelf(b, w, d, h, true), false),
  kitchen_freezer: ({
    b,
    w,
    d,
    h
  }) => (glassCooler(b, w, d, h, 4), 0.5),
  kitchen_tall: ({
    b,
    w,
    d,
    h
  }) => (kitchenTall(b, w, d, h), 0.5),
  kitchen_wall: ({
    b,
    w,
    d,
    h
  }) => (kitchenWall(b, w, d, h), false),
  microwave: ({
    b,
    w,
    d,
    h,
    base
  }) => (microwave(b, w, d, h), base > 0.05 ? false : 0.5),
  range_hood: ({
    b,
    w,
    d,
    h
  }) => (rangeHood(b, w, d, h), false),
  sink: ({
    b,
    w,
    d,
    h
  }) => (sink(b, w, d, h), 0.5),
  stove: ({
    b,
    w,
    d,
    h
  }) => (stove(b, w, d, h), 0.5),
  water_purifier: ({
    b,
    w,
    d,
    h
  }) => (waterPurifier(b, w, d, h), 0.5)
};