/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/covered-plan.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { coveredFrontEdge, isCoveredRoom, signedArea } from "./model.js";
/** Structural marks shown over a covered Room in the 2D editor. */
export function coveredPlanStructure(room) {
  if (!isCoveredRoom(room) || room.points.length < 3) return null;
  const points = signedArea(room.points) >= 0 ? room.points : [...room.points].reverse();
  const openEdge = room.open !== false ? points.length - 1 : -1;
  const front = coveredFrontEdge(points, openEdge);
  const railings = [];
  const columns = [];
  if (room.railing !== false) {
    for (let i = 0; i < points.length; i++) {
      if (i === openEdge) continue;
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (room.kind !== "canopy" || i !== front) {
        railings.push({
          a,
          b
        });
        continue;
      }
      // Match the centred gate opening of the 3D covered-yard renderer.
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 0.6) {
        railings.push({
          a,
          b
        });
        continue;
      }
      const gateWidth = Math.min(2.4, Math.max(0.9, length * 0.45), Math.max(0.3, length - 0.3));
      const t0 = Math.max(0, (length - gateWidth) / (2 * length));
      const t1 = Math.min(1, 1 - t0);
      railings.push({
        a,
        b: [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]
      }, {
        a: [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
        b
      });
    }
  }
  if (room.kind === "canopy") {
    const size = room.column_size ?? 0.12;
    for (const point of points) columns.push({
      at: point,
      size
    });
  } else {
    const a = points[front];
    const b = points[(front + 1) % points.length];
    const count = Math.min(12, Math.max(0, Math.round(room.columns ?? 2)));
    const size = room.column_size ?? 0.32;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      columns.push({
        at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        size,
        baseSize: size * 1.375
      });
    }
  }
  return {
    railings,
    columns
  };
}