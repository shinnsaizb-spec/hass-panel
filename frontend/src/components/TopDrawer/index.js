import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@mdi/react';
import { mdiCog, mdiClose, mdiDrag, mdiCheck, mdiAutoFix } from '@mdi/js';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { configApi } from '../../utils/api';
import { useLanguage } from '../../i18n/LanguageContext';
import ScaledCard from '../ScaledCard';
import './style.css';

// 不使用 WidthProvider：它会在面板关闭/挂载瞬间测到一个异常宽度（或 0），
// 导致 Responsive 把全部卡片「重新生成」成默认 h:1/w:1 的退化布局，
// 继而被写回 state → 卡片全部塌成一条线。
// 改为自己用 ResizeObserver 测量卡片区宽度，并把真实 width 显式传给 Responsive。
const ResponsiveGridLayout = Responsive;

// 顶部中缘悬停下拉面板：
// 鼠标移到中上边缘的小把手 -> 面板从顶部下拉，里面用网格渲染卡片。
// 鼠标离开面板即关闭。没有 inDrawer 卡片时不渲染任何东西。
//
// 面板顶部有一条导航条（和下面的卡片分开）：
//   左端 = 设置按钮（进入编辑模式）+ 关闭按钮
// 编辑模式下：
//   - 拖导航条空白处 = 左右移动面板
//   - 拖面板右边缘 / 下边缘 / 右下角 = 改宽度 / 高度 / 同时改
//     （不再是「从中心往两边对称缩放」，拖哪边就往哪边长）
//   - 卡片可以像主页那样自由拖动位置和拉伸大小，排版保存在本地
// 尺寸会写回全局配置（drawerWidth / drawerHeight / drawerLeft）。

const DRAWER_COLS = 12;
const DEFAULT_CARD_W = 6; // 默认占半行
const DEFAULT_CARD_H = 12; // 默认占 12 行（rowHeight=14，约 320px 高）
const MIN_W = 2;
const MAX_W = 12;
const MIN_H = 8; // ≈ 210px，卡片高度下限，避免被拖/被旧数据缩成一条线
const MAX_H = 24; // ≈ 660px
const DRAWER_ROW_HEIGHT = 14; // 配合 margin 让 1 行 ≈ 14px，h 即「行数」

// 地图 / 摄像头这种「自己按渲染尺寸绘制」的卡片不参与内容缩放（缩放会画错、溢出卡片框）。
const NO_SCALE_CARD_TYPES = new Set(['MapCard', 'CameraCard']);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** 把 '80' / '80%' / 80 都解析成数字，解析不出来用默认值 */
function parseNum(v, d) {
  if (v == null) return d;
  const s = String(v).trim();
  if (s === '') return d;
  const n = parseFloat(s.replace('%', ''));
  return Number.isFinite(n) ? n : d;
}

/** 保证每个卡片在每个断点都有格子；已有「合理」位置保留，退化数据用默认位补 */
function buildLayouts(cards, saved) {
  const ids = (cards || []).map((c) => String(c.id));
  const out = {};
  for (const bp of ['lg', 'md', 'sm']) {
    const existing = saved && Array.isArray(saved[bp]) ? saved[bp] : [];
    const byId = {};
    existing.forEach((it) => {
      byId[String(it.i)] = it;
    });
    out[bp] = ids.map((id, idx) => {
      const prev = byId[id];
      // 只接受「合理」的已保存项：宽高都达到下限、坐标都是有限数。
      // 旧 bug 会把 h:1/w:1 写进配置，这种明显是退化数据，必须当成「没有」
      // 重新生成默认排版，否则卡片会堆在左上角 / 塌成一条线。
      const valid =
        !!prev &&
        Number.isFinite(prev.w) &&
        Number.isFinite(prev.h) &&
        Number.isFinite(prev.x) &&
        Number.isFinite(prev.y) &&
        prev.w >= MIN_W &&
        prev.h >= MIN_H;
      const base = valid
        ? { ...prev, i: id }
        : bp === 'sm'
        ? { i: id, x: 0, y: idx * DEFAULT_CARD_H, w: 1, h: DEFAULT_CARD_H }
        : {
            i: id,
            x: (idx % 2) * DEFAULT_CARD_W,
            y: Math.floor(idx / 2) * DEFAULT_CARD_H,
            w: DEFAULT_CARD_W,
            h: DEFAULT_CARD_H,
          };
      const isSm = bp === 'sm'; // 单列断点：宽固定为 1（列数=1），不能用 MIN_W 钳
      return {
        i: id,
        x: clamp(Number.isFinite(base.x) ? base.x : 0, 0, DRAWER_COLS - 1),
        y: Math.max(0, Number.isFinite(base.y) ? base.y : 0),
        w: isSm ? 1 : clamp(Number.isFinite(base.w) ? base.w : DEFAULT_CARD_W, MIN_W, MAX_W),
        h: clamp(Number.isFinite(base.h) ? base.h : DEFAULT_CARD_H, MIN_H, MAX_H),
      };
    });
  }
  return out;
}

/** 按当前视觉顺序逐行收纳卡片：保留各自宽高，填满一行后再开始下一行。 */
function arrangeLayoutsByRows(layouts) {
  const colsByBreakpoint = { lg: DRAWER_COLS, md: DRAWER_COLS, sm: 1 };
  const next = { ...layouts };

  Object.keys(colsByBreakpoint).forEach((bp) => {
    const source = Array.isArray(layouts[bp]) ? layouts[bp] : [];
    const cols = colsByBreakpoint[bp];
    const ordered = source
      .map((item, index) => ({ ...item, __order: index }))
      .sort((a, b) => a.y - b.y || a.x - b.x || a.__order - b.__order);

    let x = 0;
    let y = 0;
    let rowHeight = 0;
    next[bp] = ordered.map((item) => {
      const w = bp === 'sm'
        ? 1
        : clamp(Number.isFinite(item.w) ? item.w : DEFAULT_CARD_W, MIN_W, cols);
      const h = clamp(Number.isFinite(item.h) ? item.h : DEFAULT_CARD_H, MIN_H, MAX_H);

      // 先从当前行左侧向右排；本行放不下时，整齐换到下一行。
      if (x > 0 && x + w > cols) {
        y += rowHeight;
        x = 0;
        rowHeight = 0;
      }

      const arranged = { ...item, x, y, w, h };
      delete arranged.__order;
      x += w;
      rowHeight = Math.max(rowHeight, h);
      return arranged;
    });
  });

  return next;
}

function TopDrawer({ cards, renderCard, settings }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const hasCards = !!(cards && cards.length);

  // 卡片排版：以后端全局配置里的 drawerLayouts 为准（和尺寸同一个持久化通道，
  // 在壁纸 WebView 沙箱里也能存住，刷新不丢）；没有就用默认排列。
  const [layouts, setLayouts] = useState(() =>
    buildLayouts(cards || [], (settings || {}).drawerLayouts || null)
  );

  // 面板尺寸：宽 / 高 / 左边距，都是百分比。left 为 null 表示「按当前宽度居中」
  const [size, setSize] = useState(() => {
    const s0 = settings || {};
    const rawLeft = s0.drawerLeft;
    return {
      width: clamp(parseNum(s0.drawerWidth, 100), 20, 100),
      height: clamp(parseNum(s0.drawerHeight, 85), 15, 100),
      left:
        rawLeft != null && String(rawLeft).trim() !== ''
          ? clamp(parseNum(rawLeft, 0), 0, 100)
          : null,
    };
  });

  const sizeRef = useRef(size);
  const dragRef = useRef(null);

  // 卡片区真实宽度：用 ResizeObserver 自己测，显式传给 Responsive。
  // 只有在面板打开、卡片区有真实宽度后才渲染网格，避免 WidthProvider
  // 那种「测到 0 / 异常宽度 → 生成退化布局」的坑。
  const [gridWidth, setGridWidth] = useState(0);
  const contentRef = useRef(null);
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect ? e.contentRect.width : el.clientWidth;
        if (w && w > 0) setGridWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasCards]);
  // 进入编辑模式时的快照，供「取消」时回滚（尺寸 + 卡片排版）
  const sizeSnapshotRef = useRef(null);
  const layoutSnapshotRef = useRef(null);
  // editMode 的 ref 镜像：handleLayoutChange 是在渲染期被 RGL 回调的，
  // 直接用闭包里的 editMode 可能拿到旧值，用 ref 取最新。
  const editModeRef = useRef(editMode);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const cardsSig = (cards || []).map((c) => String(c.id)).join('|');

  // 设备增减时补/删格子，已有位置不动（保留内存里当前排版）
  useEffect(() => {
    setLayouts((prev) => buildLayouts(cards || [], prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsSig]);

  // 后端保存的排版（drawerLayouts）到达 / 变化时，非编辑态下用服务端数据覆盖 working copy。
  // 全局配置是异步加载的，所以初始化时 drawerLayouts 可能还是空，等它到位再同步一次。
  const drawerLayouts = (settings || {}).drawerLayouts;
  const layoutSig = drawerLayouts ? JSON.stringify(drawerLayouts) : '';
  useEffect(() => {
    if (editMode) return;
    if (!drawerLayouts || typeof drawerLayouts !== 'object') return;
    setLayouts(buildLayouts(cards || [], drawerLayouts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutSig]);

  // 全局配置加载完成后同步一次尺寸
  const cfgWidth = (settings || {}).drawerWidth;
  const cfgHeight = (settings || {}).drawerHeight;
  const cfgLeft = (settings || {}).drawerLeft;
  useEffect(() => {
    setSize({
      width: clamp(parseNum(cfgWidth, 100), 20, 100),
      height: clamp(parseNum(cfgHeight, 85), 15, 100),
      left:
        cfgLeft != null && String(cfgLeft).trim() !== ''
          ? clamp(parseNum(cfgLeft, 0), 0, 100)
          : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgWidth, cfgHeight, cfgLeft]);

  const handleLayoutChange = useCallback((layout, allLayouts) => {
    // 非编辑态下忽略：react-grid-layout 在挂载/切换断点瞬间会回传一份布局，
    // 盲目写回会覆盖 buildLayouts 计算出的合理排版，导致卡片塌成一条线。
    // 只有在编辑态（用户拖拽/缩放）才需要记录改动。
    if (!editModeRef.current) return;
    setLayouts(allLayouts);
  }, []);

  // ===== 用鼠标改面板大小 / 位置 =====
  const onDragMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / window.innerWidth) * 100;
    const dyPct = ((e.clientY - d.startY) / window.innerHeight) * 100;
    setSize((prev) => {
      const next = { ...prev };
      if (d.mode === 'right' || d.mode === 'corner') {
        next.width = clamp(d.startW + dxPct, 20, 100);
      }
      if (d.mode === 'bottom' || d.mode === 'corner') {
        next.height = clamp(d.startH + dyPct, 15, 100);
      }
      if (d.mode === 'move') {
        next.left = clamp(d.startLeft + dxPct, 0, 100 - (next.width ?? d.startW));
      }
      return next;
    });
  }, []);

  const endDrag = useCallback(() => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', endDrag);
    if (!dragRef.current) return;
    dragRef.current = null;

    // 松手后写回全局配置，刷新也还在
    const cur = sizeRef.current;
    const payload = {
      drawerWidth: Math.round(cur.width),
      drawerHeight: Math.round(cur.height),
      drawerLeft: Math.round(cur.left ?? (100 - cur.width) / 2),
    };
    configApi.setGlobalConfig(payload).catch((e) => {
      console.error('[TopDrawer] 保存抽屉尺寸失败:', e);
    });
  }, [onDragMove]);

  const startDrag = useCallback(
    (e, mode) => {
      e.preventDefault();
      e.stopPropagation();
      const cur = sizeRef.current;
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startW: cur.width,
        startH: cur.height,
        startLeft: cur.left ?? (100 - cur.width) / 2,
      };
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', endDrag);
    },
    [onDragMove, endDrag]
  );

  // 卸载时兜底摘掉监听
  useEffect(
    () => () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', endDrag);
    },
    [onDragMove, endDrag]
  );

  // ===== 编辑模式：进入 / 确认 / 取消 =====
  // 进入编辑：拍下当前尺寸 + 排版快照，并固定面板（不再随鼠标移出而缩回）
  const enterEdit = useCallback(() => {
    sizeSnapshotRef.current = JSON.parse(JSON.stringify(sizeRef.current));
    layoutSnapshotRef.current = JSON.parse(JSON.stringify(layouts));
    editModeRef.current = true;
    setOpen(true);
    setEditMode(true);
  }, [layouts]);

  // 一键排列：非编辑态先进入编辑并拍快照；确认才保存，取消可恢复原排版。
  const autoArrange = useCallback(() => {
    if (!editModeRef.current) {
      sizeSnapshotRef.current = JSON.parse(JSON.stringify(sizeRef.current));
      layoutSnapshotRef.current = JSON.parse(JSON.stringify(layouts));
      editModeRef.current = true;
      setOpen(true);
      setEditMode(true);
    }
    setLayouts(arrangeLayoutsByRows(layouts));
  }, [layouts]);

  // 确认：把尺寸 + 卡片排版一并落盘到后端全局配置（drawerWidth/Height/Left/drawerLayouts），
  // 刷新后也还在；之后退出编辑。
  const confirmEdit = useCallback(() => {
    const cur = sizeRef.current;
    const payload = {
      drawerLayouts: layouts,
      drawerWidth: Math.round(cur.width),
      drawerHeight: Math.round(cur.height),
      drawerLeft: Math.round(cur.left ?? (100 - cur.width) / 2),
    };
    configApi
      .setGlobalConfig(payload)
      .catch((e) => console.error('[TopDrawer] 保存抽屉配置失败:', e));
    editModeRef.current = false;
    setEditMode(false);
    sizeSnapshotRef.current = null;
    layoutSnapshotRef.current = null;
  }, [layouts]);

  // 取消：回滚尺寸 + 排版到进入编辑前的快照（只在内存里还原，不写盘）
  const cancelEdit = useCallback(() => {
    const snapSize = sizeSnapshotRef.current;
    const snapLayout = layoutSnapshotRef.current;
    if (snapSize) setSize(snapSize);
    if (snapLayout) setLayouts(snapLayout);
    editModeRef.current = false;
    setEditMode(false);
    sizeSnapshotRef.current = null;
    layoutSnapshotRef.current = null;
  }, []);

  // 最右侧关闭键始终关闭面板；若还在编辑，先回滚未确认的改动。
  const closeDrawer = useCallback(() => {
    if (editModeRef.current) cancelEdit();
    setOpen(false);
  }, [cancelEdit]);

  if (!cards || cards.length === 0) return null;

  const s = settings || {};
  const drawerBlur =
    s.drawerBlur != null && String(s.drawerBlur).trim() !== ''
      ? `${String(s.drawerBlur).replace('px', '').trim()}px`
      : '12px';
  const drawerOpacity =
    s.drawerOpacity != null && String(s.drawerOpacity).trim() !== ''
      ? String(s.drawerOpacity).trim()
      : '0.6';

  // left 没单独设过就按当前宽度居中；设过就用设的
  // （这样拖右边缘时是往右长，而不是从中心往两边对称缩放）
  const leftPct = size.left != null ? size.left : (100 - size.width) / 2;

  // 卡片玻璃透明度：和主页用同一个值，保证两边卡片观感一致
  const cardGlassAlpha =
    s.cardOpacity != null && String(s.cardOpacity).trim() !== ''
      ? String(s.cardOpacity).trim()
      : '0.6';
  // 卡片标题的全局设置（标题高度 / 字体大小）
  const cardTitleH =
    s.cardTitleHeight != null && String(s.cardTitleHeight).trim() !== ''
      ? `${String(s.cardTitleHeight).replace('px', '').trim()}px`
      : '';
  const cardTitleFont =
    s.cardTitleFontSize != null && String(s.cardTitleFontSize).trim() !== ''
      ? `${String(s.cardTitleFontSize).replace('px', '').trim()}px`
      : '';
  const triggerWidth = clamp(parseNum(s.drawerTriggerWidth, 160), 40, 600);
  const triggerColor = String(s.drawerTriggerColor || '').trim();
  const triggerOpacity = clamp(parseNum(s.drawerTriggerOpacity, 0.3), 0, 1);
  const triggerStyle = {
    '--drawer-trigger-center': `${leftPct + size.width / 2}%`,
    '--drawer-trigger-width': `${triggerWidth}px`,
    '--drawer-trigger-bar-width': `${triggerWidth * 0.9}px`,
    '--drawer-trigger-opacity': String(triggerOpacity),
  };
  if (triggerColor) triggerStyle['--drawer-trigger-color'] = triggerColor;

  const panelStyle = {
    '--drawer-width': `${size.width}%`,
    '--drawer-max-height': `${size.height}%`,
    '--drawer-left': `${leftPct}%`,
    '--drawer-blur': drawerBlur,
    '--drawer-bg-alpha': drawerOpacity,
    '--card-glass-alpha': cardGlassAlpha,
  };
  if (cardTitleH) panelStyle['--card-title-h'] = cardTitleH;
  if (cardTitleFont) panelStyle['--card-title-font'] = cardTitleFont;

  // 卡片内容缩放比 = 当前格子尺寸 / 默认格子尺寸。
  // 默认格子 = 宽 DEFAULT_CARD_W、高 DEFAULT_CARD_H 行（和 buildLayouts 的默认一致）。
  // 这样卡片是默认大小时不缩放（sx=sy=1，和原来一样），被放大/缩小时内容跟着一起缩放。
  const activeBp = gridWidth > 1200 ? 'lg' : gridWidth > 768 ? 'md' : 'sm';
  const itemById = {};
  (layouts[activeBp] || []).forEach((it) => {
    itemById[String(it.i)] = it;
  });
  const defaultCols = activeBp === 'sm' ? 1 : DEFAULT_CARD_W;

  return (
    <div
      className={`top-drawer ${open ? 'open' : ''}`}
      onMouseLeave={() => {
        // 编辑模式下固定面板：鼠标移出也不缩回，直到确认或取消
        if (!editMode) setOpen(false);
      }}
    >
      {/* 随面板中心移动的小把手：触发热区宽度可在全局配置修改 */}
      <div className="top-drawer-trigger" style={triggerStyle} onMouseEnter={() => setOpen(true)} title="下拉面板">
        <span className="top-drawer-trigger-bar" />
      </div>

      <div className="top-drawer-panel" style={panelStyle}>
        {/* 顶部导航条：编辑 / 自动排列在左，关闭固定在最右侧 */}
        <div className={`top-drawer-navbar ${editMode ? 'editing' : ''}`}>
          <div className="top-drawer-nav-actions">
            <button
              type="button"
              className={`top-drawer-nav-btn ${editMode ? 'active' : ''}`}
              onClick={editMode ? confirmEdit : enterEdit}
              title={editMode ? t('config.drawerConfirm') : t('config.drawerEdit')}
              aria-label={editMode ? t('config.drawerConfirm') : t('config.drawerEdit')}
            >
              <Icon path={editMode ? mdiCheck : mdiCog} size={15} />
            </button>
            <button
              type="button"
              className="top-drawer-nav-btn"
              onClick={autoArrange}
              title={t('config.drawerAutoArrange')}
              aria-label={t('config.drawerAutoArrange')}
            >
              <Icon path={mdiAutoFix} size={15} />
            </button>
            {editMode && (
              <button
                type="button"
                className="top-drawer-nav-btn top-drawer-nav-cancel"
                onClick={cancelEdit}
                title={t('config.drawerCancel')}
                aria-label={t('config.drawerCancel')}
              >
                <Icon path={mdiClose} size={15} />
              </button>
            )}
          </div>

          {/* 编辑模式下这行既是提示，也是拖动整块面板的把手 */}
          {editMode && (
            <div className="top-drawer-nav-hint" onMouseDown={(e) => startDrag(e, 'move')}>
              {t('config.drawerEditHint')}
            </div>
          )}

          <button
            type="button"
            className="top-drawer-nav-btn top-drawer-nav-close"
            onClick={closeDrawer}
            title={t('config.drawerClose')}
            aria-label={t('config.drawerClose')}
          >
            <Icon path={mdiClose} size={15} />
          </button>
        </div>

        {/* 卡片区 */}
        <div className="top-drawer-content" ref={contentRef}>
          {/* 关键：只有在面板打开(open)且卡片区已测得真实宽度(gridWidth>0)时才挂载网格。
             避免 WidthProvider 在面板关闭/挂载瞬间测到异常宽度、把卡片重生成成
             默认 h:1/w:1 的退化布局（那正是卡片塌成一条线的根因）。 */}
          {open && gridWidth > 0 && (
            <ResponsiveGridLayout
              className={`top-drawer-layout ${editMode ? 'editing' : ''}`}
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 768, sm: 480 }}
              cols={{ lg: DRAWER_COLS, md: DRAWER_COLS, sm: 1 }}
              rowHeight={DRAWER_ROW_HEIGHT}
              margin={[14, 14]}
              containerPadding={[16, 16]}
              width={gridWidth}
              minH={MIN_H}
              minW={MIN_W}
              isDraggable={editMode}
              isResizable={editMode}
              draggableHandle=".top-drawer-card-handle"
              resizeHandles={['se']}
              useCSSTransforms={true}
              compactType={null}
              // 卡片只允许移入空格；撞到其它卡片时回弹，不挤动现有布局。
              preventCollision={true}
              onLayoutChange={handleLayoutChange}
            >
              {cards.map((card) => {
                const it = itemById[String(card.id)];
                const sx = it ? it.w / defaultCols : 1;
                const sy = it ? it.h / DEFAULT_CARD_H : 1;
                return (
                  <div key={card.id}>
                    <div className="top-drawer-card">
                      {editMode && (
                        <div className="top-drawer-card-handle" title={t('config.drawerEdit')}>
                          <Icon path={mdiDrag} size={14} />
                        </div>
                      )}
                      <ScaledCard sx={sx} sy={sy} noScale={NO_SCALE_CARD_TYPES.has(card.type)}>
                        {renderCard(card)}
                      </ScaledCard>
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>
          )}
        </div>

        {/* 编辑模式：面板尺寸手柄 */}
        {editMode && (
          <>
            <div className="top-drawer-handle right" onMouseDown={(e) => startDrag(e, 'right')} />
            <div className="top-drawer-handle bottom" onMouseDown={(e) => startDrag(e, 'bottom')} />
            <div className="top-drawer-handle corner" onMouseDown={(e) => startDrag(e, 'corner')} />
          </>
        )}
      </div>
    </div>
  );
}

export default TopDrawer;
