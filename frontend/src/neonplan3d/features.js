/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/features.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
/**
 * Features implemented by this frontend. The public add-ons are enabled by
 * default in this fork; signed packs are still used for optional pack content
 * and hidden feature keys.
 */
import { getPacks } from "./packs.js";
/** The add-ons bundled with and enabled by this fork. */
export const FEATURES = ["camera_cockpit", "weather", "screens", "energy_pro", "sound", "auto_pro"];
/** Features unlocked by a pack but not listed anywhere (exclusive items). */
const HIDDEN = ["fridge_smart"];

/** Whether this frontend knows a feature key at all (an older bundle does not know newer Pro add-ons). */
export function knownFeature(key) {
  return FEATURES.includes(key) || HIDDEN.includes(key);
}

/** The shop page where the Pro pack is sold (German; see shopUrl for the user's language). */
export const PRO_URL = "";
const isGerman = lang => (lang ?? navigator.language).toLowerCase().startsWith("de");

/** The NeonPlan 3D page of the shop in the user's language (?lang= makes the site keep that language). */
/** 本项目不含商店链接（原函数返回 mastershort.de 的商店地址）。 */
export function shopUrl() {
  return "";
}

/** Where each Pro add-on is described in chapter 6 of the manual: German and English slug and anchor. */
const MANUAL_FEATURE = {
  camera_cockpit: {
    de: "pro-erweiterungen/#61-kamera-cockpit",
    en: "pro-add-ons/#61-camera-cockpit"
  },
  weather: {
    de: "pro-erweiterungen/#62-wetter-drau%C3%9Fen",
    en: "pro-add-ons/#62-weather-outside"
  },
  screens: {
    de: "pro-erweiterungen/#63-bildschirme-live",
    en: "pro-add-ons/#63-live-screens"
  },
  energy_pro: {
    de: "pro-erweiterungen/#64-energie-pro",
    en: "pro-add-ons/#64-energy-pro"
  },
  sound: {
    de: "pro-erweiterungen/#65-klang-kino",
    en: "pro-add-ons/#65-sound-cinema"
  },
  auto_pro: {
    de: "pro-erweiterungen/#66-auto-pro",
    en: "pro-add-ons/#66-auto-pro"
  },
  extensions: {
    de: "erweiterungen-shop-moebel-packs/",
    en: "extensions-shop-furniture-packs/"
  }
};

/** The manual maintained in this fork, optionally at a Pro add-on's section or the extensions chapter. */
/** 不再外链到上游手册。 */
export function manualUrl() {
  return "";
}
export function unlockedFeatures(packs = getPacks()) {
  const out = new Set(FEATURES);
  for (const p of packs) for (const f of p.features ?? []) if (FEATURES.includes(f) || HIDDEN.includes(f)) out.add(f);
  return out;
}
export function hasFeature(feature, packs) {
  return unlockedFeatures(packs).has(feature);
}