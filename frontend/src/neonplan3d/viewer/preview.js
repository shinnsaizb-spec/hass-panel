/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/preview.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Small pictures of furniture and lamps for the editor's library: one offscreen renderer draws the
// same low-poly models as the 3D view, seen from the front at an angle, into a PNG data URL.

import { Box3, Color, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, OrthographicCamera, Scene, Vector3, WebGLRenderer } from "three";
import { packItem, setPacks } from "../packs.js";
import { pushFanRotor, pushFurniture, pushPackLamp } from "./furniture.js";
import { GeoBuffer, LineBuffer, pushPrism } from "./geo.js";
import { pushLampModel } from "./viewer3d.js";
let renderer = null;
const cache = new Map();
/** PNG data URL of an item (cached per type and size); `packs` are needed for pack furniture. */
export function furniturePreview(item, size = 180, packs, brightness = 1.3) {
  const key = `${item.type}|${item.w}|${item.d}|${item.h}|${item.variant ?? ""}|${size}|${brightness}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (packs) setPacks(packs);
  renderer ??= new WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  const buf = new GeoBuffer();
  const lines = new LineBuffer();
  const packed = packItem(item.type);
  if (packed?.light) {
    pushPackLamp(buf, packed, {
      x: 0,
      z: 0,
      rotation: 0,
      w: item.w,
      d: item.d,
      h: item.h
    }, 0, 0xffb547);
  } else if (item.lamp) {
    // hanging lamps hang from a ceiling just above them
    pushLampModel(buf, {
      x: 0,
      z: 0,
      size: [item.w, item.d, item.h],
      base: 0,
      rotation: 0,
      variant: item.variant ?? null,
      lamp: item.lamp
    }, Math.max(item.h + 0.15, 0.6), 0xffb547);
  } else {
    const f = {
      id: "preview",
      type: item.type,
      x: 0,
      z: 0,
      rotation: 0,
      w: item.w,
      d: item.d,
      h: item.h,
      variant: item.variant ?? null,
      entity: null,
      power: null
    };
    pushFurniture(buf, lines, new GeoBuffer(), f);
    if (item.type === "robot_vacuum") {
      // The live viewer owns and moves this body separately. Add the same parked silhouette only to
      // the library thumbnail so the item reads as “robot with station”, as it does in the gallery.
      const disc = (x, z, r, y0, y1, side, top) => {
        const poly = Array.from({
          length: 20
        }, (_, i) => {
          const a = i / 20 * Math.PI * 2;
          return [x + Math.cos(a) * r, z + Math.sin(a) * r];
        });
        pushPrism(buf, poly, y0, y1, side, top, {
          aoFrom: 0,
          bottom: false
        });
      };
      const z = item.d * 0.28;
      const r = Math.min(item.w * 0.4, item.d * 0.27);
      disc(0, z, r, 0.012, 0.08, 0x243049, 0x34425f);
      disc(0, z, r * 0.32, 0.08, 0.1, 0x3a4a6a, 0x4d5f86);
    }
    if (item.type === "fan_ceiling" || item.type === "fan_ceiling_light" || item.type === "fan_wall" || item.type === "fan_floor") {
      const p0 = buf.p.length;
      const l0 = lines.p.length;
      pushFanRotor(buf, lines, item.type, item.w, item.d, item.h, item.variant ?? null);
      const y = item.type === "fan_ceiling" || item.type === "fan_ceiling_light" ? item.h * 0.18 : item.type === "fan_wall" ? item.h * 0.5 : item.h * 0.78;
      const z = 0;
      for (let i = p0 + 1; i < buf.p.length; i += 3) buf.p[i] += y;
      for (let i = p0 + 2; i < buf.p.length; i += 3) buf.p[i] += z;
      for (let i = l0 + 1; i < lines.p.length; i += 3) lines.p[i] += y;
      for (let i = l0 + 2; i < lines.p.length; i += 3) lines.p[i] += z;
      if (item.type === "fan_ceiling_light") pushLampModel(buf, {
        x: 0,
        z: 0,
        size: [item.w, item.d, item.h],
        base: 0,
        rotation: 0,
        variant: null,
        lamp: "fan"
      }, item.h, 0xffb547);
    }
  }
  const scene = new Scene();
  // the neon palette is made for a dark room: pictures get a little more light and brighter edges
  const mesh = new Mesh(buf.geometry(), new MeshBasicMaterial({
    vertexColors: true,
    color: new Color(brightness, brightness, brightness)
  }));
  const edges = new LineSegments(lines.geometry(), new LineBasicMaterial({
    vertexColors: true,
    color: new Color(brightness * 1.8, brightness * 1.8, brightness * 1.8)
  }));
  scene.add(mesh, edges);

  // look from the front right, a little from above; fit the item's box into the picture
  // Some plan-native objects (notably a parking space) are intentionally line-only. Include the
  // outline in framing so their preview does not collapse around an empty triangle mesh.
  const box = new Box3().setFromObject(scene);
  const center = box.getCenter(new Vector3());
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  camera.position.copy(center).add(new Vector3(0.9, 0.75, 1.3).normalize().multiplyScalar(20));
  camera.lookAt(center);
  camera.updateMatrixWorld();
  // the camera looks at the centre: the corners' distances in view space give the picture's extent
  let r = 0.05;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    r = Math.max(r, Math.abs(p.x), Math.abs(p.y));
  }
  const pad = r * 1.12;
  camera.left = -pad;
  camera.right = pad;
  camera.top = pad;
  camera.bottom = -pad;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  mesh.geometry.dispose();
  mesh.material.dispose();
  edges.geometry.dispose();
  edges.material.dispose();
  cache.set(key, url);
  return url;
}