/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/transfer.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Export and import of the building as a JSON file. Without entities, a plan can be shared with others:
// areas, lights, sensors and every other link to this Home Assistant are removed.

import { normalizeBuilding } from "./model.js";
export const EXPORT_FORMAT = "neonplan3d";
/** A copy of the building without any link to entities or areas (background images stay out anyway). */
export function withoutEntities(b) {
  const out = structuredClone(b);
  out.energy = {
    ...out.energy,
    grid: null,
    solar: null,
    battery: null,
    battery_soc: null,
    tariff: null
  };
  out.presence = [];
  for (const f of out.floors) {
    f.placements = [];
    f.background = null;
    f.rooms = f.rooms.map(r => ({
      ...r,
      area_id: null
    }));
    f.furniture = f.furniture.map(m => ({
      ...m,
      entity: null,
      power: null
    }));
    f.openings = f.openings.map(o => ({
      ...o,
      cover: null,
      contact: null,
      tilt: null
    }));
  }
  return out;
}
export function exportFile(b, shareable) {
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exported_at: new Date().toISOString(),
    building: shareable ? withoutEntities(b) : structuredClone(b)
  };
}

/** Reads an export file; throws "not_json" or "not_plan" when it is none. */
export function parseExport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("not_json");
  }
  const file = data;
  const b = file?.format === EXPORT_FORMAT ? file.building : data;
  if (!b || b.version !== 1 || !Array.isArray(b.floors) || !b.settings) throw new Error("not_plan");
  // background images are not part of an export
  for (const f of b.floors) f.background = null;
  return normalizeBuilding(b);
}

/** Ids of the stored pictures a plan uses: floor backgrounds and screen pictures (not URLs or cameras). */
export function storedImageIds(b) {
  const ids = new Set();
  for (const f of b.floors) {
    if (f.background?.image_id) ids.add(f.background.image_id);
    for (const m of f.furniture) for (const r of m.pictures ?? []) if (r.image && !/^https?:\/\//.test(r.image) && !r.image.startsWith("camera:")) ids.add(r.image);
  }
  return [...ids];
}

/** Starts a download of a text file in the browser. */
export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], {
    type: "application/json"
  }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}