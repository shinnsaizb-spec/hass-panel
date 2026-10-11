/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/framing.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { Box3, Vector3 } from "three";
import { groundLevel, isCoveredRoom, OUTDOOR_TOP, outdoorStanding } from "../model.js";
const expandColumn = (box, x, z, y0, y1) => {
  box.expandByPoint(new Vector3(x, y0, z));
  box.expandByPoint(new Vector3(x, y1, z));
};

/** Bounds of every structural part that the camera should keep inside the initial view. */
export function framingBox(floors) {
  const box = new Box3();
  for (const {
    floor,
    ty
  } of floors) {
    const floorY = floor.elevation + ty;
    for (const room of floor.rooms) {
      for (const [x, z] of room.points) expandColumn(box, x, z, floorY, floorY + floor.height);
    }
    for (const area of floor.outdoor ?? []) {
      const ground = floorY + groundLevel(floor) + (area.offset ?? 0);
      const low = ground - (area.type === "pool" ? 0 : area.slope ?? 0);
      const ownHeight = outdoorStanding(area.type) && area.height ? area.height : OUTDOOR_TOP[area.type];
      const high = ground + (area.type === "pool" ? 0.06 : ownHeight);
      for (const [x, z] of area.points) expandColumn(box, x, z, low, high);
    }
    for (const wall of floor.walls ?? []) {
      const top = floorY + Math.min(floor.height, wall.height ?? floor.height);
      expandColumn(box, wall.a[0], wall.a[1], floorY, top);
      expandColumn(box, wall.b[0], wall.b[1], floorY, top);
    }
  }
  return box;
}

/** Full structural bounds of one room at its floor's current displayed height. */
export function roomFramingBox(floor, room, ty) {
  const box = new Box3();
  const floorY = floor.elevation + ty;
  for (const [x, z] of room.points) expandColumn(box, x, z, floorY, floorY + (isCoveredRoom(room) ? room.height ?? floor.height : floor.height));
  return box;
}

/** Camera distance that fits an axis-aligned box at the actual orbit angle, instead of a wasteful bounding sphere. */
export function cameraFitRadius(box, theta, phi, aspect, verticalFov, margin = 1) {
  if (box.isEmpty()) return 0;
  const center = box.getCenter(new Vector3());
  const towardCamera = new Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
  const right = new Vector3(Math.cos(theta), 0, -Math.sin(theta));
  const up = new Vector3(-Math.sin(theta) * Math.cos(phi), Math.sin(phi), -Math.cos(theta) * Math.cos(phi));
  const tanV = Math.tan(verticalFov / 2);
  const tanH = tanV * Math.max(0.01, aspect);
  let radius = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const p = new Vector3(x, y, z).sub(center);
        const near = p.dot(towardCamera);
        radius = Math.max(radius, near + Math.abs(p.dot(right)) * margin / tanH, near + Math.abs(p.dot(up)) * margin / tanV);
      }
    }
  }
  return radius;
}

/** A front-left view that uses a wide screen better for a long, narrow plan. */
export function cameraFitView(box, phi, aspect, verticalFov, margin = 1) {
  const size = box.getSize(new Vector3());
  const narrow = Math.max(0.01, Math.min(size.x, size.z));
  const elongated = Math.max(size.x, size.z) / narrow >= 2;
  let theta = -0.6;
  if (elongated && aspect >= 1.2) theta = size.z >= size.x ? -0.95 : -0.35;
  return {
    theta,
    radius: cameraFitRadius(box, theta, phi, aspect, verticalFov, margin)
  };
}
/**
 * Tight perspective fit inside an asymmetric screen rectangle. Besides the distance, this returns
 * the orbit target offset that moves the model away from UI overlays without wasting the free side.
 */
export function cameraFitPlacement(box, theta, phi, aspect, verticalFov, frame, minRadius = 8) {
  if (box.isEmpty()) return {
    radius: 0,
    offset: new Vector3()
  };
  const width = Math.max(1, frame.width);
  const height = Math.max(1, frame.height);
  const left = -1 + 2 * Math.max(0, frame.left) / width;
  const rightEdge = 1 - 2 * Math.max(0, frame.right) / width;
  const bottom = -1 + 2 * Math.max(0, frame.bottom) / height;
  const top = 1 - 2 * Math.max(0, frame.top) / height;
  if (left >= rightEdge || bottom >= top) return {
    radius: cameraFitRadius(box, theta, phi, aspect, verticalFov),
    offset: new Vector3()
  };
  const center = box.getCenter(new Vector3());
  const towardCamera = new Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
  const screenRight = new Vector3(Math.cos(theta), 0, -Math.sin(theta));
  const screenUp = new Vector3(-Math.sin(theta) * Math.cos(phi), Math.sin(phi), -Math.cos(theta) * Math.cos(phi));
  const tanV = Math.tan(verticalFov / 2);
  const tanH = tanV * Math.max(0.01, aspect);
  const points = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new Vector3(x, y, z).sub(center);
    points.push({
      x: p.dot(screenRight),
      y: p.dot(screenUp),
      near: p.dot(towardCamera)
    });
  }
  const intervals = radius => {
    let x0 = -Infinity;
    let x1 = Infinity;
    let y0 = -Infinity;
    let y1 = Infinity;
    for (const p of points) {
      const depth = radius - p.near;
      x0 = Math.max(x0, p.x - rightEdge * tanH * depth);
      x1 = Math.min(x1, p.x - left * tanH * depth);
      y0 = Math.max(y0, p.y - top * tanV * depth);
      y1 = Math.min(y1, p.y - bottom * tanV * depth);
    }
    return {
      x0,
      x1,
      y0,
      y1
    };
  };
  const near = Math.max(...points.map(p => p.near)) + 0.1;
  const feasible = radius => {
    const i = intervals(radius);
    return i.x0 <= i.x1 && i.y0 <= i.y1;
  };
  let low = Math.max(near, minRadius);
  let high = Math.max(low, cameraFitRadius(box, theta, phi, aspect, verticalFov));
  while (!feasible(high)) high *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (feasible(mid)) high = mid;else low = mid;
  }
  const limits = intervals(high);
  const tx = (limits.x0 + limits.x1) / 2;
  const ty = (limits.y0 + limits.y1) / 2;
  return {
    radius: high,
    offset: screenRight.multiplyScalar(tx).add(screenUp.multiplyScalar(ty))
  };
}