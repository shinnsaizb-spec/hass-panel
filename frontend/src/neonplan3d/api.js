/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/api.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Websocket calls to the backend (custom_components/neonplan3d/websocket.py).

export async function fetchBuilding(hass) {
  return hass.callWS({
    type: "neonplan3d/building/get"
  });
}
export async function saveBuilding(hass, building) {
  const res = await hass.callWS({
    type: "neonplan3d/building/save",
    building
  });
  return res.revision;
}
export function subscribeBuilding(hass, callback) {
  return hass.connection.subscribeMessage(msg => callback(msg.revision), {
    type: "neonplan3d/building/subscribe"
  });
}
export async function fetchImage(hass, imageId) {
  const res = await hass.callWS({
    type: "neonplan3d/image/get",
    image_id: imageId
  });
  return res.data;
}
export async function storeImage(hass, imageId, data) {
  await hass.callWS({
    type: "neonplan3d/image/set",
    image_id: imageId,
    data
  });
}
export async function listHistory(hass) {
  const res = await hass.callWS({
    type: "neonplan3d/history/list"
  });
  return res.snapshots;
}
export async function takeSnapshot(hass) {
  await hass.callWS({
    type: "neonplan3d/history/snapshot"
  });
}
export async function restoreSnapshot(hass, snapshotId) {
  const res = await hass.callWS({
    type: "neonplan3d/history/restore",
    snapshot_id: snapshotId
  });
  return res.revision;
}
export async function listPacks(hass) {
  const res = await hass.callWS({
    type: "neonplan3d/packs/list"
  });
  return res.packs;
}
/** Import a pack file; the backend checks its signature (errors carry a code, e.g. "bad_signature"). */
export async function importPack(hass, text) {
  return hass.callWS({
    type: "neonplan3d/packs/import",
    pack: text
  });
}
export async function removePack(hass, packId) {
  await hass.callWS({
    type: "neonplan3d/packs/remove",
    pack_id: packId
  });
}

/** A bought pack as the shop lists it, with the release installed here (null = not installed). */

/** A pack or Pro add-on in the shop the customer does not own yet. */

/** The customer's loyalty code: a discount on further purchases. */

/** Ids of the offers seen on the extensions page (the tab shows a dot for new ones). */
const SEEN_OFFERS = "neonplan3d.seenOffers";
export function unseenOffers(offers) {
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_OFFERS) ?? "[]");
  } catch {
    // no storage: every offer counts as new for this page
  }
  return offers.filter(o => !seen.includes(o.id));
}
export function markOffersSeen(offers) {
  try {
    localStorage.setItem(SEEN_OFFERS, JSON.stringify(offers.map(o => o.id)));
  } catch {
    // no storage: nothing to remember
  }
}

/** A pack update installed from the shop (shown once on the extensions page). */

const SEEN_UPDATES = "neonplan3d.seenUpdates";
export function unseenUpdates(updates) {
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_UPDATES) ?? "[]");
  } catch {
    // no storage: every update counts as new for this page
  }
  return updates.filter(u => !seen.includes(`${u.id}@${u.release}`));
}
export function markUpdatesSeen(updates) {
  try {
    localStorage.setItem(SEEN_UPDATES, JSON.stringify(updates.map(u => `${u.id}@${u.release}`)));
  } catch {
    // no storage: nothing to remember
  }
}

/** A shop link that brings the loyalty code into the cart. */
export function offerLink(url, loyalty) {
  if (!loyalty) return url;
  return `${url}${url.includes("?") ? "&" : "?"}np_coupon=${encodeURIComponent(loyalty.code)}`;
}

/** The shop connection: this installation's fingerprint, the key's state and the bought packs. */

export function getLicense(hass) {
  return hass.callWS({
    type: "neonplan3d/license/get"
  });
}

/** Bind this installation to a customer key (errors carry the shop's code, e.g. "invalid_key"). */
export function activateLicense(hass, key) {
  return hass.callWS({
    type: "neonplan3d/license/activate",
    key
  });
}
export function removeLicense(hass) {
  return hass.callWS({
    type: "neonplan3d/license/remove"
  });
}
export function refreshLicense(hass) {
  return hass.callWS({
    type: "neonplan3d/license/refresh"
  });
}

/** A full backup file: the plan, the packs with their signatures and every stored picture. */

export function fetchBackup(hass) {
  return hass.callWS({
    type: "neonplan3d/backup/export"
  });
}

/** Replace plan and packs from a backup (pictures follow one by one); packs that fail their check are skipped. */
export function restoreBackup(hass, building, packs) {
  return hass.callWS({
    type: "neonplan3d/backup/import",
    building,
    packs
  });
}

/** Fetch a bought pack from the shop, signed for this installation (also updates it). */
export function installPack(hass, packId) {
  return hass.callWS({
    type: "neonplan3d/packs/install",
    pack_id: packId
  });
}