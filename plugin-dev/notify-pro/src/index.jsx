// ==============================================================================
// 消息通知卡片（升级版）—— 插件
// ------------------------------------------------------------------------------
// 与内置 NotifyHistoryCard 的区别：
//   内置：设置「最多显示条数」= 每页条数；超过就翻页。
//   本插件：设置「翻页最多多少条」= 能翻到的消息总上限；
//           每页显示多少条由「卡片高度」自动计算（卡片越高，一页显示越多）。
//
// 依赖全部来自宿主通过 hass-panel-sdk 暴露的同一份实例：
//   React / antd / Icon / mdiJs / BaseCard / MarkdownView / useNotifyStore / useLanguage
// 因此能和宿主共用同一个通知 store（实时 SSE、未读、已读、删除）与同一套主题。
// ==============================================================================

import {
  React,
  antd,
  Icon,
  mdiJs,
  BaseCard,
  MarkdownView,
  useNotifyStore,
  useLanguage,
} from 'hass-panel-sdk';

// ---- 样式：插件运行时注入一次（esbuild 不打包 CSS，这里用 <style> 注入）----
const CSS = `
.npro-actions { display:flex; align-items:center; gap:6px; flex-wrap:nowrap; }
.npro-badge {
  min-width:20px; height:20px; padding:0 6px; border-radius:10px;
  background:var(--color-error,#ff4444); color:#fff; font-size:11px;
  font-weight:600; line-height:20px; text-align:center;
}
.npro-btn {
  width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center;
  padding:0; border:none; border-radius:8px; background:transparent;
  color:var(--color-text-secondary); cursor:pointer;
  transition:background .15s ease, color .15s ease;
}
.npro-btn:hover:not(:disabled) { background:rgba(127,127,127,.18); color:var(--color-text-primary); }
.npro-btn:disabled { opacity:.32; cursor:default; }
.npro-page {
  min-width:30px; text-align:center; font-size:11px; color:var(--color-text-secondary);
  font-variant-numeric:tabular-nums; user-select:none;
}
/* ⚠️ 用 .base-card 前缀 + !important，压过主页的 .base-card > div:not(.card-header){overflow:visible} */
.base-card .npro-body {
  flex:1 1 0; min-height:0; overflow:hidden !important; padding:6px;
  display:flex; flex-direction:column; gap:6px;
}
.npro-empty {
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:8px; color:var(--color-text-secondary); font-size:13px;
}
.npro-item {
  height:52px; flex:0 0 52px; box-sizing:border-box; position:relative;
  display:flex; align-items:center; gap:8px; width:100%; padding:0 10px;
  border:none; border-radius:8px; background:transparent; cursor:pointer;
  text-align:left; color:var(--color-text-primary);
  transition:background .15s ease; overflow:hidden;
}
.npro-item:hover { background:rgba(127,127,127,.14); }
.npro-item.is-unread { background:rgba(255,183,77,.14); }
.npro-dot {
  flex:0 0 8px; width:8px; height:8px; border-radius:50%;
  background:var(--color-text-light,#90a4ae);
}
.npro-item.npro-lv-info .npro-dot { background:#42a5f5; }
.npro-item.npro-lv-success .npro-dot { background:#66bb6a; }
.npro-item.npro-lv-warning .npro-dot { background:#ffa726; }
.npro-item.npro-lv-error .npro-dot { background:#ef5350; }
.npro-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px; }
.npro-title { font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.npro-excerpt { font-size:12px; color:var(--color-text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.npro-time { flex:0 0 auto; font-size:11px; color:var(--color-text-light,#90a4ae); }
.npro-modal-meta { display:flex; align-items:center; gap:10px; margin-bottom:12px; font-size:12px; color:var(--color-text-secondary); }
.npro-modal-level { padding:1px 8px; border-radius:999px; font-size:11px; background:rgba(127,127,127,.16); }
.npro-modal-level.npro-lv-success { color:#2e7d32; }
.npro-modal-level.npro-lv-warning { color:#ef6c00; }
.npro-modal-level.npro-lv-error { color:#c62828; }
.npro-modal-tag { padding:1px 8px; border-radius:999px; font-size:11px; background:rgba(255,183,77,.22); color:var(--color-text-primary); }
.npro-modal-del { margin-left:auto; }
`;

if (typeof document !== 'undefined' && !document.getElementById('npro-style')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'npro-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);
}

const LEVEL_CLASS = {
  info: 'npro-lv-info',
  success: 'npro-lv-success',
  warning: 'npro-lv-warning',
  error: 'npro-lv-error',
};

// 行高常量：与上面的 CSS 保持一致（单条 52px + 间距 6px；body 上下内边距 12px）
const ROW_H = 52;
const ROW_GAP = 6;
const BODY_PAD = 12;

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 把 Markdown 压成一行摘要 */
function stripMd(md) {
  return String(md || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片]')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function NotifyHistoryCardPro({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();

  const items = useNotifyStore((s) => s.items);
  const total = useNotifyStore((s) => s.total);
  const unread = useNotifyStore((s) => s.unread);
  const ensureStream = useNotifyStore((s) => s.ensureStream);
  const refresh = useNotifyStore((s) => s.refresh);
  const markRead = useNotifyStore((s) => s.markRead);
  const markAllRead = useNotifyStore((s) => s.markAllRead);
  const remove = useNotifyStore((s) => s.remove);
  const clear = useNotifyStore((s) => s.clear);

  const [active, setActive] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [bodyH, setBodyH] = React.useState(0);
  const bodyRef = React.useRef(null);

  // 「翻页最多条数」（兼容旧的 maxItems 字段）
  const maxTotal = (() => {
    const raw = cfg.maxTotal != null ? cfg.maxTotal : cfg.maxItems;
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), 1000) : 100;
  })();

  // 每页条数：由卡片 body 高度自动计算（首帧先给个猜测值，测到高度后重算）
  const perPage = React.useMemo(() => {
    if (!bodyH) return 6;
    const usable = bodyH - BODY_PAD + ROW_GAP;
    const n = Math.floor(usable / (ROW_H + ROW_GAP));
    return Math.min(Math.max(n, 1), 100);
  }, [bodyH]);

  // 测量 body 高度（卡片被拖动改变大小时也会更新）
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const update = () => setBodyH(el.clientHeight);
    update();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener('resize', update);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', update);
    };
  }, []);

  const effectiveTotal = Math.min(total || 0, maxTotal);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / perPage));
  const curPage = Math.min(page, totalPages - 1);

  // 页码越界时回退
  React.useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  // 每页条数变化（卡片高度变了）时回到第一页，避免窗口错位
  const prevPerPage = React.useRef(perPage);
  React.useEffect(() => {
    if (prevPerPage.current !== perPage) {
      prevPerPage.current = perPage;
      setPage(0);
    }
  }, [perPage]);

  // 拉取当前页数据
  React.useEffect(() => {
    ensureStream();
    refresh('all', perPage, curPage * perPage);
  }, [ensureStream, refresh, perPage, curPage]);

  const imageMode = cfg.directImage ? 'direct' : 'proxy';
  const title = cfg.title || t('cardTitles.notify') || '消息通知';

  const openItem = (it) => {
    setActive(it);
    markRead(it.id);
  };

  const headerRight = (
    <div className="npro-actions">
      {unread > 0 ? <span className="npro-badge">{unread > 99 ? '99+' : unread}</span> : null}

      <button
        type="button"
        className="npro-btn"
        title={t('notify.prevPage')}
        disabled={curPage <= 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
      >
        <Icon path={mdiJs.mdiChevronLeft} size={16} />
      </button>
      <span className="npro-page">{curPage + 1}/{totalPages}</span>
      <button
        type="button"
        className="npro-btn"
        title={t('notify.nextPage')}
        disabled={curPage >= totalPages - 1}
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      >
        <Icon path={mdiJs.mdiChevronRight} size={16} />
      </button>

      <button type="button" className="npro-btn" title={t('notify.markAllRead')} onClick={markAllRead}>
        <Icon path={mdiJs.mdiCheckAll} size={16} />
      </button>
      <button type="button" className="npro-btn" title={t('notify.clear')} onClick={() => clear('all')}>
        <Icon path={mdiJs.mdiTrashCanOutline} size={16} />
      </button>
    </div>
  );

  return (
    <BaseCard title={title} titleVisible={cfg.titleVisible} icon={mdiJs.mdiBellRing} headerRight={headerRight}>
      <div className="npro-body" ref={bodyRef}>
        {items.length === 0 ? (
          <div className="npro-empty">
            <Icon path={mdiJs.mdiBellOff} size={24} />
            <span>{t('notify.empty')}</span>
          </div>
        ) : (
          items.map((it) => (
            <button
              type="button"
              key={it.id}
              className={`npro-item ${it.read ? '' : 'is-unread'} ${LEVEL_CLASS[it.level] || ''}`}
              onClick={() => openItem(it)}
            >
              <span className="npro-dot" />
              <span className="npro-main">
                <span className="npro-title">{it.title || t('notify.untitled')}</span>
                <span className="npro-excerpt">
                  {it.format === 'markdown' ? stripMd(it.message) : it.message}
                </span>
              </span>
              <span className="npro-time">{fmtTime(it.timestamp)}</span>
            </button>
          ))
        )}
      </div>

      <antd.Modal
        open={!!active}
        onCancel={() => setActive(null)}
        footer={null}
        width={640}
        title={active ? active.title || '' : ''}
        destroyOnClose
      >
        {active ? (
          <div className="npro-modal">
            <div className="npro-modal-meta">
              <span className={`npro-modal-level ${LEVEL_CLASS[active.level] || ''}`}>{active.level}</span>
              <span>{fmtTime(active.timestamp)}</span>
              {active.persist ? <span className="npro-modal-tag">{t('notify.persisted')}</span> : null}
              <button
                type="button"
                className="npro-btn npro-modal-del"
                title={t('notify.delete')}
                onClick={() => {
                  remove(active.id);
                  setActive(null);
                }}
              >
                <Icon path={mdiJs.mdiTrashCanOutline} size={16} />
              </button>
            </div>
            <MarkdownView text={active.message} format={active.format} imageMode={imageMode} />
          </div>
        ) : null}
      </antd.Modal>
    </BaseCard>
  );
}
