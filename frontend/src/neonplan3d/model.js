/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/model.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Data model shared by editor, 3D view and backend (see custom_components/neonplan3d/schema.py).
// Units are metres; x grows to the right, z grows downwards (as in the 2D editor).

import { packItem } from "./packs.js";
import { BUILTIN_VEHICLE_TYPES, ELECTRIC_FURNITURE, ENERGY_DEVICES, FURNITURE_GROUPS, FURNITURE_SIZE, FURNITURE_TYPES, LAMP_TYPES, STAIR_TYPES } from "./furniture/metadata.js";
// Compatibility facade: existing callers can keep importing furniture metadata from model.ts.
export { BUILTIN_VEHICLE_TYPES, ELECTRIC_FURNITURE, ENERGY_DEVICES, FURNITURE_GROUPS, FURNITURE_SIZE, FURNITURE_TYPES, LAMP_TYPES, STAIR_TYPES };

/** Sensors a room's climate is read from (null = automatic, "none" = no value). */

/** A wall height on a room edge, or one per part of a split edge. */

export function isCoveredRoom(room) {
  return room.kind === "veranda" || room.kind === "balcony" || room.kind === "canopy";
}

/** Front edge of a covered polygon: opposite and parallel to its omitted house edge, else the longest. */
export function coveredFrontEdge(poly, openEnd) {
  if (poly.length < 2) return 0;
  if (openEnd < 0) {
    let front = 0;
    let longest = -1;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (length > longest) [front, longest] = [i, length];
    }
    return front;
  }
  const wa = poly[openEnd];
  const wb = poly[(openEnd + 1) % poly.length];
  const wdx = wb[0] - wa[0];
  const wdz = wb[1] - wa[1];
  const wl = Math.hypot(wdx, wdz) || 1;
  const wx = (wa[0] + wb[0]) / 2;
  const wz = (wa[1] + wb[1]) / 2;
  let front = 0;
  let best = -1;
  for (let i = 0; i < poly.length; i++) {
    if (i === openEnd) continue;
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const l = Math.hypot(dx, dz) || 1;
    const parallel = Math.abs((dx * wdx + dz * wdz) / (l * wl));
    const distance = Math.abs(wdx * ((p[1] + q[1]) / 2 - wz) - wdz * ((p[0] + q[0]) / 2 - wx)) / wl;
    const score = distance * parallel;
    if (score > best) [front, best] = [i, score];
  }
  return front;
}

/** Entity link of an opening: null = assigned automatically by area, "none" = no entity. */

/** A picture rule of a screen: while `entity` is in `state`, the stored image (or a URL) is shown. */

/** How a device's marker shows in 3D (null = automatic by the marker mode). */
export const MARKER_SHOWS = ["always", "no_power", "never"];

/** A wall drawn on its own, from a to b along its centre line. */

/** "custom": the roof is made of sections (wings of an L- or T-shaped house, a barn, a lean-to …). */

/** Shapes of a roof section. */
export const ROOF_SHAPES = ["gable", "hip", "halfhip", "pyramid", "mansard", "pent", "flat", "parapet"];

/**
 * One roof section over a rectangle of the plan (at the outer wall faces; the overhang comes on top).
 * Heights are above the ground. Across the ridge, side "a" is the low coordinate (z for a ridge along
 * x, x for a ridge along z), side "b" the high one; each side has its own eave height and pitch, so one
 * slope can reach further down (a catslide over a lower part). A pent roof rises from side a.
 */

/**
 * A field of solar modules on a roof face (see solar.ts): rows × columns from its lower left corner (u along
 * the eave, v up the slope, in metres). On a flat roof the modules stand on frames, tilted by `tilt`.
 */

/**
 * A roof window on a roof face (u along the eave, v up the slope, in metres, at its lower left corner). Like a
 * window it follows a contact (open or tilted: the sash swings out at the top) and a blind (cover).
 */
/** Energie Pro: where the hologram hangs – on a solar field, moved along the field and up the slope, scaled. */

export const DEFAULT_HOLOGRAM = {
  field: null,
  size: 1,
  right: 0,
  up: 0
};

/**
 * Energie Pro: a cable laid by hand. Its id names the cable ("solar:<field>", "inv:<inverter>", "bat:<battery>",
 * "grid"); the points are its way in the plan, run at `height` above the given floor.
 */

/** A string of solar modules: one or more fields wired together to one inverter. */

export const BUTTON_ACTIONS = ["navigate", "more_info", "service", "fire_dom_event"];

/**
 * An own button in the central menu (D143): opens a dashboard path, the more-info dialog of an entity,
 * calls a service, or fires a DOM event (a browser_mod popup with your own card).
 */

/**
 * Something to play on a speaker from its quick menu (Klang & Kino): media_player.play_media with this
 * content type and id – a radio stream URL, a Music Assistant or Sonos URI, or for an Echo (Alexa Media
 * Player) the type SPOTIFY / AMAZON_MUSIC / TUNEIN with what you would say ("Rock Antenne").
 */

/** A camera position around the house: azimuth and polar angle (radians) and the distance (m). */

/**
 * Whether an item is fixed: rooms, walls, doors, windows and outdoor areas follow the plan lock alone,
 * furniture and devices their own lock.
 */
export function isFixed(item, structural, settings) {
  if (!item) return false;
  return structural ? !!settings.lock_plan : !!item.locked;
}
export const WEATHER_EFFECTS = ["rain", "snow", "fog", "clouds", "lightning", "sky"];
/** The effects shown when the plan does not say: everything but fog (fog greys the whole scene). */
export const DEFAULT_WEATHER_EFFECTS = ["rain", "snow", "clouds", "lightning", "sky"];
export const OUTDOOR_TYPES = ["lawn", "terrace", "path", "driveway", "pool", "bed", "wild", "hedge", "fence", "pergola"];
/** Top of each kind of outdoor area above ground level (pool: its water, below). */
export const OUTDOOR_TOP = {
  lawn: 0.012,
  terrace: 0.12,
  path: 0.02,
  driveway: 0.02,
  pool: -0.25,
  bed: 0.15,
  wild: 0.03,
  hedge: 1.2,
  fence: 1.0,
  pergola: 2.2
};

/** Built-in floor/slab height of room-like covered structures. */
export const COVERED_FLOOR_TOP = {
  canopy: 0.02,
  veranda: 0.12,
  balcony: 0.12
};
export function coveredFloorTop(type) {
  return COVERED_FLOOR_TOP[type];
}

/** Types that stand on the ground as structures (no surface to stand on, no light pool). */
export function outdoorStanding(type) {
  return type === "hedge" || type === "fence" || type === "pergola";
}

/** The directions an area can fall towards: +x (right in the plan), −x, +z (down in the plan), −z. */
export const SLOPE_DIRS = ["x", "-x", "z", "-z"];
/**
 * How far the surface of an area has dropped at a point (m, ≥ 0): zero on the high edge, the full
 * slope on the low edge, along the slope direction across the extent of the polygon.
 */
export function outdoorDrop(a, x, z) {
  const slope = a.slope ?? 0;
  if (!slope || a.type === "pool") return 0;
  const dir = a.slope_dir ?? "x";
  const proj = (px, pz) => dir === "x" ? px : dir === "-x" ? -px : dir === "z" ? pz : -pz;
  let lo = Infinity;
  let hi = -Infinity;
  for (const [px, pz] of a.points) {
    const v = proj(px, pz);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (hi - lo < 1e-6) return 0;
  const t = Math.min(1, Math.max(0, (proj(x, z) - lo) / (hi - lo)));
  return slope * t;
}

/** Height of the surface of an area at a point, in floor coordinates (offset and slope included). */
export function outdoorTopAt(floor, a, x, z) {
  return groundLevel(floor) + (a.offset ?? 0) + OUTDOOR_TOP[a.type] - outdoorDrop(a, x, z);
}

/** Ground level in floor coordinates: below the ground floor slab (0.2 m), the floor itself further up. */
export function groundLevel(floor) {
  return floor.elevation > 0.3 ? 0 : -0.2;
}

/** Height outdoor lamps stand on at a point: ground level, or the top of a terrace or bed there. */
export function outdoorGround(floor, x, z) {
  const inside = (floor.outdoor ?? []).filter(o => !outdoorStanding(o.type) && o.type !== "pool" && pointInPolygon([x, z], o.points));
  // an area cut out of the one beneath it wins over that one
  const a = [...inside].reverse().find(o => o.cut) ?? inside[0];
  return a ? outdoorTopAt(floor, a, x, z) : groundLevel(floor);
}

/** Auto Pro: which entities tell the car's state; null = automatic (an entity of the car's Home Assistant device). */

/** Area outside the house (lawn, terrace, pool, hedge …), drawn like a room. */

/** Energy flow: meter position and power sensors (W). Grid positive = import, battery positive = discharging. */

/** A person and the sensor whose state names the room they are in (ESPresense, Bermuda, …). */

export const DEFAULT_ENERGY = {
  meter: null,
  grid: null,
  grid_invert: false,
  solar: null,
  battery: null,
  battery_invert: false,
  battery_soc: null,
  consumption: null,
  tariff: null
};
export const FLOOR_MATERIALS = ["wood", "oak", "tiles", "carpet", "stone", "concrete"];
export const DEFAULT_ROOF = {
  type: "none",
  pitch: 35,
  overhang: 0.4
};
export const DEFAULT_SETTINGS = {
  menu_style: "honeycomb",
  wall_exterior: 0.24,
  wall_interior: 0.12,
  grid: 0.05,
  north: 0,
  roof: {
    ...DEFAULT_ROOF
  }
};

/** Unknown or missing persisted values fail closed to the proven classic menu. */
export function normalizeMenuStyle(value) {
  return value === "honeycomb" ? "honeycomb" : "classic";
}
export function emptyBuilding() {
  return {
    version: 1,
    floors: [],
    settings: {
      ...DEFAULT_SETTINGS
    },
    energy: {
      ...DEFAULT_ENERGY
    },
    presence: []
  };
}
export function newFloor(id, name, elevation) {
  return {
    id,
    name,
    elevation,
    height: 2.5,
    cut_height: 1.15,
    rooms: [],
    openings: [],
    furniture: [],
    placements: [],
    background: null,
    outdoor: [],
    walls: [],
    ha_floor: null
  };
}

/** Storey height used to place floors created from Home Assistant levels. */
export const LEVEL_HEIGHT = 2.75;

/** Where a new floor goes: at its Home Assistant level if known, otherwise on top. */
export function floorElevation(floors, level) {
  if (level != null && Number.isFinite(level)) return Math.round(level * LEVEL_HEIGHT * 100) / 100;
  const top = floors.reduce((t, f) => !t || f.elevation > t.elevation ? f : t, null);
  return top ? Math.round((top.elevation + top.height + 0.25) * 100) / 100 : 0;
}

/**
 * Rooms for areas as 4 × 3 m tiles in rows beside a floor's existing rooms, to be dragged into place
 * and resized.
 */
export function roomTiles(floor, areas, id) {
  const xs = floor.rooms.flatMap(r => r.points.map(p => p[0]));
  const zs = floor.rooms.flatMap(r => r.points.map(p => p[1]));
  const x0 = xs.length ? Math.ceil(Math.max(...xs)) + 1 : 0;
  const z0 = zs.length ? Math.floor(Math.min(...zs)) : 0;
  return areas.map((a, i) => {
    const x = x0 + i % 3 * 4.5;
    const z = z0 + Math.floor(i / 3) * 3.5;
    return {
      id: id(),
      name: a.name,
      area_id: a.area_id,
      points: [[x, z], [x + 4, z], [x + 4, z + 3], [x, z + 3]],
      floor_material: "wood"
    };
  });
}

/**
 * Resizes a furniture item by dragging one corner (`corner`: signs of the corner in the item's own
 * frame) to a plan point; the opposite corner stays in place. Sizes snap to `grid`.
 */
export function resizeFurniture(f, corner, p, grid) {
  const a = f.rotation * Math.PI / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const [sx, sz] = corner;
  // item axes in the plan: local x → (c, s), local z → (-s, c)
  const ax = f.x - sx * (f.w / 2) * c + sz * (f.d / 2) * s;
  const az = f.z - sx * (f.w / 2) * s - sz * (f.d / 2) * c;
  const dx = p[0] - ax;
  const dz = p[1] - az;
  const snapSize = v => Math.max(0.1, Math.round(v / grid) * grid);
  const w = snapSize((dx * c + dz * s) * sx);
  const d = snapSize((-dx * s + dz * c) * sz);
  const r = v => Math.round(v * 1000) / 1000;
  return {
    x: r(ax + sx * (w / 2) * c - sz * (d / 2) * s),
    z: r(az + sx * (w / 2) * s + sz * (d / 2) * c),
    w: r(w),
    d: r(d)
  };
}

/** One of a furniture item's corners in plan coordinates. */
export function furnitureCorner(f, corner) {
  const a = f.rotation * Math.PI / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const [sx, sz] = corner;
  return [f.x + sx * (f.w / 2) * c - sz * (f.d / 2) * s, f.z + sx * (f.w / 2) * s + sz * (f.d / 2) * c];
}

/** Rotation whose local front (+z) points from the furniture centre towards `p`. */
export function furnitureRotationAt(f, p) {
  return Math.atan2(-(p[0] - f.x), p[1] - f.z) * 180 / Math.PI;
}

/** Default height of the bottom of a wall light above the floor (metres). */
export const WALL_LAMP_Y = 1.75;

/** Items that can be lifted off the floor (a wall cabinet, a shelf, a wall light, an LED strip): everything but lamps hung from the ceiling and the ceiling-mounted pack items. */
export function canLift(f) {
  if (["lamp_ceiling", "lamp_downlight", "lamp_spot", "lamp_panel", "lamp_panel_round", "lamp_pendant", "lamp_cinema_star_ceiling", "fan_ceiling", "fan_ceiling_light", "access_point", "smoke_detector", "cinema_projector_ceiling", "cinema_speaker_ceiling", "stairwell", "parking"].includes(f.type) || STAIR_TYPES.has(f.type)) return false;
  return packItem(f.type)?.mount !== "ceiling";
}
export function isLamp(type) {
  return LAMP_TYPES.has(type) || !!packItem(type)?.light;
}

/** Furniture a table lamp can stand on. */
const SURFACES = new Set(["table", "table_round", "coffee_table", "coffee_table_round", "coffee_table_glass", "nesting_tables", "side_table_round", "console_table", "lowboard_120", "lowboard_160", "lowboard_200", "table_120", "table_160", "table_200", "table_solid_220", "tv_console", "desk", "desk_l", "desk_corner", "desk_sit_stand", "desk_kids", "table_chairs_kids", "changing_dresser", "nightstand", "nightstand_drawer", "nightstand_slim", "nightstand_floating", "vanity_mirror", "vanity_light", "changing_table", "vanity_60", "vanity_80", "vanity_100", "double_vanity_120", "bathroom_cabinet_mid", "bathroom_wall_shelf", "washer_vanity", "builtin_shelf_niche", "window_seat", "platform_steps", "sideboard", "dresser", "kitchen", "island", "kitchen_island_bar", "kitchen_cart", "kitchen_open_shelf", "worktop", "tv_board", "dishwasher", "washer", "dryer", "cinema_vinyl_shelf", "cinema_hifi_rack"]);

/**
 * Positions of a rows × cols grid of lamps in a room: cells of equal size over the room's bounding box,
 * one lamp per cell centre that lies inside the room (L-shaped rooms simply leave cells out).
 */
export function spotGrid(room, rows, cols, inset = 0) {
  const b = bounds(room.points);
  const w = b.x1 - b.x0 - 2 * inset;
  const d = b.z1 - b.z0 - 2 * inset;
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = [Math.round((b.x0 + inset + w / cols * (c + 0.5)) * 1000) / 1000, Math.round((b.z0 + inset + d / rows * (r + 0.5)) * 1000) / 1000];
      if (pointInPolygon(p, room.points)) out.push(p);
    }
  }
  return out;
}
/** Point `length` metres from `p` in a plan direction (right = +x, down = +z, as in the editor). */
export function step(p, length, dir) {
  const r = v => Math.round(v * 1000) / 1000;
  const [dx, dz] = {
    right: [1, 0],
    down: [0, 1],
    left: [-1, 0],
    up: [0, -1]
  }[dir];
  return [r(p[0] + dx * length), r(p[1] + dz * length)];
}

/** Height of the highest furniture top under a point (0 = the floor). */
/**
 * Height of the bottom of a built-in model as drawn (a wall cabinet hangs at 1.45 m, a wall TV is
 * centred at 1.3 m, a radiator stands on short brackets); the mount height replaces it.
 */
export function builtinBase(f) {
  switch (f.type) {
    case "home_battery":
      // a wall battery hangs at hip height
      return f.variant === "wall" ? 0.5 : 0;
    case "kitchen_wall":
      return 1.45;
    case "floating_shelf":
      return 1.35;
    case "wall_shelf_garage":
      return 1.25;
    case "whiteboard_office":
      return 1.2;
    case "filament_shelf_wall":
      return 1.1;
    case "cat_scratch_board_wall":
      return 0.65;
    case "cat_wall_perch":
      return 1.15;
    case "cat_climbing_steps_wall":
      return 0.55;
    case "fitness_mirror_wall":
      return 0.5;
    case "fitness_wall_bars":
      return 0.3;
    case "fitness_mirror_smart":
      return 0.4;
    case "cinema_screen_wall":
    case "cinema_screen_roller":
      return 0.65;
    case "cinema_speaker_wall":
    case "cinema_speaker_inwall":
      return 1.2;
    case "cinema_acoustic_panel":
      return 0.65;
    case "cinema_tv_oled_65":
    case "cinema_tv_oled_85":
      return 0.75;
    case "nightstand_floating":
      return 0.48;
    case "tv_wall":
      return Math.max(0, 1.3 - f.h / 2);
    case "radiator":
      return 0.12;
    case "air_conditioner":
      return 1.9;
    case "inverter":
      return 1.1;
    case "wallbox":
      return 1.0;
    case "meter":
      return 0.4;
    case "security_camera":
      return 1.85;
    case "smart_lock":
      return 0.95;
    case "wall_thermostat":
      return 1.35;
    case "siren_alarm":
      return 1.85;
    case "electrical_panel":
      return 0.85;
    case "ventilation_fan":
      return 1.8;
    case "wall_switch":
      return 1.05;
    case "wall_outlet":
    case "smart_plug":
      return 0.3;
    case "motion_sensor":
      return 1.9;
    case "contact_sensor":
      return 1.1;
    case "temperature_humidity_sensor":
      return 1.35;
    case "video_doorbell":
      return 1.25;
    default:
      return 0;
  }
}
export function surfaceHeight(floor, x, z) {
  let top = 0;
  for (const f of floor.furniture) {
    if (!(SURFACES.has(f.type) || packItem(f.type)?.surface) || !pointInPolygon([x, z], furnitureFootprint(f))) continue;
    top = Math.max(top, f.h);
  }
  return top;
}
export const OPENING_DEFAULTS = {
  door: {
    width: 0.9,
    sill: 0,
    height: 2.05
  },
  window: {
    width: 1.2,
    sill: 0.9,
    height: 1.3
  },
  garage: {
    width: 2.5,
    sill: 0,
    height: 2.1
  }
};

/** Kinds of openings offered when placing one; a terrace door is a window down to the floor. */
/** Door looks: room doors, front doors (with glass, one or two sidelights), a glass door, a sliding door. */
export const DOOR_STYLES = ["interior", "front", "front_glass", "sidelight", "sidelights", "glass", "sliding", "passage"];
/** "glass_wall": fixed floor-to-ceiling glazing without sashes, slim mullions (an indoor glass wall, #163). */
export const WINDOW_STYLES = ["standard", "bars", "glass_wall"];
/** The style an opening is drawn with: its own, or the automatic one for its wall. */
export function openingStyle(o, exterior) {
  if (o.type === "door") return o.style && DOOR_STYLES.includes(o.style) ? o.style : exterior ? "front" : "interior";
  return o.style && WINDOW_STYLES.includes(o.style) ? o.style : "standard";
}

/**
 * Where the fixed glass beside a front door's leaf sits, along the opening (0 … W, 2 cm margins): the
 * panels and the leaf's span. One sidelight sits opposite the hinge unless `sidelight_hinge`; the widths
 * come from the opening (null = automatic) and shrink together so the leaf keeps at least 0.5 m.
 */
export function sidelightLayout(W, style, hingeAtStart, o) {
  if (style !== "sidelight" && style !== "sidelights") return null;
  const both = style === "sidelights";
  const total = W - 0.04;
  const autoLeaf = Math.min(1.05, Math.max(0.6, total - (both ? 0.6 : 0.3)));
  const autoSide = (total - autoLeaf) / (both ? 2 : 1);
  let s1 = o.sidelight_width ?? autoSide;
  let s2 = both ? o.sidelight_width2 ?? o.sidelight_width ?? autoSide : 0;
  s1 = Math.max(0.1, s1);
  s2 = both ? Math.max(0.1, s2) : 0;
  const room = total - 0.5;
  if (s1 + s2 > room) {
    const k = Math.max(0, room) / (s1 + s2);
    s1 *= k;
    s2 *= k;
  }
  if (both) return {
    panels: [[0.02, 0.02 + s1], [W - 0.02 - s2, W - 0.02]],
    x0: 0.02 + s1,
    x1: W - 0.02 - s2
  };
  // one panel: at the start when the hinge is at the end (opposite), or at the hinge when asked for
  const atStart = hingeAtStart ? !!o.sidelight_hinge : !o.sidelight_hinge;
  return atStart ? {
    panels: [[0.02, 0.02 + s1]],
    x0: 0.02 + s1,
    x1: W - 0.02
  } : {
    panels: [[W - 0.02 - s1, W - 0.02]],
    x0: 0.02,
    x1: W - 0.02 - s1
  };
}

/** A front door look (thick leaf, threshold, light above it). */
export function isFrontDoor(style) {
  return style === "front" || style === "front_glass" || style === "sidelight" || style === "sidelights";
}
export const OPENING_PRESETS = {
  door: {
    type: "door",
    leaves: 1,
    width: 0.9,
    sill: 0,
    height: 2.05,
    style: "interior"
  },
  front: {
    type: "door",
    leaves: 1,
    width: 1.0,
    sill: 0,
    height: 2.1,
    style: "front"
  },
  door_double: {
    type: "door",
    leaves: 2,
    width: 1.6,
    sill: 0,
    height: 2.05
  },
  window: {
    type: "window",
    leaves: 1,
    width: 1.2,
    sill: 0.9,
    height: 1.3
  },
  window_double: {
    type: "window",
    leaves: 2,
    width: 1.6,
    sill: 0.9,
    height: 1.3
  },
  terrace: {
    type: "window",
    leaves: 1,
    width: 1.0,
    sill: 0,
    height: 2.1
  },
  terrace_double: {
    type: "window",
    leaves: 2,
    width: 1.8,
    sill: 0,
    height: 2.1
  },
  garage: {
    type: "garage",
    leaves: 1,
    width: 2.5,
    sill: 0,
    height: 2.1
  },
  glass_wall: {
    type: "window",
    leaves: 1,
    width: 2.0,
    sill: 0,
    height: 2.4,
    style: "glass_wall"
  }
};
/** The preset an opening matches (by type, leaves, style and whether it reaches the floor). */
export function openingPreset(o) {
  if (o.type === "garage") return "garage";
  if (o.type === "window" && o.style === "glass_wall") return "glass_wall";
  const two = o.leaves === 2;
  if (o.type === "door") {
    if (!two && o.style && isFrontDoor(o.style)) return "front";
    return two ? "door_double" : "door";
  }
  if (o.sill < 0.1) return two ? "terrace_double" : "terrace";
  return two ? "window_double" : "window";
}

/** Fill fields added in later versions so older saved buildings keep working. */
export function normalizeBuilding(b) {
  b.energy = {
    ...DEFAULT_ENERGY,
    ...(b.energy ?? {})
  };
  b.presence = b.presence ?? [];
  b.settings = {
    ...DEFAULT_SETTINGS,
    ...b.settings,
    roof: {
      ...DEFAULT_ROOF,
      ...(b.settings?.roof ?? {})
    }
  };
  for (const f of b.floors) {
    f.outdoor = f.outdoor ?? [];
    f.walls = f.walls ?? [];
    f.rooms = f.rooms.map(r => ({
      ...r,
      panel: r.panel ?? []
    }));
    f.ha_floor = f.ha_floor ?? null;
    f.placements = f.placements.map(p => ({
      ...p,
      mount: p.mount ?? null,
      rotation: p.rotation ?? 0
    }));
    f.furniture = f.furniture.map(m => {
      const item = {
        ...m,
        entity: m.entity ?? null,
        power: m.power ?? null
      };
      // The original robot entry was only 10 cm high. Upgrade exactly that legacy default to the
      // tower dock shown by the current model, while preserving every manually resized instance.
      if (m.type === "robot_vacuum" && Math.abs(m.w - 0.36) < 0.001 && Math.abs(m.d - 0.5) < 0.001 && Math.abs(m.h - 0.1) < 0.001) {
        const [w, d, h] = FURNITURE_SIZE.robot_vacuum;
        return {
          ...item,
          w,
          d,
          h
        };
      }
      return item;
    });
    // lights placed as devices (before lamps existed) become lamps of their mount type
    const lights = f.placements.filter(p => p.entity_id.startsWith("light."));
    if (lights.length) {
      const type = {
        ceiling: "lamp_ceiling",
        floor: "lamp_floor",
        table: "lamp_table",
        wall: "lamp_wall"
      };
      for (const p of lights) {
        const t = type[p.mount ?? "ceiling"];
        const [w, d, h] = FURNITURE_SIZE[t];
        f.furniture.push({
          id: `lamp_${p.entity_id.slice(6).replace(/[^A-Za-z0-9_\-.]/g, "_")}`.slice(0, 64),
          type: t,
          x: p.x,
          z: p.z,
          rotation: 0,
          w,
          d,
          h,
          variant: null,
          entity: p.entity_id,
          power: null
        });
      }
      f.placements = f.placements.filter(p => !p.entity_id.startsWith("light."));
    }
    f.openings = f.openings.map(o => ({
      ...o,
      hinge: o.hinge ?? "left",
      leaves: o.leaves ?? 1,
      swing: o.swing ?? "in",
      style: o.style ?? null,
      cover: o.cover ?? null,
      contact: o.contact ?? null,
      contact2: o.contact2 ?? null,
      tilt: o.tilt ?? null
    }));
  }
  return b;
}
export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Signed area (positive = counter-clockwise in x/z maths orientation). */
export function signedArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    a += x0 * z1 - x1 * z0;
  }
  return a / 2;
}
export function polygonArea(points) {
  return Math.abs(signedArea(points));
}

/** Area-weighted centroid; falls back to the vertex average for degenerate polygons. */
export function centroid(points) {
  const a = signedArea(points);
  if (Math.abs(a) < 1e-9) {
    const n = points.length || 1;
    return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
  }
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    const f = x0 * z1 - x1 * z0;
    cx += (x0 + x1) * f;
    cz += (z0 + z1) * f;
  }
  return [cx / (6 * a), cz / (6 * a)];
}

/** True when the polygon is an axis-aligned rectangle (so the editor can offer x/z/width/depth fields). */
export function isAxisRect(points) {
  if (points.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % 4];
    if (Math.abs(x0 - x1) > 1e-6 && Math.abs(z0 - z1) > 1e-6) return false;
  }
  return true;
}
export function bounds(points) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of points) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  return {
    x0,
    z0,
    x1,
    z1
  };
}

/** Corners of a furniture item in world x/z (rotated rectangle). */
export function furnitureFootprint(f) {
  const a = f.rotation * Math.PI / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const hw = f.w / 2;
  const hd = f.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => [f.x + x * c - z * s, f.z + x * s + z * c]);
}
export function pointInPolygon(p, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    if (zi > p[1] !== zj > p[1] && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** 3D model of each lamp type. */
export const LAMP_MODEL = {
  lamp_ceiling: "ceiling",
  lamp_downlight: "downlight",
  lamp_spot: "spot",
  lamp_panel: "panel",
  lamp_uplight: "uplight",
  lamp_bollard: "bollard",
  lamp_garden: "garden",
  lamp_column: "column",
  lamp_tv_bars: "tv_bars",
  lamp_orb_table: "orb_table",
  lamp_portable: "portable",
  lamp_ambient_spot: "ambient",
  lamp_cube: "cube",
  lamp_panel_round: "round_panel",
  lamp_garden_spots: "garden_set",
  lamp_wall_updown: "wall_updown",
  lamp_night_moon: "kids_moon",
  lamp_star_projector: "star_projector",
  lamp_cinema_star_ceiling: "star_ceiling",
  lamp_pendant: "pendant",
  lamp_floor: "floor",
  lamp_table: "table",
  lamp_wall: "wall",
  led_strip: "strip"
};