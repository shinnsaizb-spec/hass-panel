import React, { useEffect, useRef, useState } from 'react';
import { useNotifyStore } from '../../utils/notifyStore';
import './style.css';

// marked / dompurify 都是「按需加载」：只有真的要渲染 Markdown 时才 import，
// 首屏主包体积不受影响（这是「耗性能少」的关键）。
let _libs = null;
async function loadLibs() {
  if (_libs) return _libs;
  const [markedMod, purifyMod] = await Promise.all([import('marked'), import('dompurify')]);
  const marked = markedMod.marked || markedMod.default;
  const DOMPurify = purifyMod.default || purifyMod;
  marked.setOptions({ gfm: true, breaks: true });
  _libs = { marked, DOMPurify };
  return _libs;
}

const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'strong', 'em', 'del', 's', 'code', 'pre', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
  'loading', 'decoding', 'referrerpolicy', 'data-original-src',
  'colspan', 'rowspan', 'align',
];

/**
 * 渲染通知内容：format='markdown' 时按 Markdown 渲染，否则按纯文本。
 * - 图片统一走代理（可配置 direct 直连），加懒加载；
 * - 加载失败替换成占位提示；
 * - 点击图片放大查看。
 */
export default function MarkdownView({ text = '', format = 'text', imageMode = 'proxy', className = '' }) {
  const [html, setHtml] = useState('');
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(null);
  const ref = useRef(null);
  const token = useNotifyStore((s) => s.token);
  const loadToken = useNotifyStore((s) => s.loadToken);

  useEffect(() => {
    if (format !== 'markdown') {
      setReady(true);
      return undefined;
    }
    let alive = true;
    setReady(false);
    (async () => {
      try {
        // 代理模式下需要 webhook token；还没拿到就先去取，token 到位后本 effect 会重跑。
        if (imageMode === 'proxy' && !token) {
          await loadToken();
          return;
        }
        const { marked, DOMPurify } = await loadLibs();
        const tok = token || '';
        if (!alive) return;
        const raw = marked.parse(text || '');
        // 统一处理链接/图片：只放行 http(s)，图片改写成代理地址
        DOMPurify.addHook('afterSanitizeAttributes', (node) => {
          if (node.tagName === 'IMG') {
            const src = node.getAttribute('src') || '';
            node.setAttribute('loading', 'lazy');
            node.setAttribute('decoding', 'async');
            node.setAttribute('referrerpolicy', 'no-referrer');
            if (/^https?:/i.test(src)) {
              node.setAttribute('data-original-src', src);
              if (imageMode === 'proxy') {
                node.setAttribute(
                  'src',
                  `./api/notify/image?token=${encodeURIComponent(tok)}&url=${encodeURIComponent(src)}`
                );
              }
            } else if (!/^\.?\/?api\//i.test(src)) {
              // 非 http(s) 也不是本站相对地址（如 javascript:/data:）一律去掉
              node.removeAttribute('src');
            }
          }
          if (node.tagName === 'A') {
            const href = node.getAttribute('href') || '';
            if (!/^https?:/i.test(href)) node.removeAttribute('href');
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });
        const clean = DOMPurify.sanitize(raw, {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'],
        });
        DOMPurify.removeHook('afterSanitizeAttributes');
        if (alive) {
          setHtml(clean);
          setReady(true);
        }
      } catch (_) {
        if (alive) {
          setHtml('');
          setReady(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [text, format, imageMode, token, loadToken]);

  // 图片加载失败 -> 换成占位提示；点击 -> 放大
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const imgs = Array.from(el.querySelectorAll('img'));
    const cleanups = imgs.map((img) => {
      const onError = () => {
        const span = document.createElement('span');
        span.className = 'md-img-fallback';
        span.textContent = img.getAttribute('alt') || '图片加载失败';
        img.replaceWith(span);
      };
      const onClick = () => setZoom(img.getAttribute('src') || img.currentSrc);
      img.addEventListener('error', onError, { once: true });
      img.addEventListener('click', onClick);
      return () => {
        img.removeEventListener('error', onError);
        img.removeEventListener('click', onClick);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  if (format !== 'markdown') {
    return <div className={`md-view md-plain ${className}`}>{text}</div>;
  }

  return (
    <>
      {!ready ? (
        <div className={`md-view md-loading ${className}`}>加载中…</div>
      ) : (
        <div
          ref={ref}
          className={`md-view md-rendered ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {zoom ? (
        <div className="md-zoom-mask" onClick={() => setZoom(null)}>
          <img className="md-zoom-img" src={zoom} alt="" />
        </div>
      ) : null}
    </>
  );
}
