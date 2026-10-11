/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/climate.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in top-view symbols for the climate family.

import { svg } from "lit";
import { createSymbolRegistry, circle, ellipse, line, rect } from "./common.js";
const TYPES = ["fan_ceiling", "fan_ceiling_light", "fan_floor", "fan_wall", "water_heater", "drying_rack", "radiator", "air_conditioner", "water_pump"];
function renderSymbol(type, w, d) {
  switch (type) {
    case "fan_ceiling":
    case "fan_ceiling_light":
      {
        const r = Math.min(w, d);
        const out = [...Array.from({
          length: 5
        }, (_, i) => svg`<rect x=${r * 0.08} y=${-r * 0.055} width=${r * 0.4} height=${r * 0.11} rx=${r * 0.015} transform=${`rotate(${i * 72})`} />`), circle(0, 0, r * 0.105, "fp3d-sym-fill")];
        if (type === "fan_ceiling_light") out.push(circle(0, 0, r * 0.15), circle(0, 0, r * 0.105, "fp3d-sym-fill"));
        return out;
      }
    case "fan_floor":
      return [circle(0, 0, Math.min(w, d) * 0.46), circle(0, 0, Math.min(w, d) * 0.12, "fp3d-sym-fill")];
    case "fan_wall":
      return [rect(-w * 0.16, -d / 2, w * 0.16, -d * 0.2, "fp3d-sym-fill"), line(0, -d * 0.2, 0, d * 0.08, "fp3d-sym-strong"), ellipse(0, d * 0.15, w * 0.46, d * 0.3), circle(0, d * 0.15, Math.min(w, d) * 0.13, "fp3d-sym-fill")];
    case "water_heater":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(w * 0.3, d * 0.18, Math.min(w, d) * 0.06, "fp3d-sym-fill")];
    case "drying_rack":
      {
        const out = [rect(-w / 2, -d / 2, w / 2, d / 2)];
        for (let i = 1; i < 6; i++) out.push(line(-w / 2, -d / 2 + d * i / 6, w / 2, -d / 2 + d * i / 6));
        return out;
      }
    case "radiator":
      {
        // fins along the front
        const out = [];
        const n = Math.max(3, Math.round(w / 0.1));
        for (let i = 1; i < n; i++) out.push(line(-w / 2 + w / n * i, -d / 2, -w / 2 + w / n * i, d / 2));
        return out;
      }
    case "air_conditioner":
      {
        // slim wall unit: casing, outlet and guide vanes viewed from above
        const out = [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.43, d * 0.28, w * 0.43, d * 0.28, "fp3d-sym-strong")];
        for (let i = 1; i < 6; i++) {
          const x = -w * 0.4 + w * 0.8 * (i / 6);
          out.push(line(x, d * 0.12, x + w * 0.025, d * 0.42));
        }
        return out;
      }
    case "water_pump":
      // motor at the back, round pump housing and inlet/outlet pipes at the front
      return [rect(-w * 0.42, -d * 0.42, w * 0.42, d * 0.42), rect(-w * 0.25, -d * 0.38, w * 0.25, d * 0.05, "fp3d-sym-fill"), circle(0, d * 0.15, Math.min(w, d) * 0.27, "fp3d-sym-strong"), line(0, d * 0.15, 0, d / 2), line(w * 0.18, d * 0.15, w * 0.42, d * 0.15)];
    default:
      return [];
  }
}
export const CLIMATE_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);