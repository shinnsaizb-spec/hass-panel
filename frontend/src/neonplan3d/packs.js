/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/packs.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Furniture from imported packs (see custom_components/neonplan3d/packs.py for the format). Pack
// furniture has the type "pack:<pack id>:<item id>". Every bundle (main, editor, 3D) keeps its own
// registry, filled with setPacks() from the packs the backend returns.

import { builtinBase, ELECTRIC_FURNITURE, FURNITURE_SIZE, outdoorGround, pointInPolygon, surfaceHeight, WALL_LAMP_Y } from "./model.js";
let registry = [];
let items = new Map();
let version = 0;
export function setPacks(packs) {
  registry = packs;
  items = new Map(packs.flatMap(p => p.items.map(it => [packType(p.id, it.id), it])));
  version++;
}
export function getPacks() {
  return registry;
}

/** Changes with every setPacks(), to notice new packs. */
export function packsVersion() {
  return version;
}
export function packType(packId, itemId) {
  return `pack:${packId}:${itemId}`;
}
export function isPackType(type) {
  return type.startsWith("pack:");
}

/** The pack item of a furniture type (undefined for built-in types and removed packs). */
/** Packs that were merged into another one: furniture placed from them keeps working. */
const PACK_ALIASES = {
  "mastershort.living_basics": "mastershort.living",
  "mastershort.kitchen_basics": "mastershort.kitchen",
  "mastershort.bedroom_basics": "mastershort.bedroom",
  "mastershort.bath_basics": "mastershort.bath"
};

/** The screen part of a pack item (a TV or monitor), if it has one. */
export function packScreen(type) {
  return packItem(type)?.parts.find(p => p.screen);
}
export function packItem(type) {
  if (!isPackType(type)) return undefined;
  const hit = items.get(type);
  if (hit) return hit;
  const [, pack, ...rest] = type.split(":");
  const alias = PACK_ALIASES[pack];
  return alias ? items.get(`pack:${alias}:${rest.join(":")}`) : undefined;
}

/** Default size of any furniture type. */
export function furnitureSize(type) {
  return FURNITURE_SIZE[type] ?? packItem(type)?.size ?? [0.6, 0.6, 0.8];
}

/** Whether a type can be linked with entities (power sensor, switch …). */
export function isElectric(type) {
  // a pack item that only lights (a mirror with light, an aquarium) links a light like any lamp
  return ELECTRIC_FURNITURE.has(type) || !!packItem(type)?.electric || !!packItem(type)?.light;
}

/** Name of a pack item in a language (English, then the first name as fallback). */
export function packItemName(item, language) {
  const lang = language.split("-")[0];
  return item.name[lang] ?? item.name.en ?? Object.values(item.name)[0] ?? item.id;
}

/** Height of the bottom of a pack item, a wall light or an LED strip above the floor (0 for other built-in furniture). */
export function mountBase(floor, f) {
  const item = packItem(f.type);
  if (f.mount_y != null) return f.mount_y;
  // wall lights at the usual height, LED strips just under the ceiling
  if (f.type === "lamp_wall" || f.type === "lamp_wall_updown") return WALL_LAMP_Y;
  if (f.type === "led_strip") return Math.max(0, floor.height - 0.04 - Math.max(0.02, f.h));
  if (f.type === "fan_ceiling" || f.type === "fan_ceiling_light") return Math.max(0, floor.height - Math.max(0.05, f.h));
  if (f.type === "access_point" || f.type === "smoke_detector" || f.type === "cinema_projector_ceiling" || f.type === "cinema_speaker_ceiling") return Math.max(0, floor.height - Math.max(0.02, f.h));
  if (f.type === "fan_wall") return 1.55;
  if (f.type === "altar_wall") return 1.45;
  if (f.type === "floating_shelf") return 1.35;
  if (f.type === "nightstand_floating") return 0.48;
  if (f.type === "water_heater") return 1.7;
  if (f.type === "range_hood") return 1.35;
  if (f.type === "microwave") return surfaceHeight(floor, f.x, f.z);
  if (f.type === "kitchen_open_shelf") return 1.25;
  if (f.type === "kitchen_spice_rack_wall") return 1.3;
  if (f.type === "kitchen_plate_rack_wall") return 1.25;
  if (["modem_router", "smart_display", "monitor_single", "monitor_dual", "monitor_triple", "printer_3d_open", "printer_3d_enclosed", "laser_printer", "baby_monitor", "lamp_night_moon", "lamp_star_projector", "kitchen_coffee_machine", "cinema_projector_table", "cinema_speaker_bookshelf", "cinema_speaker_center", "cinema_soundbar", "cinema_av_receiver", "cinema_projector_ust", "cinema_turntable", "cinema_media_streamer", "cinema_bluray_player", "cinema_stereo_amplifier", "cinema_headphone_stand"].includes(f.type)) return surfaceHeight(floor, f.x, f.z);
  // An outdoor pump follows the lawn/terrace below it; inside a room it stays on that floor.
  if ((f.type === "water_pump" || f.type === "heat_pump_outdoor") && !floor.rooms.some(r => r.points.length >= 3 && pointInPolygon([f.x, f.z], r.points))) return outdoorGround(floor, f.x, f.z);
  switch (item?.mount) {
    case "surface":
      return surfaceHeight(floor, f.x, f.z);
    case "wall":
      return item.wall_y ?? 1;
    case "ceiling":
      return Math.max(0, floor.height - f.h);
    default:
      // built-in models: where they are drawn by default (a wall cabinet at 1.45 m)
      return item ? 0 : builtinBase(f);
  }
}