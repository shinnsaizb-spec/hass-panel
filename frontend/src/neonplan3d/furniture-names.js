/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/furniture-names.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Display names of furniture types, built-in or from packs (kept out of packs.ts, which the 3D
// bundle uses without the UI strings).

import { translate } from "./i18n.js";
import { isPackType, packItem, packItemName } from "./packs.js";
/** Display name of any furniture type; furniture of a removed pack says so. */
export function furnitureName(hass, type) {
  if (!isPackType(type)) return translate(hass, `furn_${type}`);
  const item = packItem(type);
  return item ? packItemName(item, hass?.language ?? navigator.language) : translate(hass, "pack_missing_item");
}