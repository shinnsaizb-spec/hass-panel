// ==============================================================================
// 家具库面板（编辑页用）
// ------------------------------------------------------------------------------
// 数据来自 3D 引擎的家具表（约 500 种，13 个分类），**打开面板时才动态加载** ——
// 引擎和家具表加起来 1MB 多，不能塞进首屏包。
//
// 每个条目的图是引擎的 `furniturePreview()` 现渲染出来的 PNG（和 3D 里是同一套模型）。
// ⚠️ 一次渲染约几十毫秒，一个分类几十个条目，**不能一口气全渲**（界面会卡住），
//    所以走一个串行队列：每帧渲一个，渲好一个显示一个。
// ==============================================================================

import React from 'react';
import { FURNITURE_GROUP_LABELS, furnitureLabel } from '../../floorplan/furniture';

const THUMB_SIZE = 96;

// ---- 串行渲染队列（模块级，多个分类共用）----
let queue = [];
let pumping = false;
const cache = new Map();

function pump() {
  if (pumping) return;
  pumping = true;
  const step = () => {
    const job = queue.shift();
    if (!job) {
      pumping = false;
      return;
    }
    try {
      job.run();
    } catch (e) {
      /* 单张渲不出来不影响别的 */
    }
    // 每渲一张让出一次主线程，界面才不会卡
    window.setTimeout(step, 0);
  };
  window.setTimeout(step, 0);
}

/** 取某个家具类型的缩略图（data URL）；没渲过就排队渲 */
function requestThumb(type, size, preview) {
  const key = `${type}|${size.join(',')}`;
  if (cache.has(key)) return cache.get(key);
  const entry = { url: null, waiters: [] };
  cache.set(key, entry);
  queue.push({
    run: () => {
      const url = preview({ type, w: size[0], d: size[1], h: size[2], variant: null }, THUMB_SIZE, null, 1.25);
      entry.url = url;
      entry.waiters.forEach((fn) => fn(url));
      entry.waiters = [];
    },
  });
  pump();
  return entry;
}

/** 单个缩略图：自己负责去队列里要图 */
function Thumb({ type, size, preview }) {
  const [url, setUrl] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    const entry = requestThumb(type, size, preview);
    if (entry.url) {
      setUrl(entry.url);
      return undefined;
    }
    const waiter = (u) => {
      if (!cancelled) setUrl(u);
    };
    entry.waiters.push(waiter);
    return () => {
      cancelled = true;
      entry.waiters = entry.waiters.filter((w) => w !== waiter);
    };
  }, [type, size, preview]);

  return url ? <img className="fp-furn-thumb" src={url} alt="" draggable={false} /> : <span className="fp-furn-thumb fp-furn-thumb--wait" />;
}

export default function FurnitureLibrary({ open, activeType, onPick, onClose }) {
  const [lib, setLib] = React.useState(null);
  const [group, setGroup] = React.useState('living');
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');

  // 打开面板时才去加载引擎的家具表 + 预览渲染器
  React.useEffect(() => {
    if (!open || lib) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [meta, preview] = await Promise.all([
          import('../../neonplan3d/furniture/metadata.js'),
          import('../../neonplan3d/viewer/preview.js'),
        ]);
        if (cancelled) return;
        setLib({ groups: meta.FURNITURE_GROUPS, size: meta.FURNITURE_SIZE, preview: preview.furniturePreview });
      } catch (e) {
        if (!cancelled) setError(e && e.message ? e.message : '加载失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, lib]);

  if (!open) return null;

  const groups = lib ? Object.keys(lib.groups) : [];
  const all = lib ? Object.values(lib.groups).flat() : [];
  const q = query.trim().toLowerCase();
  // 搜索时跨分类找（中文名 + 类型名都能搜）
  const list = !lib
    ? []
    : q
      ? all.filter((t) => t.toLowerCase().includes(q) || furnitureLabel(t).toLowerCase().includes(q))
      : lib.groups[group] || [];

  return (
    <div className="fp-furn-lib">
      <div className="fp-furn-lib-head">
        <span className="fp-furn-lib-title">家具库</span>
        <input
          className="fp-furn-search"
          type="text"
          value={query}
          placeholder="搜索（中英文都行）"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="fp-furn-close" onClick={onClose} title="收起">
          ×
        </button>
      </div>

      {!q ? (
        <div className="fp-furn-tabs">
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              className={`fp-furn-tab ${g === group ? 'active' : ''}`}
              onClick={() => setGroup(g)}
            >
              {FURNITURE_GROUP_LABELS[g] || g}
            </button>
          ))}
        </div>
      ) : (
        <div className="fp-furn-hint">找到 {list.length} 件</div>
      )}

      {error ? <div className="fp-furn-error">家具表加载失败：{error}</div> : null}
      {!lib && !error ? <div className="fp-furn-hint">正在加载家具模型…</div> : null}

      <div className="fp-furn-grid">
        {list.map((type) => {
          const size = (lib && lib.size[type]) || [1, 1, 0.8];
          return (
            <button
              key={type}
              type="button"
              className={`fp-furn-item ${type === activeType ? 'active' : ''}`}
              // ⚠️ 引擎的 FURNITURE_SIZE 是**米**，本项目模型是**毫米** —— 回调前必须换算，
              //    否则放下去的家具是 1mm 级、屏幕上根本看不见（踩过）。
              onClick={() => onPick(type, size.map((v) => Math.max(100, Math.round(v * 1000))))}
              title={`${furnitureLabel(type)}（${type}）`}
            >
              {lib ? <Thumb type={type} size={size} preview={lib.preview} /> : null}
              <span className="fp-furn-name">{furnitureLabel(type)}</span>
            </button>
          );
        })}
      </div>

      <div className="fp-furn-foot">点一件 → 在画布上点一下放下 · 右键/Esc 退出</div>
    </div>
  );
}
