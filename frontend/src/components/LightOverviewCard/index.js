import React from 'react';
import { mdiHomeFloorG } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import FloorPlan from './FloorPlan';
import SceneBar from './SceneBar';
import './style.css';
import { useEntity } from '@hakit/core';
import { notification } from 'antd';

function LightOverviewCard({ config }) {
  const { t } = useLanguage();
  const debugMode = localStorage.getItem('debugMode') === 'true';

  if (!config || !config.rooms) {
    console.warn('LightOverviewCard: Missing config or rooms');
    return null;
  }

  const lightEntities = config.rooms.filter(room => room && room.entity_id && room.position).map(room => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const entity = useEntity(room.entity_id);
      return {
        ...room,
        entity,
        state: entity?.state
      };
    } catch (error) {
      if (debugMode) {
        notification.error({
          message: t('lightOverview.loadError'),
          description: `${t('lightOverview.loadErrorDesc')} ${room.entity_id}`,
          placement: 'topRight',
          duration: 3,
          key: 'LightOverviewCard',
        });
      }
      return {
        ...room,
        entity: { state: null, error: true },
      };
    }
  });

  const lightStates = {
    background: config.background || '',
    imageSize: config.imageSize || '',
    imageLeft: config.imageLeft || '',
    imageTop: config.imageTop || '',
    rooms: lightEntities,
    // 「卡片位」：点一下弹出绑定的那张卡片
    cards: Array.isArray(config.cards) ? config.cards : []
  };

  // 情景开关：只保留「有名字 + 至少一个实体」的
  const scenes = (Array.isArray(config.scenes) ? config.scenes : []).filter(
    (s) => s && s.name && Array.isArray(s.entities) && s.entities.length > 0
  );

  return (
    <BaseCard
      className="light-overview-smart"
      title={config.title || t('cardTitles.lightOverview')}
      icon={mdiHomeFloorG}
      titleVisible={config.titleVisible}
      headerRight={scenes.length > 0 ? <SceneBar scenes={scenes} /> : null}
    >
      <div className="light-overview">
        <FloorPlan lights={lightStates} />
      </div>
    </BaseCard>
  );
}

export default LightOverviewCard; 