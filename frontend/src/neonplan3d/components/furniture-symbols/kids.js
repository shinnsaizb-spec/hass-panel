/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/kids.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { svg } from "lit";
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["tipi_kids", "play_kitchen_kids", "desk_kids", "toy_shelf_boxes", "cushion_corner_kids", "rocking_horse", "play_rug_road", "table_chairs_kids", "lamp_night_moon", "ball_pit", "bed_house", "baby_monitor", "lamp_star_projector", "changing_dresser", "wardrobe_kids", "toy_boxes_3"];
function symbol(type, w, d) {
  if (type === "tipi_kids") return [svg`<polygon class="fp3d-sym-fill" points=${`0,${-d / 2} ${w / 2},${d / 2} ${-w / 2},${d / 2}`} />`, line(0, -d / 2, 0, d / 2)];
  if (type === "play_rug_road") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w / 2, 0, w / 2, 0), line(0, -d / 2, 0, d / 2)];
  if (type === "table_chairs_kids") return [rect(-w * 0.25, -d * 0.32, w * 0.25, d * 0.32, "fp3d-sym-fill"), rect(-w * 0.5, -d * 0.18, -w * 0.3, d * 0.18), rect(w * 0.3, -d * 0.18, w * 0.5, d * 0.18)];
  if (type === "lamp_night_moon") return [svg`<path class="fp3d-sym-fill" d=${`M ${w * 0.28} ${-d * 0.46} A ${w * 0.46} ${d * 0.46} 0 1 0 ${w * 0.28} ${d * 0.46} A ${w * 0.3} ${d * 0.3} 0 0 1 ${w * 0.28} ${-d * 0.46}`} />`];
  if (type === "lamp_star_projector" || type === "ball_pit" || type === "baby_monitor") return [circle(0, 0, Math.min(w, d) * 0.47, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.2)];
  if (type === "bed_house") return [rect(-w * 0.46, -d * 0.46, w * 0.46, d * 0.46, "fp3d-sym-fill"), line(-w * 0.46, 0, 0, -d * 0.46), line(0, -d * 0.46, w * 0.46, 0)];
  if (type === "toy_boxes_3") return [0, 1, 2].map(i => rect(-w / 2 + w * i / 3 + 0.01, -d / 2, -w / 2 + w * (i + 1) / 3 - 0.01, d / 2, "fp3d-sym-fill"));
  if (type === "rocking_horse") return [rect(-w * 0.3, -d * 0.3, w * 0.25, d * 0.3, "fp3d-sym-fill"), line(-w * 0.45, -d * 0.42, w * 0.45, -d * 0.42), line(-w * 0.45, d * 0.42, w * 0.45, d * 0.42)];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.38, 0, w * 0.38, 0)];
}
export const KIDS_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);