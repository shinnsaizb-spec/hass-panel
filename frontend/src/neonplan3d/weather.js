/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/weather.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
/**
 * Weather outside the house, read from a `weather.*` entity: how much it rains or snows, fog, cloud
 * cover, wind and lightning, each 0…1, so the 3D view can draw particles, dim the sky and the sun.
 */
import { DEFAULT_WEATHER_EFFECTS } from "./model.js";
/** Home Assistant's weather conditions and what they look like (cloud cover is replaced by the attribute when present). */
const CONDITIONS = {
  "clear-night": {},
  sunny: {},
  partlycloudy: {
    cloud: 0.45
  },
  cloudy: {
    cloud: 0.9
  },
  fog: {
    fog: 1,
    cloud: 0.6
  },
  hail: {
    rain: 0.8,
    cloud: 1
  },
  lightning: {
    lightning: true,
    cloud: 0.9
  },
  "lightning-rainy": {
    rain: 0.8,
    lightning: true,
    cloud: 1
  },
  pouring: {
    rain: 1,
    cloud: 1
  },
  rainy: {
    rain: 0.55,
    cloud: 0.85
  },
  snowy: {
    snow: 0.8,
    cloud: 0.9
  },
  "snowy-rainy": {
    rain: 0.35,
    snow: 0.5,
    cloud: 1
  },
  windy: {
    wind: 0.8,
    cloud: 0.2
  },
  "windy-variant": {
    wind: 0.8,
    cloud: 0.7
  },
  exceptional: {
    cloud: 0.5
  }
};

/** The weather entity to show: the preferred one when it exists, otherwise the first `weather.*`. */
export function weatherEntity(hass, preferred) {
  if (preferred && hass.states[preferred]) return preferred;
  return Object.keys(hass.states).filter(id => id.startsWith("weather.")).sort()[0] ?? null;
}
export function weatherState(hass, entity) {
  const st = entity ? hass.states[entity] : undefined;
  if (!st || st.state === "unavailable" || st.state === "unknown") return null;
  const base = CONDITIONS[st.state];
  if (!base) return null;
  const attrs = st.attributes;
  let cloud = base.cloud ?? 0;
  if (typeof attrs.cloud_coverage === "number") cloud = Math.min(1, Math.max(0, attrs.cloud_coverage / 100));
  let wind = base.wind ?? 0;
  if (typeof attrs.wind_speed === "number") {
    const kmh = attrs.wind_speed_unit === "m/s" ? attrs.wind_speed * 3.6 : attrs.wind_speed_unit === "mph" ? attrs.wind_speed * 1.609 : attrs.wind_speed;
    wind = Math.max(wind, Math.min(1, kmh / 60));
  }
  return {
    entity: st.entity_id,
    condition: st.state,
    rain: base.rain ?? 0,
    snow: base.snow ?? 0,
    fog: base.fog ?? 0,
    cloud,
    wind,
    lightning: !!base.lightning
  };
}

/** Only the chosen effects stay (the others are zeroed); `sky` says whether the sun or moon disc shows. */
export function limitEffects(w, effects) {
  const on = new Set(effects ?? DEFAULT_WEATHER_EFFECTS);
  return {
    ...w,
    rain: on.has("rain") ? w.rain : 0,
    snow: on.has("snow") ? w.snow : 0,
    fog: on.has("fog") ? w.fog : 0,
    cloud: on.has("clouds") ? w.cloud : 0,
    lightning: on.has("lightning") && w.lightning,
    sky: on.has("sky")
  };
}

/** Whether anything moves or dims: the view can skip the weather layer otherwise. */
export function weatherActive(w) {
  return !!w && (w.rain > 0 || w.snow > 0 || w.fog > 0 || w.cloud > 0 || w.lightning);
}