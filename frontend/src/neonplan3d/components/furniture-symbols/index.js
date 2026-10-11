/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/index.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { ARCHITECTURE_OUTDOOR_FURNITURE_SYMBOLS } from "./architecture-outdoor.js";
import { ARCHITECTURE_FURNITURE_SYMBOLS } from "./architecture.js";
import { BEDROOM_FURNITURE_SYMBOLS } from "./bedroom.js";
import { BATHROOM_FURNITURE_SYMBOLS } from "./bathroom.js";
import { CLIMATE_FURNITURE_SYMBOLS } from "./climate.js";
import { CINEMA_FURNITURE_SYMBOLS } from "./cinema.js";
import { EVERYDAY_FURNITURE_SYMBOLS } from "./everyday.js";
import { FITNESS_FURNITURE_SYMBOLS } from "./fitness.js";
import { GARDEN_FURNITURE_SYMBOLS } from "./garden.js";
import { GARAGE_FURNITURE_SYMBOLS } from "./garage.js";
import { KITCHEN_BATH_FURNITURE_SYMBOLS } from "./kitchen-bath.js";
import { KIDS_FURNITURE_SYMBOLS } from "./kids.js";
import { LIGHTING_FURNITURE_SYMBOLS } from "./lighting.js";
import { OFFICE_FURNITURE_SYMBOLS } from "./office.js";
import { PET_FURNITURE_SYMBOLS } from "./pets.js";
import { LIVING_FURNITURE_SYMBOLS } from "./living.js";
import { SMART_HOME_FURNITURE_SYMBOLS } from "./smart-home.js";
import { STAIR_FURNITURE_SYMBOLS } from "./stairs.js";
import { UTILITY_FURNITURE_SYMBOLS } from "./utility.js";
import { VEHICLE_FURNITURE_SYMBOLS } from "./vehicles.js";
const BUILTIN_FURNITURE_SYMBOLS = {
  ...EVERYDAY_FURNITURE_SYMBOLS,
  ...FITNESS_FURNITURE_SYMBOLS,
  ...BEDROOM_FURNITURE_SYMBOLS,
  ...LIVING_FURNITURE_SYMBOLS,
  ...KITCHEN_BATH_FURNITURE_SYMBOLS,
  ...KIDS_FURNITURE_SYMBOLS,
  ...BATHROOM_FURNITURE_SYMBOLS,
  ...ARCHITECTURE_OUTDOOR_FURNITURE_SYMBOLS,
  ...ARCHITECTURE_FURNITURE_SYMBOLS,
  ...GARDEN_FURNITURE_SYMBOLS,
  ...GARAGE_FURNITURE_SYMBOLS,
  ...CLIMATE_FURNITURE_SYMBOLS,
  ...CINEMA_FURNITURE_SYMBOLS,
  ...SMART_HOME_FURNITURE_SYMBOLS,
  ...STAIR_FURNITURE_SYMBOLS,
  ...LIGHTING_FURNITURE_SYMBOLS,
  ...OFFICE_FURNITURE_SYMBOLS,
  ...PET_FURNITURE_SYMBOLS,
  ...UTILITY_FURNITURE_SYMBOLS,
  ...VEHICLE_FURNITURE_SYMBOLS
};
export function registeredFurnitureSymbol(type, w, d) {
  const renderer = BUILTIN_FURNITURE_SYMBOLS[type];
  return renderer ? renderer(w, d) : null;
}
export { BUILTIN_FURNITURE_SYMBOLS };