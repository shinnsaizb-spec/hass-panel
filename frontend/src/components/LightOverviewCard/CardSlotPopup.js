import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getCardComponent } from '../../cards/registry';
import './CardSlotPopup.css';

// ==============================================================================
// 「卡片位」的弹出浮层
// ------------------------------------------------------------------------------
// · 使用模式：显示绑定的卡片；拖标题栏可移动；右上角关闭；点遮罩也关闭。
// · 编辑模式：右下角多一个拉伸把手，右下角显示「取消 / 保存」，
//             保存时把 {x, y, w, h} 回传给调用方写进配置。
// ==============================================================================

const MIN_W = 200;
const MIN_H = 140;

function toNum(v, fallback) {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function CardSlotPopup({ slot, cardDef, editable, onClose, onSave }) {
  const { t } = useLanguage();
  const [rect, setRect] = useState(() => ({
    x: toNum(slot.x, 80),
    y: toNum(slot.y, 80),
    w: toNum(slot.width, 420),
    h: toNum(slot.height, 320),
  }));
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (drag.kind === 'move') {
        setRect((r) => ({
          ...r,
          x: Math.max(0, Math.min(window.innerWidth - 60, drag.x0 + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 40, drag.y0 + dy)),
        }));
      } else {
        setRect((r) => ({
          ...r,
          w: Math.max(MIN_W, drag.w0 + dx),
          h: Math.max(MIN_H, drag.h0 + dy),
        }));
      }
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag]);

  const startDrag = (e, kind) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({
      kind,
      sx: e.clientX,
      sy: e.clientY,
      x0: rect.x,
      y0: rect.y,
      w0: rect.w,
      h0: rect.h,
    });
  };

  const Comp = cardDef ? getCardComponent(cardDef.type) : null;

  // ⚠️ 必须用 Portal 挂到 body：
  //   主页的卡片外面套着 ScaledCard 的 transform: scale()，
  //   而 position:fixed 在「有 transform 的祖先」里会相对那个祖先定位、并被 overflow 裁剪，
  //   结果就是弹出的卡片被限制在智能概览卡片内、超出部分看不到。
  return createPortal(
    <div
      className={`csp-mask ${editable ? 'is-editing' : ''}`}
      onPointerDown={editable ? undefined : onClose}
    >
      <div
        className="csp-box"
        style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="csp-header" onPointerDown={(e) => startDrag(e, 'move')}>
          <Icon icon={slot.icon || 'mdi:card-outline'} width={14} />
          <span className="csp-title">{slot.name || t('lightOverview.slot.title')}</span>
          {editable ? (
            <span className="csp-hint">{t('lightOverview.slot.dragHint')}</span>
          ) : (
            <button type="button" className="csp-close" onClick={onClose}>
              <Icon icon="mdi:close" width={14} />
            </button>
          )}
        </div>

        <div className="csp-body">
          {Comp ? (
            <Comp config={cardDef.config} />
          ) : (
            <div className="csp-empty">
              <Icon icon="mdi:card-off-outline" width={26} />
              <span>{t('lightOverview.slot.notBound')}</span>
            </div>
          )}
        </div>

        {editable ? (
          <>
            <div className="csp-actions">
              <button type="button" className="csp-btn" onClick={onClose}>
                {t('config.cancel')}
              </button>
              <button
                type="button"
                className="csp-btn csp-btn-primary"
                onClick={() => onSave && onSave(rect)}
              >
                {t('config.save')}
              </button>
            </div>
            <div className="csp-resize" onPointerDown={(e) => startDrag(e, 'resize')} />
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export default CardSlotPopup;
