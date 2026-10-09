import React, { useState, useEffect, useRef } from 'react';
import { Spin } from 'antd';
import Icon from '@mdi/react';
import { mdiPlay, mdiStop } from '@mdi/js';
import Modal from '../Modal';
import { useLanguage } from '../../i18n/LanguageContext';
import { axiosInstance } from '../../utils/api';
import PTZControls from '../PTZControls';
import './style.css';

// ==============================================================================
// 监控卡片
// ------------------------------------------------------------------------------
// 两种状态：
//   ① 默认 = 定格画面：定时（15 秒）从后端代理取一帧 HA 的 camera_proxy 直接显示，
//      不拉流、不占带宽，看板挂着很省。点画面可以放大（弹窗里有 PTZ）。
//   ② 点卡片上的「播放」= 在**卡片里**直接放流（WebRTC iframe），再点一次停。
//
// 为什么定格画面走后端：HA 的 /api/camera_proxy 要带长期令牌，前端直连既跨域、
// 又会把令牌暴露在 URL 里；后端代取一次，前端拿 blob 显示（顺便把鉴权头带上）。
// ==============================================================================

const SNAPSHOT_INTERVAL_MS = 15000;

function CameraCard({
  camera,
  streamUrl,
  name,
  playUrl,
  supports_ptz,
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
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [snapFailed, setSnapFailed] = useState(false);
  const [useHls, setUseHls] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const blobRef = useRef(null);

  const webrtcPlayUrl = playUrl || streamUrl;
  const posterUrl = camera?.poster?.url || camera?.mjpeg?.url;
  const hlsUrl = camera?.stream?.url;
  const supportsPTZ = supports_ptz === true;
  const displayName = name || camera?.attributes?.friendly_name || entityId;

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

  // 定格画面：定时取一帧（播放中不取，省流量）
  useEffect(() => {
    // ⚠️ 拿不到 entity_id 时必须报错，不能静默 return ——
    //    否则状态一直是「没图、也没失败」，界面就永远停在「加载中」，
    //    看起来像卡住了，其实根因是 HA 那边连不上（比如令牌过期）。
    if (!entityId) {
      setSnapFailed(true);
      return undefined;
    }
    if (playing) return undefined;
    let alive = true;

    const tick = async () => {
      try {
        const resp = await axiosInstance.get(`/hass/camera_snapshot/${entityId}`, {
          responseType: 'blob',
          timeout: 8000,
        });
        if (!alive) return;
        const next = URL.createObjectURL(resp.data);
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = next;
        setSnapshotUrl(next);
        setSnapFailed(false);
      } catch (e) {
        if (alive) setSnapFailed(true);
      }
    };

    tick();
    const id = setInterval(tick, SNAPSHOT_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(id);
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
      setSnapshotUrl(null);
    };
  }, [entityId, playing]);

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
          /* ---------- 默认：定格画面 ---------- */
          <div className="camera-snap" onClick={openModal}>
            {/* ⚠️ 骨架屏是 absolute 铺满 + 不透明底，只有「确实有图在加载」时才该盖上去；
                没图（比如取帧失败、也没配封面图）时如果还盖着，下面的错误提示就看不见了 */}
            {!imageLoaded && (snapshotUrl || posterUrl) ? (
              <div className="camera-skeleton">
                <div className="skeleton-image pulse" />
              </div>
            ) : null}
            {snapshotUrl || posterUrl ? (
              <img
                src={snapshotUrl || posterUrl}
                alt={displayName}
                className={`camera-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            ) : (
              <div className="camera-live-hint">
                {snapFailed || !entityId ? t('camera.loadError') : t('camera.loading')}
              </div>
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
