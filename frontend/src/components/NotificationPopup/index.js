import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiDragVariant, mdiClose } from '@mdi/js';
import { useNotifyStore } from '../../utils/notifyStore';
import './style.css';

// 兼容旧的四角配置（没设自定义坐标时用它）
const POSITION_CLASS = {
  'top-left': 'notify-pos-tl',
  'top-right': 'notify-pos-tr',
  'bottom-left': 'notify-pos-bl',
  'bottom-right': 'notify-pos-br',
};

const LEVEL_ICON = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * 主页通知弹窗。
 * - 从统一的 notifyStore 取实时消息（全局只有一条 SSE）
 * - 位置/大小/时长可在全局配置里调，也可在编辑模式下直接拖动摆放
 */
export default function NotificationPopup({ settings = {}, editable = false, onSavePosition }) {
  const toasts = useNotifyStore((s) => s.toasts);
  const removeToast = useNotifyStore((s) => s.removeToast);
  const ensureStream = useNotifyStore((s) => s.ensureStream);
  const stopStream = useNotifyStore((s) => s.stopStream);

  // 通知总开关（全局配置）：关掉后不建立 SSE 连接，并断开已有连接 —— 彻底不再接收消息
  const notifyEnabled = (settings || {}).notifyEnabled !== false;
  useEffect(() => {
    if (notifyEnabled) ensureStream();
    else stopStream();
  }, [notifyEnabled, ensureStream, stopStream]);

  const s = settings || {};
  const duration = (() => {
    const v = Number(s.notifyDuration);
    return Number.isFinite(v) && v >= 0 ? v : 8;
  })();
  const widthPct = Number(s.notifyWidth);
  const heightPct = Number(s.notifyHeight);
  const hasCustom = s.notifyX != null && String(s.notifyX).trim() !== '' && s.notifyY != null && String(s.notifyY).trim() !== '';

  const [pos, setPos] = useState(() => ({
    x: hasCustom ? clamp(Number(s.notifyX), 0, 100) : null,
    y: hasCustom ? clamp(Number(s.notifyY), 0, 100) : null,
  }));
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    setPos({
      x: hasCustom ? clamp(Number(s.notifyX), 0, 100) : null,
      y: hasCustom ? clamp(Number(s.notifyY), 0, 100) : null,
    });
  }, [s.notifyX, s.notifyY, hasCustom]);

  // 自动关闭：按配置时长轮询清理（0 = 不自动关）
  useEffect(() => {
    if (!duration) return undefined;
    const iv = setInterval(() => {
      const now = Date.now();
      useNotifyStore.getState().toasts.forEach((t) => {
        if (now - (t._at || now) > duration * 1000) removeToast(t._toastKey);
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [duration, removeToast]);

  // ===== 拖动摆放（仅编辑模式） =====
  const dragRef = useRef(null);
  const onDragMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.mx) / window.innerWidth) * 100;
    const dy = ((e.clientY - d.my) / window.innerHeight) * 100;
    setPos({ x: clamp(d.sx + dx, 0, 100), y: clamp(d.sy + dy, 0, 100) });
  }, []);
  const endDrag = useCallback(() => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', endDrag);
    if (!dragRef.current) return;
    dragRef.current = null;
    const p = posRef.current;
    if (p.x != null && p.y != null && onSavePosition) {
      onSavePosition(Math.round(p.x), Math.round(p.y));
    }
  }, [onDragMove, onSavePosition]);
  const startDrag = (e) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const cur = pos.x != null && pos.y != null ? pos : { x: 4, y: 4 };
    if (pos.x == null) setPos({ x: cur.x, y: cur.y });
    dragRef.current = { mx: e.clientX, my: e.clientY, sx: cur.x, sy: cur.y };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', endDrag);
  };

  useEffect(
    () => () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', endDrag);
    },
    [onDragMove, endDrag]
  );

  const customStyle = pos.x != null && pos.y != null
    ? {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  const sizeStyle = {};
  if (Number.isFinite(widthPct) && widthPct > 0) sizeStyle.width = `${widthPct}%`;
  if (Number.isFinite(heightPct) && heightPct > 0) sizeStyle.maxHeight = `${heightPct}%`;

  const posClass = customStyle ? '' : POSITION_CLASS[s.notifyPosition] || 'notify-pos-tr';
  const showPlaceholder = editable && toasts.length === 0;

  return (
    <div className={`notify-stack ${posClass} ${editable ? 'is-editing' : ''}`} style={{ ...customStyle, ...sizeStyle }}>
      {editable ? (
        <div className="notify-drag-bar" onMouseDown={startDrag} title="拖动调整弹窗位置">
          <Icon path={mdiDragVariant} size={14} />
          <span>拖动调整位置</span>
        </div>
      ) : null}

      {showPlaceholder ? (
        <div className="notify-toast notify-toast-placeholder">
          <div className="notify-toast-icon">ℹ</div>
          <div className="notify-toast-body">
            <div className="notify-toast-title">示例通知</div>
            <div className="notify-toast-message">拖动上方把手即可调整弹窗位置与大小</div>
          </div>
        </div>
      ) : null}

      {toasts.map((it) => (
        <div key={it._toastKey} className={`notify-toast notify-level-${it.level || 'info'}`}>
          <div className="notify-toast-icon">{LEVEL_ICON[it.level] || LEVEL_ICON.info}</div>
          <div className="notify-toast-body">
            {it.title ? <div className="notify-toast-title">{it.title}</div> : null}
            {it.message ? <div className="notify-toast-message">{it.message}</div> : null}
          </div>
          <button
            type="button"
            className="notify-toast-close"
            onClick={() => removeToast(it._toastKey)}
            aria-label="关闭"
          >
            <Icon path={mdiClose} size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
