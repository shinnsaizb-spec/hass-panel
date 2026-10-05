import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import Modal from '../Modal';
import LightControl from './LightControl';
import { useLanguage } from '../../i18n/LanguageContext';

function FloorPlan({ lights }) {
  const { t } = useLanguage();
  const [showControl, setShowControl] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);
  const pressTimer = useRef(null);

  // 确保 lights 和必要的属性存在
  if (!lights || !lights.background || !lights.rooms) {
    console.warn('FloorPlan: Missing required props');
    return null;
  }

  const isLightEntity = (entityId) => {
    return entityId?.startsWith('light.');
  };

  // 把配置里的「无单位数字」转成像素百分比：留空或纯数字都按 % 处理，
  // 也兼容用户手滑带上的 % / px。
  const toPercent = (val, fallback) => {
    if (val === undefined || val === null || String(val).trim() === '') return `${fallback}%`;
    const s = String(val).trim();
    if (/[%px]$/i.test(s)) return s;
    return `${s}%`;
  };

  // 图片尺寸（背景图 + 灯光效果一起缩放）是卡片级配置，
  // 留空则沿用原来的默认值 110%。图标尺寸仍是每个房间单独可调。
  const imageSize = toPercent(lights.imageSize, 110);

  // 图片位置（背景图 + 灯光效果整体移动）也是卡片级配置，
  // 留空沿用默认 -5%（和原来背景偏移一致）。这样灯光图永远跟着背景一起挪。
  const imageLeft = toPercent(lights.imageLeft, -5);
  const imageTop = toPercent(lights.imageTop, -5);

  const handlePressStart = (light) => {
    // 只有 light 类型的实体才支持长按
    if (!isLightEntity(light.entity?.entity_id)) return;

    pressTimer.current = setTimeout(() => {
      setSelectedLight(light);
      setShowControl(true);
    }, 500); // 500ms 长按触发
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleTouchStart = (light, e) => {
    // 只有 light 类型的实体才阻止默认事件
    if (isLightEntity(light.entity?.entity_id)) {
      e.preventDefault();
      handlePressStart(light);
    }
  };

  return (
    <div className="floor-plan">
      <img 
        src={lights.background}
        alt={t('lightOverview.floorPlan.roomLayout')}
        className="base-layer"
        style={{ width: imageSize, height: imageSize, left: imageLeft, top: imageTop }}
      />
      
      {lights.rooms.map((light) => {

        const isLight = isLightEntity(light.entity?.entity_id);

        // 图标尺寸是每个房间单独可调的（配置里留空则用默认 24rem）。
        // 单位写什么取决于你想怎么缩放：项目整体走 rem 自适应，
        // 所以默认用 rem；想固定大小就写 px。
        // 图片尺寸 / 位置（imageSize / imageLeft / imageTop）都是卡片级、
        // 背景与灯光效果共用，见组件顶部。
        const iconSize = light.iconSize || '24rem';

        return (
          <React.Fragment key={light.entity?.entity_id}>
            {light.image && <img
              src={light.image}
              alt={light.name}
              className={`light-layer ${light.state === 'on' ? 'active' : ''}`}
              style={{ pointerEvents: 'none', width: imageSize, height: imageSize, left: imageLeft, top: imageTop }}
            />}
            <button
              className={`room-light-button ${light.state === 'on' ? 'active' : ''}`}
              style={{
                position: 'absolute',
                ...light.position,
                // 按钮跟着图标走，维持原来的 24:30（1:1.25）比例，
                // 否则图标调大后会溢出圆形按钮
                width: `calc(${iconSize} * 1.25)`,
                height: `calc(${iconSize} * 1.25)`,
              }}
              onClick={() => light.entity?.service.toggle()}
              onMouseDown={() => isLight ? handlePressStart(light) : undefined}
              onMouseUp={isLight ? handlePressEnd : undefined}
              onMouseLeave={isLight ? handlePressEnd : undefined}
              onTouchStart={(e) => isLight && handleTouchStart(light, e)}
              onTouchEnd={isLight ? handlePressEnd : undefined}
              title={light.name}
            >
              <Icon 
                icon={light.icon || 'mdi:ceiling-light'}
                width={iconSize}
                className="light-icon"
              />
            </button>
          </React.Fragment>
        );
      })}

      <Modal
        visible={showControl}
        onClose={() => setShowControl(false)}
        title={selectedLight?.name}
        width="350px"
      >
        {selectedLight && (
          <LightControl 
            lightEntity={selectedLight.entity}
            onClose={() => setShowControl(false)}
          />
        )}
      </Modal>
    </div>
  );
}

export default FloorPlan; 