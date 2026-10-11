/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/alerts.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Warnings shown in 3D: smoke, gas, carbon monoxide and water sensors of a room, a triggered alarm,
// and a window open while it rains. The rooms concerned pulse in the warning's colour.

import { areaEntities, entityName, openingState } from "./devices.js";
import { translate } from "./i18n.js";
import { weatherEntity } from "./weather.js";

/** Entities the warnings come from; found once per registry. */

export const RAIN_STATES = new Set(["rainy", "pouring", "lightning-rainy", "hail", "snowy-rainy"]);
const CLASS_KIND = {
  smoke: "smoke",
  gas: "gas",
  carbon_monoxide: "co",
  moisture: "water"
};

/** Warning sensors per room, alarm panels and the weather entity (the chosen one, else the first; none without the rain warning). */
export function alertSources(hass, building, weatherId) {
  const rooms = [];
  for (const floor of building.floors) {
    for (const room of floor.rooms) {
      const sensors = areaEntities(hass, room.area_id).filter(id => id.startsWith("binary_sensor.") && !!CLASS_KIND[String(hass.states[id]?.attributes.device_class)]);
      if (sensors.length) rooms.push({
        floorId: floor.id,
        roomId: room.id,
        sensors
      });
    }
  }
  const ids = Object.keys(hass.states);
  const weather = building.settings.rain_warning === false ? null : weatherEntity(hass, weatherId ?? building.settings.weather_entity);
  return {
    rooms,
    alarms: ids.filter(id => id.startsWith("alarm_control_panel.")),
    weather
  };
}

/** Entities whose state changes may raise or clear a warning. */
export function alertEntities(sources) {
  return [...sources.rooms.flatMap(r => r.sensors), ...sources.alarms, ...(sources.weather ? [sources.weather] : [])];
}

/** The active warnings, rooms first, then the house-wide alarm. */
export function findAlerts(hass, building, sources, links) {
  const out = [];
  for (const r of sources.rooms) {
    for (const id of r.sensors) {
      const st = hass.states[id];
      if (st?.state !== "on") continue;
      out.push({
        kind: CLASS_KIND[String(st.attributes.device_class)],
        entity: id,
        roomId: r.roomId,
        floorId: r.floorId
      });
    }
  }
  const raining = !!sources.weather && RAIN_STATES.has(hass.states[sources.weather]?.state ?? "");
  if (raining) {
    for (const floor of building.floors) {
      for (const o of floor.openings) {
        if (o.type !== "window") continue;
        const link = links.get(o.id);
        if (!link) continue;
        const s = openingState(hass, link, "window");
        if (s.open < 0.5 && s.tilt < 0.5 && s.open2 < 0.5 && s.tilt2 < 0.5) continue;
        out.push({
          kind: "window_rain",
          entity: link.contact ?? link.tilt ?? link.contact2 ?? o.id,
          roomId: o.room_id,
          floorId: floor.id
        });
      }
    }
  }
  for (const id of sources.alarms) {
    const state = hass.states[id]?.state;
    if (state === "triggered") out.push({
      kind: "alarm",
      entity: id,
      roomId: null,
      floorId: null
    });else if (state === "pending") out.push({
      kind: "alarm_pending",
      entity: id,
      roomId: null,
      floorId: null
    });
  }
  return out;
}

/** Colour a room pulses in (0..1 channels). */
export function alertColor(kind) {
  switch (kind) {
    case "water":
      return [0.2, 0.6, 1];
    case "window_rain":
      return [0.35, 0.72, 1];
    case "alarm_pending":
      return [1, 0.62, 0.2];
    default:
      return [1, 0.2, 0.25];
  }
}

/** Short text for the banner: "Küche · Rauch: Rauchmelder". */
export function alertText(hass, building, a) {
  const room = a.roomId ? building.floors.flatMap(f => f.rooms).find(r => r.id === a.roomId) : null;
  const name = hass ? entityName(hass, a.entity) : a.entity;
  const text = translate(hass, `alert_${a.kind}`, {
    name
  });
  return room ? `${room.name} · ${text}` : text;
}