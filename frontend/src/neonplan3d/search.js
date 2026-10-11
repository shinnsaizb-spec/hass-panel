/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/search.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// "Where is …?": rooms and the devices of the plan, found by name.

import { defaultHeight, entityName, furnitureEntities, kindOf } from "./devices.js";
import { centroid, pointInPolygon } from "./model.js";
const norm = s => s.toLocaleLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Everything that can be found: rooms, placed devices and furniture or lamps with an entity. */
export function searchIndex(hass, building) {
  const out = [];
  const links = furnitureEntities(hass, building.floors);
  const many = building.floors.length > 1;
  for (const floor of building.floors) {
    const roomAt = (x, z) => floor.rooms.find(r => r.points.length >= 3 && pointInPolygon([x, z], r.points)) ?? null;
    const where = (x, z) => [roomAt(x, z)?.name, many ? floor.name : null].filter(Boolean).join(" · ");
    for (const room of floor.rooms) {
      if (room.points.length < 3) continue;
      const [x, z] = centroid(room.points);
      out.push({
        kind: "room",
        name: room.name,
        where: many ? floor.name : "",
        floorId: floor.id,
        roomId: room.id,
        entity: null,
        icon: null,
        x,
        z,
        y: 0
      });
    }
    const seen = new Set();
    const add = (entity, x, z, y) => {
      if (seen.has(entity) || !hass.states[entity]) return;
      seen.add(entity);
      out.push({
        kind: "device",
        name: entityName(hass, entity),
        where: where(x, z),
        floorId: floor.id,
        roomId: roomAt(x, z)?.id ?? null,
        entity,
        icon: kindOf(entity),
        x,
        z,
        y
      });
    };
    for (const p of floor.placements) add(p.entity_id, p.x, p.z, p.y ?? defaultHeight(kindOf(p.entity_id) ?? "sensor", floor.height, p.mount));
    for (const f of floor.furniture) {
      const link = links.get(f.id);
      const entity = link?.entity ?? link?.power;
      if (entity) add(entity, f.x, f.z, Math.min(floor.height - 0.3, Math.max(0.5, f.h)));
    }
  }
  return out;
}

/** Items matching a query (name, room or entity id), rooms first, at most `limit`. */
export function searchItems(items, query, limit = 8) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = items.filter(it => {
    const text = norm(`${it.name} ${it.where} ${it.entity ?? ""}`);
    return words.every(w => text.includes(w));
  });
  // names starting with the query first, then rooms before devices
  const q = norm(query.trim());
  const rank = it => (norm(it.name).startsWith(q) ? 0 : 2) + (it.kind === "room" ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)).slice(0, limit);
}