import React from 'react';
import { mdiFloorPlan } from '@mdi/js';
import { useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import Floorplan3D from '../../floorplan3d';
import { floorplanApi, documentToBuilding, documentToPlan } from '../../floorplan/api';
import './style.css';

// ==============================================================================
// 3D 户型图卡片
// ------------------------------------------------------------------------------
// 把 /floorplan 里画的户型图，用 3D 引擎渲染到首页仪表盘上。
// 数据来源：后端 /api/floorplan（和编辑页同一份），实体状态来自 HA。
// 交互：点 3D 里的灯 / 开关 → 直接开关那个实体；点房间 → 选中。
// ==============================================================================

/** 点了 3D 里的设备标记：灯/开关用 homeassistant.toggle 一把梭 */
function useToggleEntity() {
  const { callService } = useHass();
  return React.useCallback(
    async (entityId) => {
      if (!entityId) return;
      const domain = entityId.split('.')[0];
      try {
        // 灯、开关、窗帘、媒体播放器都有 turn_on/turn_off，用 homeassistant.toggle 统一处理
        await callService({
          domain: 'homeassistant',
          service: 'toggle',
          target: { entity_id: entityId },
        });
      } catch (e) {
        console.warn(`[Floorplan3DCard] 切换 ${domain} 失败：`, e && e.message);
      }
    },
    [callService]
  );
}

function Floorplan3DCard({ config = {} }) {
  const { t } = useLanguage();
  const { getAllEntities } = useHass();
  const {
    title,
    titleVisible,
    theme = 'day',
    wallMode = 'auto',
    explode = true,
    showToolbar = true,
    floorId = null,
  } = config;

  const [plan, setPlan] = React.useState(null);
  const [building, setBuilding] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const doc = await floorplanApi.loadDocument();
      setPlan(documentToPlan(doc));
      setBuilding(documentToBuilding(doc));
      setError('');
    } catch (e) {
      setError(e && e.message ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // 从户型图编辑页切回来时刷新一次（编辑页保存后卡片要跟着变）
  React.useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [load]);

  // 实体状态给 3D 用（灯亮不亮、窗帘开合…）。
  // ⚠️ getAllEntities() 每次调用可能返回新对象，所以整个取值过程都放进 useMemo，
  //    否则 useMemo 依赖里出现逻辑表达式，每次渲染都会重算。
  const entityStates = React.useMemo(() => {
    const all = (getAllEntities && getAllEntities()) || {};
    const out = {};
    Object.entries(all).forEach(([id, e]) => {
      out[id] = { state: e.state, attributes: e.attributes || {} };
    });
    return out;
  }, [getAllEntities]);

  const onDeviceTap = useToggleEntity();
  const hasRooms = !!(plan && plan.rooms && plan.rooms.length);

  return (
    <BaseCard
      className="floorplan3d-card"
      title={title || t('cardTitles.floorplan3d')}
      titleVisible={titleVisible}
      icon={mdiFloorPlan}
    >
      <div className="floorplan3d-card-body">
        {hasRooms ? (
          <Floorplan3D
            plan={plan}
            building={building}
            entityStates={entityStates}
            theme={theme}
            wallMode={wallMode}
            explode={explode}
            showToolbar={showToolbar}
            floorId={floorId}
            onDeviceTap={onDeviceTap}
          />
        ) : (
          <div className="floorplan3d-card-empty">
            <span className="floorplan3d-card-empty-title">
              {error || (loading ? t('floorplan3d.loading') : t('floorplan3d.empty'))}
            </span>
            {!loading && !error ? (
              <span className="floorplan3d-card-empty-hint">{t('floorplan3d.emptyHint')}</span>
            ) : null}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

export default Floorplan3DCard;
