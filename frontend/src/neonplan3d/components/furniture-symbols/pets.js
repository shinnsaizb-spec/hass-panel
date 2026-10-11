/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/pets.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["cat_tree_large", "cat_scratching_post", "cat_scratch_board_wall", "cat_cave", "cat_bed_round", "cat_wall_perch", "cat_climbing_steps_wall", "litter_box_hood", "litter_box_self_cleaning", "dog_bed", "dog_basket", "dog_house", "pet_bowls", "pet_feeder_automatic", "pet_water_fountain", "pet_gate", "pet_stairs", "hamster_cage", "small_animal_cage", "rabbit_enclosure_outdoor", "bird_cage", "aquarium_100", "aquarium_240_cabinet", "terrarium"];
function symbol(type, w, d) {
  if (type === "cat_bed_round" || type === "cat_scratching_post" || type === "litter_box_self_cleaning") return [circle(0, 0, Math.min(w, d) * 0.48, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.3)];
  if (type === "cat_climbing_steps_wall") return Array.from({
    length: 4
  }, (_, i) => rect(-w * 0.48 + i * w * 0.25, -d / 2, -w * 0.25 + i * w * 0.25, d / 2, "fp3d-sym-fill"));
  if (type === "cat_tree_large") return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(-w * 0.22, -d * 0.12, w * 0.12, "fp3d-sym-fill"), circle(w * 0.22, d * 0.12, w * 0.12, "fp3d-sym-fill")];
  if (type === "dog_house") return [rect(-w * 0.46, -d * 0.46, w * 0.46, d * 0.46, "fp3d-sym-fill"), line(-w * 0.46, 0, 0, -d * 0.46), line(0, -d * 0.46, w * 0.46, 0)];
  if (type === "pet_bowls") return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(-w * 0.23, 0, d * 0.34, "fp3d-sym-fill"), circle(w * 0.23, 0, d * 0.34, "fp3d-sym-fill")];
  if (type === "pet_gate") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...Array.from({
    length: 7
  }, (_, i) => line(-w * 0.42 + i * w * 0.14, -d / 2, -w * 0.42 + i * w * 0.14, d / 2))];
  if (type === "pet_stairs") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...Array.from({
    length: 3
  }, (_, i) => line(-w / 2, -d / 2 + d * (i + 1) / 4, w / 2, -d / 2 + d * (i + 1) / 4))];
  if (type === "bird_cage") return [circle(0, 0, Math.min(w, d) * 0.48, "fp3d-sym-fill"), line(-w * 0.35, 0, w * 0.35, 0)];
  if (["hamster_cage", "small_animal_cage", "rabbit_enclosure_outdoor"].includes(type)) return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...Array.from({
    length: 5
  }, (_, i) => line(-w * 0.4 + i * w * 0.2, -d / 2, -w * 0.4 + i * w * 0.2, d / 2))];
  if (["aquarium_100", "aquarium_240_cabinet", "terrarium"].includes(type)) return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.42, -d * 0.36, w * 0.42, d * 0.36), line(-w * 0.3, d * 0.25, w * 0.28, -d * 0.2)];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.3, -d * 0.3, w * 0.3, d * 0.3)];
}
export const PET_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);