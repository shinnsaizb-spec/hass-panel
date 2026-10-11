/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/furniture/filters.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
/** Search form shared by labels and queries; Vietnamese and European accents stay optional. */
export function foldFurnitureText(value) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}
const CEILING = /^(lamp_(ceiling|downlight|spot|panel|panel_round|pendant|cinema_star_ceiling)|fan_ceiling|fan_ceiling_light|access_point|smoke_detector|cinema_projector_ceiling|cinema_speaker_ceiling)$/;
const SURFACE = /^(microwave|kitchen_coffee_machine|modem_router|smart_display|monitor_(single|dual|triple)|printer_3d_(open|enclosed)|laser_printer|baby_monitor|lamp_(table|night_moon|star_projector|orb_table|portable|ambient_spot|cube)|cinema_(projector_table|speaker_bookshelf|speaker_center|soundbar|av_receiver|projector_ust|turntable|media_streamer|bluray_player|stereo_amplifier|headphone_stand))$/;
const WALL = /(_wall$|_wall_|wall_|floating_shelf|nightstand_floating|range_hood|air_conditioner|radiator|security_camera|smart_lock|video_doorbell|electrical_panel|ventilation_fan|motion_sensor|contact_sensor|temperature_humidity_sensor|cinema_(screen_wall|screen_roller|speaker_inwall|acoustic_panel|tv_oled_65|tv_oled_85)|fitness_mirror_smart|filament_shelf_wall|whiteboard_office|cat_(scratch_board_wall|wall_perch|climbing_steps_wall)|kitchen_(open_shelf|spice_rack_wall|plate_rack_wall))/;
const CLASSIC = /(altar|chesterfield|wingback|rocking_chair|piano|solid|canopy|futon|wood|fireplace|vanity|pedestal|vase_pampas)/;
const NATURAL = /(plant|tree|shrub|brush|garden|outdoor|flower|planter|raised_bed|greenhouse|rain_barrel|pergola|hammock|stone|wood|rug|pet|rabbit|bird|aquarium|terrarium)/;
const TECHNICAL = /(smart|sensor|camera|monitor|printer|server|network|router|electrical|ups|solar|inverter|battery|wallbox|meter|fitness|cinema|speaker|projector|screen|vehicle|car_|motor|bicycle|scooter|garage|workbench|tool|compressor|vacuum|charging|fridge|freezer|stove|oven|microwave|coffee|washer|dryer|dishwasher|heater|pump|fan|air_conditioner|thermostat)/;
const MOTION = /^(fan_|robot_|smart_curtain|bathroom_fan|fitness_(treadmill|rower|spin_bike|cross_trainer|bike_trainer|massage_chair)|cinema_turntable)/;
export function builtinFurnitureMount(type) {
  if (CEILING.test(type)) return "ceiling";
  if (SURFACE.test(type)) return "surface";
  if (WALL.test(type)) return "wall";
  return "floor";
}
export function furnitureFilterTraits(type, group, flags = {}) {
  const capabilities = new Set();
  if (flags.light) capabilities.add("light");
  if (flags.screen) capabilities.add("screen");
  if (flags.electric) capabilities.add("power");
  if (MOTION.test(type)) capabilities.add("motion");
  if (!capabilities.size) capabilities.add("static");
  const styles = new Set(["modern"]);
  if (CLASSIC.test(type)) styles.add("classic");
  if (NATURAL.test(type) || group === "outdoor" || group === "pets") styles.add("natural");
  if (TECHNICAL.test(type) || ["climate", "fitness", "cinema", "vehicles"].includes(group)) styles.add("technical");
  return {
    group,
    mount: flags.mount ?? builtinFurnitureMount(type),
    capabilities,
    styles
  };
}
export function matchesFurnitureFilters(traits, filters) {
  return (filters.group === "all" || traits.group === filters.group) && (filters.mount === "all" || traits.mount === filters.mount) && (filters.capability === "all" || traits.capabilities.has(filters.capability)) && (filters.style === "all" || traits.styles.has(filters.style));
}