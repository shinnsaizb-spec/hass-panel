import React from 'react';
import Icon from '@mdi/react';
import {
  mdiChip,
  mdiExpansionCard,
  mdiThermometer,
  mdiSineWave,
  mdiLightningBolt,
  mdiFlash,
} from '@mdi/js';
import BaseCard from '../BaseCard';
import { useEntity } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  NONE_ENTITY,
  toNum,
  unitOf,
  fmtNum,
  barColor,
  tempColor,
} from '../../utils/hardwareFormat';
import './style.css';

// ==============================================================================
// CPU / GPU 卡片（一张卡里同时显示 CPU 和 GPU）
// ------------------------------------------------------------------------------
//   [芯片] CPU                    | [显卡] GPU
//          AMD Ryzen7 9850X3D     |        NVIDIA RTX 5080
//     ◯15%  🌡40°C 〜5.23GHz      |   ◯14%  🌡39°C 〜2.86GHz
//           ⚡1.136V ⚡54W         |         ⚡0.99V ⚡84W
//
// 版式刻意做紧凑：环形 + 2×2 指标并排，窄了会自动折成上下。
// 只负责「读实体 + 展示」，数据来源随便（PCTools / HASS.Agent / Glances / 脚本…）。
// ==============================================================================

/** 读一个实体，不存在返回 null（绝不抛错）。 */
function useEnt(id) {
  return useEntity(id || NONE_ENTITY, { returnNullIfNotFound: true }) || null;
}

/** 一个指标：图标 + 值 + 单位（值缺失时显示 --）。 */
function Metric({ entityId, icon, fallbackUnit, hotAt }) {
  const e = useEnt(entityId);
  const n = toNum(e && e.state);
  const u = unitOf(e) || fallbackUnit || '';
  // 温度这类指标：超过阈值标红
  const hot = hotAt != null && n !== null && n >= hotAt;
  return (
    <div className="cgc-metric">
      <span className="cgc-metric-icon" style={{ color: hot ? tempColor(n) : undefined }}>
        <Icon path={icon} size={12} />
      </span>
      <span className="cgc-metric-value" style={{ color: hot ? tempColor(n) : undefined }}>
        {n === null ? '--' : fmtNum(n)}
        {n !== null && u ? <span className="cgc-metric-unit"> {u}</span> : null}
      </span>
    </div>
  );
}

/** 环形占用率（中间显示百分比） */
function Ring({ percent }) {
  const p =
    percent === null || percent === undefined || !Number.isFinite(percent)
      ? null
      : Math.max(0, Math.min(100, percent));
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = ((p === null ? 0 : p) / 100) * C;
  return (
    <div className="cgc-ring">
      <svg viewBox="0 0 100 100">
        <circle className="cgc-ring-bg" cx="50" cy="50" r={R} />
        <circle
          className="cgc-ring-fg"
          cx="50"
          cy="50"
          r={R}
          transform="rotate(-90 50 50)"
          style={{
            stroke: barColor(percent),
            strokeDasharray: dash + ' ' + (C - dash),
          }}
        />
      </svg>
      <span className="cgc-ring-pct">{p === null ? '--' : Math.round(p) + '%'}</span>
    </div>
  );
}

/** 一半：CPU 或 GPU */
function ComputeHalf({ kind, icon, cfg, fallbackName, below }) {
  const usageEnt = useEnt(cfg.usage);
  const usage = toNum(usageEnt && usageEnt.state);
  const name = String(cfg.name || '').trim() || fallbackName;

  return (
    <div className="cgc-half">
      <div className="cgc-head">
        <span className="cgc-head-icon">
          <Icon path={icon} size={14} />
        </span>
        <div className="cgc-head-text">
          <div className="cgc-head-kind">{kind}</div>
          <div className="cgc-head-model">{name}</div>
        </div>
      </div>
      <div className={'cgc-main' + (below ? ' below' : '')}>
        <Ring percent={usage} />
        <div className="cgc-metrics">
          <Metric entityId={cfg.temp} icon={mdiThermometer} fallbackUnit="°C" hotAt={90} />
          <Metric entityId={cfg.freq} icon={mdiSineWave} fallbackUnit="GHz" />
          <Metric entityId={cfg.voltage} icon={mdiLightningBolt} fallbackUnit="V" />
          <Metric entityId={cfg.power} icon={mdiFlash} fallbackUnit="W" />
        </div>
      </div>
    </div>
  );
}

/** 有没有配过这一半的任何一个字段 */
function hasHalf(cfg) {
  return Boolean(cfg && (cfg.name || cfg.usage || cfg.temp || cfg.freq || cfg.voltage || cfg.power));
}

function CpuGpuCard({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const title = cfg.title || t('cardTitles.cpuGpuCard');

  const cpuCfg = {
    name: cfg.cpuName,
    usage: cfg.cpuUsage,
    temp: cfg.cpuTemp,
    freq: cfg.cpuFreq,
    voltage: cfg.cpuVoltage,
    power: cfg.cpuPower,
  };
  const gpuCfg = {
    name: cfg.gpuName,
    usage: cfg.gpuUsage,
    temp: cfg.gpuTemp,
    freq: cfg.gpuFreq,
    voltage: cfg.gpuVoltage,
    power: cfg.gpuPower,
  };

  const showCpu = hasHalf(cpuCfg);
  const showGpu = hasHalf(gpuCfg);
  // 指标位置：right（占用圈右侧，默认）/ bottom（占用圈下方，参考图的排法）
  const below = cfg.metricsLayout === 'bottom';

  if (!showCpu && !showGpu) {
    return (
      <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiChip}>
        <div className="cgc-body">
          <div className="cgc-empty">
            <Icon path={mdiChip} size={26} />
            <span>{t('cpuGpu.empty')}</span>
            <span className="cgc-empty-hint">{t('cpuGpu.emptyHint')}</span>
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiChip}>
      <div className="cgc-body">
        <div className={'cgc-halves' + (showCpu && showGpu ? ' both' : '')}>
          {showCpu ? (
            <ComputeHalf kind="CPU" icon={mdiChip} cfg={cpuCfg} fallbackName="CPU" below={below} />
          ) : null}
          {showGpu ? (
            <ComputeHalf
              kind="GPU"
              icon={mdiExpansionCard}
              cfg={gpuCfg}
              fallbackName="GPU"
              below={below}
            />
          ) : null}
        </div>
      </div>
    </BaseCard>
  );
}

export default CpuGpuCard;
