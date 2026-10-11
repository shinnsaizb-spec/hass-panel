import React from 'react';
import { Switch } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';

// ============================================================================
// 「显示全部实体」开关
// ----------------------------------------------------------------------------
// 智能概览里的实体下拉**默认只列灯和开关**（这是原有行为，别改默认值）。
// 这个开关用来临时放开限制，让同一个下拉也能选到窗帘 / 风扇 / 传感器等其它域的实体。
//
// 挂在**所有**能选实体的地方：房间的「选择实体」、卡位的「绑定实体」、情景的实体多选。
//
// ⚠️ 开关状态是**纯 UI 的**（useState），不写进卡片配置 —— 它表达的是「这次挑选时想不想
//    看全部」，不是配置的一部分。所以重开配置面板会回到默认的「只列灯和开关」。
//    **但已选中的实体不会因此丢**：选项构造里会把当前值 keep 进去
//    （见 `utils/entityOptions.js` 和 `LightScenesConfig` 里补选项那段）。
//
// 样式用内联：这个开关同时被 `ConfigField/` 和 `LightOverviewEditor/` 用，
// 各自有独立的 style.css，写进任何一边另一边都拿不到（也避免污染全局）。
// ============================================================================

export default function AnyEntityToggle({ checked, onChange, indent = 0 }) {
  const { t } = useLanguage();
  return (
    <div
      title={t('configField.showAllEntitiesHint')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        lineHeight: 1.4,
        color: 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
        marginLeft: indent,
      }}
    >
      <Switch size="small" checked={checked} onChange={onChange} />
      <span>{t('configField.showAllEntities')}</span>
    </div>
  );
}
