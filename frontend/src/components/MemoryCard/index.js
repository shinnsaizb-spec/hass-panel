import React from 'react';
import Icon from '@mdi/react';
import { mdiMemory, mdiExpansionCard } from '@mdi/js';
import BaseCard from '../BaseCard';
import HardwareBarRow from '../HardwareBarRow';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';

// ==============================================================================
// 内存 / 显存卡片（合并成一张）
// ------------------------------------------------------------------------------
//   [内存图标] 内存        62%           ← 名称 + 百分比
//             9.2 GB / 5.6 GB           ← 已用 / 可用
//             [==========---------]
//   [显卡图标] 显存        88%    42°C
//             7.1 GB / 1.0 GB
//             [=================--]
//
// 外观完全走公共组件 HardwareBarRow（和硬盘卡片是同一套），所以三张卡看起来一致。
// 两组都可以单独留空 —— 只配了内存就只显示内存那一行。
// ==============================================================================

function MemoryCard({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const title = cfg.title || t('cardTitles.memoryCard');
  const fallbackUnit = String(cfg.sizeUnit || 'GB').toUpperCase();

  const rows = [
    {
      key: 'mem',
      icon: mdiMemory,
      name: cfg.memName,
      fallbackName: t('memoryCard.ram'),
      used: cfg.memUsed,
      free: cfg.memFree,
      temp: cfg.memTemp,
    },
    {
      key: 'vram',
      icon: mdiExpansionCard,
      name: cfg.vramName,
      fallbackName: t('memoryCard.vram'),
      used: cfg.vramUsed,
      free: cfg.vramFree,
      temp: cfg.vramTemp,
    },
  ].filter((r) => r.used || r.free || r.temp);

  if (rows.length === 0) {
    return (
      <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiMemory}>
        <div className="mc-body">
          <div className="mc-empty">
            <Icon path={mdiMemory} size={26} />
            <span>{t('memoryCard.empty')}</span>
            <span className="mc-empty-hint">{t('memoryCard.emptyHint')}</span>
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiMemory}>
      <div className="mc-body">
        {rows.map((r) => (
          <HardwareBarRow
            key={r.key}
            icon={r.icon}
            name={r.name}
            fallbackName={r.fallbackName}
            usedId={r.used}
            freeId={r.free}
            tempId={r.temp}
            fallbackUnit={fallbackUnit}
          />
        ))}
      </div>
    </BaseCard>
  );
}

export default MemoryCard;
