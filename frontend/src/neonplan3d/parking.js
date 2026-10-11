/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/parking.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Parking spots: a piece of furniture of type "parking" marks where a vehicle can stand. With a
// presence entity the vehicle appears only while a car is reported; a type sensor (e.g. from an AI
// camera analysis) can pick which vehicle model is shown.

import { BUILTIN_VEHICLE_TYPES, FURNITURE_SIZE } from "./model.js";
import { packItem } from "./packs.js";
/** States of a presence entity that mean "a car is there". */
export const PRESENT_STATES = new Set(["on", "home", "true", "present", "occupied", "detected", "parked", "yes", "1"]);
function ref(id) {
  return id && id !== "none" ? id : null;
}

/**
 * The vehicle (a pack item type) a parking spot shows right now: none while its presence entity
 * reports no car, the vehicle its type sensor names, else its default vehicle. Without a presence
 * entity the vehicle stands there always.
 */
export function parkedVehicle(hass, f) {
  if (f.type !== "parking") return null;
  const entity = ref(f.entity);
  if (entity) {
    const st = hass.states[entity];
    if (!st || !PRESENT_STATES.has(st.state.toLowerCase())) return null;
  }
  let vehicle = f.vehicle ?? null;
  const typeEntity = ref(f.type_entity);
  if (typeEntity && f.types?.length) {
    const s = (hass.states[typeEntity]?.state ?? "").trim().toLowerCase();
    if (s) {
      const norm = t => t.trim().toLowerCase();
      // an exact match first, then the mapping's word somewhere in the sensor's text ("black VW van")
      const hit = f.types.find(t => norm(t.state) === s) ?? f.types.find(t => norm(t.state) && s.includes(norm(t.state)));
      if (hit) vehicle = hit.vehicle;
    }
  }
  return vehicle && (packItem(vehicle) || BUILTIN_VEHICLE_TYPES.includes(vehicle)) ? vehicle : null;
}

/** Vehicles standing in the building's parking spots, by spot id. */
export function parkedVehicles(hass, building) {
  const out = new Map();
  for (const floor of building.floors) {
    for (const f of floor.furniture) {
      const v = parkedVehicle(hass, f);
      if (v) out.set(f.id, v);
    }
  }
  return out;
}

/** Entities whose changes may put a vehicle into a spot or take it away. */
export function parkingEntities(floors) {
  return floors.flatMap(fl => fl.furniture.filter(f => f.type === "parking").flatMap(f => [ref(f.entity), ref(f.type_entity)])).filter(id => !!id);
}

/** The vehicle as furniture in its spot: the pack item's size times the spot's scale, turned like the spot. */
export function vehicleFurniture(spot, vehicle) {
  const item = packItem(vehicle);
  const size = item?.size ?? (BUILTIN_VEHICLE_TYPES.includes(vehicle) ? FURNITURE_SIZE[vehicle] : null);
  if (!size) return null;
  const k = spot.scale ?? 1;
  return {
    id: `${spot.id}:vehicle`,
    type: vehicle,
    x: spot.x,
    z: spot.z,
    rotation: spot.rotation,
    w: size[0] * k,
    d: size[1] * k,
    h: size[2] * k,
    variant: null,
    entity: null,
    power: null
  };
}

/** A floor with the parked vehicles added to its furniture (for building the 3D geometry). */
export function withVehicles(floor, parked) {
  if (!floor.furniture.some(f => f.type === "parking" && parked.has(f.id))) return floor;
  const furniture = floor.furniture.flatMap(f => {
    const v = f.type === "parking" ? parked.get(f.id) : undefined;
    const car = v ? vehicleFurniture(f, v) : null;
    return car ? [f, car] : [f];
  });
  return {
    ...floor,
    furniture
  };
}