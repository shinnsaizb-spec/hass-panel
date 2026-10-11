/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/fitness.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["fitness_treadmill", "fitness_power_rack", "fitness_rower", "fitness_spin_bike", "fitness_dumbbell_rack", "fitness_punching_bag", "fitness_yoga_mat", "fitness_cross_trainer", "fitness_mirror_wall", "fitness_ball", "fitness_wall_bars", "fitness_mirror_smart", "fitness_bike_trainer", "fitness_sauna_cabin", "fitness_massage_chair", "fitness_kettlebell_set", "fitness_water_station"];
function symbol(type, w, d) {
  if (type === "fitness_treadmill") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.36, -d * 0.42, w * 0.36, d * 0.28, "fp3d-sym-fill"), line(-w * 0.42, d * 0.33, w * 0.42, d * 0.33)];
  if (type === "fitness_power_rack") return [rect(-w / 2, -d / 2, w / 2, d / 2), rect(-w * 0.25, -d * 0.3, w * 0.25, d * 0.32, "fp3d-sym-fill"), line(-w * 0.43, 0, w * 0.43, 0)];
  if (type === "fitness_rower") return [line(0, -d * 0.46, 0, d * 0.4), rect(-w * 0.3, -d * 0.08, w * 0.3, d * 0.12, "fp3d-sym-fill"), circle(0, d * 0.35, w * 0.34)];
  if (["fitness_spin_bike", "fitness_cross_trainer"].includes(type)) return [rect(-w * 0.42, -d * 0.45, w * 0.42, d * 0.45), circle(0, 0, w * 0.28, "fp3d-sym-fill"), line(-w * 0.34, -d * 0.28, w * 0.34, d * 0.28)];
  if (["fitness_dumbbell_rack", "fitness_kettlebell_set"].includes(type)) return [rect(-w / 2, -d / 2, w / 2, d / 2), ...Array.from({
    length: 5
  }, (_, i) => circle(-w * 0.38 + i * w * 0.19, 0, w * 0.055, "fp3d-sym-fill"))];
  if (type === "fitness_punching_bag") return [circle(0, 0, Math.min(w, d) * 0.46), circle(0, 0, Math.min(w, d) * 0.28, "fp3d-sym-fill")];
  if (type === "fitness_yoga_mat") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(w * 0.12, d * 0.18, w * 0.38, d * 0.36)];
  if (["fitness_mirror_wall", "fitness_mirror_smart"].includes(type)) return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(0, -d / 2, 0, d / 2)];
  if (type === "fitness_ball" || type === "fitness_water_station") return [circle(0, 0, Math.min(w, d) * 0.46, "fp3d-sym-fill")];
  if (type === "fitness_wall_bars") return [rect(-w / 2, -d / 2, w / 2, d / 2), ...Array.from({
    length: 7
  }, (_, i) => line(-w * 0.44 + i * w * 0.147, -d / 2, -w * 0.44 + i * w * 0.147, d / 2))];
  if (type === "fitness_bike_trainer") return [circle(0, -d * 0.3, w * 0.32), circle(0, d * 0.3, w * 0.32), line(0, -d * 0.3, 0, d * 0.3), rect(-w * 0.38, d * 0.2, w * 0.38, d * 0.48, "fp3d-sym-fill")];
  if (type === "fitness_sauna_cabin") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.4, d * 0.18, w * 0.32, d * 0.42), line(w * 0.14, d * 0.48, w * 0.14, d * 0.2)];
  if (type === "fitness_massage_chair") return [rect(-w * 0.46, -d * 0.45, w * 0.46, d * 0.42), rect(-w * 0.3, -d * 0.48, w * 0.3, -d * 0.02, "fp3d-sym-fill")];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
}
export const FITNESS_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);