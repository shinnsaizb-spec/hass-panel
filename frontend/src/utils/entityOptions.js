// ============================================================================
// 实体下拉选项的统一构造
// ----------------------------------------------------------------------------
// 背景：智能概览里有三处能选实体（房间的「选择实体」、卡位的「绑定实体」、
//       情景的实体多选）。原来它们各自写了一遍「只留灯和开关」的过滤，
//       而且写法还不一样（一处 startsWith 硬编码、一处正则助手）。
//
// 这里把规则收成一处：**默认仍然只列灯和开关**（保持原有行为），
// 调用方可以通过「显示全部实体」开关把它放开。
//
// ⚠️ `keep` 不是可有可无的：antd 的 Select 如果拿到的 `value` 不在 `options` 里，
//    下拉框上会退化成显示**裸实体 id**（拿不到友好名）。所以**当前已选中的那个
//    一定要塞回选项里**，哪怕它被域名白名单筛掉了。
// ============================================================================

/** 默认白名单：只列灯和开关 */
export const LIGHT_SWITCH_FILTER = '^(light|switch)\\.';

/**
 * @param {object} allEntities `getAllEntities()` 的返回值（{entity_id: {attributes,...}}）
 * @param {object} opts
 *   - allowAny  true = 不过滤，列出全部实体（「显示全部实体」开关打开时传 true）
 *   - keep      必须保留的实体 id（数组或单个），一般传「当前选中的值」
 *   - filter    自定义白名单正则字符串，默认 LIGHT_SWITCH_FILTER
 * @returns {{value: string, label: string}[]}
 */
export function buildEntityOptions(allEntities, opts = {}) {
  const { allowAny = false, keep = [], filter = LIGHT_SWITCH_FILTER } = opts;
  const keepSet = new Set([].concat(keep).filter(Boolean));
  const re = new RegExp(filter);
  return Object.entries(allEntities || {})
    .filter(([id]) => allowAny || keepSet.has(id) || re.test(id))
    .map(([id, e]) => ({
      value: id,
      label: `${(e && e.attributes && e.attributes.friendly_name) || id} (${id})`,
    }));
}
