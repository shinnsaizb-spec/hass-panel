/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/editor-view.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
/** Convert a point in plan coordinates to CSS pixels inside the plan SVG. */
export function planToScreen(view, x, z) {
  return [x * view.scale + view.ox, z * view.scale + view.oy];
}

/** Convert CSS pixels inside the plan SVG back to plan coordinates. */
export function screenToPlan(view, sx, sy) {
  return [(sx - view.ox) / view.scale, (sy - view.oy) / view.scale];
}

/** Zoom without moving the plan point currently under the pointer. */
export function zoomPlanAt(view, factor, sx, sy) {
  const next = Math.max(8, Math.min(600, view.scale * factor));
  const k = next / view.scale;
  return {
    scale: next,
    ox: sx - (sx - view.ox) * k,
    oy: sy - (sy - view.oy) * k
  };
}