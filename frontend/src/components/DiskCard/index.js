import React from 'react';
import Icon from '@mdi/react';
import { mdiHarddisk } from '@mdi/js';
import BaseCard from '../BaseCard';
import HardwareBarRow from '../HardwareBarRow';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';

// ==============================================================================
// 硬盘卡片
// ------------------------------------------------------------------------------
// 一块盘一组，各自在「编辑卡片」里写名称 / 选图标 / 选实体（不靠「按顺序对应」）：
//
//   [图标]  系统盘 (C:) 46%          42°C     ← 名称 + 百分比，温度在最右
//           849 GB / 1013 GB                   ← 已用 / 可用
//           [==========--------------]         ← 占比条
//
// 占用率 = 已用 / (已用 + 可用)。只填了「已用」时会自动去猜配对的「可用」实体。
// 温度可选，没配就不显示。
// ==============================================================================

function DiskCard({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const title = cfg.title || t('cardTitles.diskCard');
  const fallbackUnit = String(cfg.sizeUnit || 'GB').toUpperCase();
  const disks = Array.isArray(cfg.disks) ? cfg.disks.filter((d) => d && (d.used || d.free || d.name)) : [];

  if (disks.length === 0) {
    return (
      <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiHarddisk}>
        <div className="dk-body">
          <div className="dk-empty">
            <Icon path={mdiHarddisk} size={26} />
            <span>{t('diskCard.empty')}</span>
            <span className="dk-empty-hint">{t('diskCard.emptyHint')}</span>
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiHarddisk}>
      <div className="dk-body">
        {disks.map((d, i) => (
          <HardwareBarRow
            key={(d.used || d.name || '') + '#' + i}
            icon={mdiHarddisk}
            iconValue={d.icon}
            name={d.name}
            fallbackName={t('diskCard.disk')}
            usedId={d.used}
            freeId={d.free}
            tempId={d.temp}
            fallbackUnit={fallbackUnit}
          />
        ))}
      </div>
    </BaseCard>
  );
}

export default DiskCard;
