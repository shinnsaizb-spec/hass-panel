import React, { useState } from 'react';
import { mdiCctv, mdiPlay, mdiStop } from '@mdi/js';
import Icon from '@mdi/react';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import CameraCard from '../CameraCard';
import './style.css';
import { useCamera} from '@hakit/core';
import { notification } from 'antd';

function CameraSection({ config, titleVisible }) {
  const { t } = useLanguage();

  // 正在播放的摄像头（按 entity_id 记）。
  // 状态放在这一层，是因为「有标题时播放键要出现在标题右边」——那个位置在 BaseCard 的
  // headerRight 里，得由外层渲染。
  const [playingIds, setPlayingIds] = useState({});
  const togglePlaying = (id) =>
    setPlayingIds((m) => ({ ...m, [id]: !m[id] }));

  const hasTitle = titleVisible !== false;


  const debugMode = localStorage.getItem('debugMode') === 'true';

  const cameraEntities = config.cameras.map(camera => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const entity = useCamera(camera.entity_id,{stream:true});
      return {
        ...camera,
        entity,
      };
    } catch (error) {
      if (debugMode) {
        notification.error({
          message: t('camera.loadError'),
          description: `${t('camera.loadErrorDesc')} ${error.message}`,
          placement: 'topRight',
          duration: 3,
          key: 'CameraSection',
        });
      }
      return {
        ...camera,
        entity: { state: null, error: true },
      };
    }
  });
  if (!cameraEntities || cameraEntities.length === 0) return null;

  return (
    <BaseCard
      title={config.title || t('cardTitles.camera')}
      titleVisible={titleVisible}
      icon={mdiCctv}
      // 有标题：播放键放标题右边
      headerRight={
        hasTitle
          ? (
            <div className="camera-header-actions">
              {cameraEntities.map((camera) => {
                const id = camera.entity_id;
                const playing = !!playingIds[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className={`camera-play-btn in-titlebar ${playing ? 'playing' : ''}`}
                    onClick={() => togglePlaying(id)}
                    title={`${camera.name || id} · ${playing ? t('camera.stop') : t('camera.play')}`}
                  >
                    <Icon path={playing ? mdiStop : mdiPlay} size={16} />
                  </button>
                );
              })}
            </div>
          )
          : null
      }
    >
      <div className="cameras-grid">
        {cameraEntities.map((camera) => (
          <CameraCard 
            key={camera.entity_id} 
            camera={camera.entity} 
            streamUrl={camera.stream_url}
            playUrl={camera.play_url}
            name={camera.name}
            supports_ptz={camera.supports_ptz}
            playing={!!playingIds[camera.entity_id]}
            onTogglePlaying={() => togglePlaying(camera.entity_id)}
            // 没标题时才在卡片右下角自己画一个播放键
            showOwnButton={!hasTitle}
          />
        ))}
      </div>
    </BaseCard>
  );
}

export default CameraSection; 