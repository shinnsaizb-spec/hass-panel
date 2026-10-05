// ==============================================================================
// 示例插件卡片
// ------------------------------------------------------------------------------
// 写法与「内置卡片」几乎一模一样：正常 import react / @hakit/core，
// 由构建脚本把依赖重定向到宿主全局。默认导出的组件就是这张卡片。
//
// 宿主会把以下 props 透传给卡片组件：
//   config  —— 用户在配置页填写的字段值（与 manifest.configFields 对应）
//   ...     —— 其它宿主透传属性
// ==============================================================================

import React from 'react';
import { useEntity } from '@hakit/core';
import { BaseCard } from 'hass-panel-sdk';

// 把「读实体」单独拆成一个子组件，保证 hook 调用顺序稳定（规则 of hooks）
function EntityState({ entityId }) {
  const { entity } = useEntity(entityId);
  return (
    <p>
      实体 <b>{entityId}</b> 当前状态：{entity ? entity.state : '加载中…'}
    </p>
  );
}

export default function DemoPluginCard({ config }) {
  const cfg = config || {};
  const entityId = cfg.entity_id || '';
  const title = cfg.title || '示例插件卡片';

  return (
    <BaseCard title={title}>
      <div style={{ padding: 12, color: 'var(--color-text-primary)' }}>
        <p>✅ 这张卡片是通过「插件机制」运行时加载的。</p>
        {entityId ? (
          <EntityState entityId={entityId} />
        ) : (
          <p>
            在卡片配置里填一个 <b>entity_id</b> 就能读取 HA 实体状态。
          </p>
        )}
      </div>
    </BaseCard>
  );
}
