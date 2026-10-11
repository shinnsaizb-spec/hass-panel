/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Procedural low-poly furniture in the neon look. Every model is built from boxes and cylinders in
// local coordinates (x across, z depth with the front at +z, y up) scaled to the item's size, then
// rotated and moved into place. Solids go into the floor's wall buffer, main outlines into its line
// buffer and a soft contact shadow into the shadow layer, so furniture adds no draw calls.

import { Color } from "three";
import { builtinBase } from "../model.js";
import { mountBase, packItem, packScreen, packsVersion } from "../packs.js";
import { C, EDGE_FAINT, EDGE_FURN, FurnitureBuilder as Builder, flipWinding, transformMirrors } from "./furniture-builder.js";
import { AIR_CONDITIONER_Y, RADIATOR_Y } from "./furniture-models/climate.js";
import { registeredFurnitureScreen, renderRegisteredFurniture } from "./furniture-models/index.js";
import { DEG, EDGE_TOP, GeoBuffer, LineBuffer, shade } from "./geo.js";
export { pushFanRotor } from "./furniture-models/climate.js";
export { pushFridgeDoors } from "./furniture-models/kitchen-bath.js";

/**
 * Screen of a TV or monitor in local coordinates (x across, y up, z = its front face), for the glow
 * shown while the linked device is on. Null for furniture without a screen.
 */
export function screenRect(f, floor) {
  const r = screenRectUnmirrored(f, floor);
  return r && f.mirror ? {
    ...r,
    x0: -r.x1,
    x1: -r.x0
  } : r;
}
function screenRectUnmirrored(f, floor) {
  const w = Math.max(0.05, f.w);
  const d = Math.max(0.05, f.d);
  const h = Math.max(0.005, f.h);
  const part = packScreen(f.type);
  if (part) {
    // the screen part's front face, at the item's mount height
    const base = floor ? mountBase(floor, f) : 0;
    const x0 = (part.x - part.w / 2) * w;
    const x1 = (part.x + part.w / 2) * w;
    const inset = Math.min(0.02, (x1 - x0) * 0.05);
    return {
      x0: x0 + inset,
      x1: x1 - inset,
      y0: base + part.y * h + inset,
      y1: base + (part.y + part.h) * h - inset,
      z: (part.z + part.d / 2) * d
    };
  }
  // built-in models are lifted as a whole by their mount height
  const lift = floor && f.type !== "fridge_smart" ? mountBase(floor, f) - builtinBase(f) : 0;
  const r = builtInScreen(f, w, d, h, floor);
  return r ? {
    ...r,
    y0: r.y0 + lift,
    y1: r.y1 + lift
  } : null;
}
function builtInScreen(f, w, d, h, floor) {
  const registered = registeredFurnitureScreen(f.type, w, d, h);
  if (registered !== undefined) return registered;
  if (f.type === "tv_board") {
    const tw = Math.min(w * 0.8, 1.45);
    const th = tw * 0.56;
    return {
      x0: -tw / 2 + 0.02,
      x1: tw / 2 - 0.02,
      y0: h + 0.12,
      y1: h + 0.08 + th,
      z: -d / 2 + 0.165
    };
  }
  if (f.type === "tv_wall") {
    const y0 = 1.3 - h / 2;
    return {
      x0: -w / 2 + 0.02,
      x1: w / 2 - 0.02,
      y0: y0 + 0.02,
      y1: y0 + h - 0.02,
      z: d / 2 + 0.003
    };
  }
  if (f.type === "desk") return {
    x0: -0.28,
    x1: 0.28,
    y0: h + 0.1,
    y1: h + 0.4,
    z: -d / 2 + 0.115
  };
  if (f.type === "fridge_smart") {
    // the screen sits on the right door (mirrored: the door's u runs to the left from its hinge at +w/2)
    const base = floor ? mountBase(floor, f) : 0;
    return {
      x0: 0.06,
      x1: w / 2 - 0.06,
      y0: base + h * 0.52 + 0.01,
      y1: base + h * 0.86 - 0.01,
      z: d / 2 + 0.006
    };
  }
  // glowing fronts of appliances that run and of a radiator that heats
  if (f.type === "radiator") return {
    x0: -w / 2 + 0.02,
    x1: w / 2 - 0.02,
    y0: RADIATOR_Y + 0.02,
    y1: RADIATOR_Y + h - 0.02,
    z: d / 2 + 0.004
  };
  if (f.type === "air_conditioner") return {
    x0: -w * 0.43,
    x1: w * 0.43,
    y0: AIR_CONDITIONER_Y + h * 0.08,
    y1: AIR_CONDITIONER_Y + h * 0.27,
    z: d / 2 + 0.008
  };
  if (f.type === "water_pump") return {
    x0: -w * 0.1,
    x1: w * 0.1,
    y0: h * 0.56,
    y1: h * 0.65,
    z: d * 0.3 + 0.004
  };
  if (f.type === "water_heater") {
    const dia = Math.min(d * 0.88, h * 0.92);
    const y0 = (h - dia) / 2;
    return {
      x0: w * 0.18,
      x1: w * 0.4,
      y0: y0 + dia * 0.38,
      y1: y0 + dia * 0.68,
      z: d * 0.48 + 0.006
    };
  }
  if (f.type === "range_hood") return {
    x0: -w * 0.4,
    x1: w * 0.4,
    y0: 0.005,
    y1: h * 0.06,
    z: d / 2 + 0.003
  };
  if (f.type === "microwave") return {
    x0: -w * 0.4,
    x1: w * 0.18,
    y0: h * 0.17,
    y1: h * 0.82,
    z: d / 2 + 0.008
  };
  if (f.type === "water_purifier") return {
    x0: -w * 0.28,
    x1: w * 0.28,
    y0: h * 0.8 * 0.56,
    y1: h * 0.8 * 0.64,
    z: d / 2 + 0.016
  };
  if (f.type === "air_purifier") return {
    x0: -w * 0.11,
    x1: w * 0.11,
    y0: h * 0.66,
    y1: h * 0.74,
    z: d / 2 + 0.008
  };
  if (f.type === "robot_mower") return {
    x0: -w * 0.22,
    x1: w * 0.22,
    y0: h * 0.16,
    y1: h * 0.24,
    z: d * 0.31 + 0.008
  };
  if (f.type === "smart_speaker") return {
    x0: -w * 0.42,
    x1: w * 0.42,
    y0: h * 0.9,
    y1: h + 0.008,
    z: d * 0.05
  };
  if (f.type === "security_camera") return {
    x0: -w * 0.12,
    x1: w * 0.12,
    y0: 1.85 + h * 0.37,
    y1: 1.85 + h * 0.58,
    z: d * 0.53
  };
  if (f.type === "smart_lock") return {
    x0: -w * 0.36,
    x1: w * 0.36,
    y0: 0.95 + h * 0.43,
    y1: 0.95 + h * 0.78,
    z: d / 2 + 0.006
  };
  if (f.type === "network_cabinet") return {
    x0: -w * 0.22,
    x1: w * 0.22,
    y0: h * 0.82,
    y1: h * 0.86,
    z: d * 0.545
  };
  if (f.type === "nas_server") return {
    x0: -w * 0.34,
    x1: w * 0.34,
    y0: h * 0.18,
    y1: h * 0.205,
    z: d * 0.54
  };
  if (f.type === "access_point") return {
    x0: -w * 0.16,
    x1: w * 0.16,
    y0: h * 0.12,
    y1: h * 0.24,
    z: d * 0.47
  };
  if (f.type === "wall_thermostat") return {
    x0: -w * 0.37,
    x1: w * 0.37,
    y0: 1.35 + h * 0.34,
    y1: 1.35 + h * 0.82,
    z: d * 0.54
  };
  if (f.type === "smoke_detector") return {
    x0: -w * 0.1,
    x1: w * 0.1,
    y0: h * 0.05,
    y1: h * 0.22,
    z: d * 0.47
  };
  if (f.type === "siren_alarm") return {
    x0: -w * 0.32,
    x1: w * 0.32,
    y0: 1.85 + h * 0.48,
    y1: 1.85 + h * 0.82,
    z: d * 0.58
  };
  if (f.type === "electrical_panel") return {
    x0: -w * 0.34,
    x1: w * 0.34,
    y0: 0.85 + h * 0.2,
    y1: 0.85 + h * 0.8,
    z: d * 0.56
  };
  if (f.type === "ups_unit") return {
    x0: -w * 0.32,
    x1: w * 0.32,
    y0: h * 0.58,
    y1: h * 0.78,
    z: d * 0.54
  };
  if (f.type === "modem_router") return {
    x0: -w * 0.25,
    x1: w * 0.25,
    y0: h * 0.16,
    y1: h * 0.3,
    z: d * 0.54
  };
  if (f.type === "heat_pump_outdoor") return {
    x0: w * 0.32,
    x1: w * 0.41,
    y0: h * 0.62,
    y1: h * 0.69,
    z: d * 0.56
  };
  if (f.type === "hot_water_tank") return {
    x0: -w * 0.12,
    x1: w * 0.12,
    y0: h * 0.57,
    y1: h * 0.66,
    z: d * 0.49
  };
  if (f.type === "ventilation_fan") return {
    x0: -w * 0.12,
    x1: w * 0.12,
    y0: 1.8 + h * 0.44,
    y1: 1.8 + h * 0.58,
    z: d * 0.45
  };
  if (f.type === "humidifier") return {
    x0: -w * 0.35,
    x1: w * 0.35,
    y0: h * 0.61,
    y1: h * 0.69,
    z: d * 0.55
  };
  if (f.type === "smart_display") return {
    x0: -w * 0.39,
    x1: w * 0.39,
    y0: h * 0.35,
    y1: h * 0.89,
    z: d * 0.24
  };
  if (f.type === "wall_switch") return {
    x0: -w * 0.2,
    x1: w * 0.2,
    y0: 1.05 + h * 0.13,
    y1: 1.05 + h * 0.25,
    z: d * 0.56
  };
  if (f.type === "wall_outlet") return {
    x0: -w * 0.16,
    x1: w * 0.16,
    y0: 0.3 + h * 0.12,
    y1: 0.3 + h * 0.24,
    z: d * 0.56
  };
  if (f.type === "smart_plug") return {
    x0: -w * 0.25,
    x1: w * 0.25,
    y0: 0.3 + h * 0.1,
    y1: 0.3 + h * 0.17,
    z: d * 0.56
  };
  if (f.type === "motion_sensor") return {
    x0: -w * 0.27,
    x1: w * 0.27,
    y0: 1.9 + h * 0.3,
    y1: 1.9 + h * 0.78,
    z: d * 0.59
  };
  if (f.type === "contact_sensor") return {
    x0: -w * 0.28,
    x1: -w * 0.03,
    y0: 1.1 + h * 0.1,
    y1: 1.1 + h * 0.24,
    z: d * 0.54
  };
  if (f.type === "water_leak_sensor") return {
    x0: -w * 0.2,
    x1: w * 0.2,
    y0: h * 0.72,
    y1: h * 1.08,
    z: d * 0.12
  };
  if (f.type === "temperature_humidity_sensor") return {
    x0: -w * 0.35,
    x1: w * 0.35,
    y0: 1.35 + h * 0.3,
    y1: 1.35 + h * 0.78,
    z: d * 0.55
  };
  if (f.type === "video_doorbell") return {
    x0: -w * 0.2,
    x1: w * 0.2,
    y0: 1.25 + h * 0.06,
    y1: 1.25 + h * 0.18,
    z: d * 0.56
  };
  return null;
}

/** Soft contact shadow under an item: a dark core that fades out beyond its footprint. */
function contactShadow(shadow, tf, w, d, strength) {
  const grow = Math.min(0.14, Math.max(0.06, Math.min(w, d) * 0.15));
  const dark = new Color(1 - strength, 1 - strength, 1 - strength);
  const clear = new Color(1, 1, 1);
  const y = 0.003;
  const inner = [tf(-w / 2, -d / 2), tf(w / 2, -d / 2), tf(w / 2, d / 2), tf(-w / 2, d / 2)];
  const outer = [tf(-w / 2 - grow, -d / 2 - grow), tf(w / 2 + grow, -d / 2 - grow), tf(w / 2 + grow, d / 2 + grow), tf(-w / 2 - grow, d / 2 + grow)];
  const P = p => [p[0], y, p[1]];
  const s0 = shadow.p.length;
  shadow.tri(P(inner[0]), P(inner[1]), P(inner[2]), dark);
  shadow.tri(P(inner[0]), P(inner[2]), P(inner[3]), dark);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    shadow.tri(P(inner[i]), P(outer[i]), P(outer[j]), dark, clear, clear);
    shadow.tri(P(inner[i]), P(outer[j]), P(inner[j]), dark, clear, dark);
  }
  if (transformMirrors(tf)) flipWinding(shadow, s0);
}
export function pushFurniture(buf, lines, shadow, f, base = 0) {
  const key = furnitureGeometryKey(f, base);
  let cached = furnitureGeometryCache.get(key);
  if (cached) {
    furnitureGeometryCache.delete(key);
    furnitureGeometryCache.set(key, cached);
    furnitureCacheHits++;
  } else {
    const solid = new GeoBuffer();
    const edges = new LineBuffer();
    const shade = new GeoBuffer();
    // Keep rotation/mirroring in the cached shape because the procedural palette bakes directional
    // face lighting and winding. Position alone is translated when an instance is appended.
    const local = {
      ...f,
      x: 0,
      z: 0
    };
    pushUpright(solid, edges, shade, local, base);
    cached = {
      solid,
      edges,
      shade
    };
    furnitureGeometryCache.set(key, cached);
    furnitureCacheMisses++;
    if (furnitureGeometryCache.size > FURNITURE_CACHE_LIMIT) furnitureGeometryCache.delete(furnitureGeometryCache.keys().next().value);
  }
  appendFurnitureGeometry(buf, cached.solid, f);
  appendFurnitureLines(lines, cached.edges, f);
  appendFurnitureGeometry(shadow, cached.shade, f);
}
const FURNITURE_CACHE_LIMIT = 256;
const furnitureGeometryCache = new Map();
let furnitureCacheHits = 0;
let furnitureCacheMisses = 0;
function furnitureGeometryKey(f, base) {
  const n = value => Math.round(value * 10000) / 10000;
  return `${packsVersion()}|${f.type}|${n(f.w)}|${n(f.d)}|${n(f.h)}|${f.variant ?? ""}|${n(base)}|${n(f.rotation)}|${f.mirror ? 1 : 0}`;
}
function appendFurnitureGeometry(target, source, f) {
  for (let tri = 0; tri < source.p.length / 9; tri++) {
    for (const k of [0, 1, 2]) {
      const v = tri * 3 + k;
      const x = source.p[v * 3];
      const y = source.p[v * 3 + 1];
      const z = source.p[v * 3 + 2];
      target.p.push(f.x + x, y, f.z + z);
      target.c.push(...source.c.slice(v * 3, v * 3 + 3));
      target.f.push(source.f[v]);
      if (target.uv) target.uv.push(...(source.uv?.slice(v * 2, v * 2 + 2) ?? [0.5, 0.5]));
      if (target.tile) target.tile.push(...(source.tile?.slice(v * 2, v * 2 + 2) ?? [0, 1]));
    }
  }
}
function appendFurnitureLines(target, source, f) {
  for (let v = 0; v < source.p.length / 3; v++) {
    const x = source.p[v * 3];
    const y = source.p[v * 3 + 1];
    const z = source.p[v * 3 + 2];
    target.p.push(f.x + x, y, f.z + z);
    target.c.push(...source.c.slice(v * 3, v * 3 + 3));
    target.f.push(source.f[v]);
  }
}

/** Test/diagnostic hook: the cache is lazy, bounded and invalidated by the pack registry version. */
export function furnitureGeometryCacheStats() {
  return {
    size: furnitureGeometryCache.size,
    hits: furnitureCacheHits,
    misses: furnitureCacheMisses,
    limit: FURNITURE_CACHE_LIMIT
  };
}
export function clearFurnitureGeometryCache() {
  furnitureGeometryCache.clear();
  furnitureCacheHits = 0;
  furnitureCacheMisses = 0;
}
export { flipWinding } from "./furniture-builder.js";
function pushUpright(buf, lines, shadow, f, base) {
  // pack items place their parts at `base` themselves; built-in models are drawn on the floor and
  // lifted as a whole (a dryer on the washer, a shelf on the wall), without a shadow on the floor
  // the mount height is absolute: a wall cabinet drawn at 1.45 m moves by the difference (up or down)
  const lift = packItem(f.type) ? 0 : base - builtinBase(f);
  if (packItem(f.type) || Math.abs(lift) < 0.001) return buildFurniture(buf, lines, shadow, f, base);
  const p0 = buf.p.length;
  const l0 = lines.p.length;
  const s0 = shadow.p.length;
  buildFurniture(buf, lines, base < 0.05 ? shadow : new GeoBuffer(), f, 0);
  for (let i = p0 + 1; i < buf.p.length; i += 3) buf.p[i] += lift;
  for (let i = l0 + 1; i < lines.p.length; i += 3) lines.p[i] += lift;
  for (let i = s0 + 1; i < shadow.p.length; i += 3) shadow.p[i] += lift;
}
function buildFurniture(buf, lines, shadow, f, base) {
  const a = f.rotation * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const mx = f.mirror ? -1 : 1;
  const tf = (x, z) => [f.x + mx * x * c - z * s, f.z + mx * x * s + z * c];
  const b = new Builder(buf, lines, tf);
  const w = Math.max(0.05, f.w);
  const d = Math.max(0.05, f.d);
  const h = Math.max(0.005, f.h);
  const shadowStrength = renderRegisteredFurniture(f.type, {
    b,
    w,
    d,
    h,
    base,
    variant: f.variant ?? null
  });
  if (shadowStrength !== null) {
    if (shadowStrength !== false) contactShadow(shadow, tf, w, d, shadowStrength);
    return;
  }
  const item = packItem(f.type);
  if (item) {
    packModel(b, item, w, d, h, base, null);
    if (base <= 0.05) contactShadow(shadow, tf, w, d, 0.5);
    return;
  }

  // Unknown items keep a visible fallback box so malformed or newer plans remain inspectable.
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  contactShadow(shadow, tf, w, d, 0.5);
}

/** Colour of a pack part: a palette role (so packs follow the look) or "#rrggbb". */
function packColor(value, top) {
  if (!value) return null;
  if (value.startsWith("#")) return parseInt(value.slice(1), 16);
  const palette = C;
  return (top ? palette[`${value}Top`] : undefined) ?? palette[value] ?? null;
}

/** Model of a pack item: its parts scaled to the item's size; glowing parts take `glow` (a lit lamp). */
function packModel(b, item, w, d, h, base, glow, only = null) {
  const onlyGlow = !!only;
  for (const q of item.parts) {
    // only some parts (the glowing ones of a speaker, a car's windows), a hair larger so they cover the item's own
    if (only && !only(q)) continue;
    const p = onlyGlow ? {
      ...q,
      glow: true,
      w: q.w + 0.006 / w,
      d: q.d + 0.006 / d,
      y: Math.max(0, q.y - 0.002 / h),
      h: q.h + 0.004 / h
    } : q;
    const lit = p.glow && glow !== null;
    const side = lit ? glow : packColor(p.color, false) ?? C.body;
    // without a top colour, the top is the role's top shade or a little lighter
    const top = lit ? glow : packColor(p.top, false) ?? packColor(p.color, true) ?? shade(side, 1.25).getHex();
    const y0 = base + p.y * h;
    const y1 = base + Math.min(h, (p.y + p.h) * h);
    // "glow" lines are as bright as the wall lines, so a pack item can be drawn like the walls
    const edges = p.edges === "glow" ? EDGE_TOP : p.edges === "faint" ? EDGE_FAINT : p.edges ? EDGE_FURN : null;
    // a turned part draws through a builder whose coordinates turn around the part's centre
    const bb = p.rot ? b.rotated(p.x * w, p.z * d, p.rot) : b;
    if (p.shape === "cyl" && (p.axis === "x" || p.axis === "z")) {
      bb.lyingCyl(p.axis, p.x * w, p.z * d, y0, y1, p.axis === "x" ? p.w * w : p.d * d, p.axis === "x" ? p.d * d : p.w * w, side, top, 14, edges);
    } else if (p.shape === "cyl") bb.cyl(p.x * w, p.z * d, Math.min(p.w * w, p.d * d) / 2, y0, y1, side, top, 14, edges);else if (p.shape === "loft") {
      const tx = p.tx ?? p.x;
      const tz = p.tz ?? p.z;
      const tw = p.tw ?? p.w;
      const td = p.td ?? p.d;
      bb.loft([(p.x - p.w / 2) * w, (p.x + p.w / 2) * w, (p.z - p.d / 2) * d, (p.z + p.d / 2) * d], [(tx - tw / 2) * w, (tx + tw / 2) * w, (tz - td / 2) * d, (tz + td / 2) * d], y0, y1, side, top, edges);
    } else bb.box((p.x - p.w / 2) * w, (p.x + p.w / 2) * w, y0, y1, (p.z - p.d / 2) * d, (p.z + p.d / 2) * d, side, top, edges);
  }
}

/**
 * A security camera into the lamp buffer: on a wall a small body with a lens looking along +z (turned
 * by `rotation`), on the ceiling a dome hanging at the ceiling height `y`.
 */
export function pushCameraModel(buf, model, x, y, z, rotation) {
  const a = rotation * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const tf = (lx, lz) => [x + lx * c - lz * s, z + lx * s + lz * c];
  const b = new Builder(buf, new LineBuffer(), tf);
  const body = 0x1a2640;
  const bodyTop = 0x243660;
  const lens = 0x0b111f;
  if (model === "camera_ceiling") {
    // dome: a flat base and a half-dome below it
    b.cyl(0, 0, 0.07, y - 0.03, y, body, bodyTop, 12);
    b.loft([-0.05, 0.05, -0.05, 0.05], [-0.025, 0.025, -0.025, 0.025], y - 0.1, y - 0.03, lens, body);
    b.cyl(0, 0, 0.012, y - 0.075, y - 0.06, C.accent, C.accent, 6);
    return;
  }
  // wall camera: bracket at the wall (-z), body pointing into the room (+z), lens in front
  b.box(-0.02, 0.02, y - 0.02, y + 0.02, -0.06, -0.03, body, bodyTop);
  b.box(-0.01, 0.01, y - 0.01, y + 0.06, -0.05, -0.03, body, bodyTop);
  b.loft([-0.035, 0.035, -0.03, 0.09], [-0.04, 0.04, -0.03, 0.09], y + 0.02, y + 0.09, body, bodyTop);
  b.lyingCyl("z", 0, 0.1, y + 0.03, y + 0.08, 0.03, 0.05, lens, C.accent, 10);
  b.box(-0.006, 0.006, y + 0.075, y + 0.085, 0.085, 0.09, 0xff3b4f, 0xff3b4f);
}

/** The glowing parts of a pack item that is no lamp (a smart speaker's light ring) in `color`: for the screen layer. */
export function pushPackGlow(buf, item, f, base, color, pick = p => !!p.glow) {
  const a = f.rotation * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const mx = f.mirror ? -1 : 1;
  const tf = (x, z) => [f.x + mx * x * c - z * s, f.z + mx * x * s + z * c];
  packModel(new Builder(buf, new LineBuffer(), tf), item, Math.max(0.05, f.w), Math.max(0.05, f.d), Math.max(0.005, f.h), base, color, pick);
}

/** A pack lamp into the lamp buffer: glowing parts in the light's colour (`glow`), or dark when off. */
export function pushPackLamp(buf, item, f, base, glow) {
  const a = f.rotation * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  // mirrored: the item's own x runs the other way (the builder rewinds what needs it)
  const mx = f.mirror ? -1 : 1;
  const tf = (x, z) => [f.x + mx * x * c - z * s, f.z + mx * x * s + z * c];
  // lamps have no outlines: their edges are dropped
  packModel(new Builder(buf, new LineBuffer(), tf), item, Math.max(0.05, f.w), Math.max(0.05, f.d), Math.max(0.005, f.h), base, glow);
}