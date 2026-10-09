import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import Icon from '@mdi/react';
import { mdiPlay, mdiStop } from '@mdi/js';
import Modal from '../Modal';
import { useLanguage } from '../../i18n/LanguageContext';
import PTZControls from '../PTZControls';
import './style.css';

// ==============================================================================
// 监控卡片
// ------------------------------------------------------------------------------
// 两种状态：
//   ① 默认 = 静态画面：直接用 hakit 的 useCamera 给出的地址（`camera.poster.url`，
//      取不到时退回 `camera.mjpeg.url`）。面板不做二次代理、不额外拉流，
//      看板挂着很省。点画面可以放大（弹窗里有 PTZ）。
//   ② 点卡片上的「播放」= 在**卡片里**直接放流（WebRTC iframe），再点一次停。
// ==============================================================================

// 静态图默认刷新间隔（秒）。和 config 页那个字段的 default 保持一致。
const DEFAULT_REFRESH_SEC = 10;

function CameraCard({
  camera,
  streamUrl,
  name,
  playUrl,
  supports_ptz,
  // 静态图刷新间隔（秒）。0 / 不填 = 不刷新（只在卡片挂载时取一帧）。
  refreshInterval,
  // 播放状态由外层（CameraSection）管：有标题时播放键在标题栏，没标题时才画在卡片上
  playing = false,
  onTogglePlaying,
  showOwnButton = true,
}) {
  const entityId = camera?.entity_id;
  const { t } = useLanguage();

  const togglePlaying = () => {
    if (onTogglePlaying) onTogglePlaying();
  };
  const [useHls, setUseHls] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  // 加载失败过的地址。按顺序试：HA 的签名缩略图（poster）→ MJPEG 流（mjpeg）。
  // ⚠️ 用「试过就跳过」而不是简单的 `poster || mjpeg`：poster 地址字符串存在、但浏览器
  //    加载不出来时（实测会被 Chrome 的 ORB 以 ERR_BLOCKED_BY_ORB 拦掉），
  //    简单 || 会一直卡在那个坏地址上，图永远出不来。
  const [failedUrls, setFailedUrls] = useState([]);
  // 每次定时刷新 +1，用来给地址加时间戳，逼浏览器重取（见下面 displayUrl）
  const [tick, setTick] = useState(0);

  const webrtcPlayUrl = playUrl || streamUrl;
  const hlsUrl = camera?.stream?.url;
  const supportsPTZ = supports_ptz === true;
  const displayName = name || camera?.attributes?.friendly_name || entityId;

  const candidates = [camera?.poster?.url, camera?.mjpeg?.url].filter(Boolean);
  const posterUrl = candidates.find((u) => !failedUrls.includes(u)) || null;
  // 选中的是 mjpeg 时说明在用实时流（画面本来就在动），不需要、也不该按间隔重连
  const isLiveStream = !!posterUrl && posterUrl === camera?.mjpeg?.url;
  // HA 的 camera_proxy 响应不带任何缓存头，但 <img src> 不变浏览器就不会重新请求，
  // 所以刷新得靠改地址：追加一个每次都不同的 _t 参数。
  const displayUrl =
    posterUrl && !isLiveStream && tick
      ? `${posterUrl}${posterUrl.includes('?') ? '&' : '?'}_t=${tick}`
      : posterUrl;

  const markFailed = (url) => {
    if (!url) return;
    setFailedUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  // 没填 = 用默认值；填 0 = 不刷新
  const refreshSec =
    refreshInterval === undefined || refreshInterval === null || refreshInterval === ''
      ? DEFAULT_REFRESH_SEC
      : Number(refreshInterval);
  const refreshMs = Number.isFinite(refreshSec) && refreshSec > 0 ? refreshSec * 1000 : 0;

  // 换摄像头时重置画面状态
  useEffect(() => {
    setImageLoaded(false);
    setFailedUrls([]);
    setTick(0);
  }, [entityId]);

  // 定时刷新（播放中不刷新：那会儿看的是实时流，用不着静态图）
  // 走 mjpeg 兜底时也不刷 —— 那本来就是实时流，重连没意义还可能闪。
  useEffect(() => {
    if (!refreshMs || playing || isLiveStream) return undefined;
    const id = setInterval(() => {
      if (typeof camera?.poster?.refresh === 'function') {
        // 让 hakit 重新签一次地址：HA 的 authSig 是有有效期的，
        // 光给旧地址加时间戳救不回来（过期后重取会 403）。
        camera.poster.refresh();
      } else {
        // 拿不到 refresh 能力时退化成「改地址强制重取」
        setTick((n) => n + 1);
      }
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, playing, isLiveStream, camera]);

  // iframe 能不能用（沿用原来的探测逻辑）
  useEffect(() => {
    if (!webrtcPlayUrl) return;
    fetch(webrtcPlayUrl)
      .then((res) => res.text())
      .then((data) => {
        if (data.includes('Hass Panel') || data.includes('502 Bad Gateway')) setUseHls(true);
      })
      .catch(() => setUseHls(true));
  }, [webrtcPlayUrl]);

  if (!camera) return null;

  const openModal = () => {
    setIsModalVisible(true);
    setIsLoading(true);
  };

  return (
    <div className="camera-card">
      <div className="camera-preview">
        {playing ? (
          /* ---------- 播放中：卡片里直接放流 ---------- */
          <div className="camera-live">
            {!useHls && webrtcPlayUrl ? (
              <iframe
                src={`${webrtcPlayUrl}${webrtcPlayUrl.includes('?') ? '&' : '?'}scrolling=no`}
                title={displayName}
                frameBorder="0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                className="stream-iframe"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            ) : (
              <div className="camera-live-hint">
                {hlsUrl ? t('camera.hlsNotSupported') : t('camera.loadError')}
              </div>
            )}
          </div>
        ) : (
          /* ---------- 默认：静态画面 ---------- */
          <div className="camera-snap" onClick={openModal}>
            {posterUrl ? (
              <>
                {/* 骨架屏是 absolute 铺满 + 不透明底，只有「确实有图在加载」时才该盖上去 */}
                {!imageLoaded ? (
                  <div className="camera-skeleton">
                    <div className="skeleton-image pulse" />
                  </div>
                ) : null}
                <img
                  src={displayUrl}
                  alt={displayName}
                  className={`camera-image ${imageLoaded ? 'loaded' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => markFailed(posterUrl)}
                />
              </>
            ) : (
              <div className="camera-live-hint">{t('camera.loadError')}</div>
            )}
          </div>
        )}

        <div className="camera-name">{displayName}</div>

        {/* 没标题栏时才在卡片右下角画播放键（有标题时它由 CameraSection 放到标题右边） */}
        {showOwnButton ? (
          <button
            type="button"
            className={`camera-play-btn corner ${playing ? 'playing' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePlaying();
              setIsLoading(true);
            }}
            title={playing ? t('camera.stop') : t('camera.play')}
          >
            <Icon path={playing ? mdiStop : mdiPlay} size={24} />
          </button>
        ) : null}
      </div>

      {/* 放大：弹窗里放大的画面 + PTZ */}
      <Modal visible={isModalVisible} onClose={() => setIsModalVisible(false)} title={displayName}>
        <div className="camera-stream">
          {isLoading ? (
            <div className="loading-container">
              <Spin />
              <span className="loading-text">{t('camera.loading')}</span>
            </div>
          ) : null}
          {!webrtcPlayUrl && !hlsUrl ? (
            <div className="error-container">
              <span className="error-text">{t('camera.loadError')}</span>
            </div>
          ) : null}
          {!useHls && webrtcPlayUrl ? (
            <iframe
              src={`${webrtcPlayUrl}${webrtcPlayUrl.includes('?') ? '&' : '?'}scrolling=no`}
              title={displayName}
              frameBorder="0"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin"
              scrolling="no"
              className="stream-iframe"
              onLoad={(e) => {
                setIsLoading(false);
                try {
                  e.target.contentWindow.postMessage({ type: 'disable-scroll' }, '*');
                } catch (err) {
                  /* 跨域时忽略 */
                }
              }}
              onError={() => setIsLoading(false)}
            />
          ) : null}
          {!useHls && entityId && entityId.startsWith('camera.') && supportsPTZ ? (
            <PTZControls entityId={entityId} stream_url={streamUrl} />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default CameraCard;
