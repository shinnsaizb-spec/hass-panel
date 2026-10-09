import React from 'react';
import Icon from '@mdi/react';
import { mdiHarddisk, mdiThermometer } from '@mdi/js';
import { useEntity, useHass } from '@hakit/core';
import {
  NONE_ENTITY,
  toNum,
  unitOf,
  toGB,
  fmtSize,
  fmtNum,
  barColor,
  guessFreeId,
  iconPathOf,
  isImageIcon,
  diskName,
  tempColor,
} from '../../utils/hardwareFormat';
import './style.css';

// ==============================================================================
// 「一行硬件占用」的公共外观
// ------------------------------------------------------------------------------
//   [图标]  系统盘 (C:) 46%          42°C     ← 名称 + 百分比，温度在最右
//           849 GB / 1013 GB                   ← 已用 / 可用
//           [==========--------------]         ← 占比条
//
// 硬盘卡片和内存/显存卡片都用它，保证两边的外观不会各改各的走偏。
// 进度 = 已用 / (已用 + 可用)；只填「已用」时会自动去猜配对的「可用」实体。
// ==============================================================================

function useEnt(id) {
  return useEntity(id || NONE_ENTITY, { returnNullIfNotFound: true }) || null;
}

export default function HardwareBarRow({
  icon,
  iconValue,
  name,
  usedId,
  freeId,
  tempId,
  fallbackUnit = 'GB',
  /** 名称留空时，从实体名里清洗出来的兜底名（如「硬盘」「内存」） */
  fallbackName = '',
}) {
  const usedE = useEnt(usedId);
  const freeE = useEnt(freeId);
  const tempE = useEnt(tempId);
  const { getAllEntities } = useHass();

  const used = toGB(toNum(usedE && usedE.state), unitOf(usedE) || fallbackUnit, fallbackUnit);
  let free = toGB(toNum(freeE && freeE.state), unitOf(freeE) || fallbackUnit, fallbackUnit);

  // 只填了「已用」时，去猜配对的「可用」
  if (free === null && usedId) {
    const all = (getAllEntities && getAllEntities()) || {};
    const guessed = guessFreeId(usedId, all);
    if (guessed && all[guessed]) {
      free = toGB(toNum(all[guessed].state), unitOf(all[guessed]) || fallbackUnit, fallbackUnit);
    }
  }

  const total = used !== null && free !== null ? used + free : null;
  const pct = total && total > 0 && used !== null ? (used / total) * 100 : null;

  const temp = toNum(tempE && tempE.state);
  const tempUnit = unitOf(tempE) || '°C';

  const path = iconValue ? iconPathOf(iconValue, icon) : icon;

  // 名称：优先用配置里写的；没写就从实体的 friendly_name 清洗出来（去掉「已用/可用/温度」这些词）
  const displayName =
    (name || '').trim() || diskName(usedE || freeE || tempE, 0, fallbackName);

  return (
    <div className="hbr-row">
      <span className="hbr-icon">
        {isImageIcon(iconValue) ? (
          <img className="hbr-icon-img" src={iconValue} alt="" />
        ) : (
          <Icon path={path || mdiHarddisk} size={26} />
        )}
      </span>
      <div className="hbr-main">
        <div className="hbr-line1">
          <span className="hbr-name">{displayName}</span>
          <span className="hbr-pct">{pct === null ? '--' : Math.round(pct) + '%'}</span>
          {temp !== null ? (
            <span className="hbr-temp" style={{ color: tempColor(temp) }}>
              <Icon path={mdiThermometer} size={12} />
              {fmtNum(temp)}
              {tempUnit}
            </span>
          ) : null}
        </div>
        <div className="hbr-line2">
          {fmtSize(used)} <span className="hbr-sep">/</span> {fmtSize(free)}
        </div>
        <div className="hbr-track">
          <div
            className="hbr-fill"
            style={{
              width: (pct === null ? 0 : Math.max(0, Math.min(100, pct))) + '%',
              background: barColor(pct),
            }}
          />
        </div>
      </div>
    </div>
  );
}
