/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/fold.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Shader patch that shows or hides wall parts on the GPU. Geometry carries a "fold" attribute (see
// build.ts); per floor, one bit mask says which wall buckets stand (the others are cut) and another
// which buckets are drawn as glass. Hidden vertices are moved outside the clip volume, so their
// triangles and lines are dropped before rasterising.
//
// Roles: "plain" (lines, window and door parts) only follows standing/cut; "solid" (walls) also leaves
// out glass buckets; "glass" draws only the wall parts of glass buckets, as tinted glass.

/** Covered-room roofs stay translucent, but must remain legible against the dark outdoor canvas. */
export const COVERED_ROOF_BRIGHTNESS = 1.35;
export const COVERED_ROOF_ALPHA = 0.78;
/** Corrugated yard roofs stay readable while exposing devices below them in the whole-house view. */
export const CANOPY_ROOF_ALPHA = 0.42;
export function makeFoldable(material, masks, role = "plain") {
  material.onBeforeCompile = shader => {
    shader.uniforms.uStanding = masks.standing;
    shader.uniforms.uGlass = masks.glass;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nattribute float fold;\nuniform int uStanding;\nuniform int uGlass;\nvarying float vFp3dCanopy;").replace("#include <project_vertex>", `#include <project_vertex>
      {
        vFp3dCanopy = 0.0;
        bool fp3dShow = ${role === "glass" || role === "roof" ? "false" : "true"};
        if (fold > -0.5) {
          int fp3dFold = int(fold + 0.5);
          int fp3dKind = fp3dFold / 16;
          int fp3dBucket = fp3dFold - fp3dKind * 16;
          vFp3dCanopy = fp3dKind == 5 ? 1.0 : 0.0;
          bool fp3dStanding = ((uStanding >> fp3dBucket) & 1) == 1;
          bool fp3dGlass = ((uGlass >> fp3dBucket) & 1) == 1;
          // kinds: 0 upper part, 1 cut edge, 2 lower part, 3 cap, 4 upper furniture, 5 canopy roof
          fp3dShow = fp3dKind == 0 || fp3dKind == 4 || fp3dKind == 5 ? fp3dStanding : fp3dKind == 1 || fp3dKind == 3 ? !fp3dStanding : true;
          bool fp3dWall = fp3dKind == 0 || fp3dKind == 2;
          ${role === "solid" ? "if ((fp3dGlass && fp3dWall) || (fp3dBucket == 15 && (fp3dKind == 0 || fp3dKind == 5))) fp3dShow = false;" : ""}
          ${role === "glass" ? "fp3dShow = fp3dShow && fp3dGlass && fp3dWall;" : ""}
          ${role === "roof" ? "fp3dShow = fp3dShow && fp3dBucket == 15 && (fp3dKind == 0 || fp3dKind == 5);" : ""}
        }
        if (!fp3dShow) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }`);
    if (role === "glass") {
      // dark walls become a faint cyan-tinted glass
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb = diffuseColor.rgb * 1.7 + vec3(0.015, 0.05, 0.075);
        diffuseColor.a *= 0.2;`);
    } else if (role === "roof") {
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vFp3dCanopy;").replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb *= ${COVERED_ROOF_BRIGHTNESS.toFixed(2)};
        diffuseColor.a *= mix(${COVERED_ROOF_ALPHA.toFixed(2)}, ${CANOPY_ROOF_ALPHA.toFixed(2)}, vFp3dCanopy);`);
    }
  };
  material.customProgramCacheKey = () => `fp3d-fold-${role}`;
  return material;
}