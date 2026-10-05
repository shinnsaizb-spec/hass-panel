import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiMapMarkerRadius,
  mdiMapMarkerOff,
  mdiHome,
  mdiWalk,
  mdiBattery,
  mdiCrosshairsGps,
  mdiPlus,
  mdiMinus,
  mdiImageFilterCenterFocus,
} from '@mdi/js';
import { Map, APILoader, Marker } from '@uiw/react-amap';
import { useEntity } from '@hakit/core';
import BaseCard from '../BaseCard';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';

/* ============================================================================
 * 高德地图 Key —— 在面板「全局配置 → 地图」里填写
 *
 * ⚠️ 不要把 Key 写死在这个文件里：源码会提交到 git 仓库，公开后会泄露。
 *    现在 Key 存在面板的本地配置里（data 目录，不进 git）。
 *
 * 申请步骤：
 *   1. 打开高德开放平台 https://console.amap.com/dev/key/app
 *   2. 注册并登录开发者账号
 *   3. 「应用管理」→「创建新应用」
 *   4. 点击「添加 Key」，「服务平台」必须选择「Web端(JS API)」
 *   5. 把 Key 填到「全局配置 → 地图 → 高德地图 Key」
 *
 * 安全提示：前端明文 Key 有被抓取盗用的风险，请在控制台给 Key 配置「域名白名单」（Referer 限制）。
 * ========================================================================== */

const DEFAULT_ZOOM = 15;
/** 点击列表里单个定位时的聚焦级别（比默认更近，突出这个人/设备） */
const FOCUS_ZOOM = 16;
const DEFAULT_COLOR = '#1677ff';

/**
 * 读取高德 Key：优先用卡片自己的配置，其次用「全局配置」里填的。
 * 运行时从 window.globalConfigCache 取（由 configApi.getConfig / setGlobalConfig 写入）。
 */
function getAmapKey(config) {
  const fromCard = String((config && config.amapKey) || '').trim();
  if (fromCard) return fromCard;
  try {
    const g = (typeof window !== 'undefined' && window.globalConfigCache) || {};
    return String(g.amapKey || '').trim();
  } catch (_) {
    return '';
  }
}

/** Key 是否已配置（不是空、也不是占位符） */
const isKeyConfigured = (k) =>
  Boolean(k) && !String(k).startsWith('请') && !String(k).startsWith('Please');

const isImageUrl = (s) => /^https?:\/\//i.test((s || '').trim());
const isIconifyName = (s) => /^[a-z0-9-]+:[a-z0-9-]+$/i.test((s || '').trim());

/** 放进 HTML 属性前先转义引号，避免网址里的引号破坏标签结构 */
const escapeAttr = (s) => String(s).replace(/"/g, '%22').replace(/</g, '%3C').replace(/>/g, '%3E');

/** 把 HA 的状态值翻译成可读文案 */
function formatState(state, t) {
  if (state === 'home') return t('map.stateHome');
  if (state === 'not_home') return t('map.stateAway');
  if (!state || state === 'unknown' || state === 'unavailable') return t('map.stateUnknown');
  return state;
}

/**
 * 去掉设备名里自带的「位置」二字。
 * Home Assistant 的 friendly_name 很多是「90M位置」「XX的手机位置」这种，
 * 列表里一行会变成「90M 位置 🏠 在家」，重复又啰嗦。
 * 这里只清掉「位置」（含前面的「的」），其它字原样保留。
 * 如果卡片配置里手动填了名字，就以手填的为准，不做处理。
 */
function stripLocationWord(name) {
  const raw = String(name || '').trim();
  const cleaned = raw.replace(/的?位置/g, '').trim();
  return cleaned || raw;
}

/** 把时间戳格式化成「几分钟前」 */
function formatRelative(ts, t) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return `${t('map.updatedAt')} <1min`;
  if (minutes < 60) return `${t('map.updatedAt')} ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${t('map.updatedAt')} ${hours}h`;
  return `${t('map.updatedAt')} ${Math.floor(hours / 24)}d`;
}

/* ===== 坐标系转换：WGS-84 → GCJ-02 =====
 * Home Assistant 的 device_tracker 上报的是 GPS 原始坐标（WGS-84），
 * 而高德地图用的是国测局加密坐标（GCJ-02），两者在中国境内相差几百米。
 * 不做转换的话图钉会明显偏离真实位置。
 * 下面是业界通用的标准偏移算法。 */
const PI = Math.PI;
const AXIS = 6378245.0; // 克拉索夫斯基椭球长半轴
const ECC = 0.00669342162296594323; // 椭球偏心率的平方

/** 中国大陆粗略范围之外不做偏移（境外坐标本来就该保持原样） */
function outOfChina(lng, lat) {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
}

function transformLat(x, y) {
  let ret =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

/** WGS-84（GPS 原始）转 GCJ-02（高德/国测局） */
function wgs84ToGcj02(lng, lat) {
  if (outOfChina(lng, lat)) return { lng, lat };
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECC * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((AXIS * (1 - ECC)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  return { lng: lng + dLng, lat: lat + dLat };
}

/** 从实体属性里取出经纬度，取不到返回 null；convert 为真时做坐标系纠偏 */
function readPosition(entity, convert) {
  const attrs = entity?.attributes || {};
  const lat = parseFloat(attrs.latitude);
  const lng = parseFloat(attrs.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const p = convert ? wgs84ToGcj02(lng, lat) : { lng, lat };
  return { lat: p.lat, lng: p.lng };
}

/**
 * 生成标记内部的内容 HTML。
 * 支持三种图标写法：图片网址 / Emoji 或短文字 / Iconify 名称。
 * 图标加载失败时至少还保留一个带颜色的图钉，不会变成空白。
 */
function buildIconInnerHtml(icon) {
  const value = (icon || '').trim();

  if (isImageUrl(value)) {
    return `<img src="${escapeAttr(value)}" alt="" style="width:18px;height:18px;object-fit:contain;border-radius:50%;display:block;" />`;
  }

  if (isIconifyName(value)) {
    const [prefix, name] = value.split(':');
    const url = `https://api.iconify.design/${escapeAttr(prefix)}/${escapeAttr(
      name
    )}.svg?color=%23ffffff&width=18&height=18`;
    return `<img src="${url}" alt="" style="width:18px;height:18px;display:block;" />`;
  }

  if (value) {
    // Emoji 或一两个汉字，直接当文字画上去
    return `<span style="font-size:14px;line-height:1;">${escapeAttr(value)}</span>`;
  }

  // 没配图标：画一个小白点
  return `<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:block;"></span>`;
}

/** 生成一个水滴形图钉的 HTML，作为 Marker 的 content */
function buildMarkerHtml(icon, color) {
  const bg = color || DEFAULT_COLOR;
  return (
    `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
    `background:${bg};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);` +
    `display:flex;align-items:center;justify-content:center;">` +
    `<div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">` +
    buildIconInnerHtml(icon) +
    `</div></div>`
  );
}

// 聚合标记用中性深色，和单个设备的彩色图钉区分开
const CLUSTER_COLOR = '#455A64';

/** 生成聚合标记的 HTML：圆形，中间显示重叠的数量 */
function buildClusterHtml(count) {
  const size = count >= 100 ? 44 : count >= 10 ? 40 : 36;
  return (
    `<div style="min-width:${size}px;height:${size}px;padding:0 8px;box-sizing:border-box;` +
    `border-radius:50%;background:${CLUSTER_COLOR};border:2px solid #fff;` +
    `box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;` +
    `color:#fff;font-size:14px;font-weight:600;line-height:1;">${count}</div>`
  );
}

/** 把各种历史配置形态统一成 trackers 数组 */
function normalizeTrackers(config) {
  const list = Array.isArray(config?.trackers) ? config.trackers : [];
  const valid = list.filter((tr) => tr && tr.entity_id);

  // 兼容早期只支持单个实体的配置
  if (valid.length === 0 && config?.entity_id) {
    return [{ id: 'legacy', entity_id: config.entity_id, name: '', icon: '', color: DEFAULT_COLOR }];
  }
  return valid;
}

/**
 * 单个标记。
 *
 * ⚠️ 这里必须把 position / offset / content 用 useMemo 固定住引用。
 * react-amap 内部是靠 `eventHandle !== state` 这种「引用比较」来决定要不要调
 * AMap 的 setter 的（见 @uiw/react-amap-utils 的 useSettingProperties）。
 * 如果每次渲染都 `new AMap.LngLat(...)`，引用永远不相等 → 反复调用 setter
 * → setState → 重渲染 → 又是不相等的新对象，形成无限循环并让 AMap 抛错。
 */
function TrackerMarker({ AMap, item }) {
  const lng = item.position.lng;
  const lat = item.position.lat;

  const position = useMemo(() => new AMap.LngLat(lng, lat), [AMap, lng, lat]);
  const offset = useMemo(() => new AMap.Pixel(-15, -30), [AMap]);
  const content = useMemo(
    () => buildMarkerHtml(item.icon, item.color),
    [item.icon, item.color]
  );

  return (
    <Marker
      visible
      position={position}
      offset={offset}
      content={content}
      title={item.displayName}
    />
  );
}

/**
 * 多个定位重叠时的聚合标记：一个圆形，中间显示重叠的数量。
 * 同样要把 position / offset / content 的引用固定住，原因见上面 TrackerMarker 的说明。
 */
function ClusterMarker({ AMap, cluster, title }) {
  const lng = cluster.position.lng;
  const lat = cluster.position.lat;

  const position = useMemo(() => new AMap.LngLat(lng, lat), [AMap, lng, lat]);
  const offset = useMemo(() => new AMap.Pixel(-18, -18), [AMap]);
  const content = useMemo(() => buildClusterHtml(cluster.count), [cluster.count]);

  return (
    <Marker visible position={position} offset={offset} content={content} title={title} />
  );
}

function MapCard({ config }) {
  const { t } = useLanguage();
  const titleVisible = config?.titleVisible;
  const title = config?.title || t('cardTitles.map');
  const zoom = Number(config?.zoom) || DEFAULT_ZOOM;

  const trackers = useMemo(() => normalizeTrackers(config), [config]);
  // 默认开启 WGS-84 → GCJ-02 纠偏；若某些设备本身上报的就是 GCJ-02，可关掉
  const convertCoord = config?.convertCoord !== false;
  // 高德 Key：从「全局配置 → 地图」读取（不进源码、不进 git）
  const amapKey = getAmapKey(config);

  // 设备列表变化时强制重建内部组件，保证 useEntity 的调用顺序始终稳定
  const remountKey = useMemo(
    () => trackers.map((tr) => `${tr.id || ''}:${tr.entity_id}`).join('|'),
    [trackers]
  );

  if (trackers.length === 0) {
    return (
      <BaseCard title={title} titleVisible={titleVisible} icon={mdiMapMarkerRadius}>
        <div className="map-card-placeholder">
          <Icon path={mdiMapMarkerOff} size={26} />
          <span>{t('map.noTrackers')}</span>
        </div>
      </BaseCard>
    );
  }

  return (
    <MapCardInner
      key={remountKey}
      trackers={trackers}
      title={title}
      titleVisible={titleVisible}
      zoom={zoom}
      convertCoord={convertCoord}
      amapKey={amapKey}
    />
  );
}

function MapCardInner({ trackers, title, titleVisible, zoom, convertCoord, amapKey }) {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  // 上一次自动全览时「有定位的设备集合」签名，用来判断要不要重新取景
  const fittedSignature = useRef('');
  const [activeId, setActiveId] = useState(null);

  // 每个设备一次 useEntity。设备数量变化时外层会通过 key 重建本组件，
  // 所以这里的调用顺序在同一实例内始终是固定的。
  const entities = trackers.map((tracker) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useEntity(tracker.entity_id);
  });

  const items = trackers.map((tracker, index) => {
    const entity = entities[index];
    const attrs = entity?.attributes || {};
    const configuredName = (tracker.name || '').trim();
    return {
      key: tracker.id || tracker.entity_id,
      entity_id: tracker.entity_id,
      icon: tracker.icon,
      color: tracker.color,
      position: readPosition(entity, convertCoord),
      // 手填了名字就用手填的；否则用 friendly_name，并去掉里面多余的「位置」二字
      displayName:
        configuredName ||
        stripLocationWord(attrs.friendly_name || tracker.entity_id || t('map.unnamed')),
      stateText: formatState(entity?.state, t),
      isHome: entity?.state === 'home',
      battery: attrs.battery_level,
      accuracy: attrs.gps_accuracy,
      relativeTime: formatRelative(entity?.last_updated || entity?.last_changed, t),
    };
  });

  // 同一位置附近的多个设备（比如两台车都停在家里）在图上看会完全重叠、互相遮挡。
  // 这里按「当前缩放级别下会不会视觉重叠」把它们聚合成一个点，点内显示数量。
  // 注意不能用坐标精确相等来判断：两台设备在家里的 GPS 读数通常差好几米，
  // 但在缩放级别 15 下只有两三个像素，肉眼看就是一个点。
  //
  // 另外这里用普通对象/数组而不是 JS 内置的 Map —— 本文件顶部从 @uiw/react-amap
  // 导入了名为 Map 的地图组件，它会遮蔽内置的 Map 构造函数，
  // 写 `new Map()` 会变成 `new (React组件)()` 并抛 "Map is not a constructor"。
  const clusters = useMemo(() => {
    const withPos = items.filter((it) => it.position);
    if (withPos.length === 0) return [];

    // 估算当前缩放下的地面分辨率（米/像素），用来判断「多近才算会重叠」
    const lat0 = withPos[0].position.lat;
    const mPerDegLng = 111320 * Math.cos((lat0 * PI) / 180);
    const mPerDegLat = 110540;
    const mPerPx = (156543.03392 * Math.cos((lat0 * PI) / 180)) / Math.pow(2, zoom);
    const tolM = mPerPx * 26; // 26 像素以内视为会互相遮挡

    const used = new Array(withPos.length).fill(false);
    const out = [];
    for (let i = 0; i < withPos.length; i++) {
      if (used[i]) continue;
      const group = [withPos[i]];
      used[i] = true;
      for (let j = i + 1; j < withPos.length; j++) {
        if (used[j]) continue;
        const dx = (withPos[j].position.lng - withPos[i].position.lng) * mPerDegLng;
        const dy = (withPos[j].position.lat - withPos[i].position.lat) * mPerDegLat;
        if (Math.sqrt(dx * dx + dy * dy) <= tolM) {
          group.push(withPos[j]);
          used[j] = true;
        }
      }
      // 聚合点放在组内坐标的平均位置
      const lng = group.reduce((s, it) => s + it.position.lng, 0) / group.length;
      const lat = group.reduce((s, it) => s + it.position.lat, 0) / group.length;
      out.push({
        key: group.map((it) => it.key).join('|'),
        items: group,
        count: group.length,
        position: { lng, lat },
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items.map((it) => [it.key, it.position])), zoom]);

  const firstLocated = items.find((it) => it.position) || null;
  const firstLocatedKey = firstLocated ? firstLocated.key : null;
  const current = items.find((it) => it.key === activeId) || firstLocated;

  // 点击列表项时只切换选中项，真正的居中统一由下面的 effect 处理
  const centerOn = (item) => {
    if (!item?.position) return;
    setActiveId(item.key);
  };

  // ===== 右下角地图控制按钮 =====
  // 当桌面壁纸用时滚轮不可用（壁纸引擎不会把滚轮事件转发给网页），所以提供按钮操作。
  const zoomBy = (delta) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const current = typeof map.getZoom === 'function' ? map.getZoom() : zoom;
      const next = Math.min(18, Math.max(3, (current || zoom) + delta));
      map.setZoom(next);
    } catch (err) {
      console.warn('[MapCard] 缩放失败:', err);
    }
  };

  /**
   * 把视野调整到能装下「所有」定位点。
   * 优先自己算经纬度范围再 setBounds —— 它不依赖标记是否已经渲染完成，
   * 比 setFitView 更稳（首次加载时标记往往还没挂到地图上）。
   */
  const fitToAll = (map) => {
    const located = items.filter((it) => it.position);
    if (!map || located.length === 0) return false;

    const lngs = located.map((it) => it.position.lng);
    const lats = located.map((it) => it.position.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    try {
      // 所有点几乎重合时 setBounds 会把视野拉到最大级，所以直接居中放大
      if (maxLng - minLng < 0.0002 && maxLat - minLat < 0.0002) {
        map.setZoomAndCenter(FOCUS_ZOOM, [centerLng, centerLat]);
        return true;
      }
      // setBounds 自己不带内边距，得手动把范围往外扩一圈：
      // 否则贴着边缘的图钉（水滴形还拖着个尾巴）会被切掉一半，看上去就是「没显示全」
      const padLng = Math.max((maxLng - minLng) * 0.35, 0.002);
      const padLat = Math.max((maxLat - minLat) * 0.35, 0.002);
      const AMapNS = typeof window !== 'undefined' ? window.AMap : null;
      if (AMapNS && typeof AMapNS.Bounds === 'function' && typeof map.setBounds === 'function') {
        map.setBounds(
          new AMapNS.Bounds(
            new AMapNS.LngLat(minLng - padLng, minLat - padLat),
            new AMapNS.LngLat(maxLng + padLng, maxLat + padLat)
          )
        );
        return true;
      }
      if (typeof map.setFitView === 'function') {
        map.setFitView(null, false, [60, 60, 60, 60], 17);
        return true;
      }
    } catch (err) {
      console.warn('[MapCard] 自适应视野失败:', err);
    }
    return false;
  };

  const fitAll = () => {
    const map = mapRef.current;
    setActiveId(null);
    if (!map) return;
    if (fitToAll(map)) return;
    // 兜底：居中到所有聚合点的中心
    if (clusters.length === 0) return;
    const lng = clusters.reduce((s, c) => s + c.position.lng, 0) / clusters.length;
    const lat = clusters.reduce((s, c) => s + c.position.lat, 0) / clusters.length;
    try {
      map.setZoomAndCenter(zoom, [lng, lat]);
    } catch (err) {
      console.warn('[MapCard] 居中失败:', err);
    }
  };

  // 「有定位的设备」签名：坐标的小幅漂移不算变化，避免地图跟着抖动
  const locatedSignature = items
    .filter((it) => it.position)
    .map((it) => it.key)
    .sort()
    .join('|');

  /**
   * 自动全览：只要「有定位的设备集合」变了，就重新取一次能装下所有点的视野。
   * 之所以不用「只做一次」，是因为 HA 的实体是陆续连上的 ——
   * 第一次往往只有 1 个设备有坐标，等别的设备也上报后必须再扩大一次视野，
   * 否则后上线的点会落在视野外（也就是「看不全定位点」）。
   */
  useEffect(() => {
    if (!locatedSignature) return;
    let cancelled = false;
    let tries = 0;

    const attempt = () => {
      if (cancelled) return;
      const map = mapRef.current;

      // ⚠️ 地图是异步创建出来的（APILoader 要先拉高德脚本），
      // 而这个 effect 首次执行时地图往往还没好；mapRef 是 ref，赋值不触发重渲染，
      // 所以依赖不变的话这个 effect 不会再跑一次 —— 这就是「初始只显示单个点」的原因。
      // 这里自己轮询重试，直到拿到地图实例为止。
      if (!map) {
        if (tries++ < 30) setTimeout(attempt, 300);
        return;
      }

      // 用户点选了某个具体设备 -> 视野交给他选的点，不要抢回来
      if (activeId) {
        fittedSignature.current = locatedSignature;
        return;
      }
      if (fittedSignature.current === locatedSignature) return;
      try {
        if (fitToAll(map)) {
          fittedSignature.current = locatedSignature;
        }
      } catch (err) {
        console.warn('[MapCard] 自动全览失败:', err);
      }
    };

    attempt();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locatedSignature, activeId]);

  // 选中项或其定位变化时，视野跟过去
  const activePosition = current?.position
    ? `${current.position.lat},${current.position.lng}`
    : '';
  useEffect(() => {
    if (!activeId || !mapRef.current || !activePosition) return;
    const [lat, lng] = activePosition.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
      // 点单个定位：以该点为中心拉近聚焦（至少到 FOCUS_ZOOM）
      mapRef.current.setZoomAndCenter(Math.max(zoom, FOCUS_ZOOM), [lng, lat]);
    } catch (err) {
      console.warn('[MapCard] 居中失败:', err);
    }
  }, [activeId, activePosition, zoom]);

  // ⚠️ 这个数组必须是「稳定引用」：react-amap 靠引用比较来决定要不要重新 setCenter，
  // 每次渲染都新建一个 [lng, lat] 的话，任何一次重渲染（例如主页鼠标移到右上角
  // 呼出工具栏触发的 setState）都会把地图硬拽回第一个点。
  // 所以只在第一次拿到坐标时算一次，之后视野完全交给 fitToAll / setZoomAndCenter。
  const initialCenterRef = useRef(null);
  if (!initialCenterRef.current && clusters.length > 0) {
    initialCenterRef.current = [clusters[0].position.lng, clusters[0].position.lat];
  }
  const mapCenter = initialCenterRef.current;

  return (
    <BaseCard className="map-card" title={title} titleVisible={titleVisible} icon={mdiMapMarkerRadius}>
      <div className="map-card-body">
        {!isKeyConfigured(amapKey) ? (
          <div className="map-card-placeholder">
            <Icon path={mdiMapMarkerOff} size={26} />
            <span>{t('map.loadFailed')}</span>
          </div>
        ) : !mapCenter ? (
          <div className="map-card-placeholder">
            <Icon path={mdiCrosshairsGps} size={26} />
            <span>{t('map.noPosition')}</span>
          </div>
        ) : (
          <>
            <APILoader akey={amapKey} version="2.0">
              <Map
                className="map-card-canvas"
                style={{ height: '100%', width: '100%' }}
                zoom={zoom}
                center={mapCenter}
                viewMode="2D"
              >
                {({ AMap, map }) => {
                  mapRef.current = map;
                  if (!AMap) return null;
                  return (
                    <>
                      {clusters.map((cluster) =>
                        cluster.count > 1 ? (
                          <ClusterMarker
                            key={cluster.key}
                            AMap={AMap}
                            cluster={cluster}
                            title={`${cluster.count} 个定位重叠`}
                          />
                        ) : (
                          <TrackerMarker
                            key={cluster.key}
                            AMap={AMap}
                            item={cluster.items[0]}
                          />
                        )
                      )}
                    </>
                  );
                }}
              </Map>
            </APILoader>

            {/* 左上角设备列表，点击跳转到对应定位 */}
            <div className="map-card-list">
              <div className="map-card-list-title">{t('map.listTitle')}</div>
              <div className="map-card-list-items">
                {items.map((item) => {
                  const isActive = activeId ? activeId === item.key : item.key === firstLocatedKey;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={`map-card-list-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => centerOn(item)}
                      disabled={!item.position}
                      title={item.position ? t('map.locate') : t('map.noLocation')}
                    >
                      <span
                        className="map-card-list-dot"
                        style={{ background: item.color || DEFAULT_COLOR }}
                      />
                      <span className="map-card-list-name">{item.displayName}</span>
                      <span className="map-card-list-state">
                        <Icon path={item.isHome ? mdiHome : mdiWalk} size={11} />
                        {item.position ? item.stateText : t('map.noLocation')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 右下角地图控制：壁纸模式下滚轮不可用，所以提供按钮 */}
            <div className="map-card-controls">
              <button
                type="button"
                className="map-card-ctrl"
                onClick={() => zoomBy(1)}
                title={t('map.zoomIn')}
                aria-label={t('map.zoomIn')}
              >
                <Icon path={mdiPlus} size={16} />
              </button>
              <button
                type="button"
                className="map-card-ctrl"
                onClick={() => zoomBy(-1)}
                title={t('map.zoomOut')}
                aria-label={t('map.zoomOut')}
              >
                <Icon path={mdiMinus} size={16} />
              </button>
              <button
                type="button"
                className="map-card-ctrl"
                onClick={fitAll}
                title={t('map.fitAll')}
                aria-label={t('map.fitAll')}
              >
                <Icon path={mdiImageFilterCenterFocus} size={16} />
              </button>
            </div>

            {/* 底部信息条：展示当前选中设备的状态 */}
            {current && (
              <div className="map-card-footer">
                <span className="map-card-footer-name">{current.displayName}</span>
                {current.battery !== undefined && current.battery !== null && (
                  <span className="map-card-meta">
                    <Icon path={mdiBattery} size={11} />
                    {current.battery}%
                  </span>
                )}
                {current.accuracy !== undefined && current.accuracy !== null && (
                  <span className="map-card-meta">
                    {t('map.accuracy')}: ±{Math.round(current.accuracy)}m
                  </span>
                )}
                {current.relativeTime && (
                  <span className="map-card-meta">{current.relativeTime}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BaseCard>
  );
}

export default MapCard;
