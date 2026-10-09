import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useEntity } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import SceneButton from './SceneButton';

// ==============================================================================
// 智能概览标题栏右侧的「情景」按钮组
// ------------------------------------------------------------------------------
// 显示规则（按**情景数量**决定，不做宽度测量）：
//   · 只有 1 个情景  → 直接显示那个按钮（SceneButton，方形 hover 展开）
//   · 有多个情景     → 收成一个「情景模式」按钮，点击后下拉显示所有情景
//                      下拉是 radio 外观，光条（glider）**跟随鼠标悬停**移动
// ==============================================================================

// 下拉里的单个情景：radio 外观（真正的 input[type=radio] + label，配合滑轨光条）
// 只按「鼠标移到哪」高亮，不显示实体状态。
function SceneRadioItem({ scene, index, checked, onHover, onDone }) {
  const uid = useId();
  const ids = Array.isArray(scene.entities) ? scene.entities : [];

  const entities = ids.map((id) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEntity(id, { returnNullIfNotFound: true })
  );

  const valid = entities.filter(Boolean);
  const allOn = valid.length > 0 && valid.every((e) => e.state === 'on');

  const mode = scene.mode === 'on' || scene.mode === 'off' ? scene.mode : 'toggle';

  const run = () => {
    const target =
      mode === 'on' ? 'turn_on' : mode === 'off' ? 'turn_off' : allOn ? 'turn_off' : 'turn_on';
    valid.forEach((e) => {
      const fn = e.service && e.service[target];
      if (typeof fn === 'function') fn();
    });
    if (typeof onDone === 'function') onDone();
  };

  return (
    <>
      <input
        type="radio"
        className="light-scene-radio"
        name={uid}
        id={uid}
        checked={checked}
        onChange={() => {}}
        tabIndex={-1}
      />
      <label
        htmlFor={uid}
        className="light-scene-radio-label"
        onClick={run}
        onMouseEnter={() => onHover(index)}
      >
        <Icon icon="mdi:lightbulb-on-outline" width={16} />
        <span className="light-scene-radio-text">{scene.name}</span>
      </label>
    </>
  );
}

function SceneBar({ scenes }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [hoverIndex, setHoverIndex] = useState(0);
  const menuBtnRef = useRef(null);

  const collapsed = scenes.length > 1;

  const keys = scenes.map((s, i) => `${s.name}::${(s.entities || []).join(',')}::${i}`);

  // ⚠️ 下拉必须用 Portal 挂到 body：
  //   主页卡片可能被 ScaledCard 包一层（transform: scale + overflow:hidden），
  //   普通 absolute 下拉会被裁掉 / 跟着缩放，看着就像「点了没反应」。
  const placeMenu = useCallback(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const btnRect = btn.getBoundingClientRect();
    // 锚点 = **图标中心**（不是整个按钮中心）：
    // 图标固定在按钮右侧（right:0），按钮 hover 展开时右边缘不动、只有左边缘往左长，
    // 所以用图标中心定位，下拉就不会随按钮变宽而往左跑。
    const iconEl = btn.querySelector('.light-scene-ico');
    const iconRect = iconEl ? iconEl.getBoundingClientRect() : btnRect;
    const anchorX = iconRect.left + iconRect.width / 2;
    // 面板实际宽度由内容撑开（自适应最长情景名），这里只负责居中 + 防溢出
    const el = document.querySelector('.light-scene-menu-portal');
    const w = el && el.offsetWidth ? el.offsetWidth : 140;
    const left = Math.min(
      Math.max(8, anchorX - w / 2),
      Math.max(8, window.innerWidth - w - 8)
    );
    setPos({ left, top: btnRect.bottom + 6 });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    placeMenu();
    // Portal 内容是异步挂载的，挂上后再量一次实际宽度，保证居中准确
    const t = setTimeout(placeMenu, 0);
    const close = () => setOpen(false);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', close, true);
    window.addEventListener('wheel', close, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('wheel', close);
    };
  }, [open, placeMenu]);

  // 每次打开时把光条复位到第一格
  useEffect(() => {
    if (open) setHoverIndex(0);
  }, [open]);

  return (
    <div className="light-scene-bar">
      {collapsed ? (
        <div className="light-scene-menu-wrap">
          <button
            ref={menuBtnRef}
            type="button"
            className={`light-scene-btn light-scene-menu-btn ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            title={t('lightOverview.scene.menu')}
          >
            <span className="light-scene-label">{t('lightOverview.scene.menu')}</span>
            <span className="light-scene-ico">
              <Icon
                className="light-scene-icon"
                icon="mdi:lightbulb-group-outline"
                width={20}
              />
            </span>
          </button>

          {open
            ? createPortal(
                <>
                  {/* 透明遮罩：点空白处关闭下拉 */}
                  <div className="light-scene-menu-mask" onClick={() => setOpen(false)} />
                  <div
                    className="light-scene-menu-portal"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div
                      className="light-scene-radio-container"
                      style={{ '--total-radio': scenes.length }}
                    >
                      {scenes.map((s, i) => (
                        <SceneRadioItem
                          key={keys[i]}
                          scene={s}
                          index={i}
                          checked={i === hoverIndex}
                          onHover={setHoverIndex}
                          onDone={() => setOpen(false)}
                        />
                      ))}
                      {/* 左侧滑轨 + 光条：光条跟随鼠标悬停位移 */}
                      <div className="light-scene-radio-track">
                        <div
                          className="light-scene-radio-glider"
                          style={{ transform: `translateY(${hoverIndex * 100}%)` }}
                        />
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )
            : null}
        </div>
      ) : (
        scenes.map((s, i) => <SceneButton key={keys[i]} scene={s} />)
      )}
    </div>
  );
}

export default SceneBar;
