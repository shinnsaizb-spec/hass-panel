/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/office.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["desk_l", "desk_corner", "desk_sit_stand", "chair_ergonomic", "chair_visitor", "filing_cabinet", "drawer_unit_office", "bookcase_office", "monitor_single", "monitor_dual", "pc_tower", "gaming_chair", "sim_racing_cockpit", "server_rack_42u", "printer_3d_open", "whiteboard_office", "monitor_triple", "arcade_cabinet", "laser_printer", "phone_booth_office", "printer_3d_enclosed", "filament_shelf_wall"];
function symbol(type, w, d) {
  if (type.startsWith("desk_")) {
    if (type === "desk_sit_stand") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.38, 0, w * 0.38, 0)];
    const inner = type === "desk_corner" ? w * 0.15 : -w * 0.08;
    return [rect(-w / 2, -d / 2, w / 2, d * 0.05, "fp3d-sym-fill"), rect(-w / 2, d * 0.05, inner, d / 2, "fp3d-sym-fill")];
  }
  if (type.startsWith("monitor_")) {
    const count = type === "monitor_triple" ? 3 : type === "monitor_dual" ? 2 : 1;
    return Array.from({
      length: count
    }, (_, i) => rect(-w / 2 + w * i / count + w * 0.04, -d * 0.18, -w / 2 + w * (i + 1) / count - w * 0.04, d * 0.18, "fp3d-sym-fill"));
  }
  if (type === "sim_racing_cockpit") return [line(-w * 0.42, -d / 2, -w * 0.42, d / 2), line(w * 0.42, -d / 2, w * 0.42, d / 2), rect(-w * 0.3, d * 0.12, w * 0.3, d * 0.46, "fp3d-sym-fill"), circle(0, -d * 0.05, w * 0.14)];
  if (type === "whiteboard_office") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.3, 0, w * 0.3, 0)];
  if (type === "filament_shelf_wall") return [rect(-w / 2, -d / 2, w / 2, d / 2), ...Array.from({
    length: 4
  }, (_, i) => circle(-w * 0.36 + i * w * 0.24, 0, w * 0.07, "fp3d-sym-fill"))];
  if (type === "phone_booth_office") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.4, -d * 0.42, w * 0.4, -d * 0.12, "fp3d-sym-fill")];
  if (type.startsWith("printer_3d")) return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.3, -d * 0.3, w * 0.3, d * 0.3, "fp3d-sym-fill")];
  if (type === "arcade_cabinet") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.16, d * 0.25, w * 0.05), circle(w * 0.16, d * 0.25, w * 0.04)];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.4, 0, w * 0.4, 0)];
}
export const OFFICE_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);