import React from 'react';
import Icon from '@mdi/react';
import {
  mdiDesktopTowerMonitor,
  mdiTemperatureCelsius,
  mdiFlash,
  mdiMemory,
  mdiExpansionCard,
  mdiHarddisk,
} from '@mdi/js';
import BaseCard from '../BaseCard';
import { useEntity, useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';

// ==============================================================================
// 电脑监控卡片
// ------------------------------------------------------------------------------
// 把上报到 Home Assistant 的电脑硬件数据汇总成一张卡片：
//   · CPU / GPU：占用率（环形进度）+ 温度 + 功耗
//   · 内存 / 显存：已用 / 可用 / 使用率进度条
//   · 各硬盘：已用 / 可用 / 使用率进度条
//
// 数据来源可以是任意把实体写进 HA 的方式（PCTools / AIDA64 共享内存、
// HASS.Agent、Glances、自定义脚本……），本卡片只负责「读实体 + 展示」。
// ==============================================================================

// 哨兵实体 id：hakit 内部对 'unknown' 直接返回 null，
// 这样即使配置里没填实体，hook 调用次数也保持稳定（不会违反 hook 规则）。
const NONE = 'unknown';

function toNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === 'unknown' || s === 'unavailable' || s === 'None' || s === 'null') return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function unitOf(e) {
  const u = e && e.attributes && e.attributes.unit_of_measurement;
  return typeof u === 'string' ? u.trim() : '';
}

/** 任意容量单位 -> GB。无单位时按 fallbackUnit 解析。 */
function toGB(value, unit, fallbackUnit) {
  if (value === null) return null;
  const u = String(unit || fallbackUnit || 'GB').toUpperCase();
  if (u.indexOf('TB') >= 0 || u.indexOf('TIB') >= 0) return value * 1024;
  if (u.indexOf('GB') >= 0 || u.indexOf('GIB') >= 0) return value;
  if (u.indexOf('MB') >= 0 || u.indexOf('MIB') >= 0) return value / 1024;
  if (u.indexOf('KB') >= 0 || u.indexOf('KIB') >= 0) return value / 1048576;
  if (u === 'B' || u.indexOf('BYTE') >= 0) return value / 1073741824;
  return value;
}

function fmtSize(gb) {
  if (gb === null || !Number.isFinite(gb)) return '--';
  if (gb >= 1024) return (gb / 1024).toFixed(2) + ' TB';
  if (gb >= 1) return gb.toFixed(1) + ' GB';
  return (gb * 1024).toFixed(0) + ' MB';
}

function fmtNum(n) {
  if (n === null || !Number.isFinite(n)) return '--';
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** 占用率越高，颜色越警示 */
function barColor(p) {
  if (p === null || !Number.isFinite(p)) return 'var(--color-primary)';
  if (p >= 90) return 'var(--color-error, #ef5350)';
  if (p >= 75) return 'var(--color-warning, #ffa726)';
  return 'var(--color-primary)';
}

function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** 只填了「已用」时，从全部实体里猜配对的「可用」实体 */
function guessFreeId(usedId, all) {
  const cands = [
    usedId.replace(/_used/gi, '_free'),
    usedId.replace(/used_space/gi, 'free_space'),
    usedId.replace(/used/gi, 'free'),
    usedId.replace(/_usage/gi, '_free'),
    usedId.replace(/usage/gi, 'free'),
    usedId.replace(/已用/g, '可用'),
  ];
  for (let i = 0; i < cands.length; i++) {
    const c = cands[i];
    if (c !== usedId && all && all[c]) return c;
  }
  return '';
}

/** 从实体名里猜一个干净的盘符名 */
function diskName(entity, index, t) {
  const raw =
    (entity && entity.attributes && entity.attributes.friendly_name) ||
    (entity && entity.entity_id) ||
    '';
  const cleaned = String(raw)
    .replace(/[（(]?\s*(已用|已使用|已占用|使用|占用|可用|剩余|空闲|空间|容量)\s*[)）]?/gi, '')
    .replace(/[（(]?\s*(used|usage|free|available|space|size|total)\s*[)）]?/gi, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[-–—·|]+$/g, '')
    .trim();
  return cleaned || `${t('pcMonitor.disk')} ${index + 1}`;
}

// ------------------------------------------------------------------
// 子组件（每个实体单独一个组件，保证 hook 调用顺序稳定）
// ------------------------------------------------------------------

/** 读一个实体，不存在返回 null（绝不抛错） */
function useEnt(id) {
  return useEntity(id || NONE, { returnNullIfNotFound: true }) || null;
}

function Ring({ percent, caption }) {
  const p =
    percent === null || !Number.isFinite(percent) ? 0 : Math.max(0, Math.min(100, percent));
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = (p / 100) * C;
  return (
    <div className="pcm-ring">
      <svg viewBox="0 0 100 100">
        <circle className="pcm-ring-bg" cx="50" cy="50" r={R} />
        <circle
          className="pcm-ring-fg"
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
      <div className="pcm-ring-text">
        <span className="pcm-ring-pct">
          {percent === null || !Number.isFinite(percent) ? '--' : Math.round(p) + '%'}
        </span>
        <span className="pcm-ring-cap">{caption}</span>
      </div>
    </div>
  );
}

/** 一行「图标 + 名称 + 数值」（温度 / 功耗） */
function MetricRow({ entityId, icon, label, suffix }) {
  const e = useEnt(entityId);
  const n = toNum(e && e.state);
  const u = unitOf(e) || suffix || '';
  const text = n === null ? '--' : fmtNum(n) + (u ? ' ' + u : '');
  return (
    <div className="pcm-metric">
      <span className="pcm-metric-icon">
        <Icon path={icon} size={13} />
      </span>
      <span className="pcm-metric-label">{label}</span>
      <span className="pcm-metric-value">{text}</span>
    </div>
  );
}

/** CPU / GPU 一块：环形占用率 + 温度 + 功耗 */
function ComputeBlock({ caption, usageId, tempId, powerId, t }) {
  const usageEnt = useEnt(usageId);
  const usage = toNum(usageEnt && usageEnt.state);
  return (
    <div className="pcm-block">
      <Ring percent={usage} caption={caption} />
      <div className="pcm-metrics">
        <MetricRow
          entityId={tempId}
          icon={mdiTemperatureCelsius}
          label={t('pcMonitor.temp')}
          suffix="°C"
        />
        <MetricRow entityId={powerId} icon={mdiFlash} label={t('pcMonitor.power')} suffix="W" />
      </div>
    </div>
  );
}

/** 进度条一行（内存 / 显存 / 硬盘通用） */
function BarRow({ icon, name, used, free, total, t }) {
  const base = total !== null ? total : used !== null && free !== null ? used + free : null;
  const pct = base && used !== null && base > 0 ? (used / base) * 100 : null;
  return (
    <div className="pcm-bar-row">
      <div className="pcm-bar-head">
        <span className="pcm-bar-icon">
          <Icon path={icon} size={13} />
        </span>
        <span className="pcm-bar-name">{name}</span>
        <span className="pcm-bar-pct">{pct === null ? '--' : Math.round(pct) + '%'}</span>
      </div>
      <div className="pcm-bar-track">
        <div
          className="pcm-bar-fill"
          style={{
            width: (pct === null ? 0 : Math.max(0, Math.min(100, pct))) + '%',
            background: barColor(pct),
          }}
        />
      </div>
      <div className="pcm-bar-sub">
        {t('pcMonitor.used')} {fmtSize(used)} · {t('pcMonitor.free')} {fmtSize(free)}
        {total !== null ? ' · ' + t('pcMonitor.total') + ' ' + fmtSize(total) : ''}
      </div>
    </div>
  );
}

/** 内存 / 显存一块 */
function MemoryBlock({ icon, label, usedId, freeId, totalId, fallbackUnit, t }) {
  const usedE = useEnt(usedId);
  const freeE = useEnt(freeId);
  const totalE = useEnt(totalId);
  const used = toGB(toNum(usedE && usedE.state), unitOf(usedE) || fallbackUnit, fallbackUnit);
  const free = toGB(toNum(freeE && freeE.state), unitOf(freeE) || fallbackUnit, fallbackUnit);
  const total = toGB(toNum(totalE && totalE.state), unitOf(totalE) || fallbackUnit, fallbackUnit);
  return <BarRow icon={icon} name={label} used={used} free={free} total={total} t={t} />;
}

/** 单个硬盘 */
function DiskRow({ usedId, freeId, index, fallbackUnit, t }) {
  const usedE = useEnt(usedId);
  const freeE = useEnt(freeId);
  const used = toGB(toNum(usedE && usedE.state), unitOf(usedE) || fallbackUnit, fallbackUnit);
  const free = toGB(toNum(freeE && freeE.state), unitOf(freeE) || fallbackUnit, fallbackUnit);
  return (
    <BarRow
      icon={mdiHarddisk}
      name={diskName(usedE || freeE, index, t)}
      used={used}
      free={free}
      total={null}
      t={t}
    />
  );
}

// ------------------------------------------------------------------
// 卡片主体
// ------------------------------------------------------------------

function PcMonitorCard({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const title = cfg.title || t('cardTitles.pcMonitor');
  const fallbackUnit = (cfg.sizeUnit || 'GB').toUpperCase();

  const usedIds = toArray(cfg.diskUsedEntities);
  const freeIds = toArray(cfg.diskFreeEntities);

  // 只填了「已用空间」时，自动从全部实体里找配对的「可用空间」
  const { getAllEntities } = useHass();
  const allEntities = (getAllEntities && getAllEntities()) || {};
  const usedKey = usedIds.join('|');
  const freeKey = freeIds.join('|');
  const disks = React.useMemo(() => {
    const n = Math.max(usedIds.length, freeIds.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = usedIds[i] || '';
      let f = freeIds[i] || '';
      if (!f && u) f = guessFreeId(u, allEntities);
      if (u || f) out.push({ used: u, free: f });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedKey, freeKey, allEntities]);

  const hasCompute = Boolean(
    cfg.cpuUsage || cfg.cpuTemp || cfg.cpuPower || cfg.gpuUsage || cfg.gpuTemp || cfg.gpuPower
  );
  const hasMemory = Boolean(
    cfg.memUsed || cfg.memFree || cfg.memTotal || cfg.vramUsed || cfg.vramFree || cfg.vramTotal
  );
  const hasDisk = disks.length > 0;

  if (!hasCompute && !hasMemory && !hasDisk) {
    return (
      <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiDesktopTowerMonitor}>
        <div className="pcm-body">
          <div className="pcm-empty">
            <Icon path={mdiDesktopTowerMonitor} size={26} />
            <span>{t('pcMonitor.empty')}</span>
            <span className="pcm-empty-hint">{t('pcMonitor.emptyHint')}</span>
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      title={title}
      titleVisible={cfg.titleVisible}
      icon={mdiDesktopTowerMonitor}
      headerRight={cfg.deviceName ? <span className="pcm-device">{cfg.deviceName}</span> : null}
    >
      <div className="pcm-body">
        {hasCompute ? (
          <div className="pcm-section">
            {cfg.cpuUsage || cfg.cpuTemp || cfg.cpuPower ? (
              <ComputeBlock
                caption="CPU"
                usageId={cfg.cpuUsage}
                tempId={cfg.cpuTemp}
                powerId={cfg.cpuPower}
                t={t}
              />
            ) : null}
            {cfg.gpuUsage || cfg.gpuTemp || cfg.gpuPower ? (
              <ComputeBlock
                caption="GPU"
                usageId={cfg.gpuUsage}
                tempId={cfg.gpuTemp}
                powerId={cfg.gpuPower}
                t={t}
              />
            ) : null}
          </div>
        ) : null}

        {hasMemory ? (
          <>
            {hasCompute ? <div className="pcm-divider" /> : null}
            <div className="pcm-section">
              {cfg.memUsed || cfg.memFree || cfg.memTotal ? (
                <MemoryBlock
                  icon={mdiMemory}
                  label={t('pcMonitor.memory')}
                  usedId={cfg.memUsed}
                  freeId={cfg.memFree}
                  totalId={cfg.memTotal}
                  fallbackUnit={fallbackUnit}
                  t={t}
                />
              ) : null}
              {cfg.vramUsed || cfg.vramFree || cfg.vramTotal ? (
                <MemoryBlock
                  icon={mdiExpansionCard}
                  label={t('pcMonitor.vram')}
                  usedId={cfg.vramUsed}
                  freeId={cfg.vramFree}
                  totalId={cfg.vramTotal}
                  fallbackUnit={fallbackUnit}
                  t={t}
                />
              ) : null}
            </div>
          </>
        ) : null}

        {hasDisk ? (
          <>
            <div className="pcm-divider" />
            <div className="pcm-group-title">
              <Icon path={mdiHarddisk} size={13} />
              {t('pcMonitor.diskSpace')}
            </div>
            <div className="pcm-disk-list">
              {disks.map((d, i) => (
                <DiskRow
                  key={(d.used || '') + '#' + i}
                  usedId={d.used}
                  freeId={d.free}
                  index={i}
                  fallbackUnit={fallbackUnit}
                  t={t}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </BaseCard>
  );
}

export default PcMonitorCard;
