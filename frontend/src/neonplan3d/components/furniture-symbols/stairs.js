/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/stairs.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["stairs_landing_l", "stairs_winder_l", "stairs_spiral", "stairs_open", "stairs_concrete", "stairs_compact", "railing_glass", "railing_metal", "railing_wood", "railing_cable"];
function symbol(type, w, d) {
  if (type.startsWith("railing_")) {
    const out = [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong")];
    const n = type === "railing_wood" ? 5 : 3;
    for (let i = 0; i < n; i++) out.push(line(-w / 2 + w * i / (n - 1), -d / 2, -w / 2 + w * i / (n - 1), d / 2));
    return out;
  }
  if (type === "stairs_spiral") return [circle(0, 0, Math.min(w, d) / 2, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.08), ...Array.from({
    length: 10
  }, (_, i) => {
    const a = i * Math.PI * 2 / 10;
    return line(0, 0, Math.cos(a) * w * 0.46, Math.sin(a) * d * 0.46);
  })];
  if (type === "stairs_landing_l" || type === "stairs_winder_l") {
    const out = [rect(-w / 2, -d / 2, w / 2, d / 2)];
    for (let i = 1; i < 7; i++) out.push(line(w * 0.1, d / 2 - d * i / 10, w / 2, d / 2 - d * i / 10), line(-w / 2 + w * i / 10, -d / 2, -w / 2 + w * i / 10, -d * 0.1));
    return out;
  }
  const n = Math.max(5, Math.round(d / 0.28));
  return [rect(-w / 2, -d / 2, w / 2, d / 2), ...Array.from({
    length: n - 1
  }, (_, i) => line(-w / 2, d / 2 - d * (i + 1) / n, w / 2, d / 2 - d * (i + 1) / n))];
}
export const STAIR_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);