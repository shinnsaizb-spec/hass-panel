/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/architecture.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Plan symbols for interior columns, beams, chimneys, fireplaces and sliding partitions.

import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["column_round", "column_square", "column_steel", "ceiling_beams", "downstand_beam", "chimney_inside", "fireplace_builtin", "sliding_wall", "builtin_shelf_niche", "led_niche", "light_cove", "platform_steps", "gallery_railing_glass", "window_seat"];
function symbol(type, w, d) {
  if (type === "column_round") return [circle(0, 0, Math.min(w, d) / 2, "fp3d-sym-fill")];
  if (type === "column_square") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
  if (type === "column_steel") return [rect(-w / 2, -d * 0.12, w / 2, d * 0.12, "fp3d-sym-fill"), rect(-w * 0.12, -d / 2, w * 0.12, d / 2, "fp3d-sym-fill")];
  if (type === "ceiling_beams") {
    const out = [];
    for (let i = 0; i < 5; i++) out.push(line(-w / 2, -d / 2 + d * i / 4, w / 2, -d / 2 + d * i / 4, "fp3d-sym-strong"));
    return out;
  }
  if (type === "sliding_wall") return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w / 6, -d / 2, -w / 6, d / 2), line(w / 6, -d / 2, w / 6, d / 2)];
  if (type === "fireplace_builtin") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.35, d * 0.18, w * 0.35, d / 2, "fp3d-sym-fill")];
  if (type === "builtin_shelf_niche" || type === "led_niche") return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w / 2, 0, w / 2, 0), line(0, -d / 2, 0, d / 2)];
  if (type === "light_cove") return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w * 0.42, d * 0.25, w * 0.42, d * 0.25, "fp3d-sym-strong")];
  if (type === "platform_steps") return [rect(-w / 2, -d / 2, w / 2, d / 2), line(-w / 2, d * 0.12, w / 2, d * 0.12, "fp3d-sym-strong")];
  if (type === "gallery_railing_glass") return [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong"), line(-w / 2, -d / 2, -w / 2, d / 2), line(0, -d / 2, 0, d / 2), line(w / 2, -d / 2, w / 2, d / 2)];
  if (type === "window_seat") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(0, -d / 2, 0, d / 2)];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
}
export const ARCHITECTURE_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);