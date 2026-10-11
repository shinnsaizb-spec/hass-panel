/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/devices.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Devices of a room: which entities belong to an area, what kind they are, how they are placed and
// what their state looks like. Pure functions (no Lit, no three.js) so they can be tested directly.

import { centroid, pointInPolygon } from "./model.js";
import { packScreen } from "./packs.js";
const DOMAIN_KIND = {
  light: "light",
  switch: "switch",
  input_boolean: "switch",
  fan: "fan",
  water_heater: "switch",
  cover: "cover",
  climate: "climate",
  media_player: "media",
  lock: "lock",
  sensor: "sensor",
  binary_sensor: "binary",
  camera: "camera",
  scene: "scene",
  script: "script"
};

/** Sensors worth showing: room climate, and power (consumers of the energy flow). */
/** Sensor classes worth a marker: room climate, air quality, power and energy, meters (gas, water), light. */
const SENSOR_CLASSES = new Set(["temperature", "humidity", "power", "carbon_dioxide", "energy", "gas", "water", "volume", "volume_storage", "volume_flow_rate", "illuminance", "pressure", "atmospheric_pressure", "pm1", "pm25", "pm10", "volatile_organic_compounds", "volatile_organic_compounds_parts", "carbon_monoxide", "nitrogen_dioxide", "moisture", "sound_pressure"]);
/** Sensors without a class still count when their unit is a meter's (e.g. older meter readers). */
const METER_UNITS = new Set(["m³", "m3", "L", "l", "kWh", "Wh", "MWh", "lx"]);
const BINARY_CLASSES = new Set(["door", "window", "opening", "garage_door", "motion", "occupancy", "presence", "smoke", "moisture", "gas", "carbon_monoxide"]);

/** Order in lists and panels. */
export const KIND_ORDER = ["light", "cover", "climate", "media", "switch", "fan", "lock", "binary", "sensor", "camera", "scene", "script"];

/** Kinds that can be toggled with a tap in 3D. Fans open their Home Assistant details like climate devices, so speed and presets stay one tap away. */
export const TOGGLE_KINDS = new Set(["light", "switch"]);
/** Normal 3D taps stay immediate; richer controls remain available on long press. */
export function deviceTapAction(kind) {
  if (kind === "cover" || kind === "camera") return "menu";
  return kind !== null && TOGGLE_KINDS.has(kind) ? "toggle" : "details";
}
export function domainOf(entityId) {
  return entityId.slice(0, entityId.indexOf("."));
}
export function kindOf(entityId) {
  return DOMAIN_KIND[domainOf(entityId)] ?? null;
}

/** Scenes and scripts belong to the room panel, not to a spot in the room. */
export function isPlaceable(kind) {
  return kind !== null && kind !== "scene" && kind !== "script";
}
export function entityAreaId(hass, entityId) {
  const entry = hass.entities?.[entityId];
  if (!entry) return null;
  if (entry.area_id) return entry.area_id;
  return entry.device_id && hass.devices?.[entry.device_id]?.area_id || null;
}

/** Whether an entity is shown at all: visible, no config/diagnostic entity, and a kind we handle. */
export function isRelevant(hass, entityId) {
  const kind = kindOf(entityId);
  if (!kind) return false;
  const entry = hass.entities?.[entityId];
  if (entry?.hidden || entry?.entity_category) return false;
  const st = hass.states[entityId];
  if (!st) return false;
  const dc = st.attributes.device_class;
  if (kind === "sensor") return dc ? SENSOR_CLASSES.has(dc) : METER_UNITS.has(String(st.attributes.unit_of_measurement ?? ""));
  if (kind === "binary") return !!dc && BINARY_CLASSES.has(dc);
  return true;
}

/**
 * Lookups over the whole entity registry (entities per area, power sensors per device). They are
 * built once per registry and reused: every state change would otherwise scan thousands of
 * entities per room. Home Assistant replaces `entities`, `devices` and `states` with new objects when
 * they change, so their identity is the cache key; a changed number of states (entities that appear
 * after the registry) rebuilds as well.
 */

/** Sensor classes that never make a marker, even without an area (diagnostics of the device itself). */
const NOISE_CLASSES = new Set(["battery", "signal_strength", "timestamp", "date", "duration", "data_rate", "data_size", "frequency", "enum"]);

/** A numeric sensor with a unit: offered for devices without an area even without a known class. */
function isLooseSensor(hass, entityId) {
  if (kindOf(entityId) !== "sensor") return false;
  const entry = hass.entities?.[entityId];
  if (entry?.hidden || entry?.entity_category) return false;
  const st = hass.states[entityId];
  if (!st || !st.attributes.unit_of_measurement) return false;
  if (NOISE_CLASSES.has(String(st.attributes.device_class ?? ""))) return false;
  return Number.isFinite(Number(st.state)) || isUnavailable(st);
}
let registry = null;
function registryOf(hass) {
  const reg = registry;
  if (reg && reg.entities === hass.entities && reg.devices === hass.devices) {
    if (reg.states === hass.states) return reg;
    reg.states = hass.states;
    if (Object.keys(hass.states).length === reg.stateCount) return reg;
  }
  const areas = new Map();
  const power = new Map();
  const unassigned = [];
  const domains = new Map();
  for (const id of Object.keys(hass.entities ?? {})) {
    const entry = hass.entities[id];
    const device = entry.device_id;
    if (device && isPower(hass, id)) (power.get(device) ?? power.set(device, []).get(device)).push(id);
    if (device && !entry.hidden && !entry.entity_category) (domains.get(device) ?? domains.set(device, new Set()).get(device)).add(domainOf(id));
    const relevant = isRelevant(hass, id);
    const area = entityAreaId(hass, id);
    if (!area) {
      if ((relevant || isLooseSensor(hass, id)) && isPlaceable(kindOf(id))) unassigned.push(id);
      continue;
    }
    if (relevant) (areas.get(area) ?? areas.set(area, []).get(area)).push(id);
  }
  // entities without a registry entry (set up in YAML without a unique_id, e.g. a USB camera) have no area
  // and would never show up: they count as unassigned
  if (hass.entities) {
    for (const id of Object.keys(hass.states)) {
      if (hass.entities[id]) continue;
      if ((isRelevant(hass, id) || isLooseSensor(hass, id)) && isPlaceable(kindOf(id))) unassigned.push(id);
    }
  }
  unassigned.sort((a, b) => KIND_ORDER.indexOf(kindOf(a)) - KIND_ORDER.indexOf(kindOf(b)) || entityName(hass, a).localeCompare(entityName(hass, b)));
  for (const [areaId, ids] of areas) {
    const areaName = hass.areas?.[areaId]?.name;
    ids.sort((a, b) => {
      const ka = KIND_ORDER.indexOf(kindOf(a));
      const kb = KIND_ORDER.indexOf(kindOf(b));
      return ka - kb || entityName(hass, a, areaName).localeCompare(entityName(hass, b, areaName));
    });
  }
  registry = {
    entities: hass.entities,
    devices: hass.devices,
    states: hass.states,
    stateCount: Object.keys(hass.states).length,
    areas,
    power,
    unassigned,
    domains
  };
  return registry;
}

/** Entities of an area, sorted by kind and name (a shared array: do not change it). */
export function areaEntities(hass, areaId) {
  if (!areaId || !hass.entities) return [];
  return registryOf(hass).areas.get(areaId) ?? [];
}

/** Placeable entities of every other area, by area name (for placing a device from elsewhere). */
export function otherAreaEntities(hass, exceptArea) {
  if (!hass.entities) return [];
  return [...registryOf(hass).areas].filter(([areaId]) => areaId !== exceptArea).map(([areaId, ids]) => ({
    areaId,
    name: hass.areas?.[areaId]?.name ?? areaId,
    ids: ids.filter(id => isPlaceable(kindOf(id)))
  })).filter(a => a.ids.length).sort((a, b) => a.name.localeCompare(b.name));
}

/** Placeable entities without an area (templates, groups, helpers; any numeric sensor with a unit). */
export function unassignedEntities(hass) {
  if (!hass.entities) return [];
  return registryOf(hass).unassigned;
}

/** Device classes of the room climate values. */
export const CLIMATE_CLASSES = {
  temperature: "temperature",
  humidity: "humidity",
  co2: "carbon_dioxide"
};
/** Device domains that show a device is no room sensor (a heat pump, a 3D printer, a TV …). */
const NOT_A_ROOM_SENSOR = new Set(["climate", "water_heater", "switch", "button", "camera", "media_player", "vacuum", "light", "fan", "lawn_mower"]);
/** Names of temperatures that are not the room's (flow, nozzle, CPU, outside …). */
const NOT_ROOM_NAME = /(vorlauf|r(ü|ue)cklauf|flow|return|d(ü|ue)se|nozzle|hotend|extruder|druckbett|heatbed|(^|[^a-z])bed($|[^a-z])|chamber|cpu|gpu|chip|soc|akku|batter|wasser|water|kessel|boiler|au(ß|ss)en|outdoor|outside|abgas|exhaust|sole|brine|verdampfer|kondensat|verdichter|compressor|motor|k(ü|ue)hl|freezer|fridge|gefrier)/i;

/** Whether a sensor measures the room itself (not a device's inner temperature). */
export function isRoomClimateSensor(hass, entityId) {
  const device = hass.entities?.[entityId]?.device_id;
  const domains = device ? registryOf(hass).domains.get(device) : undefined;
  if (domains && [...domains].some(d => NOT_A_ROOM_SENSOR.has(d))) return false;
  return !NOT_ROOM_NAME.test(`${entityId} ${hass.states[entityId]?.attributes.friendly_name ?? ""}`);
}

/**
 * Sensors a room's temperature, humidity or CO2 is read from: the chosen one, or automatically the
 * room sensors of its area plus the ones placed in the room (an area sensor placed in another room
 * counts there instead).
 */
export function roomClimateSensors(hass, floor, room, key) {
  const chosen = room.climate?.[key];
  if (chosen === "none") return [];
  if (chosen) return hass.states[chosen] ? [chosen] : [];
  const dc = CLIMATE_CLASSES[key];
  const inRoom = (x, z) => pointInPolygon([x, z], room.points);
  const placed = floor?.placements.filter(p => p.entity_id.startsWith("sensor.")) ?? [];
  const here = placed.filter(p => inRoom(p.x, p.z)).map(p => p.entity_id);
  const elsewhere = new Set(placed.filter(p => !inRoom(p.x, p.z)).map(p => p.entity_id));
  const ids = [...new Set([...areaEntities(hass, room.area_id).filter(id => !elsewhere.has(id)), ...here])];
  return ids.filter(id => id.startsWith("sensor.") && hass.states[id]?.attributes.device_class === dc && isRoomClimateSensor(hass, id));
}

/** Average of a room climate value (null when no sensor reports one). */
/** The temperature unit Home Assistant shows ("°F" with US customary units, else "°C"). */
export function tempUnit(hass) {
  return hass.config?.unit_system?.temperature === "°F" ? "°F" : "°C";
}

/** A temperature in °C, from a value in the given unit (°F, K, else taken as °C). */
export function toCelsius(value, unit) {
  if (unit === "°F") return (value - 32) * 5 / 9;
  if (unit === "K") return value - 273.15;
  return value;
}

/** A temperature in °C shown in Home Assistant's unit. */
export function fromCelsius(hass, celsius) {
  return tempUnit(hass) === "°F" ? celsius * 9 / 5 + 32 : celsius;
}

/** Average of the room's climate sensors; temperatures always in °C, whatever unit a sensor reports. */
export function roomClimateValue(hass, floor, room, key) {
  const values = roomClimateSensors(hass, floor, room, key).map(id => {
    const v = Number(hass.states[id]?.state);
    return key === "temperature" ? toCelsius(v, hass.states[id]?.attributes.unit_of_measurement) : v;
  }).filter(v => Number.isFinite(v));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Power sensors of a device, in registry order (a shared array: do not change it). */
export function powerSensorsOf(hass, deviceId) {
  if (!hass.entities) return [];
  return registryOf(hass).power.get(deviceId) ?? [];
}

/** Friendly name without a leading area name ("Wohnzimmer Deckenlicht" in the Wohnzimmer -> "Deckenlicht"). */
export function entityName(hass, entityId, areaName) {
  const st = hass.states[entityId];
  const name = st?.attributes.friendly_name ?? hass.entities?.[entityId]?.name ?? entityId;
  if (areaName && name.length > areaName.length + 1 && name.toLowerCase().startsWith(areaName.toLowerCase() + " ")) {
    const rest = name.slice(areaName.length + 1);
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return name;
}
export function isUnavailable(st) {
  return !st || st.state === "unavailable" || st.state === "unknown";
}

/** States of a status sensor (a 3D printer, a washing machine's programme) that mean "it is working". */
const WORKING_STATES = new Set(["running", "printing", "prepare", "preparing", "slicing", "heating", "busy", "working", "active", "washing", "rinsing", "spinning", "drying", "cleaning", "in_progress", "in progress", "on"]);

/** Whether an entity is a status sensor (enum states such as running / idle / finish) that furniture can follow. */
export function isStatusSensor(st) {
  return !!st && st.entity_id.startsWith("sensor.") && st.attributes.device_class === "enum";
}

/** "Active" drives the glow of a device marker: light on, cover open, heating, playing, window open … */
export function isActive(st) {
  if (!st) return false;
  if (domainOf(st.entity_id) === "humidifier") return st.state === "on";
  if (domainOf(st.entity_id) === "lawn_mower") return ["mowing", "starting", "returning"].includes(st.state);
  if (domainOf(st.entity_id) === "siren") return st.state === "on";
  if (domainOf(st.entity_id) === "alarm_control_panel") return ["triggered", "pending", "arming"].includes(st.state);
  switch (kindOf(st.entity_id)) {
    case "light":
    case "switch":
    case "fan":
    case "binary":
      return st.state === "on";
    case "cover":
      return st.state === "open" || st.state === "opening";
    case "climate":
      return st.attributes.hvac_action === "heating" || st.attributes.hvac_action === "cooling";
    case "media":
      return st.state === "playing";
    case "lock":
      return st.state === "unlocked" || st.state === "open";
    case "sensor":
      // a status sensor: a 3D printer printing, a machine running
      return isStatusSensor(st) && WORKING_STATES.has(String(st.state).toLowerCase());
    default:
      return false;
  }
}

/** Colour (0..1 channels) and level (0..1) of a light that is on; null when off. */
export function lightGlow(st, colorFrom) {
  if (!st || st.state !== "on") return null;
  // a relay switches the light while the bulb itself knows its colour and brightness: read those there
  const a = colorFrom && !["unavailable", "unknown"].includes(colorFrom.state) ? colorFrom.attributes : st.attributes;
  // a perceptual curve: a lamp at 10 % still reads as "on" (0.45), full brightness stays 1
  const level = typeof a.brightness === "number" ? 0.2 + 0.8 * Math.sqrt(Math.min(1, Math.max(0, a.brightness / 255))) : 1;
  const rgb = a.rgb_color;
  let color;
  if (rgb && a.color_mode !== "color_temp" && a.color_mode !== "brightness" && a.color_mode !== "onoff") {
    color = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
  } else if (typeof a.color_temp_kelvin === "number") {
    color = kelvinToRgb(a.color_temp_kelvin);
  } else {
    color = [1, 0.71, 0.28]; // warm neon amber (#ffb547)
  }
  return {
    color,
    level
  };
}

/** Rough black-body colour for 2000–6500 K, tuned to stay warm and readable on the dark floor. */
export function kelvinToRgb(k) {
  const t = Math.min(1, Math.max(0, (k - 2200) / (6500 - 2200)));
  const warm = [1, 0.66, 0.26];
  const cool = [0.78, 0.9, 1];
  return [warm[0] + (cool[0] - warm[0]) * t, warm[1] + (cool[1] - warm[1]) * t, warm[2] + (cool[2] - warm[2]) * t];
}

/** Default mounting height of a device marker (metres above the floor). */
export function defaultHeight(kind, floorHeight, mount = null) {
  // a wall camera hangs high on the wall, a ceiling camera under the ceiling
  if (kind === "camera") return mount === "ceiling" ? Math.max(0.5, floorHeight - 0.05) : 2.2;
  if (kind === "light" && mount) {
    // markers sit just above floor and table lamps and next to wall lamps
    if (mount === "floor") return 1.95;
    if (mount === "table") return 1.25;
    if (mount === "wall") return 1.95;
  }
  switch (kind) {
    case "light":
      return Math.max(0.5, floorHeight - 0.25);
    case "cover":
      return Math.min(2, floorHeight - 0.3);
    case "climate":
      return 0.6;
    case "media":
      return 0.9;
    case "binary":
    case "sensor":
      return 1.4;
    default:
      return 1.05;
  }
}

// ------------------------------------------------------------------ automatic placement

function distanceToEdges(p, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2));
    best = Math.min(best, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t));
  }
  return best;
}

/**
 * Places entities in a room without overlapping each other or the markers already there. Lights go
 * towards the middle, spread out; everything else goes along the walls. The room label at the
 * centroid is kept free. Deterministic, so the same room always gets the same layout.
 */
export function autoPlace(room, entityIds, taken = []) {
  if (room.points.length < 3 || !entityIds.length) return [];
  const poly = room.points;
  const xs = poly.map(p => p[0]);
  const zs = poly.map(p => p[1]);
  const x0 = Math.min(...xs);
  const z0 = Math.min(...zs);
  const x1 = Math.max(...xs);
  const z1 = Math.max(...zs);
  const size = Math.min(x1 - x0, z1 - z0);
  const step = Math.max(0.1, Math.min(0.25, size / 8));
  const margin = Math.min(0.35, size / 5);
  const label = centroid(poly);
  const candidates = [];
  for (let x = x0 + step / 2; x < x1; x += step) {
    for (let z = z0 + step / 2; z < z1; z += step) {
      const p = [x, z];
      if (!pointInPolygon(p, poly)) continue;
      const wall = distanceToEdges(p, poly);
      if (wall < margin) continue;
      candidates.push({
        p,
        wall
      });
    }
  }
  if (!candidates.length) candidates.push({
    p: label,
    wall: 0
  });
  const used = [...taken];
  const out = [];
  const labelFree = Math.min(0.7, size / 4);
  for (const entity_id of entityIds) {
    const light = kindOf(entity_id) === "light";
    let best = candidates[0].p;
    let bestScore = -Infinity;
    for (const {
      p,
      wall
    } of candidates) {
      const free = used.length ? Math.min(...used.map(q => Math.hypot(p[0] - q[0], p[1] - q[1]))) : 3;
      const fromLabel = Math.hypot(p[0] - label[0], p[1] - label[1]);
      let score = Math.min(free, 3) * 2;
      if (fromLabel < labelFree && !light) score -= 10;
      // lights prefer the middle of the room, other devices a spot near a wall
      score -= light ? fromLabel * 0.35 : wall * 1.2;
      if (score > bestScore + 1e-9) {
        bestScore = score;
        best = p;
      }
    }
    const p = [Math.round(best[0] * 100) / 100, Math.round(best[1] * 100) / 100];
    used.push(p);
    out.push({
      entity_id,
      x: p[0],
      z: p[1],
      y: null,
      mount: null
    });
  }
  return out;
}

// ------------------------------------------------------------------ doors and windows

const COVER_CLASSES = new Set([undefined, "shutter", "blind", "awning", "shade", "curtain", "window"]);
const GARAGE_COVERS = new Set(["garage", "gate"]);
const WINDOW_CONTACTS = new Set(["window", "opening"]);
/** Pairs openings with entities in order; with `shared`, a single entity serves all openings. */
function pair(openings, ids, shared = false) {
  const out = new Map();
  if (!ids.length) return out;
  openings.forEach((o, i) => {
    const id = shared && ids.length === 1 ? ids[0] : ids[i];
    if (id) out.set(o.id, id);
  });
  return out;
}

/**
 * Entities of every door and window: set by hand, or (when null) matched automatically with the
 * covers and contact sensors of the room's area, in the order the openings sit on the room outline.
 */
export function openingEntities(hass, floors) {
  const out = new Map();
  for (const floor of floors) {
    for (const room of floor.rooms) {
      const own = floor.openings.filter(o => o.room_id === room.id).sort((a, b) => a.edge - b.edge || a.offset - b.offset);
      if (!own.length) continue;
      const ids = areaEntities(hass, room.area_id);
      const cls = id => hass.states[id]?.attributes.device_class;
      const covers = ids.filter(id => kindOf(id) === "cover" && COVER_CLASSES.has(cls(id)));
      const windows = own.filter(o => o.type === "window");
      const doors = own.filter(o => o.type === "door");
      const garages = own.filter(o => o.type === "garage");
      // one blind for the whole room (e.g. a group) serves every window; a sensor belongs to one window
      const autoCover = pair(windows, covers, true);
      const autoWindow = pair(windows, ids.filter(id => kindOf(id) === "binary" && WINDOW_CONTACTS.has(cls(id))));
      const autoDoor = pair(doors, ids.filter(id => kindOf(id) === "binary" && cls(id) === "door"));
      const autoGarageCover = pair(garages, ids.filter(id => kindOf(id) === "cover" && GARAGE_COVERS.has(cls(id) ?? "")));
      const autoGarageContact = pair(garages, ids.filter(id => kindOf(id) === "binary" && cls(id) === "garage_door"));
      const pick = (ref, auto) => ref === "none" ? null : ref ?? auto ?? null;
      for (const o of own) {
        const autoC = o.type === "window" ? autoCover : o.type === "garage" ? autoGarageCover : null;
        const autoK = o.type === "window" ? autoWindow : o.type === "garage" ? autoGarageContact : autoDoor;
        out.set(o.id, {
          cover: pick(o.cover, autoC?.get(o.id)),
          // a window with a handle sensor gets no plain contact assigned automatically
          contact: o.sensor === "handle" && o.contact == null ? null : pick(o.contact, autoK.get(o.id)),
          tilt: o.tilt === "none" ? null : o.tilt,
          contact2: o.leaves === 2 && o.contact2 && o.contact2 !== "none" ? o.contact2 : null,
          tilt2: o.leaves === 2 && o.tilt2 && o.tilt2 !== "none" ? o.tilt2 : null,
          position: o.position && o.position !== "none" ? o.position : null,
          positionInverted: !!o.position_inverted,
          tiltAngle: o.tilt_angle && o.tilt_angle !== "none" ? o.tilt_angle : null,
          tiltMax: o.tilt_max ?? null,
          tiltOffset: o.tilt_offset ?? null,
          tiltInvert: !!o.tilt_invert,
          shut: !!o.shut
        });
      }
    }
  }
  return out;
}
const POSITION_WORDS = [[/^(tilted|tilt|gekippt|kipp)/i, "tilted"], [/^(open|opened|offen|geöffnet|on)$/i, "open"], [/^(closed|close|geschlossen|zu|off)$/i, "closed"]];

/**
 * Position of a window or door from its contact: plain contacts (on = open), handle sensors with
 * three states ("open" / "tilted" / "closed", also in German) and contacts that tell it in a
 * window_state attribute (HomematicIP). Null when the sensor gives no answer.
 */
export function windowPosition(st) {
  if (!st || isUnavailable(st)) return null;
  const attr = st.attributes.window_state;
  for (const value of [typeof attr === "string" ? attr : null, st.state]) {
    if (!value) continue;
    const hit = POSITION_WORDS.find(([re]) => re.test(value.trim()));
    if (hit) return hit[1];
  }
  return null;
}

/** Door leaves without a contact sensor stand half open, so the doorway stays readable. */
export const DOOR_DEFAULT_OPEN = 0.5;

/**
 * Visual state of an opening from its entities. Windows: sash open or tilted, blind closed fraction.
 * Doors: leaf open (contact) or half open. Garage doors: closed fraction from the cover or contact.
 */
export function openingState(hass, e, type = "window") {
  const on = id => !!id && hass.states[id]?.state === "on";
  const known = id => !!id && !!hass.states[id] && !isUnavailable(hass.states[id]);
  const pos = id => id ? windowPosition(hass.states[id]) : null;
  // the second leaf of a double door or window stays closed without a sensor; it tilts like the first
  const tilted2 = on(e.tilt2) || pos(e.tilt2) === "tilted" || pos(e.contact2) === "tilted";
  const open2 = pos(e.contact2) === "open" && !tilted2 ? 1 : 0;
  // a separate tilt sensor, or a handle sensor that reports "tilted" itself
  let tilted = on(e.tilt) || pos(e.tilt) === "tilted" || pos(e.contact) === "tilted";
  // a tilt angle sensor tilts the sash as far as it reports (a share of the angle that counts as fully tilted)
  let tiltFrac = tilted ? 1 : 0;
  const angleRaw = e.tiltAngle ? Number(hass.states[e.tiltAngle]?.state) : NaN;
  if (Number.isFinite(angleRaw)) {
    const angle = (angleRaw - (e.tiltOffset ?? 0)) * (e.tiltInvert ? -1 : 1);
    tiltFrac = Math.min(1, Math.max(0, angle / (e.tiltMax || 15)));
    if (tiltFrac < 0.08) tiltFrac = 0;
    tilted = tiltFrac > 0;
  }
  const open = pos(e.contact) === "open" && !tilted ? 1 : 0;
  let cover = null;
  const c = e.cover ? hass.states[e.cover] : undefined;
  const live = livePosition(hass, e.position);
  if (live !== null) cover = e.positionInverted ? live : 1 - live;else if (c && !isUnavailable(c)) {
    const pos = c.attributes.current_position;
    if (typeof pos === "number") cover = 1 - Math.min(100, Math.max(0, pos)) / 100;else cover = c.state === "closed" ? 1 : c.state === "opening" || c.state === "closing" ? 0.5 : 0;
  } else if (e.cover) cover = 0;
  if (type === "door") {
    // a door with a roller shutter (front door, French window, sliding door): the blind comes down over it
    const p = pos(e.contact);
    return {
      open: p === null ? e.shut ? 0 : DOOR_DEFAULT_OPEN : p === "closed" ? 0 : 1,
      open2: pos(e.contact2) === "open" ? 1 : 0,
      tilt: 0,
      tilt2: 0,
      cover,
      sensed: p !== null || cover !== null
    };
  }
  if (type === "garage") {
    // a garage door without a cover shows its contact: open or closed
    const sensed = cover !== null || known(e.contact);
    if (cover === null) cover = known(e.contact) ? on(e.contact) ? 0 : 1 : 1;
    return {
      open: 0,
      open2: 0,
      tilt: 0,
      tilt2: 0,
      cover,
      sensed
    };
  }
  return {
    open,
    open2,
    tilt: tiltFrac,
    tilt2: tilted2 ? 1 : 0,
    cover,
    sensed: known(e.contact) || known(e.tilt) || Number.isFinite(angleRaw)
  };
}

/**
 * Open fraction from a separate position sensor (Homematic "level" and the like): a percentage
 * (unit "%" or a value above 1) or a fraction 0–1; null when unknown.
 */
function livePosition(hass, id) {
  const st = id ? hass.states[id] : undefined;
  if (!st || isUnavailable(st)) return null;
  const v = Number(st.state);
  if (!Number.isFinite(v)) return null;
  const percent = st.attributes.unit_of_measurement === "%" || v > 1;
  return Math.min(1, Math.max(0, percent ? v / 100 : v));
}

// ------------------------------------------------------------------ grouping by device

/**
 * Groups entities by device. The main entity is the one without a name of its own (Home Assistant's
 * convention for a device's main feature); otherwise the first in kind order. Groups keep the order
 * of their main entities in `ids`.
 */
export function groupByDevice(hass, ids) {
  const byDevice = new Map();
  const order = [];
  for (const id of ids) {
    const device = hass.entities?.[id]?.device_id ?? `entity:${id}`;
    let list = byDevice.get(device);
    if (!list) {
      byDevice.set(device, list = []);
      order.push(device);
    }
    list.push(id);
  }
  const groups = order.map(device => {
    const list = byDevice.get(device);
    const main = list.find(id => !hass.entities?.[id]?.name) ?? list[0];
    return {
      primary: main,
      others: list.filter(id => id !== main)
    };
  });
  const rank = new Map(ids.map((id, i) => [id, i]));
  return groups.sort((a, b) => rank.get(a.primary) - rank.get(b.primary));
}

/** Main entities only (one per device). */
export function primaryEntities(hass, ids) {
  return groupByDevice(hass, ids).map(g => g.primary);
}

// ------------------------------------------------------------------ furniture links

/** Name patterns of the entities that belong to electric furniture. */
const FURNITURE_NAMES = {
  robot_vacuum: /(saug|vacuum|robo|roomba|roborock|dreame|ecovacs|deebot)/i,
  robot_mower: /(mähroboter|robot(?:ic)? ?mower|lawn ?mower|robot cắt cỏ|robot cat co|máy cắt cỏ|may cat co)/i,
  tv_board: /\b(tv|fernseh|television|fire ?tv|apple ?tv|chromecast|shield)/i,
  tv_wall: /\b(tv|fernseh|television|fire ?tv|apple ?tv|chromecast|shield)/i,
  tv_stand: /\b(tv|fernseh|television|fire ?tv|apple ?tv|chromecast|shield)/i,
  desk: /\b(pc|computer|rechner|desktop|monitor|workstation)/i,
  fridge: /(kühl|fridge|gefrier|freezer)/i,
  fridge_smart: /(kühl|fridge|gefrier|freezer)/i,
  stove: /(herd|kochfeld|cooktop|stove|induktion)/i,
  kitchen_tall: /(backofen|oven|ofen)/i,
  dishwasher: /(spülmaschine|geschirrspül|dishwasher)/i,
  washer: /(waschmaschine|washer|washing)/i,
  dryer: /(trockner|dryer)/i,
  washer_dryer_tower: /(wasch.*trock|trock.*wasch|washer.*dryer|dryer.*washer|giặt.*sấy|giat.*say)/i,
  balcony_solar: /(balkonkraftwerk|balcony.*solar|solar.*balcony|pin.*mặt trời.*ban công|pin.*mat troi.*ban cong)/i,
  kitchen: /(kaffee|coffee|wasserkocher|kettle)/i,
  island: /(kochfeld|herd|induktion|cooktop)/i,
  sink: /(spülmaschine|geschirrspül|dishwasher)/i,
  radiator: /(heiz|radiator|thermostat|climate|hk|trv)/i,
  air_conditioner: /(klima|air ?condition|aircon|airco|split|điều hòa|dieu hoa|máy lạnh|may lanh)/i,
  water_pump: /(wasserpumpe|gartenpumpe|brunnenpumpe|water ?pump|garden ?pump|well ?pump|pool ?pump|irrigation|máy bơm|may bom|bơm nước|bom nuoc|bơm giếng|bom gieng|bơm tưới|bom tuoi)/i,
  fan_ceiling: /(deckenventilator|ceiling ?fan|quạt trần|quat tran)/i,
  fan_ceiling_light: /(deckenventilator|ceiling ?fan|quạt trần|quat tran)/i,
  fan_wall: /(wandventilator|wall(?: mounted)? ?fan|quạt (?:treo )?tường|quat (?:treo )?tuong)/i,
  fan_floor: /(standventilator|standing ?fan|floor ?fan|quạt đứng|quat dung)/i,
  water_heater: /(warmwasser|water ?heater|boiler|bình nóng lạnh|binh nong lanh|máy nước nóng|may nuoc nong)/i,
  range_hood: /(dunstabzug|range ?hood|extractor|hút mùi|hut mui)/i,
  microwave: /(mikrowelle|microwave|lò vi sóng|lo vi song)/i,
  water_purifier: /(wasserfilter|water ?purifier|water ?dispenser|lọc nước|loc nuoc|cây nước|cay nuoc)/i,
  air_purifier: /(luftreiniger|air ?purifier|air ?cleaner|máy lọc không khí|may loc khong khi)/i,
  smart_speaker: /(smart ?speaker|lautsprecher|speaker|echo|alexa|homepod|google (home|nest)|loa thông minh|loa thong minh)/i,
  security_camera: /(security ?camera|surveillance|überwachung|camera|kamera|cctv|cam an ninh)/i,
  smart_lock: /(smart ?lock|türschloss|door ?lock|khóa cửa|khoa cua)/i,
  smart_curtain: /(curtain|blind|shade|vorhang|rollladen|rèm|rem)/i,
  network_cabinet: /(netzwerkschrank|network ?(cabinet|rack)|server ?rack|tủ mạng|tu mang)/i,
  nas_server: /\b(nas|network attached storage|homeserver|home server|server lưu trữ|may chu luu tru|máy chủ lưu trữ)\b/i,
  access_point: /(wlan|wi-?fi|access ?point|wireless ?ap|điểm truy cập|diem truy cap|bộ phát wifi|bo phat wifi)/i,
  wall_thermostat: /(wandthermostat|wall ?thermostat|thermostat|bộ điều nhiệt|bo dieu nhiet)/i,
  smoke_detector: /(rauchmelder|smoke ?(detector|alarm)|báo khói|bao khoi|cảm biến khói|cam bien khoi)/i,
  siren_alarm: /(sirene|siren|alarm|còi báo động|coi bao dong|đèn chớp|den chop)/i,
  electrical_panel: /(sicherungskasten|electrical ?panel|fuse ?box|tủ điện|tu dien)/i,
  ups_unit: /\b(ups|usv|bộ lưu điện|bo luu dien)\b/i,
  modem_router: /(modem|router|bộ định tuyến|bo dinh tuyen|bộ phát mạng|bo phat mang)/i,
  heat_pump_outdoor: /(wärmepumpe|heat ?pump|bơm nhiệt|bom nhiet)/i,
  hot_water_tank: /(warmwasserspeicher|hot ?water ?tank|bình tích nước nóng|binh tich nuoc nong)/i,
  ventilation_fan: /(lüfter|exhaust ?fan|ventilation ?fan|quạt thông gió|quat thong gio)/i,
  humidifier: /(luftbefeuchter|humidifier|máy tạo ẩm|may tao am)/i,
  smart_display: /(smart ?display|control ?panel|màn hình điều khiển|man hinh dieu khien)/i,
  wall_switch: /(wall ?switch|light ?switch|wandschalter|lichtschalter|công tắc|cong tac)/i,
  wall_outlet: /(wall ?outlet|power ?outlet|socket|steckdose|ổ cắm|o cam)/i,
  smart_plug: /(smart ?plug|smart ?socket|zwischenstecker|ổ cắm thông minh|o cam thong minh)/i,
  motion_sensor: /(motion|occupancy|presence|bewegung|präsenz|cảm biến chuyển động|cam bien chuyen dong|hiện diện|hien dien)/i,
  contact_sensor: /(door|window|contact|öffnung|kontakt|cửa|cua|cảm biến cửa|cam bien cua)/i,
  water_leak_sensor: /(water ?leak|moisture|wassermelder|leck|rò nước|ro nuoc|ngập|ngap)/i,
  temperature_humidity_sensor: /(temperature|humidity|thermo|hygro|temperatur|feuchte|nhiệt độ|nhiet do|độ ẩm|do am)/i,
  video_doorbell: /(video ?doorbell|doorbell|klingel|chuông cửa|chuong cua)/i,
  kitchen_display: /(vitrine|display ?cabinet|cabinet ?light|schranklicht|tủ kính|tu kinh|tủ trưng bày|tu trung bay|đèn tủ|den tu|led tủ|led tu)/i,
  media_wall_tv: /\b(tv|fernseh|television|fire ?tv|apple ?tv|chromecast|shield)/i,
  cinema_screen_wall: /(projector|beamer|cinema|theater|kino|máy chiếu|may chieu)/i,
  cinema_screen_roller: /(projector|beamer|cinema|theater|kino|máy chiếu|may chieu)/i,
  cinema_projector_ceiling: /(projector|beamer|máy chiếu|may chieu)/i,
  cinema_projector_table: /(projector|beamer|máy chiếu|may chieu)/i,
  cinema_projector_ust: /(projector|beamer|máy chiếu|may chieu)/i,
  cinema_screen_floor_rising: /(projector|beamer|cinema|theater|kino|máy chiếu|may chieu)/i,
  cinema_speaker_tower: /(speaker|lautsprecher|loa)/i,
  cinema_speaker_bookshelf: /(speaker|lautsprecher|loa)/i,
  cinema_speaker_center: /(center|centre|speaker|lautsprecher|loa)/i,
  cinema_subwoofer: /(subwoofer|sub|bass|siêu trầm|sieu tram)/i,
  cinema_soundbar: /(soundbar|sound ?bar|loa thanh)/i,
  cinema_speaker_wall: /(speaker|lautsprecher|loa)/i,
  cinema_speaker_ceiling: /(speaker|lautsprecher|loa)/i,
  cinema_av_receiver: /(av ?receiver|receiver|ampli|amplifier|verstärker)/i,
  cinema_tv_oled_65: /\b(tv|fernseh|television|oled|fire ?tv|apple ?tv|chromecast|shield)/i,
  cinema_tv_oled_85: /\b(tv|fernseh|television|oled|fire ?tv|apple ?tv|chromecast|shield)/i,
  cinema_turntable: /(turntable|record ?player|plattenspieler|mâm đĩa|mam dia|đĩa than|dia than)/i,
  cinema_game_console: /(game|console|playstation|xbox|nintendo|spielkonsole|máy chơi game|may choi game)/i,
  cinema_hifi_rack: /(hi-?fi|stereo|audio|receiver|ampli)/i,
  cinema_popcorn_machine: /(popcorn|bỏng ngô|bong ngo)/i,
  cinema_surround_speaker_stand: /(surround|rear ?speaker|lautsprecher|loa)/i,
  cinema_speaker_inwall: /(in.?wall|wall ?speaker|lautsprecher|loa âm tường|loa am tuong)/i,
  cinema_media_streamer: /(media ?stream|streamer|apple ?tv|chromecast|shield)/i,
  cinema_bluray_player: /(blu.?ray|disc ?player|player)/i,
  cinema_stereo_amplifier: /(stereo|amplifier|verstärker|ampli)/i,
  fireplace_wall_electric: /(fireplace|kamin|lò sưởi|lo suoi)/i,
  bed_ambient_180: /(bed|bett|giường|giuong).*(light|licht|đèn|den)|ambient/i,
  wardrobe_light: /(wardrobe|closet|kleiderschrank|tủ áo|tu ao).*(light|licht|đèn|den)/i,
  alarm_sunrise: /(sunrise|wake.?up|lichtwecker|báo thức|bao thuc)/i,
  vanity_light: /(vanity|dressing|schmink|trang điểm|trang diem).*(light|licht|đèn|den)/i,
  mirror_round_light: /(mirror|spiegel|gương|guong).*(round|rund|tròn|tron|light|licht|đèn|den)/i,
  mirror_80_light: /(mirror|spiegel|gương|guong).*(light|licht|đèn|den)/i,
  mirror_cabinet_light: /(mirror|spiegel|gương|guong).*(cabinet|schrank|tủ|tu).*(light|licht|đèn|den)/i,
  electric_towel_heater: /(towel|handtuch|khăn|khan).*(heater|wärm|sưởi|suoi)/i,
  bathroom_fan: /(bath|bad|toilet|wc|phòng tắm|phong tam).*(fan|lüfter|quạt|quat)/i,
  washer_vanity: /(washer|washing|wasch|máy giặt|may giat)/i,
  rain_shower_led: /(shower|dusche|sen).*(led|light|licht|đèn|den)/i,
  mirror_led_clock: /(mirror|spiegel|gương|guong).*(led|clock|uhr|đồng hồ|dong ho)/i,
  fireplace_builtin: /(fireplace|kamin|lò sưởi|lo suoi)/i,
  led_niche: /(niche|nische|hốc|hoc).*(led|light|licht|đèn|den)/i,
  light_cove: /(cove|voute|khe|hắt|hat).*(light|licht|đèn|den)/i
};
const MEDIA_FURNITURE = new Set(["tv_board", "tv_wall", "tv_stand", "media_wall_tv", "smart_display", "cinema_screen_wall", "cinema_screen_roller", "cinema_screen_floor_rising", "cinema_tv_oled_65", "cinema_tv_oled_85"]);
const MEDIA_AUDIO = new Set(["cinema_projector_ceiling", "cinema_projector_table", "cinema_projector_ust", "cinema_speaker_tower", "cinema_speaker_bookshelf", "cinema_speaker_center", "cinema_subwoofer", "cinema_soundbar", "cinema_speaker_wall", "cinema_speaker_ceiling", "cinema_av_receiver", "cinema_turntable", "cinema_game_console", "cinema_hifi_rack", "cinema_surround_speaker_stand", "cinema_speaker_inwall", "cinema_media_streamer", "cinema_bluray_player", "cinema_stereo_amplifier"]);

/** Whether a screen picture rule matches now: the state or attribute equals the value, or contains it (3+ chars); "*" always. */
export function pictureRuleMatches(hass, rule) {
  const st = hass.states[rule.entity];
  if (!st) return false;
  const raw = rule.attribute ? st.attributes[rule.attribute] : st.state;
  if (raw === undefined || raw === null) return false;
  const value = String(raw).toLowerCase();
  const want = rule.state.trim().toLowerCase();
  return rule.state.trim() === "*" || value === want || want.length >= 3 && value.includes(want);
}

/** Furniture controlled by a media player: screens, projectors, speakers and receivers. */
export function isMediaFurniture(type) {
  return MEDIA_FURNITURE.has(type) || MEDIA_AUDIO.has(type) || !!packScreen(type);
}
/** Furniture with a visible screen that can show a media player or a picture rule. */
export function hasScreen(type) {
  return MEDIA_FURNITURE.has(type) || !!packScreen(type) || type === "desk" || type === "fridge_smart";
}

/** Entities that ask before they are switched: placed devices and furniture links marked "confirm". */
export function confirmEntities(hass, floors) {
  const out = new Set();
  const links = furnitureEntities(hass, floors);
  const openings = floors.some(f => f.openings.some(o => o.confirm)) ? openingEntities(hass, floors) : null;
  for (const floor of floors) {
    for (const p of floor.placements) if (p.confirm) out.add(p.entity_id);
    // blinds and garage doors of openings marked "ask first"
    for (const o of floor.openings) {
      const cover = o.confirm ? openings?.get(o.id)?.cover : null;
      if (cover && cover !== "none") out.add(cover);
    }
    for (const f of floor.furniture) {
      const link = f.confirm ? links.get(f.id) : null;
      if (link?.entity && link.entity !== "none") out.add(link.entity);
      if (link?.light && link.light !== "none") out.add(link.light);
    }
  }
  return out;
}

/** Smart fridges: which of their doors stand open now (a door sensor reporting "on" or "open"). */
export function fridgeDoors(hass, floors) {
  const open = id => {
    if (!id || id === "none") return false;
    const s = hass.states[id]?.state;
    return s === "on" || s === "open";
  };
  const out = new Map();
  for (const floor of floors) for (const f of floor.furniture) if (f.type === "fridge_smart") out.set(f.id, {
    left: open(f.door_left),
    right: open(f.door_right)
  });
  return out;
}
/** Name hints for picking a lamp's light (a light that fits the name wins, otherwise any free one). */
const LAMP_NAMES = {
  lamp_ceiling: /(decke|ceiling|haupt|main)/i,
  lamp_downlight: /(spot|strahler|downlight|einbau)/i,
  lamp_spot: /(spot|strahler)/i,
  lamp_panel: /(panel|decke|ceiling)/i,
  lamp_uplight: /(fluter|uplight|steh)/i,
  lamp_bollard: /(weg|garten|garden|path|poller|außen|aussen|outdoor)/i,
  lamp_garden: /(garten|garden|spot|außen|aussen|outdoor|baum|tree)/i,
  lamp_pendant: /(pendel|pendant|hänge|esstisch|dining)/i,
  lamp_floor: /(steh|floor)/i,
  lamp_table: /(tisch|nacht|table|bedside|lese|reading)/i,
  lamp_wall: /(wand|wall)/i,
  led_strip: /(led|strip|streifen|leiste|band)/i,
  lamp_column: /(lichtsäule|light ?column|cột đèn|cot den)/i,
  lamp_tv_bars: /(tv.*(light|licht|đèn|den)|light ?bar|lichtleiste|thanh đèn|thanh den)/i,
  lamp_orb_table: /(kugel|orb|sphere|cầu|cau)/i,
  lamp_portable: /(akku|battery|portable|tragbar|xách tay|xac tay|đèn sạc|den sac)/i,
  lamp_ambient_spot: /(ambient|ambiente|mood|không gian|khong gian)/i,
  lamp_cube: /(würfel|cube|khối|khoi)/i,
  lamp_panel_round: /((rund|round|tròn|tron).*(panel|decke|ceiling|ốp trần|op tran)|(panel|decke|ceiling|ốp trần|op tran).*(rund|round|tròn|tron))/i,
  lamp_garden_spots: /((garten|garden|outdoor|sân vườn|san vuon).*(spot|rọi|roi)|(spot|rọi|roi).*(garten|garden|outdoor|sân vườn|san vuon))/i,
  lamp_wall_updown: /(up.*down|außenwand|outdoor wall|tường.*hai hướng|tuong.*hai huong)/i,
  lamp_cinema_star_ceiling: /(star|stern|cinema|kino|sao|điện ảnh|dien anh)/i
};
function isPower(hass, id) {
  return id.startsWith("sensor.") && hass.states[id]?.attributes.device_class === "power";
}

/** Power sensor of an entity's device. */
function devicePower(hass, id) {
  if (isPower(hass, id)) return id;
  const device = hass.entities?.[id]?.device_id;
  if (!device) return null;
  return powerSensorsOf(hass, device).find(e => e !== id) ?? null;
}

/**
 * Entities of electric furniture: set by hand, or (when null) found in the area of the room the item
 * stands in: the TV's media player (a TV first), otherwise an entity whose name fits the item; the
 * power sensor comes from the same device or a sensor whose name fits. Each entity is used once.
 */
export function furnitureEntities(hass, floors) {
  const out = new Map();
  for (const floor of floors) {
    // entities set by hand and devices placed in the plan (an Echo Show in the corner) are taken
    const used = new Set([...floor.furniture.flatMap(f => [f.entity, f.light_entity, f.power]), ...floor.placements.map(p => p.entity_id)].filter(v => !!v && v !== "none"));
    for (const f of floor.furniture) {
      const lamp = f.type in LAMP_NAMES;
      const pattern = lamp ? LAMP_NAMES[f.type] : FURNITURE_NAMES[f.type];
      if (!pattern && f.entity == null && f.light_entity == null && f.power == null) continue;
      const room = floor.rooms.find(r => r.points.length >= 3 && pointInPolygon([f.x, f.z], r.points));
      const ids = room ? primaryEntities(hass, areaEntities(hass, room.area_id)) : [];
      const name = id => `${id} ${entityName(hass, id)}`;
      let entity = f.entity === "none" ? null : f.entity ?? null;
      if (f.entity == null) {
        const free = ids.filter(id => !used.has(id));
        if (lamp) {
          const lights = free.filter(id => kindOf(id) === "light");
          entity = lights.find(id => pattern.test(name(id))) ?? lights[0] ?? null;
        } else if (f.type === "robot_vacuum") {
          // vacuums are no device kind of their own: look them up in the room's area directly
          const area = room?.area_id ?? null;
          entity = Object.keys(hass.entities ?? {}).find(id => id.startsWith("vacuum.") && !used.has(id) && entityAreaId(hass, id) === area) ?? null;
        } else if (f.type === "robot_mower") {
          // A mower lives outdoors and therefore usually has no room/area to resolve through.
          const candidates = Object.keys(hass.states ?? {}).filter(id => id.startsWith("lawn_mower.") && !used.has(id));
          const matches = candidates.filter(id => pattern.test(name(id)));
          entity = matches.length === 1 ? matches[0] : candidates.length === 1 ? candidates[0] : null;
        } else if (f.type === "radiator" || f.type === "air_conditioner" || f.type === "wall_thermostat" || f.type === "heat_pump_outdoor") {
          const climates = free.filter(id => kindOf(id) === "climate");
          entity = climates.find(id => pattern.test(name(id))) ?? climates[0] ?? null;
        } else if (["network_cabinet", "nas_server", "access_point", "smoke_detector", "siren_alarm", "electrical_panel", "ups_unit", "modem_router", "hot_water_tank", "ventilation_fan", "humidifier", "wall_switch", "wall_outlet", "smart_plug", "motion_sensor", "contact_sensor", "water_leak_sensor", "temperature_humidity_sensor", "video_doorbell", "washer_dryer_tower", "balcony_solar"].includes(f.type)) {
          const area = room?.area_id ?? null;
          const domains = {
            network_cabinet: ["switch", "sensor", "binary_sensor"],
            nas_server: ["switch", "sensor", "binary_sensor"],
            access_point: ["switch", "sensor", "binary_sensor", "device_tracker"],
            smoke_detector: ["binary_sensor"],
            siren_alarm: ["siren", "alarm_control_panel", "switch", "binary_sensor"],
            electrical_panel: ["switch", "sensor", "binary_sensor"],
            ups_unit: ["switch", "sensor", "binary_sensor"],
            modem_router: ["switch", "sensor", "binary_sensor", "device_tracker"],
            hot_water_tank: ["water_heater", "climate", "switch"],
            ventilation_fan: ["fan", "switch"],
            humidifier: ["humidifier", "fan", "switch"],
            wall_switch: ["switch", "input_boolean", "light"],
            wall_outlet: ["switch"],
            smart_plug: ["switch"],
            motion_sensor: ["binary_sensor"],
            contact_sensor: ["binary_sensor"],
            water_leak_sensor: ["binary_sensor"],
            temperature_humidity_sensor: ["sensor"],
            video_doorbell: ["camera", "binary_sensor"],
            washer_dryer_tower: ["switch", "sensor"],
            balcony_solar: ["sensor"]
          };
          const candidates = Object.keys(hass.states ?? {}).filter(id => {
            if (used.has(id) || !domains[f.type].includes(domainOf(id))) return false;
            if (area && entityAreaId(hass, id) !== area) return false;
            if (f.type === "smoke_detector" && hass.states[id]?.attributes.device_class !== "smoke") return false;
            const deviceClass = String(hass.states[id]?.attributes.device_class ?? "");
            if (f.type === "motion_sensor" && !["motion", "occupancy", "presence"].includes(deviceClass)) return false;
            if (f.type === "contact_sensor" && !["door", "window", "opening"].includes(deviceClass)) return false;
            if (f.type === "water_leak_sensor" && deviceClass !== "moisture") return false;
            if (f.type === "temperature_humidity_sensor" && !["temperature", "humidity"].includes(deviceClass)) return false;
            if (f.type === "balcony_solar" && deviceClass !== "power") return false;
            return pattern.test(name(id));
          });
          entity = room ? candidates[0] ?? null : candidates.length === 1 ? candidates[0] : null;
        } else if (["air_purifier", "smart_speaker", "security_camera", "smart_lock", "smart_curtain"].includes(f.type)) {
          const expected = {
            air_purifier: "fan",
            smart_speaker: "media",
            security_camera: "camera",
            smart_lock: "lock",
            smart_curtain: "cover"
          }[f.type];
          const candidates = free.filter(id => kindOf(id) === expected);
          entity = candidates.find(id => pattern.test(name(id))) ?? candidates[0] ?? null;
        } else if (f.type === "water_pump") {
          // Outdoor furniture has no room/area; a distinct pump name can still be found globally.
          const candidates = room ? free : Object.keys(hass.states ?? {}).filter(id => !used.has(id));
          const matches = candidates.filter(id => ["switch", "fan"].includes(kindOf(id) ?? "") && pattern.test(name(id)));
          entity = room ? matches[0] ?? null : matches.length === 1 ? matches[0] : null;
        } else if (f.type === "kitchen_display") {
          const lights = free.filter(id => ["light", "switch"].includes(kindOf(id) ?? ""));
          entity = lights.find(id => pattern.test(name(id))) ?? null;
        } else if (isMediaFurniture(f.type)) {
          const media = free.filter(id => kindOf(id) === "media");
          // a TV takes the TV (or any player of the room); a monitor or a smart speaker model only one whose name fits
          entity = media.find(id => hass.states[id]?.attributes.device_class === "tv") ?? media.find(id => pattern?.test(name(id))) ?? (MEDIA_FURNITURE.has(f.type) ? media[0] ?? null : null);
        } else if (pattern) {
          entity = free.find(id => ["switch", "media", "fan"].includes(kindOf(id) ?? "") && pattern.test(name(id))) ?? null;
        }
        if (entity) used.add(entity);
      }
      let light = f.light_entity === "none" ? null : f.light_entity ?? null;
      if (f.type === "fan_ceiling_light" && f.light_entity == null) {
        // The fan and light commonly belong to one HA device, so inspect all area entities rather
        // than only primaryEntities(), which intentionally collapses siblings of the same device.
        const freeLights = (room ? areaEntities(hass, room.area_id) : []).filter(id => !used.has(id) && kindOf(id) === "light");
        light = freeLights.find(id => /(fan|ceiling|decken|quạt|quat)/i.test(name(id))) ?? freeLights[0] ?? null;
        if (light) used.add(light);
      }
      let power = f.power === "none" ? null : f.power ?? null;
      if (f.power == null) {
        power = entity ? devicePower(hass, entity) : null;
        if (!power && pattern && room && !lamp) {
          const all = areaEntities(hass, room.area_id);
          power = all.find(id => isPower(hass, id) && !used.has(id) && pattern.test(name(id))) ?? null;
        }
        if (power) used.add(power);
      }
      if (entity || light || power) out.set(f.id, {
        entity,
        power,
        ...(f.type === "fan_ceiling_light" || f.light_entity != null ? {
          light
        } : {})
      });
    }
  }
  return out;
}

/** Glow colour of a TV screen for the app that is running (brand colours of common apps). */
export function appColor(st) {
  if (!st || st.state === "off" || st.state === "standby" || isUnavailable(st)) return null;
  const a = st.attributes;
  const text = `${a.app_name ?? ""} ${a.source ?? ""} ${a.app_id ?? ""}`.toLowerCase();
  if (text.includes("netflix")) return [0.9, 0.04, 0.08];
  if (text.includes("youtube")) return [1, 0.1, 0.15];
  if (text.includes("prime") || text.includes("amazon")) return [0.1, 0.6, 0.95];
  if (text.includes("disney")) return [0.2, 0.35, 1];
  if (text.includes("spotify")) return [0.12, 0.85, 0.4];
  if (text.includes("zdf") || text.includes("ard") || text.includes("mediathek")) return [1, 0.5, 0.1];
  return [0.22, 0.88, 1];
}

/**
 * Entities of a room's panel: what the plan shows in the room (placed devices, lamps and furniture
 * with their entities, blinds and contacts of its doors and windows) plus the ones picked for the
 * panel. `more` are the other entities of the room's area, offered on request.
 */
export function roomPanelEntities(hass, floor, room) {
  const inRoom = (x, z) => pointInPolygon([x, z], room.points);
  const furniture = furnitureEntities(hass, [floor]);
  const openings = openingEntities(hass, [floor]);
  const shown = [...floor.placements.filter(p => inRoom(p.x, p.z)).map(p => p.entity_id), ...floor.furniture.filter(f => inRoom(f.x, f.z)).flatMap(f => [furniture.get(f.id)?.entity, furniture.get(f.id)?.light, furniture.get(f.id)?.power]), ...floor.openings.filter(o => o.room_id === room.id).flatMap(o => {
    const e = openings.get(o.id);
    return e ? [e.cover, e.contact, e.tilt, e.contact2] : [];
  }), ...(room.panel ?? [])].filter(id => !!id && !!hass.states[id]);
  // entities the editor hid for this room stay out of the panel altogether
  const hidden = new Set(room.hidden ?? []);
  const unique = [...new Set(shown)].filter(id => !hidden.has(id));
  const set = new Set(unique);
  return {
    shown: unique,
    more: areaEntities(hass, room.area_id).filter(id => !set.has(id) && !hidden.has(id))
  };
}
const ROOM_KEYS = /(^|_)(current_room|current_segment|aktueller_raum|current_area)($|_)/;

// ------------------------------------------------------------------ Auto Pro: the car on a parking spot

/** The car's entities, every role resolved: the chosen one, else one found on the car's device. */

const CAR_ROLE_PATTERNS = {
  soc: /(^|_)(soc|state_of_charge|battery_level|battery|ladestand|ladezustand|akku)($|_)/,
  range: /(^|_)(range|reichweite|remaining_range)($|_)/,
  charging: /(charging|charge_power|ladeleistung|laden|charger_power|lade)/,
  plugged: /(plug|cable|connected|stecker|kabel|angeschlossen)/,
  lock: /(lock|verriegel|schloss)/,
  climate: /(climat|preheat|precondition|hvac|heiz|klima|standheizung)/,
  tracker: /./
};

/** The entities of the car's Home Assistant device: the chosen device entity's siblings, else the presence entity's. */
export function carEntities(hass, f) {
  const c = f.car ?? {};
  const pick = ref => ref && ref !== "none" ? ref : null;
  const seed = pick(c.device) ?? pick(f.entity);
  const device = seed ? hass.entities?.[seed]?.device_id : null;
  const siblings = device && hass.entities ? Object.values(hass.entities).filter(e => e.device_id === device).map(e => e.entity_id) : [];
  const key = id => `${id} ${hass.states[id]?.attributes.friendly_name ?? ""} ${hass.entities?.[id]?.translation_key ?? ""}`.toLowerCase().replace(/[\s-]+/g, "_");
  const find = (role, domains, extra) => siblings.find(id => domains.includes(id.split(".")[0]) && CAR_ROLE_PATTERNS[role].test(key(id)) && (!extra || extra(id))) ?? null;
  const unit = id => String(hass.states[id]?.attributes.unit_of_measurement ?? "");
  const dc = id => String(hass.states[id]?.attributes.device_class ?? "");
  return {
    soc: pick(c.soc) ?? siblings.find(id => id.startsWith("sensor.") && dc(id) === "battery") ?? find("soc", ["sensor"], id => unit(id) === "%"),
    range: pick(c.range) ?? find("range", ["sensor"], id => /km|mi/.test(unit(id))) ?? find("range", ["sensor"]),
    charging: pick(c.charging) ?? find("charging", ["sensor"], id => /^k?W$/.test(unit(id))) ?? find("charging", ["binary_sensor", "switch"]),
    plugged: pick(c.plugged) ?? siblings.find(id => id.startsWith("binary_sensor.") && dc(id) === "plug") ?? find("plugged", ["binary_sensor"]),
    lock: pick(c.lock) ?? siblings.find(id => id.startsWith("lock.")) ?? find("lock", ["binary_sensor"]),
    climate: pick(c.climate) ?? siblings.find(id => id.startsWith("climate.")) ?? find("climate", ["switch", "binary_sensor"]),
    tracker: pick(c.tracker) ?? siblings.find(id => id.startsWith("device_tracker.")) ?? null
  };
}

/** What the car reports right now (null for anything it does not tell). */

export function carState(hass, f) {
  const e = carEntities(hass, f);
  const st = id => id ? hass.states[id] : undefined;
  const num = id => {
    const v = Number(st(id)?.state);
    return id && Number.isFinite(v) ? v : null;
  };
  const soc = num(e.soc);
  const range = num(e.range);
  const chargeSt = st(e.charging);
  const chargeUnit = String(chargeSt?.attributes.unit_of_measurement ?? "");
  const chargingW = chargeSt && /^k?W$/.test(chargeUnit) ? (num(e.charging) ?? 0) * (chargeUnit === "kW" ? 1000 : 1) : null;
  const charging = chargingW !== null ? chargingW > 50 : !!chargeSt && ["on", "charging", "laden"].includes(chargeSt.state.toLowerCase());
  const plugSt = st(e.plugged);
  const lockSt = st(e.lock);
  const climSt = st(e.climate);
  const trackSt = st(e.tracker);
  const trackState = trackSt?.state.toLowerCase() ?? "";
  return {
    entities: e,
    soc: soc !== null ? Math.max(0, Math.min(100, soc)) : null,
    range,
    rangeUnit: String(st(e.range)?.attributes.unit_of_measurement ?? "km"),
    chargingW,
    charging,
    plugged: plugSt ? plugSt.state === "on" : null,
    locked: lockSt ? lockSt.entity_id.startsWith("lock.") ? lockSt.state === "locked" : lockSt.state === "on" : null,
    climateOn: climSt ? climSt.entity_id.startsWith("climate.") ? climSt.state !== "off" && climSt.state !== "unavailable" : climSt.state === "on" : null,
    away: trackSt && trackState !== "home" && !isUnavailable(trackSt) ? trackState === "not_home" ? "" : trackSt.state : null
  };
}

/** Every entity a car's state hangs on (to watch for changes). */
export function carWatched(hass, floors) {
  return floors.flatMap(fl => fl.furniture.filter(f => f.type === "parking" && f.car).flatMap(f => Object.values(carEntities(hass, f)))).filter(id => !!id);
}

/** The sensor naming the room a robot vacuum cleans: the chosen one, else one of the vacuum's device. */
export function robotRoomSensor(hass, vacuum, chosen) {
  if (chosen === "none") return null;
  if (chosen) return chosen;
  const device = vacuum ? hass.entities?.[vacuum]?.device_id : null;
  if (!device || !hass.entities) return null;
  for (const e of Object.values(hass.entities)) {
    if (e.device_id !== device || !e.entity_id.startsWith("sensor.")) continue;
    if (ROOM_KEYS.test(e.translation_key ?? "") || ROOM_KEYS.test(e.entity_id.split(".")[1])) return e.entity_id;
  }
  return null;
}

/** A name compared without case, accents or umlaut spelling ("Küche" = "kueche" = "Kuche"). */
export function roomKey(name) {
  return name.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").normalize("NFD").replace(/[^a-z0-9]/g, "");
}

/** The room a robot reports (sensor state, else the vacuum's current_room attribute), matched by room or area name. */
export function robotRoom(hass, rooms, vacuum, sensor) {
  const raw = sensor ? hass.states[sensor]?.state : vacuum ? hass.states[vacuum]?.attributes.current_room : undefined;
  if (typeof raw !== "string" || !raw || raw === "unknown" || raw === "unavailable") return null;
  const want = roomKey(raw);
  if (!want) return null;
  const names = r => [r.name, r.area_id ?? "", r.area_id && hass.areas?.[r.area_id]?.name || ""].map(roomKey).filter(Boolean);
  return rooms.find(r => names(r).includes(want)) ?? rooms.find(r => names(r).some(n => n.length >= 3 && (n.includes(want) || want.includes(n)))) ?? null;
}

/** Covers that are doors rather than blinds: a central "close all" leaves them alone. */
const DOOR_COVERS = new Set(["garage", "gate", "door"]);

/**
 * Lights and blinds of a floor for the central "all on / all off" (#145): the main entities of its
 * rooms' areas (without the ones a room hides), placed devices and linked furniture. Garage doors and
 * gates are no blinds and stay out.
 */
export function floorControls(hass, floor) {
  const lights = new Set();
  const covers = new Set();
  const add = id => {
    if (!id || id === "none" || !hass.states[id]) return;
    const kind = kindOf(id);
    if (kind === "light") lights.add(id);else if (kind === "cover" && !DOOR_COVERS.has(String(hass.states[id].attributes.device_class ?? ""))) covers.add(id);
  };
  for (const room of floor.rooms) {
    const hidden = new Set(room.hidden ?? []);
    for (const id of primaryEntities(hass, areaEntities(hass, room.area_id))) if (!hidden.has(id)) add(id);
  }
  for (const pl of floor.placements) add(pl.entity_id);
  for (const f of floor.furniture) add(f.entity);
  return {
    lights: [...lights],
    covers: [...covers]
  };
}

/** The service a favourite runs when tapped: scenes and scripts start, buttons are pressed, the rest toggles. */
export function favoriteCall(entityId) {
  const domain = entityId.split(".")[0];
  if (domain === "scene" || domain === "script") return [domain, "turn_on"];
  if (domain === "automation") return [domain, "trigger"];
  if (domain === "button" || domain === "input_button") return [domain, "press"];
  return ["homeassistant", "toggle"];
}

/**
 * Run an own button (D143) from an element inside the dashboard: navigate, more-info, a service, or a
 * DOM event – "ll-custom" is what Home Assistant's fire-dom-event sends, and browser_mod listens for it.
 */
export function runButton(hass, from, b) {
  const target = b.target?.trim() ?? "";
  if (b.action === "navigate" && target) {
    history.pushState(null, "", target);
    window.dispatchEvent(new CustomEvent("location-changed", {
      detail: {
        replace: false
      }
    }));
  } else if (b.action === "more_info" && target) {
    from.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: {
        entityId: target
      },
      bubbles: true,
      composed: true
    }));
  } else if (b.action === "service" && target.includes(".")) {
    const [domain, service] = target.split(".", 2);
    void hass.callService(domain, service, b.data ?? {});
  } else if (b.action === "fire_dom_event") {
    from.dispatchEvent(new CustomEvent("ll-custom", {
      detail: b.data ?? {},
      bubbles: true,
      composed: true
    }));
  }
}