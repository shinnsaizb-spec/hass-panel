/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/furniture/catalog.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Inventory view of the built-in furniture library. The existing exports stay in model.ts for
// compatibility; this module is the first migration step towards one declarative catalog. It gives
// tests, reports and future renderers one typed place to inspect every id, size and library group.

import { FURNITURE_GROUPS, FURNITURE_SIZE, FURNITURE_TYPES } from "./metadata.js";
/** Built-in types intentionally kept outside the normal library. */
export const HIDDEN_FURNITURE_TYPES = ["inverter", "home_battery", "wallbox", "meter", "grid_point", "fridge_smart", "stairwell"];

/** Catalog entries that modify building geometry instead of drawing a standalone 3D object. */
export const STRUCTURAL_ONLY_FURNITURE_TYPES = ["stairwell"];

/** Public pack categories and counts shown by the original project; used only as a coverage target. */
export const REFERENCE_PACK_TARGETS = {
  home_cinema: 35,
  utility: 18,
  pets: 24,
  architecture: 17,
  living: 69,
  kitchen: 66,
  bedroom: 41,
  bathroom: 37,
  kids: 18,
  office: 25,
  garden: 33,
  garage: 17,
  fitness: 17,
  smart_home: 30,
  vehicles: 15,
  stairs: 12
};
/**
 * Primary functional home for every current library item in the 16-category expansion plan. This
 * differs from the editor groups: an item may be discoverable in several UI groups, but is counted
 * exactly once here so progress cannot be inflated.
 */
export const REFERENCE_PACK_ITEMS = {
  home_cinema: ["tv_board", "tv_wall", "smart_speaker", "cinema_screen_wall", "cinema_screen_roller", "cinema_projector_ceiling", "cinema_projector_table", "cinema_speaker_tower", "cinema_speaker_bookshelf", "cinema_speaker_center", "cinema_subwoofer", "cinema_soundbar", "cinema_speaker_wall", "cinema_speaker_ceiling", "cinema_av_receiver", "cinema_tv_oled_65", "cinema_tv_oled_85", "cinema_projector_ust", "cinema_screen_floor_rising", "cinema_turntable", "cinema_vinyl_shelf", "cinema_game_console", "cinema_hifi_rack", "cinema_chair", "cinema_chair_row_3", "cinema_acoustic_panel", "cinema_bass_trap_corner", "cinema_popcorn_machine", "lamp_cinema_star_ceiling", "cinema_surround_speaker_stand", "cinema_speaker_inwall", "cinema_media_streamer", "cinema_bluray_player", "cinema_stereo_amplifier", "cinema_headphone_stand"],
  utility: ["radiator", "air_conditioner", "water_pump", "water_heater", "drying_rack", "water_purifier", "air_purifier", "water_tank", "washer", "dryer", "washer_dryer_tower", "balcony_solar", "electrical_panel", "ups_unit", "heat_pump_outdoor", "hot_water_tank", "ventilation_fan", "humidifier"],
  pets: ["cat_tree_large", "cat_scratching_post", "cat_scratch_board_wall", "cat_cave", "cat_bed_round", "cat_wall_perch", "cat_climbing_steps_wall", "litter_box_hood", "litter_box_self_cleaning", "dog_bed", "dog_basket", "dog_house", "pet_bowls", "pet_feeder_automatic", "pet_water_fountain", "pet_gate", "pet_stairs", "hamster_cage", "small_animal_cage", "rabbit_enclosure_outdoor", "bird_cage", "aquarium_100", "aquarium_240_cabinet", "terrarium"],
  architecture: ["room_divider", "shower_screen", "smart_curtain", "column_round", "column_square", "column_steel", "ceiling_beams", "downstand_beam", "chimney_inside", "fireplace_builtin", "sliding_wall", "builtin_shelf_niche", "led_niche", "light_cove", "platform_steps", "gallery_railing_glass", "window_seat"],
  living: ["altar", "altar_table", "altar_cabinet", "altar_wall", "shoe_cabinet", "shoe_bench", "sofa", "sofa_2", "sofa_3", "sofa_4", "sofa_l", "sofa_corner_left", "sofa_corner_right", "sofa_chesterfield", "sofa_velvet_3", "sofa_modular_5", "sofa_armless", "sofa_chaise", "sofa_u", "sofa_bed", "chaise_longue", "armchair", "club_chair", "cocktail_chair", "wingback_chair", "recliner", "rocking_chair", "bean_bag", "ottoman", "stool", "chair_upholstered", "chair_shell", "coffee_table", "coffee_table_round", "coffee_table_glass", "nesting_tables", "side_table_round", "console_table", "table_120", "table_160", "table_200", "table_solid_220", "bench_dining_160", "tv_console", "lowboard_120", "lowboard_160", "lowboard_200", "tv_stand", "sideboard", "highboard", "chest_drawers_3", "display_cabinet", "shelf", "bookshelf_wide", "cube_shelf_2x2", "cube_shelf_4x2", "cube_shelf_4x4", "room_divider_shelf", "floating_shelf", "wood_stove", "plant", "rug", "coat_rack", "media_wall_tv", "piano_upright", "vase_pampas", "plant_monstera", "rug_round", "fireplace_wall_electric"],
  kitchen: ["range_hood", "microwave", "kitchen_corner", "kitchen_display", "table", "table_round", "chair", "bench", "corner_bench", "bar_stool", "kitchen", "kitchen_wall", "kitchen_tall", "island", "worktop", "sink", "stove", "dishwasher", "fridge", "kitchen_coffee_machine", "kitchen_wine_fridge", "kitchen_island_bar", "kitchen_recycling_station", "kitchen_pantry_pullout", "kitchen_corner_carousel", "kitchen_oven_tower", "kitchen_open_shelf", "kitchen_spice_rack_wall", "kitchen_cart", "kitchen_plate_rack_wall", "kitchen_freezer"],
  bedroom: ["vanity", "bed_single", "bed_double", "bed", "nightstand", "wardrobe", "dresser", "bed_90", "bed_140", "bed_160", "bed_180", "bed_200", "bed_upholstered_180", "bed_boxspring_180", "bed_futon_160", "wardrobe_2door", "wardrobe_3door", "wardrobe_4door", "wardrobe_6door", "wardrobe_mirror", "wardrobe_corner", "nightstand_drawer", "nightstand_slim", "nightstand_floating", "dresser_80_3", "dresser_140_6", "chest_tall_5", "clothes_rail", "bed_canopy", "wardrobe_sliding", "closet_walkin", "vanity_mirror", "bed_bench", "changing_table", "mirror_floor", "chest_tall", "reading_nook", "bed_ambient_180", "wardrobe_light", "alarm_sunrise", "vanity_light"],
  bathroom: ["bathtub", "shower", "wc", "washbasin", "vanity_60", "vanity_80", "vanity_100", "double_vanity_120", "pedestal_basin", "bathtub_builtin", "bathtub_corner", "shower_corner_90", "shower_niche_120", "shower_walkin_140", "toilet_close_coupled", "toilet_wall_hung", "bidet", "bathroom_cabinet_tall", "bathroom_cabinet_mid", "mirror_round_light", "mirror_80_light", "bathroom_wall_shelf", "towel_rail", "bathtub_freestanding", "sauna", "towel_radiator", "whirlpool_indoor", "washing_machine_cabinet", "laundry_basket", "ladder_shelf_towels", "mirror_cabinet_light", "electric_towel_heater", "bathroom_fan", "washer_vanity", "rain_shower_led", "mirror_led_clock", "laundry_cabinet_basket"],
  kids: ["crib", "bunk_bed", "tipi_kids", "play_kitchen_kids", "desk_kids", "toy_shelf_boxes", "cushion_corner_kids", "rocking_horse", "play_rug_road", "table_chairs_kids", "lamp_night_moon", "ball_pit", "bed_house", "baby_monitor", "lamp_star_projector", "changing_dresser", "wardrobe_kids", "toy_boxes_3"],
  office: ["desk", "office_chair", "tall_cabinet", "desk_l", "desk_corner", "desk_sit_stand", "chair_ergonomic", "chair_visitor", "filing_cabinet", "drawer_unit_office", "bookcase_office", "monitor_single", "monitor_dual", "pc_tower", "gaming_chair", "sim_racing_cockpit", "server_rack_42u", "printer_3d_open", "whiteboard_office", "monitor_triple", "arcade_cabinet", "laser_printer", "phone_booth_office", "printer_3d_enclosed", "filament_shelf_wall"],
  garden: ["hammock", "stone_table_set", "planter_large", "gate", "fence", "gas_grill", "lounge_set_outdoor", "sun_lounger", "parasol", "pergola", "raised_bed", "greenhouse", "hot_tub_outdoor", "fire_bowl", "garden_torch", "play_tower_slide", "garden_shed", "trampoline", "flower_pots_3", "lawn_sprinkler", "irrigation_valve_box", "rain_barrel", "garden_lantern", "outdoor_kitchen", "patio_heater", "tree_oak", "tree_lime", "tree_birch", "tree_maple", "tree_fruit", "tree_spruce", "tree_pine", "tree_thuja", "shrub", "shrub_flowering", "brush_wild", "trees_group_3"],
  garage: ["workbench", "workbench_pegboard", "tool_cabinet", "tool_chest", "storage_rack_garage", "wall_shelf_garage", "air_compressor", "shop_vacuum", "ladder_step", "ladder_extension", "storage_boxes", "tire_stack", "bike_rack", "repair_stand", "parts_bin", "utility_sink_garage", "charging_bay"],
  fitness: ["fitness_treadmill", "fitness_power_rack", "fitness_rower", "fitness_spin_bike", "fitness_dumbbell_rack", "fitness_punching_bag", "fitness_yoga_mat", "fitness_cross_trainer", "fitness_mirror_wall", "fitness_ball", "fitness_wall_bars", "fitness_mirror_smart", "fitness_bike_trainer", "fitness_sauna_cabin", "fitness_massage_chair", "fitness_kettlebell_set", "fitness_water_station"],
  smart_home: ["lamp_ceiling", "lamp_downlight", "lamp_spot", "lamp_panel", "lamp_pendant", "lamp_floor", "lamp_table", "lamp_wall", "led_strip", "lamp_uplight", "lamp_bollard", "lamp_garden", "lamp_column", "lamp_tv_bars", "lamp_orb_table", "lamp_portable", "lamp_ambient_spot", "lamp_cube", "lamp_panel_round", "lamp_garden_spots", "lamp_wall_updown", "fan_ceiling", "fan_ceiling_light", "fan_wall", "fan_floor", "security_camera", "smart_lock", "robot_vacuum", "robot_mower", "network_cabinet", "nas_server", "access_point", "wall_thermostat", "smoke_detector", "siren_alarm", "modem_router", "smart_display", "wall_switch", "wall_outlet", "smart_plug", "motion_sensor", "contact_sensor", "water_leak_sensor", "temperature_humidity_sensor", "video_doorbell"],
  vehicles: ["motorbike", "bicycle_city", "bicycle_cargo", "scooter", "motorcycle_touring", "car_sedan", "car_hatchback", "car_suv", "car_pickup", "car_van", "car_wagon", "car_compact", "car_electric", "car_minibus", "parking"],
  stairs: ["stairs", "stairs_landing", "stairs_landing_l", "stairs_winder_l", "stairs_spiral", "stairs_open", "stairs_concrete", "stairs_compact", "railing_glass", "railing_metal", "railing_wood", "railing_cable"]
};
const memberships = new Map();
for (const [group, types] of Object.entries(FURNITURE_GROUPS)) {
  for (const type of types) memberships.set(type, [...(memberships.get(type) ?? []), group]);
}

/** Stable inventory in FURNITURE_TYPES order so reports produce deterministic diffs. */
export const BUILTIN_FURNITURE_CATALOG = FURNITURE_TYPES.map(id => {
  const groups = memberships.get(id) ?? [];
  return Object.freeze({
    id,
    nameKey: `furn_${id}`,
    size: FURNITURE_SIZE[id],
    groups: Object.freeze(groups),
    library: groups.length > 0,
    renderer: id,
    symbol: id
  });
});

/** Fast lookup used by editor, renderer and symbol migration bridges. */
export const BUILTIN_FURNITURE_BY_ID = new Map(BUILTIN_FURNITURE_CATALOG.map(item => [item.id, item]));

/** Editor sections generated from the catalog, rather than read directly from the legacy constants. */
export const FURNITURE_LIBRARY_GROUPS = Object.freeze(Object.fromEntries(Object.keys(FURNITURE_GROUPS).map(group => [group,
// Preserve the established per-section order while resolving every id through the catalog.
Object.freeze(FURNITURE_GROUPS[group].filter(id => BUILTIN_FURNITURE_BY_ID.get(id)?.groups.includes(group)))])));
export function furnitureCatalogEntry(type) {
  return BUILTIN_FURNITURE_BY_ID.get(type);
}
/** Machine-readable counts used by tests and the Markdown inventory report. */
export function furnitureCatalogSummary() {
  const grouped = BUILTIN_FURNITURE_CATALOG.filter(item => item.library);
  const multiGroup = Object.fromEntries(grouped.filter(item => item.groups.length > 1).map(item => [item.id, item.groups]));
  return {
    total: BUILTIN_FURNITURE_CATALOG.length,
    library: grouped.length,
    hidden: BUILTIN_FURNITURE_CATALOG.length - grouped.length,
    memberships: grouped.reduce((sum, item) => sum + item.groups.length, 0),
    groups: Object.fromEntries(Object.entries(FURNITURE_GROUPS).map(([group, types]) => [group, types.length])),
    ungrouped: BUILTIN_FURNITURE_CATALOG.filter(item => !item.library).map(item => item.id),
    multiGroup,
    referencePacks: Object.fromEntries(Object.entries(REFERENCE_PACK_TARGETS).map(([pack, target]) => [pack, {
      current: REFERENCE_PACK_ITEMS[pack].length,
      target
    }]))
  };
}

/** Structural problems that would make the editor, renderer or saved plans disagree. */
export function furnitureCatalogIssues() {
  const issues = [];
  const known = new Set();
  for (const type of FURNITURE_TYPES) {
    if (known.has(type)) issues.push(`duplicate id: ${type}`);
    known.add(type);
    const size = FURNITURE_SIZE[type];
    if (!size || size.length !== 3 || size.some(value => !Number.isFinite(value) || value <= 0)) issues.push(`invalid size: ${type}`);
  }
  for (const type of Object.keys(FURNITURE_SIZE)) if (!known.has(type)) issues.push(`size without type: ${type}`);
  for (const [group, types] of Object.entries(FURNITURE_GROUPS)) {
    if (!types.length) issues.push(`empty group: ${group}`);
    const seen = new Set();
    for (const type of types) {
      if (!known.has(type)) issues.push(`unknown type in ${group}: ${type}`);
      if (seen.has(type)) issues.push(`duplicate type in ${group}: ${type}`);
      seen.add(type);
    }
  }
  const hidden = new Set(HIDDEN_FURNITURE_TYPES);
  const structural = new Set(STRUCTURAL_ONLY_FURNITURE_TYPES);
  for (const item of BUILTIN_FURNITURE_CATALOG) {
    if (item.nameKey !== `furn_${item.id}`) issues.push(`invalid name key: ${item.id}`);
    if (!item.renderer) issues.push(`missing renderer: ${item.id}`);
    if (!item.symbol) issues.push(`missing symbol: ${item.id}`);
    if (!item.library && !hidden.has(item.id)) issues.push(`ungrouped type not declared hidden: ${item.id}`);
    if (item.library && hidden.has(item.id)) issues.push(`hidden type appears in library: ${item.id}`);
  }
  for (const [group, types] of Object.entries(FURNITURE_LIBRARY_GROUPS)) {
    if (types.join("\0") !== FURNITURE_GROUPS[group].join("\0")) issues.push(`catalog group order differs: ${group}`);
  }
  for (const type of hidden) if (!known.has(type)) issues.push(`unknown hidden type: ${type}`);
  for (const type of structural) {
    if (!known.has(type)) issues.push(`unknown structural-only type: ${type}`);
    if (!hidden.has(type)) issues.push(`structural-only type must be hidden: ${type}`);
  }
  const assigned = new Map();
  for (const [pack, types] of Object.entries(REFERENCE_PACK_ITEMS)) {
    for (const type of types) {
      if (!known.has(type)) issues.push(`unknown type in reference pack ${pack}: ${type}`);
      if (hidden.has(type)) issues.push(`hidden type in reference pack ${pack}: ${type}`);
      const previous = assigned.get(type);
      if (previous) issues.push(`type assigned to reference packs ${previous} and ${pack}: ${type}`);else assigned.set(type, pack);
    }
  }
  for (const item of BUILTIN_FURNITURE_CATALOG) if (item.library && !assigned.has(item.id)) issues.push(`library type without reference pack: ${item.id}`);
  return issues;
}

/** Human-readable Phase 0 inventory; generated with `npm run catalog`. */
export function furnitureCatalogMarkdown() {
  const summary = furnitureCatalogSummary();
  const rows = Object.entries(summary.groups).map(([group, count]) => `| ${group} | ${count} |`);
  const packRows = Object.entries(summary.referencePacks).map(([pack, count]) => `| ${pack} | ${count.current} | ${count.target} |`);
  const duplicateRows = Object.entries(summary.multiGroup).map(([id, groups]) => `- \`${id}\`: ${groups.join(", ")}`);
  return ["# Built-in furniture inventory", "", `- Declared types: **${summary.total}**`, `- Library items: **${summary.library}**`, `- Hidden/internal items: **${summary.hidden}**`, `- Group memberships: **${summary.memberships}**`, "", "| Group | Items |", "|---|---:|", ...rows, "", `Hidden/internal: ${summary.ungrouped.map(id => `\`${id}\``).join(", ")}`, "", "Multiple current groups:", ...(duplicateRows.length ? duplicateRows : ["- None"]), "", "## Reference pack coverage", "", "| Pack | Current primary items | Published target |", "|---|---:|---:|", ...packRows, ""].join("\n");
}