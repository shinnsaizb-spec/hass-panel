/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/smart-home.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Smart-home devices, controls and technical infrastructure.

import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function airPurifier(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.04, w * 0.1), EDGE_FURN);
  const front = d / 2 + 0.006;
  b.cyl(0, d / 2, w * 0.095, h * 0.69, h * 0.705, C.dark, C.dark, 18, EDGE_GLOW);
  for (let i = 0; i < 7; i++) {
    const y = h * (0.16 + i * 0.055);
    b.seg(-w * 0.34, y, front, w * 0.34, y, front, EDGE_FAINT);
  }
  for (let i = -3; i <= 3; i++) b.seg(i * w * 0.085, h + 0.003, -d * 0.27, i * w * 0.085, h + 0.003, d * 0.22, EDGE_FAINT);
}
function smartSpeaker(b, w, d, h) {
  const r = Math.min(w, d) * 0.46;
  b.cyl(0, 0, r, h * 0.06, h * 0.9, C.dark, C.fabricTop, 18, EDGE_FURN);
  b.cyl(0, 0, r * 0.94, h * 0.9, h, C.dark, C.dark, 18, EDGE_GLOW);
  b.cyl(0, 0, r * 0.72, h, h + 0.006, C.dark, C.dark, 18, EDGE_FAINT);
  for (const x of [-w * 0.12, w * 0.12]) b.cyl(x, 0, w * 0.014, h + 0.007, h + 0.01, C.white, C.white, 8);
}
function securityCamera(b, w, d, h) {
  const y0 = 1.85;
  b.box(-w * 0.28, w * 0.28, y0, y0 + h * 0.7, -d / 2, -d / 2 + d * 0.12, C.white, C.whiteTop, EDGE_FURN);
  b.box(-w * 0.08, w * 0.08, y0 + h * 0.3, y0 + h * 0.45, -d / 2 + d * 0.1, 0, C.metal, C.metal, EDGE_FAINT);
  b.lyingCyl("z", 0, d * 0.16, y0 + h * 0.17, y0 + h * 0.78, d * 0.58, h * 0.58, C.white, C.whiteTop, 14, EDGE_FURN);
  b.lyingCyl("z", 0, d * 0.47, y0 + h * 0.28, y0 + h * 0.67, d * 0.08, h * 0.38, C.dark, C.dark, 16, EDGE_GLOW);
  b.lyingCyl("z", 0, d * 0.515, y0 + h * 0.38, y0 + h * 0.57, d * 0.025, h * 0.18, C.accent, C.dark, 14);
}
function smartLock(b, w, d, h) {
  const y0 = 0.95;
  const front = d / 2;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, front, C.dark, C.metal, Math.min(0.018, w * 0.12), EDGE_FURN);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const x = (col - 1) * w * 0.22;
    const y = y0 + h * (0.7 - row * 0.105);
    b.seg(x - w * 0.025, y, front + 0.005, x + w * 0.025, y, front + 0.005, EDGE_GLOW);
  }
  b.cyl(0, front, w * 0.12, y0 + h * 0.22, y0 + h * 0.235, C.accent, C.dark, 14, EDGE_GLOW);
  b.lyingCyl("x", w * 0.22, front + d * 0.12, y0 + h * 0.31, y0 + h * 0.4, w * 0.75, h * 0.085, C.metal, C.metal, 10, EDGE_FURN);
}
function smartCurtain(b, w, d, h) {
  const trackY = h * 0.96;
  b.lyingCyl("x", 0, -d * 0.18, trackY, h, w, d * 0.16, C.metal, C.metal, 10, EDGE_FURN);
  b.box(-w * 0.06, w * 0.06, trackY - h * 0.055, trackY + h * 0.015, -d * 0.28, d * 0.02, C.dark, C.dark, EDGE_GLOW);
  const gap = w * 0.12;
  const folds = 6;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -w / 2 : gap;
    const x1 = side < 0 ? -gap : w / 2;
    const step = (x1 - x0) / folds;
    for (let i = 0; i < folds; i++) {
      const a = x0 + i * step;
      const z = i % 2 ? d * 0.12 : -d * 0.04;
      b.box(a, a + step * 0.82, h * 0.04, trackY, z - d * 0.18, z + d * 0.18, C.fabric, C.fabricTop, i === 0 || i === folds - 1 ? EDGE_FURN : null);
    }
  }
}
function networkCabinet(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.42, w * 0.42, h * 0.06, h * 0.94, d * 0.48, d * 0.515, C.glass, C.glass, EDGE_FAINT);
  for (let i = 0; i < 7; i++) {
    const y = h * (0.16 + i * 0.105);
    b.box(-w * 0.34, w * 0.34, y, y + h * 0.035, d * 0.505, d * 0.535, i % 3 === 1 ? C.metal : C.bodyTop, C.bodyTop, EDGE_FAINT);
  }
  b.box(-w * 0.22, w * 0.22, h * 0.82, h * 0.86, d * 0.525, d * 0.545, C.accent, C.accent, EDGE_GLOW);
  b.cyl(w * 0.38, d * 0.525, w * 0.018, h * 0.48, h * 0.5, C.metal, C.metal, 8, EDGE_FAINT);
}
function nasServer(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.bodyTop, EDGE_FURN);
  const gap = w * 0.035;
  const bayW = (w * 0.72 - gap * 3) / 4;
  for (let i = 0; i < 4; i++) {
    const x0 = -w * 0.36 + i * (bayW + gap);
    b.box(x0, x0 + bayW, h * 0.13, h * 0.86, d * 0.49, d * 0.525, C.body, C.metal, EDGE_FAINT);
    b.box(x0 + bayW * 0.18, x0 + bayW * 0.82, h * 0.18, h * 0.205, d * 0.52, d * 0.54, C.accent, C.accent, EDGE_GLOW);
  }
  b.cyl(w * 0.41, d * 0.52, w * 0.025, h * 0.7, h * 0.73, C.accent, C.accent, 10, EDGE_GLOW);
}
function ceilingAccessPoint(b, w, d, h) {
  const r = Math.min(w, d) * 0.47;
  b.cyl(0, 0, r, 0, h * 0.58, C.white, C.whiteTop, 16, EDGE_FURN);
  b.cyl(0, 0, r * 0.82, h * 0.58, h, C.white, C.whiteTop, 16, EDGE_FAINT);
  b.seg(-w * 0.16, h * 0.18, d * 0.455, w * 0.16, h * 0.18, d * 0.455, EDGE_GLOW);
}
function wallThermostat(b, w, d, h) {
  const y0 = 1.35;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.body, C.bodyTop, Math.min(0.018, w * 0.1), EDGE_FURN);
  b.box(-w * 0.37, w * 0.37, y0 + h * 0.34, y0 + h * 0.82, d * 0.48, d * 0.54, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.28, w * 0.28, y0 + h * 0.12, y0 + h * 0.22, d * 0.5, d * 0.55, C.metal, C.metal, EDGE_FAINT);
}
function smokeDetector(b, w, d, h) {
  const r = Math.min(w, d) * 0.47;
  b.cyl(0, 0, r, 0, h * 0.7, C.white, C.whiteTop, 16, EDGE_FURN);
  b.cyl(0, 0, r * 0.78, h * 0.7, h, C.white, C.whiteTop, 16, EDGE_FAINT);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const x = Math.cos(a) * r * 0.62;
    const z = Math.sin(a) * r * 0.62;
    b.cyl(x, z, r * 0.055, h * 0.12, h * 0.16, C.dark, C.dark, 6);
  }
  b.seg(-w * 0.1, h * 0.12, d * 0.46, w * 0.1, h * 0.12, d * 0.46, EDGE_GLOW);
}
function sirenAlarm(b, w, d, h) {
  const y0 = 1.85;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.loft([-w * 0.32, w * 0.32, d * 0.42, d * 0.56], [-w * 0.25, w * 0.25, d * 0.45, d * 0.58], y0 + h * 0.48, y0 + h * 0.82, 0x7a2034, 0xff3658, EDGE_GLOW);
  b.box(-w * 0.23, w * 0.23, y0 + h * 0.13, y0 + h * 0.25, d * 0.48, d * 0.56, C.accent, C.accent, EDGE_FAINT);
}
function electricalPanel(b, w, d, h) {
  const y0 = 0.85;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.43, w * 0.43, y0 + h * 0.07, y0 + h * 0.93, d * 0.47, d * 0.54, C.glass, C.glass, EDGE_FAINT);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = (col - 2) * w * 0.145;
    const y = y0 + h * (0.22 + row * 0.25);
    b.box(x - w * 0.045, x + w * 0.045, y, y + h * 0.075, d * 0.51, d * 0.56, row === 0 ? C.accent : C.metal, C.metal, EDGE_FAINT);
  }
}
function upsUnit(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.bodyTop, Math.min(0.025, w * 0.06), EDGE_FURN);
  b.box(-w * 0.32, w * 0.32, h * 0.58, h * 0.78, d * 0.49, d * 0.54, C.glass, C.glass, EDGE_GLOW);
  b.cyl(0, d * 0.51, w * 0.045, h * 0.4, h * 0.43, C.accent, C.accent, 10, EDGE_FAINT);
  for (let i = 0; i < 4; i++) b.seg(-w * 0.28, h * (0.12 + i * 0.06), d * 0.51, w * 0.28, h * (0.12 + i * 0.06), d * 0.51, EDGE_FAINT);
}
function modemRouter(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h * 0.62, -d / 2, d / 2, C.body, C.bodyTop, Math.min(0.018, h * 0.12), EDGE_FURN);
  for (const x of [-w * 0.38, w * 0.38]) b.cyl(x, -d * 0.35, w * 0.025, h * 0.2, h, C.dark, C.metal, 8, EDGE_FAINT);
  for (let i = -2; i <= 2; i++) b.cyl(i * w * 0.095, d * 0.48, w * 0.012, h * 0.2, h * 0.23, i === 0 ? C.accent : C.metal, i === 0 ? C.accent : C.metal, 6, EDGE_GLOW);
}
function heatPumpOutdoor(b, w, d, h) {
  b.box(-w / 2, w / 2, h * 0.04, h, -d / 2, d / 2, C.white, C.whiteTop, EDGE_FURN);
  // The gallery unit reads as a broad black horizontal grille, not as a visible round fan.
  b.box(-w * 0.42, w * 0.2, h * 0.17, h * 0.82, d * 0.5, d * 0.54, C.dark, C.dark, EDGE_FAINT);
  for (let i = 0; i < 6; i++) {
    const y = h * (0.23 + i * 0.09);
    b.box(-w * 0.4, w * 0.18, y, y + h * 0.025, d * 0.535, d * 0.555, C.bodyTop, C.bodyTop, EDGE_FAINT);
  }
  b.box(w * 0.29, w * 0.43, h * 0.2, h * 0.8, d * 0.5, d * 0.54, C.body, C.bodyTop, EDGE_FAINT);
  b.box(w * 0.32, w * 0.41, h * 0.62, h * 0.69, d * 0.53, d * 0.56, C.accent, C.accent, EDGE_GLOW);
}
function hotWaterTank(b, w, d, h) {
  const r = Math.min(w, d) * 0.45;
  b.cyl(0, 0, r, h * 0.035, h * 0.94, C.white, C.whiteTop, 18, EDGE_FURN);
  b.cyl(0, 0, r * 0.88, h * 0.94, h, C.white, C.whiteTop, 18, EDGE_FAINT);
  b.box(-w * 0.12, w * 0.12, h * 0.57, h * 0.66, d * 0.44, d * 0.49, C.glass, C.glass, EDGE_GLOW);
  for (const x of [-w * 0.18, w * 0.18]) b.cyl(x, 0, w * 0.035, 0, h * 0.05, C.metal, C.metal, 8, EDGE_FAINT);
}
function ventilationFan(b, w, d, h) {
  const y0 = 1.8;
  b.box(-w / 2, w / 2, y0, y0 + h, -d / 2, -d * 0.18, C.white, C.whiteTop, EDGE_FURN);
  const r = Math.min(w, h) * 0.38;
  b.lyingCyl("z", 0, d * 0.12, y0 + h * 0.12, y0 + h * 0.12 + r * 2, d * 0.52, r * 2, C.dark, C.bodyTop, 16, EDGE_FURN);
  for (let i = 0; i < 6; i++) {
    const y = y0 + h * (0.24 + i * 0.09);
    b.seg(-w * 0.34, y, d * 0.42, w * 0.34, y, d * 0.42, EDGE_FAINT);
  }
}
function humidifier(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, h * 0.12, h * 0.56, d * 0.49, d * 0.54, C.dark, C.dark, EDGE_FAINT);
  b.box(-w * 0.35, w * 0.35, h * 0.61, h * 0.69, d * 0.49, d * 0.55, C.accent, C.accent, EDGE_GLOW);
  b.box(w * 0.12, w * 0.31, h * 0.78, h * 0.84, d * 0.5, d * 0.55, C.accent, C.accent, EDGE_FAINT);
  for (let i = -2; i <= 2; i++) b.seg(i * w * 0.11, h + 0.003, -d * 0.22, i * w * 0.11, h + 0.003, d * 0.18, EDGE_FAINT);
}
function smartDisplay(b, w, d, h) {
  // Landscape control panel with the separate lower bar shown in the public gallery.
  b.box(-w * 0.48, w * 0.48, h * 0.18, h, -d * 0.2, d * 0.2, C.dark, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.39, w * 0.39, h * 0.35, h * 0.89, d * 0.19, d * 0.24, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.28, w * 0.28, h * 0.03, h * 0.17, -d * 0.03, d * 0.25, C.body, C.bodyTop, EDGE_FURN);
}
function wallSwitch(b, w, d, h) {
  const y0 = 1.05;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.012, w * 0.12), EDGE_FURN);
  b.box(-w * 0.32, w * 0.32, y0 + h * 0.14, y0 + h * 0.82, d * 0.42, d * 0.55, C.body, C.bodyTop, EDGE_FAINT);
  b.seg(-w * 0.16, y0 + h * 0.2, d * 0.56, w * 0.16, y0 + h * 0.2, d * 0.56, EDGE_GLOW);
}
function wallOutlet(b, w, d, h) {
  const y0 = 0.3;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.012, w * 0.12), EDGE_FURN);
  for (const x of [-w * 0.17, w * 0.17]) b.cyl(x, d * 0.51, w * 0.065, y0 + h * 0.38, y0 + h * 0.43, C.dark, C.dark, 8, EDGE_FAINT);
  b.seg(-w * 0.12, y0 + h * 0.18, d * 0.55, w * 0.12, y0 + h * 0.18, d * 0.55, EDGE_GLOW);
}
function smartPlug(b, w, d, h) {
  const y0 = 0.3;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.body, C.bodyTop, Math.min(0.014, w * 0.12), EDGE_FURN);
  b.cyl(0, d * 0.49, w * 0.27, y0 + h * 0.28, y0 + h * 0.34, C.dark, C.dark, 14, EDGE_FAINT);
  b.box(-w * 0.25, w * 0.25, y0 + h * 0.1, y0 + h * 0.17, d * 0.48, d * 0.56, C.accent, C.accent, EDGE_GLOW);
}
function motionSensor(b, w, d, h) {
  const y0 = 1.9;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.014, w * 0.13), EDGE_FURN);
  b.loft([-w * 0.38, w * 0.38, d * 0.4, d * 0.55], [-w * 0.27, w * 0.27, d * 0.43, d * 0.58], y0 + h * 0.3, y0 + h * 0.78, C.glass, C.glass, EDGE_GLOW);
  for (let i = 0; i < 3; i++) b.seg(-w * 0.23, y0 + h * (0.39 + i * 0.1), d * 0.59, w * 0.23, y0 + h * (0.39 + i * 0.1), d * 0.59, EDGE_FAINT);
}
function contactSensor(b, w, d, h) {
  const y0 = 1.1;
  b.pad(-w / 2, w * 0.12, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.008, h * 0.14), EDGE_FURN);
  b.pad(w * 0.24, w / 2, y0 + h * 0.12, y0 + h * 0.88, -d * 0.42, d * 0.42, C.metal, C.metal, Math.min(0.006, h * 0.1), EDGE_FAINT);
  b.seg(-w * 0.28, y0 + h * 0.16, d * 0.54, -w * 0.03, y0 + h * 0.16, d * 0.54, EDGE_GLOW);
}
function waterLeakSensor(b, w, d, h) {
  const r = Math.min(w, d) * 0.47;
  b.cyl(0, 0, r, 0, h, C.white, C.whiteTop, 12, EDGE_FURN);
  b.cyl(0, d * 0.12, r * 0.2, h, h * 1.08, C.accent, C.accent, 8, EDGE_GLOW);
  for (const x of [-w * 0.24, w * 0.24]) b.box(x - w * 0.055, x + w * 0.055, 0, h * 0.12, -d * 0.18, d * 0.18, C.metal, C.metal, EDGE_FAINT);
}
function temperatureHumiditySensor(b, w, d, h) {
  const y0 = 1.35;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.white, C.whiteTop, Math.min(0.012, w * 0.12), EDGE_FURN);
  b.box(-w * 0.35, w * 0.35, y0 + h * 0.3, y0 + h * 0.78, d * 0.46, d * 0.55, C.glass, C.glass, EDGE_GLOW);
  b.seg(-w * 0.22, y0 + h * 0.18, d * 0.56, w * 0.22, y0 + h * 0.18, d * 0.56, EDGE_FAINT);
}
function videoDoorbell(b, w, d, h) {
  const y0 = 1.25;
  b.pad(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, C.dark, C.bodyTop, Math.min(0.012, w * 0.18), EDGE_FURN);
  b.cyl(0, d * 0.48, w * 0.25, y0 + h * 0.67, y0 + h * 0.7, C.glass, C.glass, 12, EDGE_GLOW);
  b.cyl(0, d * 0.49, w * 0.2, y0 + h * 0.18, y0 + h * 0.21, C.body, C.bodyTop, 12, EDGE_FAINT);
  b.seg(-w * 0.18, y0 + h * 0.1, d * 0.56, w * 0.18, y0 + h * 0.1, d * 0.56, EDGE_GLOW);
}
export const SMART_HOME_FURNITURE_MODELS = {
  air_purifier: ({
    b,
    w,
    d,
    h
  }) => (airPurifier(b, w, d, h), 0.5),
  smart_speaker: ({
    b,
    w,
    d,
    h
  }) => (smartSpeaker(b, w, d, h), 0.5),
  security_camera: ({
    b,
    w,
    d,
    h
  }) => (securityCamera(b, w, d, h), false),
  smart_lock: ({
    b,
    w,
    d,
    h
  }) => (smartLock(b, w, d, h), false),
  smart_curtain: ({
    b,
    w,
    d,
    h
  }) => (smartCurtain(b, w, d, h), false),
  network_cabinet: ({
    b,
    w,
    d,
    h
  }) => (networkCabinet(b, w, d, h), 0.5),
  nas_server: ({
    b,
    w,
    d,
    h
  }) => (nasServer(b, w, d, h), 0.5),
  access_point: ({
    b,
    w,
    d,
    h
  }) => (ceilingAccessPoint(b, w, d, h), false),
  wall_thermostat: ({
    b,
    w,
    d,
    h
  }) => (wallThermostat(b, w, d, h), false),
  smoke_detector: ({
    b,
    w,
    d,
    h
  }) => (smokeDetector(b, w, d, h), false),
  siren_alarm: ({
    b,
    w,
    d,
    h
  }) => (sirenAlarm(b, w, d, h), false),
  electrical_panel: ({
    b,
    w,
    d,
    h
  }) => (electricalPanel(b, w, d, h), false),
  ups_unit: ({
    b,
    w,
    d,
    h
  }) => (upsUnit(b, w, d, h), 0.5),
  heat_pump_outdoor: ({
    b,
    w,
    d,
    h
  }) => (heatPumpOutdoor(b, w, d, h), 0.5),
  hot_water_tank: ({
    b,
    w,
    d,
    h
  }) => (hotWaterTank(b, w, d, h), 0.5),
  ventilation_fan: ({
    b,
    w,
    d,
    h
  }) => (ventilationFan(b, w, d, h), false),
  humidifier: ({
    b,
    w,
    d,
    h
  }) => (humidifier(b, w, d, h), 0.5),
  wall_switch: ({
    b,
    w,
    d,
    h
  }) => (wallSwitch(b, w, d, h), false),
  wall_outlet: ({
    b,
    w,
    d,
    h
  }) => (wallOutlet(b, w, d, h), false),
  smart_plug: ({
    b,
    w,
    d,
    h
  }) => (smartPlug(b, w, d, h), false),
  motion_sensor: ({
    b,
    w,
    d,
    h
  }) => (motionSensor(b, w, d, h), false),
  contact_sensor: ({
    b,
    w,
    d,
    h
  }) => (contactSensor(b, w, d, h), false),
  water_leak_sensor: ({
    b,
    w,
    d,
    h
  }) => (waterLeakSensor(b, w, d, h), 0.5),
  temperature_humidity_sensor: ({
    b,
    w,
    d,
    h
  }) => (temperatureHumiditySensor(b, w, d, h), false),
  video_doorbell: ({
    b,
    w,
    d,
    h
  }) => (videoDoorbell(b, w, d, h), false),
  modem_router: ({
    b,
    w,
    d,
    h,
    base
  }) => (modemRouter(b, w, d, h), base > 0.05 ? false : 0.5),
  smart_display: ({
    b,
    w,
    d,
    h,
    base
  }) => (smartDisplay(b, w, d, h), base > 0.05 ? false : 0.5)
};