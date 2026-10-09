// ==============================================================================
// 灯光概览卡片的「图标尺寸」
// ------------------------------------------------------------------------------
// 单位统一为 **px**，用户只填数字（例如 20），不需要写单位。
// 这里负责解析与生成 CSS 值，同时兼容历史数据：
//   '15px' → 15   '24rem' → 24（一律按 px 处理）
// ==============================================================================

/** 没填时的默认图标尺寸（px） */
export const DEFAULT_ICON_SIZE = 20;

/** 解析成纯数字（px）。非法 / 空值返回 fallback。 */
export function normalizeIconSize(v, fallback = DEFAULT_ICON_SIZE) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 生成可直接用于 CSS / Iconify width 的值，如 '20px'。 */
export function iconSizeCss(v, fallback) {
  return `${normalizeIconSize(v, fallback)}px`;
}
