/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/garage.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["workbench", "workbench_pegboard", "tool_cabinet", "tool_chest", "storage_rack_garage", "wall_shelf_garage", "air_compressor", "shop_vacuum", "ladder_step", "ladder_extension", "storage_boxes", "tire_stack", "bike_rack", "repair_stand", "parts_bin", "utility_sink_garage", "charging_bay"];
function symbol(type, w, d) {
  if (type === "tire_stack" || type === "shop_vacuum" || type === "air_compressor") return [circle(0, 0, Math.min(w, d) * 0.45, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.18)];
  if (type.startsWith("ladder_")) {
    const out = [line(-w * .4, d / 2, w * .4, -d / 2, "fp3d-sym-strong"), line(w * .4, d / 2, -w * .4, -d / 2, "fp3d-sym-strong")];
    for (let i = 1; i < 6; i++) out.push(line(-w * .32, d / 2 - d * i / 6, w * .32, d / 2 - d * i / 6));
    return out;
  }
  if (type === "bike_rack") return [line(-w / 2, 0, w / 2, 0, "fp3d-sym-strong"), ...Array.from({
    length: 4
  }, (_, i) => line(-w * .38 + i * w * .25, -d / 2, -w * .38 + i * w * .25, d / 2))];
  if (type === "repair_stand") return [circle(0, 0, Math.min(w, d) * .12), line(-w * .4, 0, w * .4, 0, "fp3d-sym-strong"), line(0, -d * .4, 0, d * .4, "fp3d-sym-strong")];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * .42, 0, w * .42, 0)];
}
export const GARAGE_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);