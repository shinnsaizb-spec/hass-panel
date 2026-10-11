/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/index.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { ARCHITECTURE_OUTDOOR_FURNITURE_MODELS } from "./architecture-outdoor.js";
import { ARCHITECTURE_FURNITURE_MODELS, ARCHITECTURE_FURNITURE_SCREENS } from "./architecture.js";
import { BEDROOM_FURNITURE_MODELS, BEDROOM_FURNITURE_SCREENS } from "./bedroom.js";
import { BATHROOM_FURNITURE_MODELS, BATHROOM_FURNITURE_SCREENS } from "./bathroom.js";
import { CLIMATE_FURNITURE_MODELS } from "./climate.js";
import { CINEMA_FURNITURE_MODELS, CINEMA_FURNITURE_SCREENS } from "./cinema.js";
import { ENERGY_FURNITURE_MODELS } from "./energy.js";
import { EVERYDAY_FURNITURE_MODELS, EVERYDAY_FURNITURE_SCREENS } from "./everyday.js";
import { FITNESS_FURNITURE_MODELS, FITNESS_FURNITURE_SCREENS } from "./fitness.js";
import { GARDEN_FURNITURE_MODELS } from "./garden.js";
import { GARAGE_FURNITURE_MODELS } from "./garage.js";
import { KITCHEN_BATH_FURNITURE_MODELS } from "./kitchen-bath.js";
import { KIDS_FURNITURE_MODELS, KIDS_FURNITURE_SCREENS } from "./kids.js";
import { LIVING_FURNITURE_MODELS, LIVING_FURNITURE_SCREENS } from "./living.js";
import { MISC_FURNITURE_MODELS } from "./misc.js";
import { OFFICE_FURNITURE_MODELS, OFFICE_FURNITURE_SCREENS } from "./office.js";
import { PET_FURNITURE_MODELS } from "./pets.js";
import { SMART_HOME_FURNITURE_MODELS } from "./smart-home.js";
import { STAIR_FURNITURE_MODELS } from "./stairs.js";
import { UTILITY_FURNITURE_MODELS, UTILITY_FURNITURE_SCREENS } from "./utility.js";
import { VEHICLE_FURNITURE_MODELS } from "./vehicles.js";
/** Built-in renderers split by functional family. Add new families to this one composition point. */
const BUILTIN_FURNITURE_MODELS = {
  ...EVERYDAY_FURNITURE_MODELS,
  ...FITNESS_FURNITURE_MODELS,
  ...BEDROOM_FURNITURE_MODELS,
  ...LIVING_FURNITURE_MODELS,
  ...KITCHEN_BATH_FURNITURE_MODELS,
  ...KIDS_FURNITURE_MODELS,
  ...BATHROOM_FURNITURE_MODELS,
  ...ARCHITECTURE_OUTDOOR_FURNITURE_MODELS,
  ...ARCHITECTURE_FURNITURE_MODELS,
  ...GARDEN_FURNITURE_MODELS,
  ...GARAGE_FURNITURE_MODELS,
  ...CLIMATE_FURNITURE_MODELS,
  ...CINEMA_FURNITURE_MODELS,
  ...SMART_HOME_FURNITURE_MODELS,
  ...STAIR_FURNITURE_MODELS,
  ...ENERGY_FURNITURE_MODELS,
  ...MISC_FURNITURE_MODELS,
  ...OFFICE_FURNITURE_MODELS,
  ...PET_FURNITURE_MODELS,
  ...UTILITY_FURNITURE_MODELS,
  ...VEHICLE_FURNITURE_MODELS
};
const BUILTIN_FURNITURE_SCREENS = {
  ...ARCHITECTURE_FURNITURE_SCREENS,
  ...BATHROOM_FURNITURE_SCREENS,
  ...BEDROOM_FURNITURE_SCREENS,
  ...EVERYDAY_FURNITURE_SCREENS,
  ...FITNESS_FURNITURE_SCREENS,
  ...CINEMA_FURNITURE_SCREENS,
  ...KIDS_FURNITURE_SCREENS,
  ...LIVING_FURNITURE_SCREENS,
  ...OFFICE_FURNITURE_SCREENS,
  ...UTILITY_FURNITURE_SCREENS
};

/** Null means the legacy renderer owns this type; otherwise the result says whether to add a shadow. */
export function renderRegisteredFurniture(type, context) {
  const renderer = BUILTIN_FURNITURE_MODELS[type];
  return renderer ? renderer(context) : null;
}

/** Undefined means the legacy screen registry owns the type; null means this model has no screen. */
export function registeredFurnitureScreen(type, w, d, h) {
  const renderer = BUILTIN_FURNITURE_SCREENS[type];
  return renderer ? renderer(w, d, h) : undefined;
}
export { BUILTIN_FURNITURE_MODELS, BUILTIN_FURNITURE_SCREENS };