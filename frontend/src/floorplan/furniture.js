// ==============================================================================
// 家具的显示名 / 分类标签
// ------------------------------------------------------------------------------
// 家具的**类型表本身**（FURNITURE_GROUPS / FURNITURE_SIZE / FURNITURE_TYPES）在
// `floorplan3d/vendor/furniture/metadata.js` 里（从 3D 引擎移植过来的，约 500 种）。
// 那个文件属于引擎、体积也不小，所以**不要在首屏静态 import** ——
// 编辑页是打开「家具」工具时才动态加载它的。
//
// 这个文件只放**纯文案**，不依赖引擎，可以随便静态引。
// ==============================================================================

/** 分类的中文名（key 与引擎的 FURNITURE_GROUPS 一一对应） */
export const FURNITURE_GROUP_LABELS = {
  lights: '灯具',
  living: '客厅',
  dining: '餐厅',
  kitchen: '厨房',
  sleeping: '卧室',
  bath: '卫浴',
  climate: '暖通家电',
  outdoor: '户外庭院',
  work: '办公 / 车库',
  pets: '宠物',
  fitness: '健身',
  cinema: '影音',
  vehicles: '车辆',
};

/**
 * 常用家具的中文名。
 * 没收录的（冷门型号）会退回「把类型名美化一下」的结果，所以这里不用追求全覆盖。
 */
const NAMES = {
  // ---- 灯具 ----
  lamp_ceiling: '吸顶灯', lamp_downlight: '筒灯', lamp_spot: '射灯', lamp_panel: '平板灯',
  lamp_panel_round: '圆形平板灯', lamp_pendant: '吊灯', lamp_floor: '落地灯', lamp_table: '台灯',
  lamp_wall: '壁灯', lamp_wall_updown: '上下照壁灯', lamp_uplight: '上照灯', lamp_column: '灯柱',
  lamp_bollard: '草坪灯', lamp_garden: '庭院灯', lamp_garden_spots: '庭院射灯组', led_strip: '灯带',
  lamp_tv_bars: '电视背光', lamp_orb_table: '球形台灯', lamp_portable: '便携灯', lamp_cube: '方块灯',
  lamp_ambient_spot: '氛围射灯', lamp_night_moon: '月亮小夜灯', lamp_star_projector: '星空投影灯',
  lamp_cinema_star_ceiling: '星空顶',
  // ---- 客厅 ----
  sofa: '沙发', sofa_2: '双人沙发', sofa_3: '三人沙发', sofa_4: '四人沙发', sofa_l: 'L 形沙发',
  sofa_corner_left: '转角沙发(左)', sofa_corner_right: '转角沙发(右)', sofa_chesterfield: '切斯特菲尔德沙发',
  sofa_velvet_3: '丝绒三人沙发', sofa_modular_5: '模块沙发(5件)', sofa_armless: '无扶手沙发',
  sofa_chaise: '贵妃沙发', sofa_u: 'U 形沙发', sofa_bed: '沙发床', chaise_longue: '贵妃躺椅',
  armchair: '单人扶手椅', club_chair: '俱乐部椅', cocktail_chair: '休闲椅', wingback_chair: '高背椅',
  recliner: '躺椅(可调)', rocking_chair: '摇椅', bean_bag: '懒人沙发', ottoman: '脚凳',
  stool: '圆凳', chair_upholstered: '软包椅', chair_shell: '贝壳椅',
  coffee_table: '茶几', coffee_table_round: '圆茶几', coffee_table_glass: '玻璃茶几',
  nesting_tables: '套几', side_table_round: '圆边几', console_table: '玄关桌',
  tv_console: '电视柜', tv_board: '电视柜', tv_wall: '壁挂电视', tv_stand: '电视架',
  media_wall_tv: '电视背景墙', lowboard_120: '矮柜 120', lowboard_160: '矮柜 160', lowboard_200: '矮柜 200',
  sideboard: '餐边柜', highboard: '高柜', chest_drawers_3: '三斗柜', display_cabinet: '展示柜',
  shelf: '置物架', bookshelf_wide: '宽书架', cube_shelf_2x2: '格子柜 2×2', cube_shelf_4x2: '格子柜 4×2',
  cube_shelf_4x4: '格子柜 4×4', room_divider_shelf: '隔断架', floating_shelf: '壁挂搁板',
  builtin_shelf_niche: '嵌入式壁龛', window_seat: '飘窗坐凳', room_divider: '隔断屏风',
  sliding_wall: '推拉隔断', wood_stove: '壁炉(烧柴)', fireplace_builtin: '嵌入式壁炉',
  fireplace_wall_electric: '电壁炉', piano_upright: '立式钢琴', vase_pampas: '芦苇花瓶',
  plant: '盆栽', plant_monstera: '龟背竹', rug: '地毯', rug_round: '圆地毯',
  altar: '神龛', altar_table: '供桌', altar_cabinet: '供柜', altar_wall: '壁挂神龛',
  smart_display: '智能屏', smart_speaker: '智能音箱', smart_curtain: '智能窗帘',
  // ---- 餐厅 ----
  table: '餐桌', table_120: '餐桌 120', table_160: '餐桌 160', table_200: '餐桌 200',
  table_solid_220: '实木餐桌 220', table_round: '圆餐桌', chair: '餐椅', bench: '长凳',
  bench_dining_160: '餐凳 160', corner_bench: '转角卡座', bar_stool: '吧台凳',
  // ---- 厨房 ----
  kitchen: '橱柜', kitchen_corner: '转角橱柜', kitchen_wall: '吊柜', kitchen_tall: '高柜',
  kitchen_display: '展示柜', island: '中岛台', worktop: '台面', sink: '水槽', stove: '灶台',
  range_hood: '抽油烟机', microwave: '微波炉', water_purifier: '净水器', dishwasher: '洗碗机',
  fridge: '冰箱', fridge_smart: '智能冰箱', kitchen_coffee_machine: '咖啡机',
  kitchen_wine_fridge: '酒柜', kitchen_island_bar: '岛台吧台', kitchen_recycling_station: '垃圾分类柜',
  kitchen_pantry_pullout: '高柜拉篮', kitchen_corner_carousel: '转角拉篮', kitchen_oven_tower: '烤箱高柜',
  kitchen_open_shelf: '开放式置物架', kitchen_spice_rack_wall: '壁挂调料架', kitchen_cart: '推车',
  kitchen_plate_rack_wall: '壁挂盘架', kitchen_freezer: '冷柜',
  // ---- 卧室 ----
  bed: '床', bed_single: '单人床', bed_double: '双人床', bed_90: '床 90', bed_140: '床 140',
  bed_160: '床 160', bed_180: '床 180', bed_200: '床 200', bed_upholstered_180: '软包床 180',
  bed_boxspring_180: '弹簧床 180', bed_futon_160: '榻榻米床 160', bed_ambient_180: '氛围床 180',
  bed_canopy: '架子床', bunk_bed: '上下铺', bed_house: '房子儿童床',
  wardrobe: '衣柜', wardrobe_2door: '两门衣柜', wardrobe_3door: '三门衣柜', wardrobe_4door: '四门衣柜',
  wardrobe_6door: '六门衣柜', wardrobe_mirror: '带镜衣柜', wardrobe_corner: '转角衣柜',
  wardrobe_sliding: '推拉门衣柜', wardrobe_kids: '儿童衣柜', closet_walkin: '衣帽间',
  nightstand: '床头柜', nightstand_drawer: '抽屉床头柜', nightstand_slim: '窄床头柜',
  nightstand_floating: '悬空床头柜', dresser: '梳妆台', dresser_80_3: '斗柜 80', dresser_140_6: '斗柜 140',
  chest_tall: '高斗柜', chest_tall_5: '五斗柜', clothes_rail: '挂衣架', vanity: '梳妆台',
  vanity_mirror: '带镜梳妆台', mirror_floor: '穿衣镜', bed_bench: '床尾凳',
  reading_nook: '阅读角', changing_table: '婴儿换尿布台', changing_dresser: '婴儿尿布柜',
  crib: '婴儿床', baby_monitor: '婴儿监视器', toy_boxes_3: '玩具收纳箱',
  wardrobe_light: '衣柜灯', alarm_sunrise: '日出唤醒灯', vanity_light: '梳妆灯',
  // ---- 卫浴 ----
  bathtub: '浴缸', bathtub_builtin: '嵌入式浴缸', bathtub_corner: '转角浴缸',
  bathtub_freestanding: '独立浴缸', whirlpool_indoor: '按摩浴缸', shower: '淋浴',
  shower_corner_90: '转角淋浴房', shower_niche_120: '淋浴房 120', shower_walkin_140: '无障碍淋浴 140',
  shower_screen: '淋浴隔断', rain_shower_led: '带灯顶喷', wc: '马桶',
  toilet_close_coupled: '连体马桶', toilet_wall_hung: '壁挂马桶', bidet: '妇洗器',
  washbasin: '洗手盆', pedestal_basin: '立柱盆', vanity_60: '浴室柜 60', vanity_80: '浴室柜 80',
  vanity_100: '浴室柜 100', double_vanity_120: '双盆浴室柜 120', bathroom_cabinet_tall: '浴室高柜',
  bathroom_cabinet_mid: '浴室中柜', bathroom_wall_shelf: '浴室壁架', mirror_round_light: '圆镜(带灯)',
  mirror_80_light: '镜子 80(带灯)', mirror_cabinet_light: '镜柜(带灯)', mirror_led_clock: 'LED 时钟镜',
  towel_rail: '毛巾杆', towel_radiator: '毛巾加热架', electric_towel_heater: '电热毛巾架',
  bathroom_fan: '浴室排风扇', sauna: '桑拿房', laundry_basket: '脏衣篮',
  laundry_cabinet_basket: '洗衣篮柜', ladder_shelf_towels: '毛巾梯架',
  washer: '洗衣机', dryer: '烘干机', washer_dryer_tower: '洗烘套装',
  washer_vanity: '洗衣机一体柜', washing_machine_cabinet: '洗衣机柜',
  // ---- 暖通家电 ----
  radiator: '暖气片', air_conditioner: '空调', water_pump: '水泵', water_heater: '热水器',
  water_tank: '水箱', fan_ceiling: '吊扇', fan_ceiling_light: '吊扇灯', fan_wall: '壁扇', fan_floor: '落地扇',
  drying_rack: '晾衣架', air_purifier: '空气净化器', humidifier: '加湿器',
  ventilation_fan: '换气扇', heat_pump_outdoor: '热泵外机', hot_water_tank: '热水罐',
  // ---- 智能家居 ----
  security_camera: '摄像头', smart_lock: '智能门锁', network_cabinet: '弱电箱', nas_server: 'NAS',
  access_point: '无线 AP', wall_thermostat: '温控面板', smoke_detector: '烟雾报警器',
  siren_alarm: '声光报警器', electrical_panel: '配电箱', ups_unit: 'UPS', modem_router: '光猫路由',
  smart_plug: '智能插座', wall_switch: '墙壁开关', wall_outlet: '墙壁插座',
  motion_sensor: '人体传感器', contact_sensor: '门窗传感器', water_leak_sensor: '水浸传感器',
  temperature_humidity_sensor: '温湿度传感器', video_doorbell: '可视门铃',
  robot_vacuum: '扫地机器人', robot_mower: '割草机器人',
  inverter: '逆变器', home_battery: '家用电池', wallbox: '充电桩', meter: '电表', grid_point: '并网点',
  // ---- 户外 ----
  stone_table_set: '石桌凳', planter_large: '大花箱', gate: '大门', fence: '围栏',
  gas_grill: '燃气烤炉', lounge_set_outdoor: '户外休闲套装', sun_lounger: '躺椅(户外)',
  parasol: '遮阳伞', pergola: '凉棚', raised_bed: '抬高花床', greenhouse: '温室',
  hot_tub_outdoor: '户外泡池', fire_bowl: '火盆', garden_torch: '庭院火把',
  play_tower_slide: '儿童滑梯塔', garden_shed: '工具房', trampoline: '蹦床',
  flower_pots_3: '花盆组', lawn_sprinkler: '草坪喷头', irrigation_valve_box: '灌溉阀箱',
  rain_barrel: '雨水桶', garden_lantern: '庭院灯', outdoor_kitchen: '户外厨房',
  patio_heater: '户外取暖器', hammock: '吊床', balcony_solar: '阳台光伏',
  tree_oak: '橡树', tree_lime: '椴树', tree_birch: '白桦', tree_maple: '枫树', tree_fruit: '果树',
  tree_spruce: '云杉', tree_pine: '松树', tree_thuja: '侧柏', shrub: '灌木',
  shrub_flowering: '开花灌木', brush_wild: '野生草丛', trees_group_3: '树丛(3棵)',
  // ---- 办公 / 车库 ----
  desk: '书桌', desk_l: 'L 形书桌', desk_corner: '转角书桌', desk_sit_stand: '升降桌',
  desk_kids: '儿童书桌', office_chair: '办公椅', chair_ergonomic: '人体工学椅',
  chair_visitor: '访客椅', gaming_chair: '电竞椅', tall_cabinet: '高柜', coat_rack: '衣帽架',
  filing_cabinet: '文件柜', drawer_unit_office: '抽屉柜', bookcase_office: '书柜',
  monitor_single: '显示器', monitor_dual: '双显示器', monitor_triple: '三显示器', pc_tower: '主机',
  sim_racing_cockpit: '赛车模拟座舱', server_rack_42u: '42U 机柜', printer_3d_open: '3D 打印机(敞开)',
  printer_3d_enclosed: '3D 打印机(封闭)', filament_shelf_wall: '耗材壁架', whiteboard_office: '白板',
  arcade_cabinet: '街机', laser_printer: '激光打印机', phone_booth_office: '电话亭',
  workbench: '工作台', workbench_pegboard: '带洞洞板工作台', tool_cabinet: '工具柜',
  tool_chest: '工具箱柜', storage_rack_garage: '车库货架', wall_shelf_garage: '车库壁架',
  air_compressor: '空压机', shop_vacuum: '工业吸尘器', ladder_step: '人字梯',
  ladder_extension: '伸缩梯', storage_boxes: '收纳箱', tire_stack: '轮胎堆', bike_rack: '自行车架',
  repair_stand: '修车架', parts_bin: '零件盒', utility_sink_garage: '车库水槽', charging_bay: '充电位',
  // ---- 宠物 ----
  cat_tree_large: '大型猫爬架', cat_scratching_post: '猫抓柱', cat_scratch_board_wall: '壁挂猫抓板',
  cat_cave: '猫窝', cat_bed_round: '圆形猫床', cat_wall_perch: '壁挂猫跳台',
  cat_climbing_steps_wall: '壁挂猫爬梯', litter_box_hood: '封闭猫砂盆',
  litter_box_self_cleaning: '自动猫砂盆', dog_bed: '狗窝', dog_basket: '狗篮',
  dog_house: '狗屋', pet_bowls: '宠物食盆', pet_feeder_automatic: '自动喂食器',
  pet_water_fountain: '宠物饮水机', pet_gate: '宠物门栏', pet_stairs: '宠物楼梯',
  hamster_cage: '仓鼠笼', small_animal_cage: '小动物笼', rabbit_enclosure_outdoor: '户外兔舍',
  bird_cage: '鸟笼', aquarium_100: '鱼缸 100', aquarium_240_cabinet: '鱼缸 240(带柜)', terrarium: '爬宠缸',
  // ---- 健身 ----
  fitness_treadmill: '跑步机', fitness_power_rack: '深蹲架', fitness_rower: '划船机',
  fitness_spin_bike: '动感单车', fitness_dumbbell_rack: '哑铃架', fitness_punching_bag: '沙袋',
  fitness_yoga_mat: '瑜伽垫', fitness_cross_trainer: '椭圆机', fitness_mirror_wall: '健身镜墙',
  fitness_ball: '健身球', fitness_wall_bars: '肋木架', fitness_mirror_smart: '智能健身镜',
  fitness_bike_trainer: '骑行台', fitness_sauna_cabin: '桑拿舱', fitness_massage_chair: '按摩椅',
  fitness_kettlebell_set: '壶铃组', fitness_water_station: '饮水站',
  // ---- 影音 ----
  cinema_screen_wall: '画框幕布', cinema_screen_roller: '电动幕布', cinema_projector_ceiling: '吊装投影仪',
  cinema_projector_table: '桌面投影仪', cinema_projector_ust: '超短焦投影', cinema_speaker_tower: '落地音箱',
  cinema_speaker_bookshelf: '书架音箱', cinema_speaker_center: '中置音箱', cinema_subwoofer: '低音炮',
  cinema_soundbar: '回音壁', cinema_speaker_wall: '壁挂音箱', cinema_speaker_ceiling: '吸顶音箱',
  cinema_av_receiver: '功放', cinema_tv_oled_65: 'OLED 电视 65', cinema_tv_oled_85: 'OLED 电视 85',
  cinema_screen_floor_rising: '地升幕布', cinema_turntable: '黑胶唱机', cinema_vinyl_shelf: '唱片架',
  cinema_game_console: '游戏主机', cinema_hifi_rack: '音响机架', cinema_chair: '影院座椅',
  cinema_chair_row_3: '影院座椅(3连)', cinema_acoustic_panel: '吸音板', cinema_bass_trap_corner: '低频陷阱',
  cinema_popcorn_machine: '爆米花机', cinema_surround_speaker_stand: '环绕音箱架',
  cinema_speaker_inwall: '入墙音箱', cinema_media_streamer: '播放器', cinema_bluray_player: '蓝光机',
  cinema_stereo_amplifier: '立体声功放', cinema_headphone_stand: '耳机架',
  // ---- 车辆 ----
  car_sedan: '轿车', car_hatchback: '两厢车', car_suv: 'SUV', car_pickup: '皮卡', car_van: '面包车',
  car_wagon: '旅行车', car_compact: '小型车', car_electric: '电动车', car_minibus: '中巴',
  motorbike: '摩托车', motorcycle_touring: '巡航摩托', scooter: '踏板车',
  bicycle_city: '城市自行车', bicycle_cargo: '载货自行车', parking: '车位',
  // ---- 其它 ----
  column_round: '圆柱', column_square: '方柱', column_steel: '钢柱', ceiling_beams: '顶梁',
  downstand_beam: '下挂梁', chimney_inside: '室内烟囱', led_niche: '发光壁龛', light_cove: '灯槽',
  platform_steps: '平台踏步', gallery_railing_glass: '玻璃护栏', stairs: '楼梯',
  stairs_landing: '带平台楼梯', stairs_landing_l: 'L 形楼梯', stairs_winder_l: 'L 形转角楼梯',
  stairs_spiral: '旋转楼梯', stairs_open: '开放式楼梯', stairs_concrete: '混凝土楼梯',
  stairs_compact: '紧凑楼梯', railing_glass: '玻璃栏杆', railing_metal: '金属栏杆',
  railing_wood: '木质栏杆', railing_cable: '钢索栏杆', shoe_cabinet: '鞋柜', shoe_bench: '换鞋凳',
};

/** 没收录中文名时的兜底：`sofa_corner_left` → `Sofa corner left` */
function prettify(type) {
  const s = String(type || '').replace(/_/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/** 家具的显示名 */
export function furnitureLabel(type) {
  return NAMES[type] || prettify(type);
}
