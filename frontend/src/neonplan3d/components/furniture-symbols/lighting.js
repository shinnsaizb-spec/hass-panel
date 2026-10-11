/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/lighting.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in top-view symbols for the lighting family.

import { svg } from "lit";
import { createSymbolRegistry, circle, ellipse, line, rect } from "./common.js";
const TYPES = ["lamp_downlight", "lamp_spot", "lamp_bollard", "lamp_garden", "lamp_column", "lamp_tv_bars", "lamp_orb_table", "lamp_portable", "lamp_ambient_spot", "lamp_cube", "lamp_panel_round", "lamp_garden_spots", "lamp_wall_updown", "lamp_panel", "lamp_uplight", "lamp_ceiling", "lamp_pendant", "lamp_floor", "lamp_table", "lamp_wall", "led_strip"];
function renderSymbol(type, w, d) {
  switch (type) {
    case "lamp_downlight":
    case "lamp_spot":
      return [circle(0, 0, Math.min(w, d) * 0.45, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 1.4)];
    case "lamp_bollard":
    case "lamp_garden":
      return [circle(0, 0, Math.min(w, d) * 0.5, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 1.6)];
    case "lamp_column":
      return [rect(-w * 0.42, -d * 0.42, w * 0.42, d * 0.42, "fp3d-sym-fill"), rect(-w * 0.18, -d * 0.18, w * 0.18, d * 0.18), line(-w, 0, w, 0), line(0, -d, 0, d)];
    case "lamp_tv_bars":
      return [rect(-w * 0.44, -d * 0.42, -w * 0.18, d * 0.42, "fp3d-sym-fill"), rect(w * 0.18, -d * 0.42, w * 0.44, d * 0.42, "fp3d-sym-fill")];
    case "lamp_orb_table":
      return [circle(0, 0, Math.min(w, d) * 0.47, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.24)];
    case "lamp_portable":
      return [svg`<polygon class="fp3d-sym-fill" points=${`${-w * 0.42},${d * 0.42} ${w * 0.42},${d * 0.42} ${w * 0.28},${-d * 0.42} ${-w * 0.28},${-d * 0.42}`} />`, rect(-w * 0.13, -d * 0.14, w * 0.13, d * 0.14)];
    case "lamp_ambient_spot":
      return [circle(0, 0, Math.min(w, d) * 0.47, "fp3d-sym-fill"), rect(-w * 0.26, -d * 0.26, w * 0.26, d * 0.26, "fp3d-sym-strong")];
    case "lamp_cube":
      return [rect(-w * 0.46, -d * 0.46, w * 0.46, d * 0.46, "fp3d-sym-fill"), rect(-w * 0.3, -d * 0.3, w * 0.3, d * 0.3)];
    case "lamp_panel_round":
      {
        const r = Math.min(w, d) * 0.46;
        return [circle(0, 0, r, "fp3d-sym-fill"), ...Array.from({
          length: 8
        }, (_, i) => {
          const a = i * Math.PI / 4;
          return line(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, Math.cos(a) * r * 1.42, Math.sin(a) * r * 1.42);
        })];
      }
    case "lamp_garden_spots":
      return [-0.34, 0, 0.34].flatMap(x => [circle(x * w, 0, d * 0.28, "fp3d-sym-fill"), line(x * w, -d * 0.2, x * w, d * 0.46)]);
    case "lamp_wall_updown":
      return [rect(-w / 2, -d / 2, w / 2, -d * 0.28, "fp3d-sym-fill"), rect(-w * 0.34, -d * 0.28, w * 0.34, d * 0.3), line(-w * 0.46, d * 0.42, w * 0.46, d * 0.42, "fp3d-sym-strong")];
    case "lamp_panel":
      return [rect(-w / 2 + 0.03, -d / 2 + 0.03, w / 2 - 0.03, d / 2 - 0.03, "fp3d-sym-fill")];
    case "lamp_uplight":
    case "lamp_ceiling":
    case "lamp_pendant":
    case "lamp_floor":
    case "lamp_table":
      {
        // a lamp from above: the shade, and short rays for hanging ones
        const r = Math.min(w, d) / 2;
        const out = [circle(0, 0, r * 0.9, "fp3d-sym-fill"), circle(0, 0, r * 0.3)];
        if (type === "lamp_ceiling" || type === "lamp_pendant") {
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            out.push(line(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35));
          }
        }
        return out;
      }
    case "lamp_wall":
      return [rect(-w / 2, -d / 2, w / 2, -d / 2 + 0.03, "fp3d-sym-fill"), ellipse(0, 0.01, w * 0.4, d * 0.4)];
    case "led_strip":
      return [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong")];
    default:
      return [];
  }
}
export const LIGHTING_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);