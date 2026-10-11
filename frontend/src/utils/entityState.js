// ============================================================================
// 实体「算不算运行中」的判断 —— 智能概览的「运行时图标 / 停止时图标」靠它
// ----------------------------------------------------------------------------
// 原来这个白名单硬编码在 `LightOverviewCard/FloorPlan.js` 里，而且只覆盖了
// 「灯 / 开关 / 少数几个域」。用户绑其它类型的实体（lock、climate、数值传感器…）时，
// 状态值不在名单里 → **永远显示「停止时图标」**，没法用。
//
// 现在：
//   · `isEntityOn(state, custom)` —— 传了 `custom` 就以它为准，否则走默认白名单
//     （**留空 = 保持老行为**，老配置完全不受影响）。
//   · `candidateStates()` —— 给配置界面列出「这个实体可能有哪些状态值」，
//     用户照着填 `custom` 就行。
// ============================================================================

/** 默认视为「开启 / 运行中」的状态值（不同 domain 叫法不同） */
export const ON_STATES = [
  'on',
  'open',
  'home',
  'playing',
  'active',
  'detected',
  'cleaning',
  'heat',
  'cool',
];

/** 各域常见的状态值 —— 只是给配置界面当候选，不参与判断 */
export const DOMAIN_STATES = {
  light: ['on', 'off'],
  switch: ['on', 'off'],
  input_boolean: ['on', 'off'],
  binary_sensor: ['on', 'off'],
  fan: ['on', 'off'],
  humidifier: ['on', 'off'],
  siren: ['on', 'off'],
  automation: ['on', 'off'],
  script: ['on', 'off'],
  update: ['on', 'off'],
  sun: ['above_horizon', 'below_horizon'],
  cover: ['open', 'closed', 'opening', 'closing'],
  lock: ['locked', 'unlocked', 'locking', 'unlocking', 'jammed', 'open'],
  climate: ['off', 'heat', 'cool', 'auto', 'dry', 'fan_only'],
  water_heater: ['off', 'eco', 'electric', 'gas', 'heat_pump', 'high_demand', 'performance'],
  media_player: ['playing', 'paused', 'idle', 'off', 'on', 'standby', 'buffering'],
  vacuum: ['cleaning', 'docked', 'idle', 'paused', 'returning', 'error'],
  device_tracker: ['home', 'not_home'],
  person: ['home', 'not_home'],
  alarm_control_panel: [
    'disarmed',
    'armed_home',
    'armed_away',
    'armed_night',
    'armed_vacation',
    'pending',
    'triggered',
  ],
  camera: ['recording', 'streaming', 'idle'],
};

/** 这些属性里装的是「可能的状态值」，直接拿来当候选 */
const STATE_ATTR_KEYS = [
  'options',
  'hvac_modes',
  'preset_modes',
  'fan_modes',
  'swing_modes',
  'source_list',
];

/**
 * 实体算不算「运行中」。
 * @param {string} state  实体当前状态
 * @param {string[]} [custom] 用户自定义的「运行时状态」；**非空时以它为准**
 */
export function isEntityOn(state, custom) {
  if (typeof state !== 'string' || !state) return false;
  if (Array.isArray(custom) && custom.length) return custom.includes(state);
  return ON_STATES.includes(state);
}

/**
 * 给某个实体列出「可能的状态值」候选，供配置界面展示 / 挑选。
 * 来源：当前状态 + 用户已配的 + 该域常见值 + 从属性里推出来的（select 的 options、climate 的 hvac_modes…）
 */
export function candidateStates(entityId, entity, custom) {
  const out = [];
  const push = (v) => {
    if (typeof v === 'string' && v && !out.includes(v)) out.push(v);
  };

  push(entity && entity.state);
  (Array.isArray(custom) ? custom : []).forEach(push);

  const domain = String(entityId || '').split('.')[0];
  (DOMAIN_STATES[domain] || []).forEach(push);

  const attrs = (entity && entity.attributes) || {};
  for (const key of STATE_ATTR_KEYS) {
    if (Array.isArray(attrs[key])) attrs[key].forEach(push);
  }
  return out;
}
