/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/vehicles.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in low-poly vehicles. Shapes are generic functional silhouettes, not branded models.
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function wheels(b, w, d, h, r = h * 0.18) {
  for (const x of [-w * 0.47, w * 0.47]) for (const z of [-d * 0.31, d * 0.31]) b.lyingCyl("x", x, z, r, r, w * 0.12, r, C.dark, C.metal, 12, EDGE_FURN);
}
function car(b, w, d, h, style) {
  wheels(b, w, d, h);
  const base = h * 0.2,
    belt = style === "suv" || style === "van" || style === "minibus" ? h * 0.58 : h * 0.5;
  b.loft([-w * 0.47, w * 0.47, -d * 0.46, d * 0.46], [-w * 0.44, w * 0.44, -d * 0.42, d * 0.42], base, belt, C.body, C.bodyTop, EDGE_FURN);
  if (style === "pickup") {
    b.loft([-w * 0.4, w * 0.4, d * 0.02, d * 0.4], [-w * 0.33, w * 0.33, d * 0.08, d * 0.27], belt, h * 0.92, C.body, C.glass, EDGE_GLOW);
    b.box(-w * 0.42, w * 0.42, belt, belt + 0.06, -d * 0.4, -d * 0.02, C.dark, C.bodyTop, EDGE_FAINT);
  } else {
    const longRoof = style === "wagon" || style === "van" || style === "minibus" || style === "suv";
    const back = longRoof ? -d * 0.36 : -d * 0.22;
    const front = style === "van" || style === "minibus" ? d * 0.36 : d * 0.24;
    b.loft([-w * 0.39, w * 0.39, back, front], [-w * 0.34, w * 0.34, back + d * 0.04, front - d * 0.06], belt, h * 0.94, C.glass, C.bodyTop, EDGE_GLOW);
  }
  for (const x of [-w * 0.27, w * 0.27]) b.box(x - w * 0.1, x + w * 0.1, h * 0.32, h * 0.4, d * 0.46, d * 0.475, C.white, C.accent, EDGE_GLOW);
  if (style === "electric") b.box(-w * 0.22, w * 0.22, base + 0.02, base + 0.06, -d * 0.47, -d * 0.455, C.accent, C.accent, EDGE_GLOW);
}
function bicycle(b, w, d, h, cargo) {
  const r = Math.min(h * 0.34, d * 0.19);
  for (const z of [-d * 0.36, d * 0.36]) b.lyingCyl("x", 0, z, r, r, w * 0.12, r, C.dark, C.metal, 14, EDGE_FURN);
  b.seg(0, r, -d * 0.36, 0, h * 0.58, 0, EDGE_GLOW);
  b.seg(0, h * 0.58, 0, 0, r, d * 0.36, EDGE_GLOW);
  b.seg(0, r, -d * 0.36, 0, r, d * 0.36, EDGE_FAINT);
  b.seg(-w * 0.32, h * 0.72, d * 0.28, w * 0.32, h * 0.72, d * 0.28, EDGE_FURN);
  if (cargo) b.box(-w * 0.42, w * 0.42, r * 0.8, r * 1.55, -d * 0.3, -d * 0.02, C.wood, C.woodTop, EDGE_FURN);
}
function poweredTwoWheel(b, w, d, h, touring) {
  const r = Math.min(w * 0.38, d * 0.14, h * 0.25);
  for (const z of [-d * 0.34, d * 0.34]) b.lyingCyl("x", 0, z, r, r, w * 0.62, r, C.dark, C.metal, 12, EDGE_FURN);
  b.loft([-w * 0.3, w * 0.3, -d * 0.27, d * 0.18], [-w * 0.2, w * 0.2, -d * 0.16, d * 0.08], r * 0.8, h * 0.62, C.body, C.bodyTop, EDGE_FURN);
  b.pad(-w * 0.28, w * 0.28, h * 0.55, h * 0.65, -d * 0.28, d * 0.02, C.dark, C.fabricTop, 0.02, EDGE_FAINT);
  b.seg(0, h * 0.55, d * 0.05, 0, h * 0.9, d * 0.33, EDGE_GLOW);
  if (touring) for (const x of [-w * 0.38, w * 0.38]) b.box(x - w * 0.1, x + w * 0.1, h * 0.38, h * 0.64, -d * 0.3, -d * 0.08, C.body, C.bodyTop, EDGE_FAINT);
}
export const VEHICLE_FURNITURE_MODELS = {
  bicycle_city: ({
    b,
    w,
    d,
    h
  }) => (bicycle(b, w, d, h, false), 0.5),
  bicycle_cargo: ({
    b,
    w,
    d,
    h
  }) => (bicycle(b, w, d, h, true), 0.5),
  scooter: ({
    b,
    w,
    d,
    h
  }) => (poweredTwoWheel(b, w, d, h, false), 0.5),
  motorcycle_touring: ({
    b,
    w,
    d,
    h
  }) => (poweredTwoWheel(b, w, d, h, true), 0.5),
  car_sedan: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "sedan"), 0.5),
  car_hatchback: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "hatch"), 0.5),
  car_suv: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "suv"), 0.5),
  car_pickup: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "pickup"), 0.5),
  car_van: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "van"), 0.5),
  car_wagon: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "wagon"), 0.5),
  car_compact: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "compact"), 0.5),
  car_electric: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "electric"), 0.5),
  car_minibus: ({
    b,
    w,
    d,
    h
  }) => (car(b, w, d, h, "minibus"), 0.5)
};