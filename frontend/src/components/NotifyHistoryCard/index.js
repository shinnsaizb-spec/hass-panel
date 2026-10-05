import React, { useEffect, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiBellRing,
  mdiBellOff,
  mdiCheckAll,
  mdiTrashCanOutline,
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';
import { Modal } from 'antd';
import BaseCard from '../BaseCard';
import MarkdownView from '../MarkdownView';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotifyStore } from '../../utils/notifyStore';
import './style.css';

const LEVEL_CLASS = {
  info: 'lv-info',
  success: 'lv-success',
  warning: 'lv-warning',
  error: 'lv-error',
};

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 把 Markdown 压成一行摘要，用于列表显示 */
function stripMd(md) {
  return String(md || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片]')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 消息通知卡片：看历史消息，点某条弹窗看完整内容（支持 Markdown / 图片）。
 */
export default function NotifyHistoryCard({ config }) {
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
  const [active, setActive] = useState(null);
  const [page, setPage] = useState(0);

  // 每页显示多少条（可在卡片设置里改；默认 20）
  const maxItems = (() => {
    const v = Number(config?.maxItems);
    return Number.isFinite(v) && v > 0 ? Math.min(v, 200) : 20;
  })();

  const totalPages = Math.max(1, Math.ceil((total || 0) / maxItems));
  const curPage = Math.min(page, totalPages - 1);

  useEffect(() => {
    ensureStream();
    refresh('all', maxItems, curPage * maxItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureStream, refresh, maxItems, curPage]);

  // 总数变化后页码越界时回退
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  const imageMode = config?.directImage ? 'direct' : 'proxy';
  const title = config?.title || t('cardTitles.notify');

  const openItem = (it) => {
    setActive(it);
    markRead(it.id);
  };

  const headerRight = (
    <div className="notify-card-actions">
      {unread > 0 ? <span className="notify-card-badge">{unread > 99 ? '99+' : unread}</span> : null}

      {/* 翻页（每页 maxItems 条，不用滚动） */}
      <button
        type="button"
        className="notify-card-btn"
        title={t('notify.prevPage')}
        disabled={curPage <= 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
      >
        <Icon path={mdiChevronLeft} size={16} />
      </button>
      <span className="notify-card-page">{curPage + 1}/{totalPages}</span>
      <button
        type="button"
        className="notify-card-btn"
        title={t('notify.nextPage')}
        disabled={curPage >= totalPages - 1}
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      >
        <Icon path={mdiChevronRight} size={16} />
      </button>

      <button type="button" className="notify-card-btn" title={t('notify.markAllRead')} onClick={markAllRead}>
        <Icon path={mdiCheckAll} size={16} />
      </button>
      <button type="button" className="notify-card-btn" title={t('notify.clear')} onClick={() => clear('all')}>
        <Icon path={mdiTrashCanOutline} size={16} />
      </button>
    </div>
  );

  return (
    <BaseCard title={title} titleVisible={config?.titleVisible} icon={mdiBellRing} headerRight={headerRight}>
      <div className="notify-card-body">
        {items.length === 0 ? (
          <div className="notify-card-empty">
            <Icon path={mdiBellOff} size={24} />
            <span>{t('notify.empty')}</span>
          </div>
        ) : (
          items.map((it) => (
            <button
              type="button"
              key={it.id}
              className={`notify-card-item ${it.read ? '' : 'is-unread'} ${LEVEL_CLASS[it.level] || ''}`}
              onClick={() => openItem(it)}
            >
              <span className="notify-card-dot" />
              <span className="notify-card-main">
                <span className="notify-card-title">{it.title || t('notify.untitled')}</span>
                <span className="notify-card-excerpt">
                  {it.format === 'markdown' ? stripMd(it.message) : it.message}
                </span>
              </span>
              <span className="notify-card-time">{fmtTime(it.timestamp)}</span>
            </button>
          ))
        )}
      </div>

      <Modal
        open={!!active}
        onCancel={() => setActive(null)}
        footer={null}
        width={640}
        title={active?.title || ''}
        destroyOnClose
      >
        {active ? (
          <div className="notify-modal">
            <div className="notify-modal-meta">
              <span className={`notify-modal-level ${LEVEL_CLASS[active.level] || ''}`}>{active.level}</span>
              <span>{fmtTime(active.timestamp)}</span>
              {active.persist ? <span className="notify-modal-tag">{t('notify.persisted')}</span> : null}
              <button
                type="button"
                className="notify-card-btn notify-modal-del"
                title={t('notify.delete')}
                onClick={() => {
                  remove(active.id);
                  setActive(null);
                }}
              >
                <Icon path={mdiTrashCanOutline} size={16} />
              </button>
            </div>
            <MarkdownView text={active.message} format={active.format} imageMode={imageMode} />
          </div>
        ) : null}
      </Modal>
    </BaseCard>
  );
}
