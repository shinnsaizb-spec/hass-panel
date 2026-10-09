import {
  mdiCar,
  mdiMopedElectric,
  mdiHarddisk,
  mdiMemory,
  mdiUsbFlashDrive,
  mdiNas,
  mdiMouse,
  mdiKeyboard,
  mdiHeadphones,
  mdiEarbuds,
  mdiGamepadVariant,
  mdiCellphone,
  mdiTablet,
  mdiLaptop,
  mdiSpeaker,
  mdiWatch,
  mdiBatteryOutline,
} from '@mdi/js';

// 硬件类卡片（CPU/GPU、硬盘、设备电量）共用的取值与格式化工具。

/** 硬盘图标可选项（配置面板和卡片渲染共用同一份，避免两边对不上） */
export const DISK_ICON_OPTIONS = [
  { value: 'hdd', label: '机械硬盘', path: mdiHarddisk },
  { value: 'ssd', label: '固态硬盘', path: mdiMemory },
  { value: 'usb', label: '移动硬盘', path: mdiUsbFlashDrive },
  { value: 'nas', label: '网络存储', path: mdiNas },
];

/** 设备图标可选项 */
export const DEVICE_ICON_OPTIONS = [
  { value: 'mouse', label: '鼠标', path: mdiMouse },
  { value: 'keyboard', label: '键盘', path: mdiKeyboard },
  { value: 'headset', label: '耳机', path: mdiHeadphones },
  { value: 'earbuds', label: '耳塞', path: mdiEarbuds },
  { value: 'gamepad', label: '手柄', path: mdiGamepadVariant },
  { value: 'phone', label: '手机', path: mdiCellphone },
  { value: 'tablet', label: '平板', path: mdiTablet },
  { value: 'laptop', label: '笔记本', path: mdiLaptop },
  { value: 'speaker', label: '音箱', path: mdiSpeaker },
  { value: 'watch', label: '手表', path: mdiWatch },
  { value: 'car', label: '汽车', path: mdiCar },
  { value: 'ebike', label: '电动两轮车', path: mdiMopedElectric },
  { value: 'other', label: '其他', path: mdiBatteryOutline },
];

const ICON_MAP = {};
DISK_ICON_OPTIONS.concat(DEVICE_ICON_OPTIONS).forEach((o) => {
  ICON_MAP[o.value] = o.path;
});

/** 图标值 -> mdi 路径（找不到用 fallback） */
export function iconPathOf(value, fallback) {
  return ICON_MAP[value] || fallback;
}

/**
 * 这个「图标」值是不是一张自定义图片（上传的 / 从附件选的）？
 * 预设值是 hdd / ssd / mouse 这种短标识，自定义的是 URL 或 ./api/upload/xxx.png 这种路径。
 */
export function isImageIcon(value) {
  if (!value || typeof value !== 'string') return false;
  if (ICON_MAP[value]) return false;
  return /^(https?:|data:|blob:|\/\.?\/|\.\/|\.\.\/|\/api\/)/.test(value);
}

// 这些卡片只负责「读实体 + 展示」，数据来源可以是任何把实体写进 HA 的方式
// （PCTools / HASS.Agent / Glances / 自定义脚本……）。

/** 哨兵实体 id：hakit 对 'unknown' 直接返回 null，保证 hook 调用次数稳定。 */
export const NONE_ENTITY = 'unknown';

/** 把实体状态解析成数字；空/unknown/unavailable 返回 null。 */
export function toNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === 'unknown' || s === 'unavailable' || s === 'None' || s === 'null') return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** 实体自带的单位。 */
export function unitOf(e) {
  const u = e && e.attributes && e.attributes.unit_of_measurement;
  return typeof u === 'string' ? u.trim() : '';
}

/** 任意容量单位 -> GB。没单位时按 fallbackUnit 解析。 */
export function toGB(value, unit, fallbackUnit) {
  if (value === null || value === undefined) return null;
  const u = String(unit || fallbackUnit || 'GB').toUpperCase();
  if (u.indexOf('TB') >= 0 || u.indexOf('TIB') >= 0) return value * 1024;
  if (u.indexOf('GB') >= 0 || u.indexOf('GIB') >= 0) return value;
  if (u.indexOf('MB') >= 0 || u.indexOf('MIB') >= 0) return value / 1024;
  if (u.indexOf('KB') >= 0 || u.indexOf('KIB') >= 0) return value / 1048576;
  if (u === 'B' || u.indexOf('BYTE') >= 0) return value / 1073741824;
  return value;
}

/** GB 数值 -> 人类可读（1.50 TB / 849.0 GB / 512 MB）。 */
export function fmtSize(gb) {
  if (gb === null || gb === undefined || !Number.isFinite(gb)) return '--';
  if (gb >= 1024) return (gb / 1024).toFixed(2) + ' TB';
  if (gb >= 1) return gb.toFixed(1) + ' GB';
  return (gb * 1024).toFixed(0) + ' MB';
}

/** 数字保留 1 位小数（整数就不带小数点）。 */
export function fmtNum(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '--';
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/**
 * 占用率的颜色：平时橙色，占用到 90% 及以上变红。
 * （CPU/GPU 的占用圈、硬盘/内存的进度条都用这个，保证三处一致。）
 */
export function barColor(pct, primary = 'var(--color-warning, #ffa726)') {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return primary;
  if (pct >= 90) return 'var(--color-error, #ef5350)';
  return 'var(--color-warning, #ffa726)';
}

/** 温度阈值：到了就标红（CPU / GPU / 硬盘 / 内存 都用这个） */
export const TEMP_HOT = 90;

/**
 * 温度值的颜色：>= 90°C 返回红色，否则返回 undefined（走 CSS 默认色）。
 * 直接塞进 style 里用：<span style={{ color: tempColor(temp) }}>
 */
export function tempColor(t) {
  if (t === null || t === undefined || !Number.isFinite(t)) return undefined;
  return t >= TEMP_HOT ? 'var(--color-error, #ef5350)' : undefined;
}

/** 配置里的多实体字段：数组或逗号分隔字符串都接受。 */
export function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** 去掉名称里的「单位词」，留下干净的设备/磁盘名。 */
export function cleanName(raw, dropRe, fallback) {
  const cleaned = String(raw || '')
    .replace(dropRe, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[-–—·|]+$/g, '')
    .trim();
  return cleaned || fallback;
}

const DISK_DROP =
  /[（(]?\s*(已用|已使用|已占用|使用|占用|可用|剩余|空闲|空间|容量|温度|百分比)\s*[)）]?/gi;
const DISK_DROP_EN =
  /[（(]?\s*(used|usage|free|available|space|size|total|temp|temperature|percent)\s*[)）]?/gi;

/** 从硬盘实体的名字里猜一个干净的盘符名。 */
export function diskName(entity, index, fallback) {
  const raw =
    (entity && entity.attributes && entity.attributes.friendly_name) ||
    (entity && entity.entity_id) ||
    '';
  const cleaned = cleanName(raw, DISK_DROP, '')
    .replace(DISK_DROP_EN, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || `${fallback} ${index + 1}`;
}

const BATT_DROP =
  /[（(]?\s*(电量|电池|充电|状态|百分比|剩余|正在充电|是否充电)\s*[)）]?/gi;
const BATT_DROP_EN =
  /[（(]?\s*(battery|level|charge|charging|status|percent|percentage|state)\s*[)）]?/gi;

/** 从电量实体的名字里猜一个干净的设备名。 */
export function batteryName(entity, index, fallback) {
  const raw =
    (entity && entity.attributes && entity.attributes.friendly_name) ||
    (entity && entity.entity_id) ||
    '';
  const cleaned = cleanName(raw, BATT_DROP, '')
    .replace(BATT_DROP_EN, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || `${fallback} ${index + 1}`;
}

/**
 * 只填了「已用」时，从全部实体里猜配对的「可用」实体。
 * （和电脑监控卡片同一套猜测规则，两边保持一致。）
 */
export function guessFreeId(usedId, all) {
  if (!usedId) return '';
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

/** 充电状态实体 → 是否在充电（兼容 on/true/charging/正在充电…）。 */
export function isChargingState(state) {
  if (state === null || state === undefined) return null;
  const s = String(state).trim().toLowerCase();
  if (!s || s === 'unknown' || s === 'unavailable') return null;
  if (['on', 'true', 'yes', '1', 'charging', 'charge', 'plugged', 'plugged_in'].indexOf(s) >= 0) {
    return true;
  }
  if (['off', 'false', 'no', '0', 'discharging', 'not_charging', 'unplugged', 'idle'].indexOf(s) >= 0) {
    return false;
  }
  if (s.indexOf('充电') >= 0 && s.indexOf('未') < 0 && s.indexOf('没') < 0) return true;
  if (s.indexOf('放电') >= 0) return false;
  return null;
}
