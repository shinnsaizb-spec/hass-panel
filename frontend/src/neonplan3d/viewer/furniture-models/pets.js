/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/pets.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function catTree(b, w, d, h) {
  b.box(-w * 0.46, w * 0.46, 0, h * 0.035, -d * 0.46, d * 0.46, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.34, w * 0.08, h * 0.05, h * 0.3, -d * 0.32, d * 0.2, C.fabric, C.cushion, EDGE_FAINT);
  for (const [x, z, y0, y1] of [[-0.22, -0.12, 0.28, 0.9], [0.22, 0.12, 0.03, 0.7], [0.02, -0.08, 0.52, 0.96]]) b.cyl(x * w, z * d, w * 0.055, h * y0, h * y1, C.wood, C.woodTop, 10, EDGE_FAINT);
  for (const [x, z, y] of [[-0.22, -0.12, 0.5], [0.22, 0.12, 0.7], [0.02, -0.08, 0.96]]) b.pad(x * w - w * 0.24, x * w + w * 0.24, h * y, h * y + h * 0.035, z * d - d * 0.32, z * d + d * 0.32, C.fabric, C.cushion, 0.02, EDGE_GLOW);
}
function scratchingPost(b, w, d, h) {
  b.box(-w * 0.46, w * 0.46, 0, h * 0.05, -d * 0.46, d * 0.46, C.body, C.bodyTop, EDGE_FURN);
  b.cyl(0, 0, w * 0.1, h * 0.05, h * 0.92, C.wood, C.woodTop, 12, EDGE_FAINT);
  b.pad(-w * 0.38, w * 0.38, h * 0.92, h, -d * 0.38, d * 0.38, C.fabric, C.cushion, 0.025, EDGE_GLOW);
}
function wallCat(b, w, d, h, kind) {
  if (kind === "board") return b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  if (kind === "perch") return b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.fabric, C.cushion, 0.025, EDGE_FURN);
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.38 + i * w * 0.25;
    const y = h * i * 0.23;
    b.box(x - w * 0.12, x + w * 0.12, y, y + h * 0.08, -d / 2, d / 2, C.wood, C.woodTop, EDGE_GLOW);
  }
}
function cave(b, w, d, h) {
  b.loft([-w / 2, w / 2, -d / 2, d / 2], [-w * 0.34, w * 0.34, -d * 0.34, d * 0.34], 0, h, C.fabric, C.cushion, EDGE_FURN);
  b.box(-w * 0.2, w * 0.2, 0, h * 0.5, d * 0.48, d * 0.52, C.dark, C.dark, EDGE_GLOW);
}
function roundBed(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.49, 0, h, C.fabric, C.cushion, 18, EDGE_FURN);
  b.cyl(0, 0, Math.min(w, d) * 0.34, h * 0.5, h, C.body, C.bodyTop, 18, EDGE_FAINT);
}
function litter(b, w, d, h, automatic) {
  b.box(-w / 2, w / 2, 0, h * 0.26, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  if (automatic) {
    b.cyl(0, 0, w * 0.46, h * 0.2, h, C.white, C.whiteTop, 14, EDGE_FURN);
    b.box(-w * 0.24, w * 0.24, h * 0.28, h * 0.68, d * 0.43, d * 0.51, C.dark, C.dark, EDGE_GLOW);
    b.box(-w * 0.15, w * 0.15, h * 0.08, h * 0.14, d * 0.5, d * 0.54, C.accent, C.accent, EDGE_GLOW);
  } else {
    b.loft([-w * 0.48, w * 0.48, -d * 0.48, d * 0.48], [-w * 0.38, w * 0.38, -d * 0.38, d * 0.38], h * 0.26, h, C.white, C.whiteTop, EDGE_FAINT);
    b.box(-w * 0.2, w * 0.2, h * 0.26, h * 0.62, d * 0.47, d * 0.52, C.dark, C.dark, EDGE_GLOW);
  }
}
function dogBed(b, w, d, h, basket) {
  b.pad(-w / 2, w / 2, 0, h * 0.55, -d / 2, d / 2, C.fabric, C.cushion, 0.04, EDGE_FURN);
  const rim = basket ? h : h * 0.8;
  for (const x of [-w / 2, w / 2]) b.box(x - w * 0.06, x + w * 0.06, h * 0.25, rim, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FAINT);
  b.box(-w / 2, w / 2, h * 0.25, rim, -d / 2, -d * 0.38, C.body, C.bodyTop, EDGE_FAINT);
}
function dogHouse(b, w, d, h) {
  b.box(-w * 0.46, w * 0.46, 0, h * 0.66, -d * 0.46, d * 0.46, C.wood, C.woodTop, EDGE_FURN);
  b.loft([-w * 0.55, w * 0.55, -d * 0.55, d * 0.55], [-w * 0.06, w * 0.06, -d * 0.55, d * 0.55], h * 0.66, h, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.2, w * 0.2, 0, h * 0.48, d * 0.45, d * 0.49, C.dark, C.dark, EDGE_GLOW);
}
function bowls(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h * 0.18, -d / 2, d / 2, C.body, C.bodyTop, 0.02, EDGE_FURN);
  for (const x of [-w * 0.23, w * 0.23]) {
    b.cyl(x, 0, d * 0.38, h * 0.18, h, C.metal, C.glass, 16, EDGE_GLOW);
    b.cyl(x, 0, d * 0.25, h * 0.72, h, C.dark, C.glass, 16, EDGE_FAINT);
  }
}
function petAppliance(b, w, d, h, fountain) {
  if (fountain) {
    b.cyl(0, 0, Math.min(w, d) * 0.48, 0, h * 0.35, C.body, C.glass, 18, EDGE_FURN);
    b.cyl(0, 0, w * 0.18, h * 0.35, h * 0.82, C.white, C.whiteTop, 14, EDGE_FAINT);
    b.cyl(0, 0, w * 0.32, h * 0.78, h, C.glass, C.accent, 18, EDGE_GLOW);
    return;
  }
  b.cyl(0, -d * 0.06, w * 0.38, h * 0.28, h, C.white, C.whiteTop, 16, EDGE_FURN);
  b.box(-w * 0.42, w * 0.42, 0, h * 0.32, -d * 0.42, d * 0.45, C.body, C.bodyTop, EDGE_FAINT);
  b.cyl(0, d * 0.3, w * 0.3, h * 0.05, h * 0.18, C.metal, C.glass, 14, EDGE_GLOW);
  b.box(-w * 0.12, w * 0.12, h * 0.55, h * 0.66, d * 0.31, d * 0.45, C.dark, C.accent, EDGE_GLOW);
}
function petGate(b, w, d, h) {
  const rail = Math.min(w * 0.055, 0.045);
  b.box(-w / 2, w / 2, 0, rail, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  b.box(-w / 2, w / 2, h - rail, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  for (let i = 0; i < 9; i++) {
    const x = -w * 0.46 + i * w * 0.115;
    b.box(x - rail / 2, x + rail / 2, rail, h - rail, -d / 2, d / 2, C.metal, C.metal, EDGE_FAINT);
  }
  b.box(w * 0.28, w * 0.42, h * 0.48, h * 0.58, d * 0.48, d * 0.62, C.accent, C.accent, EDGE_GLOW);
}
function petStairs(b, w, d, h) {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const z0 = -d / 2 + d / steps * i;
    const y = h / steps * (i + 1);
    b.pad(-w / 2, w / 2, 0, y, z0, z0 + d / steps + 0.01, C.fabric, C.cushion, 0.025, EDGE_FURN);
  }
}
function cage(b, w, d, h, kind) {
  const baseH = h * (kind === "rabbit" ? 0.08 : 0.14);
  b.box(-w / 2, w / 2, 0, baseH, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const bar = Math.min(w, d) * 0.018;
  const cols = kind === "rabbit" ? 10 : 8;
  for (let i = 0; i <= cols; i++) {
    const x = -w / 2 + w / cols * i;
    for (const z of [-d / 2, d / 2]) b.box(x - bar, x + bar, baseH, h, z - bar, z + bar, C.metal, C.metal, EDGE_FAINT);
  }
  for (const x of [-w / 2, w / 2]) for (let i = 0; i <= 5; i++) {
    const z = -d / 2 + d / 5 * i;
    b.box(x - bar, x + bar, baseH, h, z - bar, z + bar, C.metal, C.metal, EDGE_FAINT);
  }
  b.box(-w / 2, w / 2, h - bar * 2, h, -d / 2, d / 2, C.metal, C.metal, EDGE_FURN);
  if (kind === "hamster") {
    b.lyingCyl("x", w * 0.2, 0, baseH + h * 0.05, h * 0.58, w * 0.12, h * 0.42, C.accent, C.dark, 16, EDGE_GLOW);
    b.box(-w * 0.4, -w * 0.12, baseH, h * 0.35, -d * 0.32, d * 0.08, C.wood, C.woodTop, EDGE_FAINT);
  } else {
    b.box(-w * 0.38, -w * 0.05, baseH, h * 0.38, -d * 0.35, d * 0.08, C.wood, C.woodTop, EDGE_FAINT);
    b.cyl(w * 0.26, d * 0.18, Math.min(w, d) * 0.09, baseH, h * 0.26, C.metal, C.glass, 12, EDGE_GLOW);
  }
}
function birdCage(b, w, d, h) {
  const r = Math.min(w, d) * 0.46;
  b.cyl(0, 0, r, 0, h * 0.08, C.body, C.bodyTop, 18, EDGE_FURN);
  b.cyl(0, 0, r, h * 0.76, h * 0.82, C.metal, C.metal, 18, EDGE_FURN);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    b.cyl(x, z, r * 0.018, h * 0.06, h * 0.8, C.metal, C.metal, 6, EDGE_FAINT);
  }
  b.cyl(0, 0, r * 0.7, h * 0.82, h * 0.94, C.metal, C.metal, 16, EDGE_FAINT);
  b.cyl(0, 0, r * 0.12, h * 0.94, h, C.accent, C.accent, 10, EDGE_GLOW);
  b.box(-r * 0.7, r * 0.7, h * 0.44, h * 0.47, -r * 0.05, r * 0.05, C.wood, C.woodTop, EDGE_FAINT);
}
function glassHabitat(b, w, d, h, cabinet, dry) {
  const base = cabinet ? h * 0.48 : h * 0.06;
  if (cabinet) {
    b.box(-w / 2, w / 2, 0, base, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
    b.box(-w * 0.025, w * 0.025, h * 0.04, base * 0.92, d * 0.49, d * 0.52, C.dark, C.dark, EDGE_FAINT);
  } else b.box(-w / 2, w / 2, 0, base, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  b.box(-w * 0.48, w * 0.48, base, h * 0.94, -d * 0.48, d * 0.48, C.glass, C.glass, EDGE_GLOW);
  b.box(-w / 2, w / 2, h * 0.94, h, -d / 2, d / 2, C.dark, C.bodyTop, EDGE_FURN);
  if (dry) {
    b.box(-w * 0.45, w * 0.45, base, base + h * 0.12, -d * 0.45, d * 0.45, C.wood, C.woodTop, EDGE_FAINT);
    for (const x of [-w * 0.27, w * 0.04, w * 0.3]) b.cyl(x, 0, w * 0.035, base + h * 0.1, base + h * 0.55, C.wood, C.woodTop, 8, EDGE_FAINT);
  } else {
    b.box(-w * 0.45, w * 0.45, base + h * 0.05, base + h * 0.11, -d * 0.45, d * 0.45, C.wood, C.plant, EDGE_FAINT);
    for (const x of [-w * 0.26, w * 0.18]) b.cyl(x, 0, w * 0.035, base + h * 0.1, base + h * 0.45, C.plant, C.plantTop, 7, EDGE_GLOW);
  }
}
export const PET_FURNITURE_MODELS = {
  cat_tree_large: ({
    b,
    w,
    d,
    h
  }) => (catTree(b, w, d, h), 0.5),
  cat_scratching_post: ({
    b,
    w,
    d,
    h
  }) => (scratchingPost(b, w, d, h), 0.5),
  cat_scratch_board_wall: ({
    b,
    w,
    d,
    h
  }) => (wallCat(b, w, d, h, "board"), false),
  cat_cave: ({
    b,
    w,
    d,
    h
  }) => (cave(b, w, d, h), 0.5),
  cat_bed_round: ({
    b,
    w,
    d,
    h
  }) => (roundBed(b, w, d, h), 0.5),
  cat_wall_perch: ({
    b,
    w,
    d,
    h
  }) => (wallCat(b, w, d, h, "perch"), false),
  cat_climbing_steps_wall: ({
    b,
    w,
    d,
    h
  }) => (wallCat(b, w, d, h, "steps"), false),
  litter_box_hood: ({
    b,
    w,
    d,
    h
  }) => (litter(b, w, d, h, false), 0.5),
  litter_box_self_cleaning: ({
    b,
    w,
    d,
    h
  }) => (litter(b, w, d, h, true), 0.5),
  dog_bed: ({
    b,
    w,
    d,
    h
  }) => (dogBed(b, w, d, h, false), 0.5),
  dog_basket: ({
    b,
    w,
    d,
    h
  }) => (dogBed(b, w, d, h, true), 0.5),
  dog_house: ({
    b,
    w,
    d,
    h
  }) => (dogHouse(b, w, d, h), 0.5),
  pet_bowls: ({
    b,
    w,
    d,
    h
  }) => (bowls(b, w, d, h), 0.5),
  pet_feeder_automatic: ({
    b,
    w,
    d,
    h
  }) => (petAppliance(b, w, d, h, false), 0.5),
  pet_water_fountain: ({
    b,
    w,
    d,
    h
  }) => (petAppliance(b, w, d, h, true), 0.5),
  pet_gate: ({
    b,
    w,
    d,
    h
  }) => (petGate(b, w, d, h), 0.5),
  pet_stairs: ({
    b,
    w,
    d,
    h
  }) => (petStairs(b, w, d, h), 0.5),
  hamster_cage: ({
    b,
    w,
    d,
    h
  }) => (cage(b, w, d, h, "hamster"), 0.5),
  small_animal_cage: ({
    b,
    w,
    d,
    h
  }) => (cage(b, w, d, h, "animal"), 0.5),
  rabbit_enclosure_outdoor: ({
    b,
    w,
    d,
    h
  }) => (cage(b, w, d, h, "rabbit"), 0.5),
  bird_cage: ({
    b,
    w,
    d,
    h
  }) => (birdCage(b, w, d, h), 0.5),
  aquarium_100: ({
    b,
    w,
    d,
    h
  }) => (glassHabitat(b, w, d, h, false, false), 0.5),
  aquarium_240_cabinet: ({
    b,
    w,
    d,
    h
  }) => (glassHabitat(b, w, d, h, true, false), 0.5),
  terrarium: ({
    b,
    w,
    d,
    h
  }) => (glassHabitat(b, w, d, h, false, true), 0.5)
};