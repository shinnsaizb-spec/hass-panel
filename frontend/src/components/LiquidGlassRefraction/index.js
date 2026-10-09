import { useEffect } from 'react';
import {
  startRefraction,
  stopRefraction,
  applyCardStyle,
  readParams,
} from '../../theme/liquid-glass-refraction';

/**
 * 液态玻璃「折射」的挂载点（不渲染任何 DOM）。
 *
 * 它做两件事：
 * 1. 把「卡片风格」（全局配置 → 卡片风格）写到 `<body data-card-style="...">`，
 *    CSS 据此切换卡片外观。**这一步任何浏览器都要做**，跟折射能不能用无关。
 * 2. 在支持 `backdrop-filter: url()` 的浏览器（桌面版 Chrome / Edge）上，
 *    再给卡片边缘加上真实的折射（SVG feDisplacementMap）。
 *
 * 细节见 `theme/liquid-glass-refraction.js`。
 */
function LiquidGlassRefraction() {
  useEffect(() => {
    // ① 卡片风格：纯 CSS，先无条件应用一次（首屏可能还没拿到远端配置，用默认值兜底）
    const initial = readParams();
    applyCardStyle(initial.style, initial.blur, initial.opacity);

    // ② 配置变化时同步风格（引擎没启动时也得跟着变）
    const onConfigChanged = (e) => {
      const p = readParams(e && e.detail);
      applyCardStyle(p.style, p.blur, p.opacity);
    };
    window.addEventListener('hasspanel:global-config-changed', onConfigChanged);

    // ③ 支持折射的浏览器再启动折射引擎
    const started = startRefraction();

    return () => {
      window.removeEventListener('hasspanel:global-config-changed', onConfigChanged);
      if (started) stopRefraction();
    };
  }, []);

  return null;
}

export default LiquidGlassRefraction;
