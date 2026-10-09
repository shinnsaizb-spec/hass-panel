import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useEntity } from '@hakit/core';
import Modal from '../Modal';
import LightControl from './LightControl';
import CardSlotPopup from './CardSlotPopup';
import { useLanguage } from '../../i18n/LanguageContext';
import { iconSizeCss, normalizeIconSize } from '../../utils/iconSize';
import { configApi } from '../../utils/api';

// 视为「开启」的状态值（不同 domain 叫法不同）
const ON_STATES = ['on', 'open', 'home', 'playing', 'active', 'detected', 'cleaning', 'heat', 'cool'];

// ------------------------------------------------------------------------------
// 「卡片位」按钮
// ------------------------------------------------------------------------------
// · 绑定了卡片 → 点一下弹出那张卡片
// · 没绑定卡片 → 点一下直接开关绑定的传感器
// · 图标按绑定传感器的状态在「运行时图标 / 停止时图标」之间切换（图片，支持 GIF）
// ------------------------------------------------------------------------------
function CardSlotButton({ slot, onOpenCard }) {
  const ent = useEntity(slot.entityId || 'unknown', { returnNullIfNotFound: true });
  const isOn = !!ent && ON_STATES.includes(ent.state);
  // 绑了传感器 → 按状态在「运行时 / 停止时图标」之间切换；没绑 → 用默认图标
  const img = slot.entityId ? (isOn ? slot.imageOn : slot.imageOff) : slot.image;
  const px = normalizeIconSize(slot.size, 30);

  const handleClick = () => {
    if (slot.cardId) {
      onOpenCard(slot);
      return;
    }
    // 没绑卡片 → 只操作传感器开关
    if (ent && ent.service && typeof ent.service.toggle === 'function') {
      ent.service.toggle();
    }
  };

  return (
    <button
      type="button"
      // has-image：用自定义图片时去掉圆形外框，直接按图标大小显示图片
      className={`card-slot-button ${isOn ? 'is-on' : ''} ${img ? 'has-image' : ''}`}
      style={{
        left: slot.position?.left || '50%',
        top: slot.position?.top || '50%',
        width: `calc(${px}px * 1.25)`,
        height: `calc(${px}px * 1.25)`,
      }}
      onClick={handleClick}
      title={slot.name}
    >
      {img ? (
        <img src={img} alt="" className="card-slot-img" draggable={false} />
      ) : (
        <Icon icon={slot.icon || 'mdi:card-outline'} width={px} />
      )}
    </button>
  );
}

function FloorPlan({ lights }) {
  const { t } = useLanguage();
  const [showControl, setShowControl] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);
  // 弹出的卡片位浮层：{ slot, def }
  const [popup, setPopup] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const pressTimer = useRef(null);

  // 拉一次用户的卡片列表，供「卡片位」弹出对应卡片
  useEffect(() => {
    let alive = true;
    configApi
      .getConfig()
      .then((res) => {
        if (alive) setAllCards((res && res.data && res.data.cards) || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 确保 lights 和必要的属性存在
  if (!lights || !lights.background || !lights.rooms) {
    console.warn('FloorPlan: Missing required props');
    return null;
  }

  const cardSlots = Array.isArray(lights.cards) ? lights.cards : [];

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

  const imageSize = toPercent(lights.imageSize, 110);
  const imageLeft = toPercent(lights.imageLeft, -5);
  const imageTop = toPercent(lights.imageTop, -5);

  const handlePressStart = (light) => {
    if (!isLightEntity(light.entity?.entity_id)) return;
    pressTimer.current = setTimeout(() => {
      setSelectedLight(light);
      setShowControl(true);
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleTouchStart = (light, e) => {
    if (isLightEntity(light.entity?.entity_id)) {
      e.preventDefault();
      handlePressStart(light);
    }
  };

  /** 点「卡片位」→ 找到绑定的卡片并弹出 */
  const openSlotCard = (slot) => {
    const def = allCards.find((c) => String(c.id) === String(slot.cardId)) || null;
    setPopup({ slot, def });
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

        // 图标尺寸每个房间单独可调，单位统一为 px（用户在配置里只填数字）。
        const iconSize = iconSizeCss(light.iconSize);

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

      {/* 「卡片位」：绑了卡片就弹卡片，没绑就开关传感器 */}
      {cardSlots.map((slot, i) => (
        <CardSlotButton
          key={`${slot.entityId || 'x'}::${slot.cardId || 'x'}::${i}`}
          slot={slot}
          onOpenCard={openSlotCard}
        />
      ))}

      {/* 长按灯光 → 灯光控制 */}
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

      {/* 点卡片位 → 弹出绑定的卡片（位置 / 大小在「布局编辑」里拖出来） */}
      {popup ? (
        <CardSlotPopup
          slot={popup.slot}
          cardDef={popup.def}
          editable={false}
          onClose={() => setPopup(null)}
        />
      ) : null}
    </div>
  );
}

export default FloorPlan;
