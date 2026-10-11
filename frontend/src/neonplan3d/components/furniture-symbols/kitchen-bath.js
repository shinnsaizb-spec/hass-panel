/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/kitchen-bath.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in top-view symbols for the kitchen-bath family.

import { createSymbolRegistry, circle, line, rect } from "./common.js";
const TYPES = ["range_hood", "microwave", "water_purifier", "kitchen_corner", "kitchen_display", "island", "fridge", "stove", "sink", "kitchen_coffee_machine", "kitchen_wine_fridge", "kitchen_island_bar", "kitchen_recycling_station", "kitchen_pantry_pullout", "kitchen_corner_carousel", "kitchen_oven_tower", "kitchen_open_shelf", "kitchen_spice_rack_wall", "kitchen_cart", "kitchen_plate_rack_wall", "kitchen_freezer"];
function renderSymbol(type, w, d) {
  switch (type) {
    case "range_hood":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.35, d * 0.28, w * 0.35, d * 0.28, "fp3d-sym-strong")];
    case "microwave":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.38, -d * 0.05, w * 0.2, d / 2, "fp3d-sym-fill"), circle(w * 0.34, d * 0.22, Math.min(w, d) * 0.06)];
    case "water_purifier":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(0, -d * 0.16, Math.min(w, d) * 0.065), line(0, -d * 0.16, 0, d * 0.22, "fp3d-sym-strong"), circle(0, d * 0.22, Math.min(w, d) * 0.045, "fp3d-sym-fill")];
    case "kitchen_corner":
      return [rect(-w / 2, -d / 2, w / 2, -d * 0.05), rect(-w / 2, -d * 0.05, -w * 0.05, d / 2), line(-w * 0.05, -d * 0.05, w / 2, -d * 0.05), line(-w * 0.05, -d * 0.05, -w * 0.05, d / 2)];
    case "kitchen_display":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), line(0, -d / 2, 0, d / 2, "fp3d-sym-strong"), line(-w * 0.38, d * 0.2, w * 0.38, d * 0.2), line(-w * 0.32, d * 0.34, w * 0.32, d * 0.34, "fp3d-sym-strong")];
    case "island":
      // cabinets on the back side, overhanging worktop on the front
      return [line(-w / 2, d / 2 - 0.3, w / 2, d / 2 - 0.3)];
    case "fridge":
      return [line(-w / 2 + 0.06, d / 2 - 0.04, w / 2 - 0.06, d / 2 - 0.04, "fp3d-sym-strong")];
    case "stove":
      {
        const r = Math.min(w, d) * 0.14;
        return [circle(-w * 0.22, -d * 0.2, r), circle(w * 0.22, -d * 0.2, r * 0.8), circle(-w * 0.22, d * 0.2, r * 0.8), circle(w * 0.22, d * 0.2, r)];
      }
    case "sink":
      {
        const bw = Math.min(0.5, w - 0.2);
        return [rect(-bw / 2, -d / 2 + 0.1, bw / 2, d / 2 - 0.08), circle(0, -d / 2 + 0.06, 0.025, "fp3d-sym-fill")];
      }
    case "kitchen_coffee_machine":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.16, d * 0.18, Math.min(w, d) * 0.08), circle(w * 0.16, d * 0.18, Math.min(w, d) * 0.08)];
    case "kitchen_wine_fridge":
    case "kitchen_freezer":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.34, 0, w * 0.34, 0, "fp3d-sym-strong")];
    case "kitchen_island_bar":
      return [rect(-w / 2, -d / 2, w / 2, d * 0.12, "fp3d-sym-fill"), line(-w / 2, d * 0.2, w / 2, d * 0.2, "fp3d-sym-strong")];
    case "kitchen_recycling_station":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w / 6, -d / 2, -w / 6, d / 2), line(w / 6, -d / 2, w / 6, d / 2)];
    case "kitchen_pantry_pullout":
    case "kitchen_oven_tower":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(w * 0.3, -d * 0.3, w * 0.3, d * 0.3, "fp3d-sym-strong")];
    case "kitchen_corner_carousel":
      return [rect(-w / 2, -d / 2, w / 2, -d * 0.05), rect(-w / 2, -d * 0.05, -w * 0.05, d / 2), circle(-w * 0.05, -d * 0.05, Math.min(w, d) * 0.32, "fp3d-sym-fill")];
    case "kitchen_open_shelf":
    case "kitchen_spice_rack_wall":
    case "kitchen_plate_rack_wall":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.3, 0, w * 0.3, 0, "fp3d-sym-strong")];
    case "kitchen_cart":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.38, d * 0.38, Math.min(w, d) * 0.08), circle(w * 0.38, d * 0.38, Math.min(w, d) * 0.08)];
    default:
      return [];
  }
}
export const KITCHEN_BATH_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);