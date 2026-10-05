import { useEffect } from 'react';

/**
 * 让卡片的水涟漪中心跟随鼠标。
 *
 * 原理：卡片背景的涟漪是 `.react-grid-item > div::after` 上的两层同心圆渐变，
 * 这里只在鼠标移动时把「鼠标相对卡片的位置」写进该卡片的 CSS 变量 `--rx / --ry`，
 * CSS 那边用 `background-position: var(--rx) var(--ry)` + 过渡来平滑跟随。
 *
 * 用事件委托 + requestAnimationFrame 节流：只挂一个 document 监听，
 * 每帧最多写一次样式，开销很小。
 */
export default function CardRippleEffect() {
  useEffect(() => {
    let raf = 0;
    let last = null;

    const apply = () => {
      raf = 0;
      const e = last;
      if (!e || !e.target || typeof e.target.closest !== 'function') return;
      const item = e.target.closest('.react-grid-item');
      if (!item) return;
      const card = item.firstElementChild;
      if (!card) return;
      const rect = item.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--rx', `${x.toFixed(2)}%`);
      card.style.setProperty('--ry', `${y.toFixed(2)}%`);
    };

    const onMove = (e) => {
      last = e;
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
