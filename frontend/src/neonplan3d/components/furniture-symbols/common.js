/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/common.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Shared SVG primitives for built-in top-view furniture symbols.

import { svg } from "lit";
export const rect = (x0, z0, x1, z1, cls = "") => svg`<rect class=${cls} x=${Math.min(x0, x1)} y=${Math.min(z0, z1)} width=${Math.abs(x1 - x0)} height=${Math.abs(z1 - z0)} />`;
export const line = (x0, z0, x1, z1, cls = "") => svg`<line class=${cls} x1=${x0} y1=${z0} x2=${x1} y2=${z1} />`;
export const circle = (x, z, r, cls = "") => svg`<circle class=${cls} cx=${x} cy=${z} r=${r} />`;
export const ellipse = (x, z, rx, rz, cls = "") => svg`<ellipse class=${cls} cx=${x} cy=${z} rx=${rx} ry=${rz} />`;
export function fronts(w, d, n) {
  const out = [];
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + w / n * i;
    out.push(line(x, d / 2, x, d / 2 - Math.min(0.12, d * 0.3)));
  }
  return out;
}
export function seating(w, d, seats, arms) {
  const back = Math.min(0.24, d * 0.28);
  const arm = arms ? Math.min(0.2, w * 0.12) : 0;
  const out = [rect(-w / 2, -d / 2, w / 2, -d / 2 + back, "fp3d-sym-fill")];
  if (arms) out.push(rect(-w / 2, -d / 2, -w / 2 + arm, d / 2, "fp3d-sym-fill"), rect(w / 2 - arm, -d / 2, w / 2, d / 2, "fp3d-sym-fill"));
  const inner = w - 2 * arm;
  for (let i = 1; i < seats; i++) {
    const x = -w / 2 + arm + inner / seats * i;
    out.push(line(x, -d / 2 + back, x, d / 2 - 0.02));
  }
  return out;
}
export function createSymbolRegistry(types, render) {
  return Object.fromEntries(types.map(type => [type, (w, d) => render(type, w, d)]));
}