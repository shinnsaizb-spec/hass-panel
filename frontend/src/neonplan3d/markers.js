/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/markers.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Turns placements and entity states into device markers for the 3D view, and formats short state
// texts shared by markers and the room panel.

import { defaultHeight, entityName, isActive, isUnavailable, kindOf, lightGlow, tempUnit } from "./devices.js";
import { formatNumber, translate } from "./i18n.js";
import { iconSvg, mdiIcon } from "./icons.js";
import { pointInPolygon } from "./model.js";
const t = (hass, key) => translate(hass, key);

/** Short, localised state text for a marker or a panel row. */
export function stateText(hass, st) {
  if (!st || isUnavailable(st)) return t(hass, "state_unavailable");
  const a = st.attributes;
  switch (kindOf(st.entity_id)) {
    case "light":
      if (st.state !== "on") return t(hass, "state_off");
      return typeof a.brightness === "number" ? `${Math.round(a.brightness / 255 * 100)} %` : t(hass, "state_on");
    case "switch":
    case "fan":
      return t(hass, st.state === "on" ? "state_on" : "state_off");
    case "cover":
      if (typeof a.current_position === "number" && st.state !== "opening" && st.state !== "closing") return `${a.current_position} %`;
      return translateState(hass, st.state);
    case "climate":
      {
        const cur = typeof a.current_temperature === "number" ? `${formatNumber(hass, a.current_temperature, 1)} ${hass ? tempUnit(hass) : "°C"}` : null;
        if (st.state === "off") return cur ? `${cur} · ${t(hass, "state_off")}` : t(hass, "state_off");
        return cur ?? translateState(hass, st.state);
      }
    case "media":
      {
        // what is running: the app (Netflix, YouTube, …), else the title or the input source
        const running = st.state === "playing" || st.state === "paused" || st.state === "on" || st.state === "idle";
        const what = [a.app_name, a.media_title, a.source].find(v => typeof v === "string" && v);
        return running && what ? what : translateState(hass, st.state);
      }
    case "lock":
    case "camera":
      return translateState(hass, st.state);
    case "binary":
      {
        const opening = ["door", "window", "opening", "garage_door"].includes(a.device_class);
        if (opening) return t(hass, st.state === "on" ? "state_open" : "state_closed");
        return t(hass, st.state === "on" ? "state_detected" : "state_clear");
      }
    case "sensor":
      {
        const v = Number(st.state);
        const unit = a.unit_of_measurement ?? "";
        // the decimals set in Home Assistant win (a gas meter reads 1234.567 m³)
        const digits = hass?.entities?.[st.entity_id]?.display_precision ?? 1;
        return Number.isFinite(v) ? `${formatNumber(hass, v, digits)}${unit ? ` ${unit}` : ""}` : st.state;
      }
    default:
      return "";
  }
}
function translateState(hass, state) {
  const key = `state_${state}`;
  const s = translate(hass, key);
  return s === key ? state : s;
}

/** Markers for every placed entity that still exists. */
export function buildMarkers(hass, building) {
  const out = [];
  for (const floor of building.floors) {
    for (const pl of floor.placements) {
      const kind = kindOf(pl.entity_id);
      const st = hass.states[pl.entity_id];
      if (!kind || !st) continue;
      const room = floor.rooms.find(r => r.points.length >= 3 && pointInPolygon([pl.x, pl.z], r.points)) ?? null;
      const areaName = room?.area_id ? hass.areas?.[room.area_id]?.name : undefined;
      out.push({
        id: pl.entity_id,
        floorId: floor.id,
        roomId: room?.id ?? null,
        x: pl.x,
        z: pl.z,
        y: pl.y ?? defaultHeight(kind, floor.height, pl.mount ?? null),
        lamp: kind === "light" ? pl.mount ?? "ceiling" : null,
        model: kind === "camera" ? pl.mount === "ceiling" ? "camera_ceiling" : "camera_wall" : undefined,
        motion: kind === "camera" ? cameraMotion(hass, pl.entity_id) : undefined,
        fov: pl.fov ?? undefined,
        reach: pl.reach ?? undefined,
        tilt: pl.tilt ?? undefined,
        rotation: pl.rotation ?? 0,
        icon: pl.icon ? mdiIcon(pl.icon) : iconSvg(kind),
        cone: kind === "camera" && pl.cone === false ? false : undefined,
        name: pl.name || entityName(hass, pl.entity_id, areaName),
        ownName: pl.name || undefined,
        showName: !!pl.show_name,
        text: stateText(hass, st),
        active: isActive(st),
        unavailable: isUnavailable(st),
        glow: kind === "light" ? lightGlow(st) : null,
        show: pl.marker ?? undefined,
        fixed: !!pl.locked
      });
    }
  }
  return out;
}

/** What a camera's detection sensor reports: a person, a vehicle, an animal or plain motion (by its id and name). */

export function detectionKind(hass, sensorId) {
  // ids join their words with underscores: "einfahrt_car_occupancy"
  const text = `${sensorId} ${String(hass.states[sensorId]?.attributes.friendly_name ?? "")}`.toLowerCase().replace(/[_.-]/g, " ");
  if (/person|people|human|pedestrian/.test(text)) return "person";
  if (/\bcar\b|vehicle|truck|bus|motorcycle|bicycle|fahrzeug|auto\b/.test(text)) return "car";
  if (/\bdog\b|\bcat\b|\bpet\b|animal|bird|hund|katze|tier/.test(text)) return "pet";
  return "motion";
}

/** Whether a camera's device reports motion or a person right now (its motion/occupancy sensors). */
export function cameraMotion(hass, cameraId) {
  return cameraMotionSensors(hass, cameraId).some(id => hass.states[id]?.state === "on");
}

/** The motion, occupancy and presence sensors of a camera's device. */
export function cameraMotionSensors(hass, cameraId) {
  const device = hass.entities?.[cameraId]?.device_id;
  if (!device) return [];
  return Object.values(hass.entities ?? {}).filter(e => e.device_id === device && e.entity_id.startsWith("binary_sensor.")).map(e => e.entity_id).filter(id => ["motion", "occupancy", "presence"].includes(String(hass.states[id]?.attributes.device_class)));
}

/** Entity ids placed anywhere in the building (to notice relevant state changes cheaply). */
export function placedEntities(building) {
  return building.floors.flatMap(f => f.placements.map(p => p.entity_id));
}

/** Opens Home Assistant's more-info dialog for an entity. */
export function openMoreInfo(from, entityId) {
  from.dispatchEvent(new CustomEvent("hass-more-info", {
    detail: {
      entityId
    },
    bubbles: true,
    composed: true
  }));
}

/** Toggle an entity with its own domain's toggle service (light.toggle, switch.toggle, …). */
export function toggleEntity(hass, entityId) {
  const domain = entityId.slice(0, entityId.indexOf("."));
  return hass.callService(domain, "toggle", {
    entity_id: entityId
  });
}