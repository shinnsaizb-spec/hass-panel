import React from 'react';
import Icon from '@mdi/react';
import { mdiBatteryOutline, mdiFlash } from '@mdi/js';
import BaseCard from '../BaseCard';
import { useEntity } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  NONE_ENTITY,
  toNum,
  batteryName,
  isChargingState,
  iconPathOf,
  isImageIcon,
} from '../../utils/hardwareFormat';
import './style.css';

// ==============================================================================
// 设备电量卡片
// ------------------------------------------------------------------------------
// 一台设备一组，各自在「编辑卡片」里写名称 / 选图标 / 选实体（不靠「按顺序对应」）：
//
//   [鼠标]  ATK F1 PRO        15%   ▮▮▯▯
//   [键盘]  QK80MK2           23%   ▮▮▯▯   ← <30% 图标内部变红
//   [手机]  iPhone 16 PM      62%   ▮▮▮▮⚡  ← 充电中
//
// 充电状态两种来源：
//   ① 配了「充电状态」传感器 → 直接用它（on/charging/正在充电… 都认）
//   ② 没配 + 打开「按电量变化推算」→ 电量上升 = 充电中；电量下降 = 停止；
//      连续 10 分钟没再上升 = 停止（避免拔了电源还一直显示在充）
// ==============================================================================

/** 连续多久没再上升就认为「不在充电」 */
const CHARGE_WINDOW_MS = 10 * 60 * 1000;
/** 兜底检查间隔：保证「10 分钟没上升」能自己停下来 */
const TICK_MS = 20 * 1000;
/** 低电量阈值（电池图标变红） */
const LOW_PCT = 30;

/** 读一个实体，不存在返回 null（绝不抛错）。 */
function useEnt(id) {
  return useEntity(id || NONE_ENTITY, { returnNullIfNotFound: true }) || null;
}

/** 电池图标：外框 + 正极 + 内部电量条（<30% 变红）。 */
function BatteryIcon({ pct, charging, low }) {
  const p = pct === null || pct === undefined ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <span className={'bt-icon' + (charging ? ' charging' : '') + (low ? ' low' : '')}>
      <svg viewBox="0 0 32 15" aria-hidden="true">
        <rect className="bt-icon-body" x="0.75" y="0.75" width="26" height="13.5" rx="3.2" />
        <rect className="bt-icon-cap" x="28.2" y="4.6" width="2.6" height="5.8" rx="1.1" />
        <rect
          className="bt-icon-fill"
          x="2.8"
          y="2.8"
          width={Math.max(0, (p / 100) * 21.9)}
          height="9.4"
          rx="1.8"
        />
      </svg>
      {charging ? (
        <span className="bt-bolt">
          <Icon path={mdiFlash} size={11} />
        </span>
      ) : null}
    </span>
  );
}

function BatteryRow({ device, index, compute, tick, t }) {
  const pctE = useEnt(device.level);
  const chargeE = useEnt(device.charge);
  const pct = toNum(pctE && pctE.state);

  // 「按电量变化推算充电」用的状态：上次电量 + 最后上升时间
  const trackRef = React.useRef({ lastPct: null, lastRiseAt: 0, rising: false });

  React.useEffect(() => {
    const tr = trackRef.current;
    if (pct === null) return;
    if (tr.lastPct === null) {
      tr.lastPct = pct;
      return;
    }
    if (pct > tr.lastPct) {
      tr.rising = true;
      tr.lastRiseAt = Date.now();
    } else if (pct < tr.lastPct) {
      tr.rising = false;
    }
    tr.lastPct = pct;
  }, [pct]);

  // tick 每 20s 变一次 → 到期后自动把「充电中」收回来
  const computedCharging = React.useMemo(() => {
    const tr = trackRef.current;
    if (!tr.rising || !tr.lastRiseAt) return false;
    return Date.now() - tr.lastRiseAt <= CHARGE_WINDOW_MS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, pct]);

  const fromSensor = isChargingState(chargeE && chargeE.state);
  const charging = device.charge ? fromSensor === true : compute ? computedCharging : false;

  const low = pct !== null && pct < LOW_PCT;
  const name =
    String(device.name || '').trim() ||
    batteryName(pctE || chargeE, index, t('batteryCard.device'));

  return (
    <div className="bt-row">
      {/* 左边（图标 + 名称）占 42.5%，右边（电量 + 电池图标）占 42.5%，中间自然留 15% */}
      <div className="bt-left">
        <span className="bt-device-icon">
          {isImageIcon(device.icon) ? (
            <img className="bt-device-icon-img" src={device.icon} alt="" />
          ) : (
            <Icon path={iconPathOf(device.icon, mdiBatteryOutline)} size={16} />
          )}
        </span>
        <span className="bt-name">{name}</span>
      </div>
      <div className="bt-right">
        <span className="bt-pct">{pct === null ? '--' : Math.round(pct) + '%'}</span>
        <BatteryIcon pct={pct} charging={charging} low={low} />
      </div>
    </div>
  );
}

function BatteryCard({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const title = cfg.title || t('cardTitles.batteryCard');
  const compute = cfg.computeCharge !== false;

  // 兜底心跳：让「10 分钟没上升」能自己停下来
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const devices = Array.isArray(cfg.devices)
    ? cfg.devices.filter((d) => d && (d.level || d.charge || d.name))
    : [];

  if (devices.length === 0) {
    return (
      <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiBatteryOutline}>
        <div className="bt-body">
          <div className="bt-empty">
            <Icon path={mdiBatteryOutline} size={26} />
            <span>{t('batteryCard.empty')}</span>
            <span className="bt-empty-hint">{t('batteryCard.emptyHint')}</span>
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiBatteryOutline}>
      <div className="bt-body">
        {devices.map((d, i) => (
          <BatteryRow
            key={(d.level || d.name || '') + '#' + i}
            device={d}
            index={i}
            compute={compute}
            tick={tick}
            t={t}
          />
        ))}
      </div>
    </BaseCard>
  );
}

export default BatteryCard;
