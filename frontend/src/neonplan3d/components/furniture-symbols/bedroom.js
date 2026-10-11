/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/bedroom.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Fixed-size bed and wardrobe symbols kept with the bedroom family.

import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["bed_90", "bed_140", "bed_160", "bed_180", "bed_200", "bed_upholstered_180", "bed_boxspring_180", "bed_futon_160", "wardrobe_2door", "wardrobe_3door", "wardrobe_4door", "wardrobe_6door", "wardrobe_mirror", "wardrobe_corner", "nightstand_drawer", "nightstand_slim", "nightstand_floating", "dresser_80_3", "dresser_140_6", "chest_tall_5", "clothes_rail", "bed_canopy", "wardrobe_sliding", "closet_walkin", "vanity_mirror", "bed_bench", "changing_table", "mirror_floor", "chest_tall", "reading_nook", "bed_ambient_180", "wardrobe_light", "alarm_sunrise", "vanity_light"];
function renderSymbol(type, w, d) {
  if (type === "clothes_rail") return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.44, 0, w * 0.44, 0, "fp3d-sym-strong")];
  if (type === "closet_walkin") return [rect(-w / 2, -d / 2, -w * 0.2, d / 2, "fp3d-sym-fill"), rect(-w * 0.2, -d / 2, w / 2, -d * 0.2, "fp3d-sym-fill")];
  if (type === "vanity_mirror" || type === "vanity_light") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.3, -d / 2, w * 0.3, -d * 0.32, "fp3d-sym-fill")];
  if (type === "bed_bench") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(0, -d / 2, 0, d / 2)];
  if (type === "changing_table") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.42, -d * 0.4, w * 0.42, d * 0.4, "fp3d-sym-fill")];
  if (type === "mirror_floor") return [rect(-w / 2, -d * 0.12, w / 2, d * 0.12, "fp3d-sym-fill"), line(-w * 0.4, -d / 2, w * 0.4, d / 2)];
  if (type === "reading_nook") return [rect(-w / 2, -d / 2, w * 0.3, d / 2, "fp3d-sym-fill"), rect(w * 0.32, -d / 2, w / 2, d / 2)];
  if (type === "alarm_sunrise") return [circle(0, 0, Math.min(w, d) * 0.44, "fp3d-sym-fill"), line(-w * 0.25, 0, w * 0.25, 0, "fp3d-sym-strong")];
  if (type === "wardrobe_corner") return [rect(-w / 2, -d / 2, -w * 0.08, d / 2, "fp3d-sym-fill"), rect(-w * 0.08, -d / 2, w / 2, -d * 0.08, "fp3d-sym-fill")];
  if (type.startsWith("wardrobe_")) {
    const doors = type === "wardrobe_2door" ? 2 : type === "wardrobe_4door" ? 4 : type === "wardrobe_6door" ? 6 : 3;
    const out = [rect(-w / 2, -d / 2, w / 2, d / 2)];
    for (let i = 1; i < doors; i++) out.push(line(-w / 2 + w * i / doors, -d / 2, -w / 2 + w * i / doors, d / 2));
    if (type === "wardrobe_mirror") out.push(rect(-w * 0.13, -d * 0.42, w * 0.13, d * 0.42, "fp3d-sym-fill"));
    return out;
  }
  if (type.startsWith("nightstand_") || type.startsWith("dresser_") || type === "chest_tall_5" || type === "chest_tall") {
    const rows = type === "dresser_80_3" || type === "dresser_140_6" ? 3 : type === "chest_tall_5" ? 5 : type === "chest_tall" ? 4 : type === "nightstand_slim" ? 2 : 1;
    const out = [rect(-w / 2, -d / 2, w / 2, d / 2)];
    for (let i = 1; i < rows; i++) out.push(line(-w / 2, -d / 2 + d * i / rows, w / 2, -d / 2 + d * i / rows));
    if (type === "dresser_140_6") out.push(line(0, -d / 2, 0, d / 2));
    return out;
  }
  const pillows = w < 1.2 ? 1 : 2;
  const out = [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w / 2, -d / 2, w / 2, -d / 2 + Math.min(0.1, d * 0.06), "fp3d-sym-fill"), line(-w / 2, -d * 0.12, w / 2, -d * 0.12)];
  for (let i = 0; i < pillows; i++) out.push(rect(-w / 2 + 0.08 + w * i / pillows, -d * 0.43, -w / 2 - 0.08 + w * (i + 1) / pillows, -d * 0.18, "fp3d-sym-fill"));
  if (type === "bed_upholstered_180") out.push(line(-w * 0.25, -d / 2, -w * 0.25, -d * 0.12), line(w * 0.25, -d / 2, w * 0.25, -d * 0.12));
  return out;
}
export const BEDROOM_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);