// ==============================================================================
// 卡片「显示名」的统一解析
// ------------------------------------------------------------------------------
// 「添加卡片」列表里的名字有几个来源，优先级如下：
//   ① 用户自定义的覆盖名（在「插件管理 → 卡片显示名」里改，存在后端）
//   ② i18n 的 cardTitles.<key>（内置卡片的老行为，保持显示不变）
//   ③ 卡片自带的 name（内置卡片来自 cards.<key>；插件卡片来自 manifest.name）
//   ④ 卡片类型名兜底
//
// ⚠️ 为什么需要 getCardTranslationKey：
//   `AddCardModal` 以前用 `type.replace('Card','').toLowerCase()` 去查 cardTitles，
//   于是驼峰卡片（PcMonitorCard / WashingMachineCard / SocketStatusCard …）会查成
//   全小写 key（pcmonitor / washingmachine / socketstatus），必须两种都写才不出错。
//   这里把规则集中到一处，避免再出现「添加卡片里显示成 cardTitles.xxx」的问题。
// ==============================================================================

/** 卡片类型 -> cardTitles 里的 key（个别卡片有历史别名） */
export function getCardTranslationKey(type) {
  if (type === 'ScriptPanel') return 'script';
  if (type === 'WaterPurifierCard') return 'water';
  if (type === 'LightOverviewCard') return 'lightOverview';
  return String(type || '').replace('Card', '').toLowerCase();
}

/**
 * 解析一张卡片的显示名。
 * @param {string} type      卡片类型（如 PcMonitorCard）
 * @param {Function} t       i18n 的 t()
 * @param {string} fallbackName 卡片自带的 name（内置 = t('cards.x')，插件 = manifest.name）
 * @param {Object} overrides 覆盖表 { "<cardType>": "自定义名" }
 */
export function resolveCardDisplayName(type, t, fallbackName, overrides) {
  const override = overrides && overrides[type];
  if (override) return override;

  if (typeof t === 'function') {
    const titleKey = `cardTitles.${getCardTranslationKey(type)}`;
    const fromTitles = t(titleKey);
    // t() 找不到 key 时会原样返回 key，这里据此判断「有没有翻译」
    if (fromTitles && fromTitles !== titleKey) return fromTitles;
  }

  return fallbackName || type;
}
