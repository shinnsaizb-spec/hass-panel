/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/editor-navigation.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
/** Stable editor navigation: tools are grouped by the job the user is doing. */

export const EDITOR_TOOL_GROUPS = [{
  key: "room",
  tools: ["rect", "polygon", "covered"]
}, {
  key: "structure",
  tools: ["wall", "opening", "hole", "roof"]
}, {
  key: "layout",
  tools: ["furniture", "outdoor"]
}, {
  key: "energy",
  tools: ["energy"]
}];
/** Properties only make sense while an item is selected; deletion returns to the library. */
export function resolvedFurniturePane(requested, hasSelection) {
  return requested === "properties" && hasSelection ? "properties" : "library";
}