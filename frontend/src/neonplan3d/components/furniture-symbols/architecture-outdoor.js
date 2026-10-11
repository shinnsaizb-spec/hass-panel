/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/architecture-outdoor.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in top-view symbols for the architecture-outdoor family.

import { createSymbolRegistry, circle, ellipse, line, rect } from "./common.js";
const TYPES = ["motorbike", "hammock", "stone_table_set", "planter_large", "water_tank", "gate", "fence", "parking", "stairs", "stairs_landing"];
function renderSymbol(type, w, d) {
  switch (type) {
    case "motorbike":
      return [ellipse(0, -d * 0.34, w * 0.24, d * 0.11), ellipse(0, d * 0.34, w * 0.24, d * 0.11), line(0, -d * 0.28, 0, d * 0.3, "fp3d-sym-strong"), ellipse(0, 0, w * 0.3, d * 0.2, "fp3d-sym-fill"), line(-w * 0.32, d * 0.23, w * 0.32, d * 0.23)];
    case "hammock":
      return [line(-w / 2, 0, -w * 0.32, 0), line(w * 0.32, 0, w / 2, 0), ellipse(0, 0, w * 0.32, d * 0.42, "fp3d-sym-fill")];
    case "stone_table_set":
      return [circle(0, 0, Math.min(w, d) * 0.22, "fp3d-sym-fill"), ...[[0, -0.38], [0.38, 0], [0, 0.38], [-0.38, 0]].map(([x, z]) => circle(x * w, z * d, Math.min(w, d) * 0.1))];
    case "planter_large":
      return [circle(0, 0, Math.min(w, d) * 0.47), circle(0, 0, Math.min(w, d) * 0.33, "fp3d-sym-fill")];
    case "water_tank":
      return [circle(0, 0, Math.min(w, d) * 0.48), circle(0, 0, Math.min(w, d) * 0.12, "fp3d-sym-fill")];
    case "gate":
      return [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong"), line(0, -d / 2, 0, d / 2)];
    case "fence":
      {
        const out = [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong")];
        for (let i = 0; i < 7; i++) out.push(line(-w / 2 + w * i / 6, -d / 2, -w / 2 + w * i / 6, d / 2));
        return out;
      }
    case "parking":
      // the spot's marking with an arrow head at the front
      return [rect(-w / 2 + 0.08, -d / 2 + 0.08, w / 2 - 0.08, d / 2 - 0.08), line(-w * 0.15, d / 2 - 0.5, 0, d / 2 - 0.22, "fp3d-sym-strong"), line(0, d / 2 - 0.22, w * 0.15, d / 2 - 0.5, "fp3d-sym-strong")];
    case "stairs":
      {
        // steps and an arrow pointing up the stair (towards the back)
        const n = Math.max(3, Math.round(d / 0.26));
        const out = [];
        for (let i = 1; i < n; i++) out.push(line(-w / 2, d / 2 - d / n * i, w / 2, d / 2 - d / n * i));
        out.push(line(0, d / 2 - 0.1, 0, -d / 2 + 0.25, "fp3d-sym-strong"), line(-0.15, -d / 2 + 0.45, 0, -d / 2 + 0.25, "fp3d-sym-strong"), line(0.15, -d / 2 + 0.45, 0, -d / 2 + 0.25, "fp3d-sym-strong"));
        return out;
      }
    case "stairs_landing":
      {
        // Two parallel flights, joined across the back by the landing; arrows show the half-turn route.
        const gap = Math.min(0.16, w * 0.12);
        const flightW = (w - gap) / 2;
        const landingD = Math.min(d * 0.34, Math.max(d * 0.22, flightW));
        const landingFront = -d / 2 + landingD;
        const lowerX0 = -w / 2;
        const lowerX1 = -gap / 2;
        const upperX0 = gap / 2;
        const upperX1 = w / 2;
        const n = Math.max(3, Math.round((d - landingD) / 0.26));
        const out = [line(-w / 2, landingFront, w / 2, landingFront, "fp3d-sym-strong")];
        for (let i = 1; i < n; i++) {
          const z = d / 2 - (d - landingD) / n * i;
          out.push(line(lowerX0, z, lowerX1, z), line(upperX0, z, upperX1, z));
        }
        const lx = (lowerX0 + lowerX1) / 2;
        const ux = (upperX0 + upperX1) / 2;
        out.push(line(lx, d / 2 - 0.1, lx, landingFront + 0.18, "fp3d-sym-strong"), line(lx - 0.12, landingFront + 0.36, lx, landingFront + 0.18, "fp3d-sym-strong"), line(lx + 0.12, landingFront + 0.36, lx, landingFront + 0.18, "fp3d-sym-strong"), line(ux, landingFront + 0.18, ux, d / 2 - 0.1, "fp3d-sym-strong"), line(ux - 0.12, d / 2 - 0.28, ux, d / 2 - 0.1, "fp3d-sym-strong"), line(ux + 0.12, d / 2 - 0.28, ux, d / 2 - 0.1, "fp3d-sym-strong"));
        return out;
      }
    default:
      return [];
  }
}
export const ARCHITECTURE_OUTDOOR_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);