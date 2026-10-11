import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Input, Button, Select } from 'antd';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';
import AnyEntityToggle from './AnyEntityToggle';

// ==============================================================================
// 智能概览卡片：情景开关配置
// ------------------------------------------------------------------------------
// 每个情景 = 一个名字 + 一组灯 / 开关 + 一个动作。
// 卡片标题栏右侧会为每个情景生成一个按钮：
//   mode = toggle（默认，都不选）→ 全开则全关，否则全开
//   mode = on   只开
//   mode = off  只关
//
// 整块配置**默认折叠**，折叠样式与「全局配置」里的分区保持一致
// （直接复用 .global-config-section 那几个类，保证视觉完全统一）。
// ==============================================================================

/** 折叠分区：与「全局配置」的 Section 同款（主题色标题 + 虚线下边框 + chevron） */
function Section({ title, children }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="global-config-section">
      <button
        type="button"
        className="global-config-section-title"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span>{title}</span>
        <Icon path={collapsed ? mdiChevronDown : mdiChevronUp} size={16} />
      </button>
      {!collapsed && <div className="global-config-section-body">{children}</div>}
    </div>
  );
}

function LightScenesConfig({ field, value, onChange, getFilteredEntities }) {
  const { t } = useLanguage();
  const scenes = Array.isArray(value) ? value : [];
  /** 「显示全部实体」：默认**关** = 只列灯和开关（原有行为）。整个情景列表共用这一个开关。 */
  const [showAll, setShowAll] = useState(false);

  // `getFilteredEntities` 是 ConfigField 给的通用助手（内部对 entity_id 做正则匹配），
  // 传 `.*` 就等于「全部实体」—— 不用再单独要一份实体表。
  const all = getFilteredEntities('.*');
  const nameOf = new Map(all.map((e) => [e.id, e.name]));
  const base = showAll ? all : all.filter((e) => /^(light|switch)\./.test(e.id));
  // ⚠️ 已经选过的实体即使被筛掉也要补回选项里，否则多选框上会退化成显示**裸实体 id**
  const baseIds = new Set(base.map((e) => e.id));
  const picked = [...new Set(scenes.flatMap((s) => s.entities || []))].filter((id) => !baseIds.has(id));
  const options = [
    ...base,
    ...picked.map((id) => ({ id, name: nameOf.get(id) || id })),
  ].map((e) => ({
    value: e.id,
    label: `${e.name} (${e.id})`,
  }));

  const update = (index, patch) => {
    onChange(scenes.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const remove = (index) => onChange(scenes.filter((_, i) => i !== index));

  const add = () => onChange([...scenes, { name: '', entities: [] }]);

  return (
    <div className="config-field">
      {/* 默认收起；样式与「全局配置」里的分区一致（不带数量统计） */}
      <Section title={field.label}>
        <div className="light-scenes-config">
          {/* 整个情景列表共用这一个开关（每个情景的实体选择是同一类下拉，各给一个太啰嗦） */}
          <AnyEntityToggle checked={showAll} onChange={setShowAll} />
          {scenes.map((scene, index) => (
            <div key={index} className="scene-item">
              <div className="scene-field">
                <span className="field-name">{t('configField.sceneName')}</span>
                <Input
                  value={scene.name || ''}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder={t('configField.placeholderSceneName')}
                />
              </div>

              <div className="scene-field">
                <span className="field-name">{t('configField.sceneEntities')}</span>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  value={scene.entities || []}
                  onChange={(v) => update(index, { entities: v })}
                  placeholder={t('configField.selectEntity')}
                  options={options}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="scene-field">
                <span className="field-name">{t('configField.sceneMode')}</span>
                {/* 三选一，互斥；都不选（默认）就是「开 / 关」切换 */}
                <Select
                  value={scene.mode || 'toggle'}
                  onChange={(v) => update(index, { mode: v })}
                  style={{ width: 140 }}
                  options={[
                    { label: t('configField.sceneModeToggle'), value: 'toggle' },
                    { label: t('configField.sceneModeOn'), value: 'on' },
                    { label: t('configField.sceneModeOff'), value: 'off' },
                  ]}
                />
              </div>

              <Button
                type="primary"
                danger
                style={{ width: '100px' }}
                onClick={() => remove(index)}
              >
                {t('configField.deleteButton')}
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="primary"
          style={{ width: '100px', marginTop: '10px' }}
          onClick={add}
        >
          {t('configField.addButton')}
        </Button>
      </Section>
    </div>
  );
}

export default LightScenesConfig;
