import React, { useEffect, useRef } from 'react';
import Icon from '@mdi/react';
import {
  mdiMapMarkerRadius,
  mdiMapMarkerOff,
  mdiHome,
  mdiWalk,
  mdiBattery,
  mdiCrosshairsGps,
} from '@mdi/js';
import { Map, APILoader, Marker } from '@uiw/react-amap';
import { useEntity } from '@hakit/core';
import BaseCard from '../BaseCard';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';

/* ============================================================================
 * 高德地图 Key —— 必须替换成你自己的，否则地图无法显示
 *
 * 申请步骤：
 *   1. 打开高德开放平台 https://console.amap.com/dev/key/app
 *   2. 注册并登录开发者账号
 *   3. 「应用管理」→「创建新应用」
 *   4. 点击「添加 Key」，「服务平台」一项必须选择「Web端(JS API)」
 *   5. 把拿到的 Key 替换下面这个字符串
 *
 * 安全提示：前端明文 Key 存在被他人抓取盗用的风险。
 *   个人使用请在控制台给 Key 配置「域名白名单」（Referer 限制）；
 *   对外商用则应由后端代理转发鉴权，不要把 Key 直接放在前端。
 * ========================================================================== */
const AMAP_KEY = '请在高德开放平台申请您自己的key后替换此占位符';

const DEFAULT_ZOOM = 15;

/** Key 是否已被替换成真实值 */
const isKeyConfigured = () =>
  Boolean(AMAP_KEY) && !AMAP_KEY.startsWith('请') && !AMAP_KEY.startsWith('Please');

/** 把 HA 的状态值翻译成可读文案 */
function formatState(state, t) {
  if (state === 'home') return t('map.stateHome');
  if (state === 'not_home') return t('map.stateAway');
  if (!state || state === 'unknown' || state === 'unavailable') return t('map.stateUnknown');
  return state;
}

/** 把时间戳格式化成「几分钟前」 */
function formatRelative(ts, t) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('map.updatedAt') + ' <1min';
  if (minutes < 60) return `${t('map.updatedAt')} ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${t('map.updatedAt')} ${hours}h`;
  return `${t('map.updatedAt')} ${Math.floor(hours / 24)}d`;
}

function MapCard({ config }) {
  const { t } = useLanguage();
  const titleVisible = config?.titleVisible;
  const title = config?.title || t('cardTitles.map');
  const entityId = config?.entity_id;
  const zoom = Number(config?.zoom) || DEFAULT_ZOOM;

  // 未配置实体：给出明确指引，不渲染地图
  if (!entityId) {
    return (
      <BaseCard title={title} titleVisible={titleVisible} icon={mdiMapMarkerRadius}>
        <div className="map-card-placeholder">
          <Icon path={mdiMapMarkerOff} size={26} />
          <span>{t('map.noEntity')}</span>
        </div>
      </BaseCard>
    );
  }

  return (
    <MapCardInner
      entityId={entityId}
      title={title}
      titleVisible={titleVisible}
      zoom={zoom}
    />
  );
}

function MapCardInner({ entityId, title, titleVisible, zoom }) {
  const { t } = useLanguage();
  const entity = useEntity(entityId);
  const mapRef = useRef(null);

  const attributes = entity?.attributes || {};
  const latitude = parseFloat(attributes.latitude);
  const longitude = parseFloat(attributes.longitude);
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);

  // 定位变化时把视野跟过去
  useEffect(() => {
    if (mapRef.current && hasPosition) {
      mapRef.current.setZoomAndCenter(zoom, [longitude, latitude]);
    }
  }, [latitude, longitude, zoom, hasPosition]);

  const stateText = formatState(entity?.state, t);
  const isHome = entity?.state === 'home';
  const battery = attributes.battery_level;
  const relativeTime = formatRelative(entity?.last_updated || entity?.last_changed, t);
  const gpsAccuracy = attributes.gps_accuracy;

  return (
    <BaseCard title={title} titleVisible={titleVisible} icon={mdiMapMarkerRadius}>
      <div className="map-card-status">
        <span className={`map-card-badge ${isHome ? 'is-home' : 'is-away'}`}>
          <Icon path={isHome ? mdiHome : mdiWalk} size={12} />
          {stateText}
        </span>
        {battery !== undefined && battery !== null && (
          <span className="map-card-meta">
            <Icon path={mdiBattery} size={12} />
            {battery}%
          </span>
        )}
        {relativeTime && <span className="map-card-meta">{relativeTime}</span>}
      </div>

      <div className="map-card-body">
        {!isKeyConfigured() ? (
          <div className="map-card-placeholder">
            <Icon path={mdiMapMarkerOff} size={26} />
            <span>{t('map.loadFailed')}</span>
          </div>
        ) : !hasPosition ? (
          <div className="map-card-placeholder">
            <Icon path={mdiCrosshairsGps} size={26} />
            <span>{t('map.noPosition')}</span>
          </div>
        ) : (
          <APILoader akey={AMAP_KEY} version="2.0">
            <Map
              className="map-card-canvas"
              style={{ height: '100%', width: '100%' }}
              zoom={zoom}
              center={[longitude, latitude]}
              viewMode="2D"
            >
              {({ AMap, map }) => {
                mapRef.current = map;
                if (!AMap) return null;
                return (
                  <Marker
                    visible
                    position={new AMap.LngLat(longitude, latitude)}
                    title={attributes.friendly_name || entityId}
                  />
                );
              }}
            </Map>
          </APILoader>
        )}
      </div>

      {gpsAccuracy !== undefined && gpsAccuracy !== null && hasPosition && (
        <div className="map-card-footer">
          {t('map.accuracy')}: ±{Math.round(gpsAccuracy)}m
        </div>
      )}
    </BaseCard>
  );
}

export default MapCard;
