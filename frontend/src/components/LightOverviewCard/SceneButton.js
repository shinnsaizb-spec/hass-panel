import React from 'react';
import Icon from '@mdi/react';
import { mdiLightbulbOn, mdiLightbulbOff } from '@mdi/js';
import { useEntity } from '@hakit/core';

// ==============================================================================
// 智能概览标题栏上的「情景」按钮（收起时是方形图标按钮，hover 展开显示名字）
// ------------------------------------------------------------------------------
// 一个情景 = 一组灯 / 开关 + 一个名字 + 一个动作：
//   mode = 'toggle'（默认，都不选）→ 全开则全关，否则全开
//   mode = 'on'   只开
//   mode = 'off'  只关
//
// ⚠️ 这里在 map 里调 useEntity（hook 数量 = 情景里的实体数）。
//    调用方渲染时 **必须** 用「名称 + 实体列表」拼 key，
//    这样实体列表变化时 React 会重建组件，hook 数量变化才安全。
// ==============================================================================

function SceneButton({ scene, onDone }) {
  const ids = Array.isArray(scene.entities) ? scene.entities : [];

  const entities = ids.map((id) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEntity(id, { returnNullIfNotFound: true })
  );

  const valid = entities.filter(Boolean);
  const allOn = valid.length > 0 && valid.every((e) => e.state === 'on');
  const allOff = valid.length > 0 && valid.every((e) => e.state === 'off');

  const mode = scene.mode === 'on' || scene.mode === 'off' ? scene.mode : 'toggle';

  const run = () => {
    const target =
      mode === 'on' ? 'turn_on' : mode === 'off' ? 'turn_off' : allOn ? 'turn_off' : 'turn_on';
    valid.forEach((e) => {
      const fn = e.service && e.service[target];
      if (typeof fn === 'function') fn();
    });
    // 在下拉菜单里点了情景后收起菜单（平铺模式下 onDone 为空，不影响）
    if (typeof onDone === 'function') onDone();
  };

  // 高亮 = 目标状态已达成（只关模式看是否全关，其余看是否全开）
  const active = mode === 'off' ? allOff : allOn;

  return (
    <button
      type="button"
      className={`light-scene-btn ${active ? 'is-on' : ''}`}
      onClick={run}
      title={scene.name}
    >
      <span className="light-scene-label">{scene.name}</span>
      <span className="light-scene-ico">
        <Icon
          className="light-scene-icon"
          path={active ? mdiLightbulbOn : mdiLightbulbOff}
          size={20}
        />
      </span>
    </button>
  );
}

export default SceneButton;
