import React from 'react';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiCursorDefaultOutline,
  mdiDeleteOutline,
  mdiContentSave,
  mdiImageOutline,
  mdiHistory,
  mdiArrowULeftTop,
} from '@mdi/js';
import { AutoComplete, Input, InputNumber, Button, Slider, Modal, message, Select } from 'antd';
import { useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import { configApi } from '../../utils/api';
import Floorplan3D from '../../components/Floorplan3D';
import { floorplanApi } from '../../floorplan/api';
import {
  createEmptyPlan,
  createRoom,
  createBinding,
  normalizePlan,
  snap,
  roomAreaM2,
  BINDING_KINDS,
} from '../../floorplan/model';
import './style.css';

// ==============================================================================
// 户型图编辑器（整页）
// ------------------------------------------------------------------------------
// 左边 2D 画，右边 3D 实时预览 —— 画完立刻能看到立体效果。
//
// 坐标：SVG 的 user unit 就是**毫米**，viewBox 直接跟着缩放走，
// 所以鼠标位置只要过一次 CTM 逆变换就是毫米坐标，不用手写换算。
//
// 第一版只支持矩形房间（拖一个框 = 一个房间）。底图可以当描图纸：
// 上传户型图 → 调比例和偏移 → 对着描。
// ==============================================================================

const MODE_SELECT = 'select';
const MODE_DRAW = 'draw';

/** 屏幕坐标 -> SVG 里的毫米坐标 */
function toMm(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function FloorplanPage() {
  const { t } = useLanguage();
  const { getAllEntities } = useHass();
  const allEntities = (getAllEntities && getAllEntities()) || {};

  const svgRef = React.useRef(null);
  const hostRef = React.useRef(null);

  const [plan, setPlan] = React.useState(createEmptyPlan);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [mode, setMode] = React.useState(MODE_DRAW);
  const [selectedId, setSelectedId] = React.useState(null);
  const [hostSize, setHostSize] = React.useState({ w: 800, h: 600 });
  const [view, setView] = React.useState({ cx: 0, cy: 0, pxPerMm: 0.06 });
  const [draft, setDraft] = React.useState(null);
  const [backupsOpen, setBackupsOpen] = React.useState(false);
  const [backups, setBackups] = React.useState([]);
  const dragRef = React.useRef(null);

  const floorId = (plan.floors[0] && plan.floors[0].id) || null;
  const selected = (plan.rooms || []).find((r) => r.id === selectedId) || null;

  // ---------- 读 ----------
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await floorplanApi.load();
        if (alive) setPlan(p);
      } catch (e) {
        message.error(`${t('floorplan.loadFailed')}: ${e.message}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 画布尺寸
  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      setHostSize({ w: el.clientWidth || 800, h: el.clientHeight || 600 });
    });
    ro.observe(el);
    setHostSize({ w: el.clientWidth || 800, h: el.clientHeight || 600 });
    return () => ro.disconnect();
  }, []);

  const mutate = React.useCallback((fn) => {
    setPlan((prev) => {
      const next = fn(prev);
      setDirty(true);
      return next;
    });
  }, []);

  // ---------- 保存 ----------
  const handleSave = async () => {
    setSaving(true);
    try {
      await floorplanApi.save(plan);
      setDirty(false);
      message.success(t('floorplan.saved'));
    } catch (e) {
      message.error(`${t('floorplan.saveFailed')}: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ---------- 视图 ----------
  const vw = hostSize.w / view.pxPerMm;
  const vh = hostSize.h / view.pxPerMm;
  const viewBox = `${view.cx - vw / 2} ${view.cy - vh / 2} ${vw} ${vh}`;
  const grid = plan.gridSize || 100;
  // 网格太密就不画了（屏幕上一个格子小于 6px 时）
  const showGrid = grid * view.pxPerMm > 6;

  const onWheel = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const before = toMm(svg, e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const nextZoom = Math.max(0.004, Math.min(1.2, view.pxPerMm * factor));
    setView((v) => {
      const nvw = hostSize.w / nextZoom;
      const nvh = hostSize.h / nextZoom;
      // 以光标为中心缩放：让光标下的那一点保持在原位
      const relX = (before.x - (v.cx - vw / 2)) / vw;
      const relY = (before.y - (v.cy - vh / 2)) / vh;
      return {
        pxPerMm: nextZoom,
        cx: before.x - (relX - 0.5) * nvw,
        cy: before.y - (relY - 0.5) * nvh,
      };
    });
  };

  // ---------- 交互 ----------
  const onPointerDown = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const mm = toMm(svg, e.clientX, e.clientY);

    // 中键 / 右键 = 平移画布
    if (e.button === 1 || e.button === 2) {
      dragRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, cx: view.cx, cy: view.cy };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;

    const target = e.target;
    const handle = target && target.getAttribute && target.getAttribute('data-handle');
    const roomId = target && target.getAttribute && target.getAttribute('data-room');

    // 拖角缩放
    if (handle && selected) {
      dragRef.current = { kind: 'resize', corner: handle, id: selected.id, orig: { ...selected } };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    // 拖动房间
    if (roomId) {
      const room = plan.rooms.find((r) => r.id === roomId);
      setSelectedId(roomId);
      dragRef.current = {
        kind: 'move',
        id: roomId,
        start: mm,
        orig: { x: room.x, y: room.y },
      };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    // 空白处：画新房间
    if (mode === MODE_DRAW) {
      const sx = snap(mm.x, grid);
      const sy = snap(mm.y, grid);
      setDraft({ x: sx, y: sy, w: 0, h: 0 });
      dragRef.current = { kind: 'draw', sx, sy };
      svg.setPointerCapture(e.pointerId);
    } else {
      setSelectedId(null);
    }
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const svg = svgRef.current;
    const mm = toMm(svg, e.clientX, e.clientY);

    if (drag.kind === 'pan') {
      const dx = (e.clientX - drag.startX) / view.pxPerMm;
      const dy = (e.clientY - drag.startY) / view.pxPerMm;
      setView((v) => ({ ...v, cx: drag.cx - dx, cy: drag.cy - dy }));
      return;
    }
    if (drag.kind === 'draw') {
      const ex = snap(mm.x, grid);
      const ey = snap(mm.y, grid);
      setDraft({ x: drag.sx, y: drag.sy, w: ex - drag.sx, h: ey - drag.sy });
      return;
    }
    if (drag.kind === 'move') {
      const dx = snap(mm.x - drag.start.x, grid);
      const dy = snap(mm.y - drag.start.y, grid);
      mutate((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id === drag.id ? { ...r, x: drag.orig.x + dx, y: drag.orig.y + dy } : r
        ),
      }));
      return;
    }
    if (drag.kind === 'resize') {
      const o = drag.orig;
      const corner = drag.corner;
      let { x, y, w, h } = o;
      const right = snap(mm.x, grid);
      const bottom = snap(mm.y, grid);
      if (corner === 'se') {
        w = right - o.x;
        h = bottom - o.y;
      } else if (corner === 'sw') {
        x = right;
        w = o.x + o.w - right;
        h = bottom - o.y;
      } else if (corner === 'ne') {
        y = bottom;
        w = right - o.x;
        h = o.y + o.h - bottom;
      } else {
        x = right;
        y = bottom;
        w = o.x + o.w - right;
        h = o.y + o.h - bottom;
      }
      mutate((p) => ({ ...p, rooms: p.rooms.map((r) => (r.id === o.id ? { ...r, x, y, w, h } : r)) }));
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (drag.kind === 'draw') {
      const d = draft;
      setDraft(null);
      if (!d) return;
      const room = createRoom(floorId, d.x, d.y, d.w, d.h, '');
      // 太小就不建（误点）
      if (Math.abs(room.w) < grid || Math.abs(room.h) < grid) return;
      const normalized = {
        ...room,
        x: Math.min(d.x, d.x + d.w),
        y: Math.min(d.y, d.y + d.h),
        w: Math.abs(d.w),
        h: Math.abs(d.h),
      };
      mutate((p) => ({ ...p, rooms: p.rooms.concat([normalized]) }));
      setSelectedId(normalized.id);
      setMode(MODE_SELECT);
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    mutate((p) => ({
      ...p,
      rooms: p.rooms.filter((r) => r.id !== selected.id),
      bindings: p.bindings.filter((b) => b.roomId !== selected.id),
    }));
    setSelectedId(null);
  };

  // ---------- 底图 ----------
  const [imgSize, setImgSize] = React.useState({ w: 1000, h: 700 });
  const bg = plan.background;
  React.useEffect(() => {
    if (!bg || !bg.url) return;
    const im = new window.Image();
    im.onload = () => setImgSize({ w: im.naturalWidth || 1000, h: im.naturalHeight || 700 });
    im.src = bg.url;
  }, [bg && bg.url]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchBg = (patch) =>
    mutate((p) => ({ ...p, background: { ...(p.background || { url: '', opacity: 0.5, scale: 8, offsetX: 0, offsetY: 0 }), ...patch } }));

  const uploadBg = async (file) => {
    if (!file) return;
    try {
      const res = await configApi.uploadImage(file);
      patchBg({ url: res.file_path, opacity: 0.5, scale: 8, offsetX: 0, offsetY: 0 });
      message.success(t('floorplan.bgUploaded'));
    } catch (e) {
      message.error(`${t('floorplan.bgUploadFailed')}: ${e.message}`);
    }
  };

  // ---------- 绑定 ----------
  const entityOptions = Object.entries(allEntities).map(([id, e]) => ({
    value: id,
    label: `${(e.attributes && e.attributes.friendly_name) || id} (${id})`,
  }));

  const addBinding = () =>
    mutate((p) => ({ ...p, bindings: p.bindings.concat([createBinding(selected.id, '', 'light')]) }));

  const patchBinding = (id, patch) =>
    mutate((p) => ({ ...p, bindings: p.bindings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));

  const removeBinding = (id) =>
    mutate((p) => ({ ...p, bindings: p.bindings.filter((b) => b.id !== id) }));

  const roomBindings = selected ? (plan.bindings || []).filter((b) => b.roomId === selected.id) : [];

  // 3D 预览用的实体状态
  const entityStates = React.useMemo(() => {
    const out = {};
    Object.entries(allEntities).forEach(([id, e]) => {
      out[id] = { state: e.state, attributes: e.attributes || {} };
    });
    return out;
  }, [allEntities]);

  const openBackups = async () => {
    setBackupsOpen(true);
    try {
      setBackups(await floorplanApi.listBackups());
    } catch (e) {
      message.error(e.message);
    }
  };

  const restore = async (name) => {
    try {
      const p = await floorplanApi.restore(name);
      setPlan(p);
      setDirty(false);
      setBackupsOpen(false);
      message.success(t('floorplan.restored'));
    } catch (e) {
      message.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="fp-page fp-page-loading">
        <span>{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="fp-page">
      {/* ---------- 工具栏 ---------- */}
      <div className="fp-toolbar">
        <div className="fp-toolbar-group">
          <button
            type="button"
            className={`fp-btn ${mode === MODE_DRAW ? 'active' : ''}`}
            onClick={() => setMode(MODE_DRAW)}
            title={t('floorplan.modeDraw')}
          >
            <Icon path={mdiPlus} size={15} />
            {t('floorplan.modeDraw')}
          </button>
          <button
            type="button"
            className={`fp-btn ${mode === MODE_SELECT ? 'active' : ''}`}
            onClick={() => setMode(MODE_SELECT)}
            title={t('floorplan.modeSelect')}
          >
            <Icon path={mdiCursorDefaultOutline} size={15} />
            {t('floorplan.modeSelect')}
          </button>
          <button type="button" className="fp-btn" onClick={removeSelected} disabled={!selected}>
            <Icon path={mdiDeleteOutline} size={15} />
            {t('floorplan.deleteRoom')}
          </button>
        </div>

        <div className="fp-toolbar-group">
          <span className="fp-label">{t('floorplan.grid')}</span>
          <InputNumber
            size="small"
            min={10}
            step={50}
            value={grid}
            onChange={(v) => mutate((p) => ({ ...p, gridSize: v || 100 }))}
            style={{ width: 90 }}
            addonAfter="mm"
          />
        </div>

        <div className="fp-toolbar-group">
          <input
            type="file"
            accept="image/*"
            id="fp-bg-upload"
            style={{ display: 'none' }}
            onChange={(e) => {
              uploadBg(e.target.files && e.target.files[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="fp-btn"
            onClick={() => document.getElementById('fp-bg-upload').click()}
          >
            <Icon path={mdiImageOutline} size={15} />
            {t('floorplan.background')}
          </button>
          {bg && bg.url ? (
            <button type="button" className="fp-btn" onClick={() => patchBg({ url: '' })}>
              {t('floorplan.bgClear')}
            </button>
          ) : null}
        </div>

        <div className="fp-toolbar-spacer" />

        <div className="fp-toolbar-group">
          <button type="button" className="fp-btn" onClick={openBackups}>
            <Icon path={mdiHistory} size={15} />
            {t('floorplan.history')}
          </button>
          <button
            type="button"
            className={`fp-btn fp-btn-primary ${dirty ? 'dirty' : ''}`}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Icon path={mdiContentSave} size={15} />
            {saving ? t('config.saving') : t('config.save')}
          </button>
        </div>
      </div>

      {/* ---------- 主体 ---------- */}
      <div className="fp-body">
        <div className="fp-canvas-wrap" ref={hostRef}>
          <svg
            ref={svgRef}
            className={`fp-svg mode-${mode}`}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <defs>
              <pattern
                id="fp-grid"
                width={grid}
                height={grid}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${grid} 0 L 0 0 0 ${grid}`}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.16"
                  strokeWidth={Math.max(1, 1 / view.pxPerMm)}
                />
              </pattern>
            </defs>

            <rect
              x={view.cx - vw / 2}
              y={view.cy - vh / 2}
              width={vw}
              height={vh}
              fill="transparent"
            />
            {showGrid ? (
              <rect
                x={view.cx - vw / 2}
                y={view.cy - vh / 2}
                width={vw}
                height={vh}
                fill="url(#fp-grid)"
                className="fp-grid-rect"
              />
            ) : null}

            {/* 底图（描图纸） */}
            {bg && bg.url ? (
              <image
                href={bg.url}
                x={bg.offsetX || 0}
                y={bg.offsetY || 0}
                width={imgSize.w * (bg.scale || 8)}
                height={imgSize.h * (bg.scale || 8)}
                opacity={bg.opacity == null ? 0.5 : bg.opacity}
                preserveAspectRatio="none"
                style={{ pointerEvents: 'none' }}
              />
            ) : null}

            {/* 房间 */}
            {(plan.rooms || []).map((room) => {
              const isSel = room.id === selectedId;
              return (
                <g key={room.id}>
                  <rect
                    data-room={room.id}
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    className={`fp-room ${isSel ? 'selected' : ''}`}
                    strokeWidth={2 / view.pxPerMm}
                  />
                  {room.name ? (
                    <text
                      x={room.x + room.w / 2}
                      y={room.y + room.h / 2}
                      className="fp-room-label"
                      fontSize={Math.max(60, 260 / Math.max(0.5, view.pxPerMm * 10))}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ pointerEvents: 'none' }}
                    >
                      {room.name}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* 选中房间的四个角把手 */}
            {selected
              ? [
                  ['nw', selected.x, selected.y],
                  ['ne', selected.x + selected.w, selected.y],
                  ['sw', selected.x, selected.y + selected.h],
                  ['se', selected.x + selected.w, selected.y + selected.h],
                ].map(([corner, hx, hy]) => (
                  <rect
                    key={corner}
                    data-handle={corner}
                    x={hx - 5 / view.pxPerMm}
                    y={hy - 5 / view.pxPerMm}
                    width={10 / view.pxPerMm}
                    height={10 / view.pxPerMm}
                    className="fp-handle"
                  />
                ))
              : null}

            {/* 正在拖出来的新房间 */}
            {draft ? (
              <rect
                x={Math.min(draft.x, draft.x + draft.w)}
                y={Math.min(draft.y, draft.y + draft.h)}
                width={Math.abs(draft.w)}
                height={Math.abs(draft.h)}
                className="fp-draft"
                strokeWidth={2 / view.pxPerMm}
                style={{ pointerEvents: 'none' }}
              />
            ) : null}
          </svg>

          <div className="fp-hint">
            {mode === MODE_DRAW ? t('floorplan.hintDraw') : t('floorplan.hintSelect')}
          </div>

          {/* 底图参数 */}
          {bg && bg.url ? (
            <div className="fp-bg-panel">
              <div className="fp-bg-row">
                <span>{t('floorplan.bgOpacity')}</span>
                <Slider
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={bg.opacity == null ? 0.5 : bg.opacity}
                  onChange={(v) => patchBg({ opacity: v })}
                  style={{ flex: 1, margin: '0 8px' }}
                />
              </div>
              <div className="fp-bg-row">
                <span>{t('floorplan.bgScale')}</span>
                <InputNumber
                  size="small"
                  min={0.5}
                  max={200}
                  step={0.5}
                  value={bg.scale || 8}
                  onChange={(v) => patchBg({ scale: v || 8 })}
                  style={{ width: 100 }}
                  addonAfter="mm/px"
                />
              </div>
              <div className="fp-bg-row">
                <span>{t('floorplan.bgOffset')}</span>
                <InputNumber
                  size="small"
                  value={bg.offsetX || 0}
                  onChange={(v) => patchBg({ offsetX: v || 0 })}
                  style={{ width: 86 }}
                  addonBefore="X"
                />
                <InputNumber
                  size="small"
                  value={bg.offsetY || 0}
                  onChange={(v) => patchBg({ offsetY: v || 0 })}
                  style={{ width: 86 }}
                  addonBefore="Y"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------- 右侧 ---------- */}
        <div className="fp-side">
          <div className="fp-preview">
            <Floorplan3D
              plan={plan}
              entityStates={entityStates}
              emptyHint={t('floorplan.previewEmpty')}
            />
          </div>

          <div className="fp-inspector">
            {selected ? (
              <>
                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.roomName')}</span>
                  <Input
                    size="small"
                    value={selected.name}
                    placeholder={t('floorplan.roomNamePlaceholder')}
                    onChange={(e) =>
                      mutate((p) => ({
                        ...p,
                        rooms: p.rooms.map((r) =>
                          r.id === selected.id ? { ...r, name: e.target.value } : r
                        ),
                      }))
                    }
                  />
                </div>
                <div className="fp-meta">
                  {selected.w} × {selected.h} mm · {roomAreaM2(selected)} m²
                </div>

                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.bindings')}</span>
                  {roomBindings.map((b) => (
                    <div className="fp-binding" key={b.id}>
                      <Select
                        size="small"
                        value={b.kind}
                        onChange={(v) => patchBinding(b.id, { kind: v })}
                        options={BINDING_KINDS.map((k) => ({ value: k.value, label: k.label }))}
                        style={{ width: 92 }}
                      />
                      <AutoComplete
                        size="small"
                        value={b.entityId || undefined}
                        onChange={(v) => patchBinding(b.id, { entityId: v || '' })}
                        options={entityOptions}
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder={t('configField.selectEntity')}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <Button size="small" danger onClick={() => removeBinding(b.id)}>
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button size="small" block onClick={addBinding}>
                    ＋ {t('floorplan.addBinding')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="fp-inspector-empty">{t('floorplan.selectHint')}</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={t('floorplan.history')}
        open={backupsOpen}
        onCancel={() => setBackupsOpen(false)}
        footer={null}
        width={520}
      >
        {backups.length === 0 ? (
          <div className="fp-inspector-empty">{t('floorplan.noBackups')}</div>
        ) : (
          <div className="fp-backup-list">
            {backups.map((b) => (
              <div className="fp-backup-item" key={b.name}>
                <span>{b.mtime.replace('T', ' ').slice(0, 19)}</span>
                <Button size="small" icon={<Icon path={mdiArrowULeftTop} size={12} />} onClick={() => restore(b.name)}>
                  {t('floorplan.restore')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default FloorplanPage;
