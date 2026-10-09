import React from 'react';
import { mdiWeb } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import './style.css';

// 只接受 http(s) 网址，避免把乱填的内容直接塞进 iframe 的 src
const isHttpUrl = (s) => /^https?:\/\//i.test((s || '').trim());

/**
 * 通用「网页嵌入」卡片：用户在卡片设置里填一个网址，卡片里用 iframe 原样加载。
 *
 * 交互说明：
 * - 卡片本身不拦鼠标，iframe 默认可点按 / 滚动（满足「需要点击」的需求）。
 * - 在 Wallpaper Engine 里当壁纸时，WE 默认不把鼠标事件转发给网页壁纸，
 *   要在 iframe 里点按需把这张壁纸设为「可交互」（WE 右键菜单里开）。
 * - 部分网站（百度 / GitHub / 网银等）会下发 X-Frame-Options 或 CSP frame-ancestors
 *   禁止被嵌入，那种 iframe 会显示空白 —— 这是浏览器限制，卡片侧无解。
 */
function IFrameCard({ config = {} }) {
  const { t } = useLanguage();
  const { url, title, titleVisible, scroll } = config;
  const safeUrl = (url || '').trim();
  const showEmpty = !isHttpUrl(safeUrl);

  return (
    <BaseCard
      className="iframe-card"
      title={title || t('cardTitles.iframe')}
      titleVisible={titleVisible}
      icon={mdiWeb}
    >
      <div className="iframe-card-body">
        {showEmpty ? (
          <div className="iframe-card-empty">
            <span className="iframe-card-empty-title">{t('iframe.empty')}</span>
            <span className="iframe-card-empty-hint">{t('iframe.emptyHint')}</span>
          </div>
        ) : (
          <iframe
            className="iframe-card-frame"
            src={safeUrl}
            title={title || 'iframe'}
            frameBorder="0"
            loading="lazy"
            allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-downloads"
            scrolling={scroll === false ? 'no' : 'yes'}
          />
        )}
      </div>
    </BaseCard>
  );
}

export default IFrameCard;
