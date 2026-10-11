import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete, Button, Input, Select } from 'antd';
import { Icon } from '@iconify/react';
import { useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import { configApi } from '../../utils/api';
import { getMdiIcons } from '../../utils/helper';
import { normalizeIconSize } from '../../utils/iconSize';
import { buildEntityOptions } from '../../utils/entityOptions';
import { candidateStates } from '../../utils/entityState';
import CardSlotPopup from '../LightOverviewCard/CardSlotPopup';
import AttachmentManagerModal from '../AttachmentManagerModal';
import AnyEntityToggle from '../ConfigField/AnyEntityToggle';
import './style.css';

// ==============================================================================
// 智能概览（原「灯光概览」）：布局编辑器
// ------------------------------------------------------------------------------
// 布局：左边是图，右边是设置面板。
//   · 点图中的「背景」→ 右侧显示背景图的设置
//   · 点「灯光图标」  → 右侧显示该灯光的设置
//   · 点「卡片位」    → 右侧显示该卡片位的设置（绑定哪张卡片、弹出多大）
//   · 选中的元素可以直接拖动改位置；点空白处取消选中
//
// ⚠️ 灯光效果图（光晕图）在这里**不渲染** —— 它和背景图一样大，一旦可点就会
//    挡住背景，导致「点灯光却选中了背景」。卡片实际渲染时才画（见 FloorPlan.js）。
//
// ⚠️ 编辑区必须和真实卡片一样是正方形（卡片 .floor-plan 是 aspect-ratio:1），
//    否则百分比定位在拖拽时会变形。
// ==============================================================================

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const ICON_SIZE_MIN = 4;
const ICON_SIZE_MAX = 120;

function toNum(v, fallback) {
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  const n = parseFloat(String(v).replace(/[%px]/gi, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

/** 设置面板里的一行：标签 + 控件 */
function Row({ label, children }) {
  return (
    <div className="loe-row">
      <span className="loe-label">{label}</span>
      {children}
    </div>
  );
}

/**
 * 实体数据：把所选实体当前的**状态 / 域 / device_class / 全部属性**摊开给用户看，
 * 并列出「可能的状态值」—— 点一下就能加进「运行时状态」。
 *
 * 为什么需要它：不同域的实体状态值五花八门（lock 是 locked/unlocked、climate 是
 * heat/cool/auto…、数值传感器干脆是 21.5），光看实体名根本猜不到该往「运行时状态」里填什么。
 */
function EntityData({ entityId, entity, onStates, onToggleState, t }) {
  const [open, setOpen] = useState(false);
  const domain = String(entityId || '').split('.')[0];
  const attrs = (entity && entity.attributes) || {};
  const picked = Array.isArray(onStates) ? onStates : [];
  const states = candidateStates(entityId, entity, picked);

  return (
    <div className="loe-entity-data">
      <button type="button" className="loe-entity-data-toggle" onClick={() => setOpen((v) => !v)}>
        <span>{t('lightOverviewEditor.viewEntityData')}</span>
        <span className="loe-entity-data-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="loe-entity-data-body">
          <div className="loe-entity-data-line">
            <span className="loe-entity-data-k">{t('lightOverviewEditor.currentState')}</span>
            <code className="loe-entity-data-state">{entity && entity.state ? entity.state : '—'}</code>
            <span className="loe-entity-data-k">domain</span>
            <code>{domain || '—'}</code>
            {attrs.device_class ? (
              <>
                <span className="loe-entity-data-k">device_class</span>
                <code>{attrs.device_class}</code>
              </>
            ) : null}
          </div>
          <div className="loe-entity-data-line">
            <span className="loe-entity-data-k">{t('lightOverviewEditor.possibleStates')}</span>
            <span className="loe-entity-data-chips">
              {states.length ? (
                states.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`loe-state-chip ${picked.includes(s) ? 'is-picked' : ''}`}
                    title={t('lightOverviewEditor.pickStateHint')}
                    onClick={() => onToggleState(s)}
                  >
                    {s}
                  </button>
                ))
              ) : (
                <span className="loe-entity-data-none">{t('lightOverviewEditor.noStateYet')}</span>
              )}
            </span>
          </div>
          <details className="loe-entity-data-attrs">
            <summary>attributes</summary>
            <pre>{JSON.stringify(attrs, null, 2)}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}

/** 图片行：上传 / 从附件里选 / 清除（accept 用 image/*，GIF 也支持） */
function ImageRow({ label, value, onChange, t }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    try {
      const res = await configApi.uploadImage(file);
      onChange(res.file_path);
    } catch (e) {
      console.error('图片上传失败:', e);
    }
  };

  return (
    <Row label={label}>
      <div className="loe-file">
        <span className="loe-file-name">
          {value ? String(value).split('/').pop() : t('lightOverviewEditor.noFile')}
        </span>
        <label className="loe-btn loe-btn-sm">
          <Icon icon="mdi:upload" width={12} />
          {value ? t('lightOverviewEditor.changeFile') : t('lightOverviewEditor.uploadFile')}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleUpload(e.target.files && e.target.files[0]);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="loe-btn loe-btn-sm"
          onClick={() => setShowPicker(true)}
          title={t('lightOverviewEditor.pickFile')}
        >
          <Icon icon="mdi:folder-image" width={12} />
          {t('lightOverviewEditor.pickFile')}
        </button>
        {value ? (
          <button type="button" className="loe-btn loe-btn-sm" onClick={() => onChange('')}>
            <Icon icon="mdi:close" width={12} />
            {t('lightOverviewEditor.clearFile')}
          </button>
        ) : null}
      </div>

      <AttachmentManagerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={(it) => {
          onChange(it.url);
          setShowPicker(false);
        }}
      />
    </Row>
  );
}

export default function LightOverviewEditor({ config, onPatch }) {
  const { t } = useLanguage();
  const { getAllEntities } = useHass();

  const cfg = config || {};
  const rooms = Array.isArray(cfg.rooms) ? cfg.rooms : [];
  const cardSlots = Array.isArray(cfg.cards) ? cfg.cards : [];
  const background = cfg.background || '';

  const areaRef = useRef(null);
  const [selected, setSelected] = useState(null); // { kind: 'bg' | 'room' | 'card', index }
  const [drag, setDrag] = useState(null);
  const [userCards, setUserCards] = useState([]);
  // 背景图「从附件选择」弹窗
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  // 正在「编辑位置」的卡片位：{ index, slot }
  const [editingSlot, setEditingSlot] = useState(null);

  const imageSize = toNum(cfg.imageSize, 110);
  const imageLeft = toNum(cfg.imageLeft, -5);
  const imageTop = toNum(cfg.imageTop, -5);

  const selectedRoom = selected && selected.kind === 'room' ? rooms[selected.index] : null;
  const selectedCard = selected && selected.kind === 'card' ? cardSlots[selected.index] : null;

  const patch = useCallback((p) => onPatch(p), [onPatch]);

  // 用户已添加的卡片列表（供「卡片位」绑定；排除本卡片自己，避免无限嵌套）
  useEffect(() => {
    let alive = true;
    configApi
      .getConfig()
      .then((res) => {
        if (!alive) return;
        const list = (res && res.data && res.data.cards) || [];
        setUserCards(list.filter((c) => c.type !== 'LightOverviewCard'));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 实体下拉：**默认只列灯 / 开关**（原有行为）；打开「显示全部实体」才列全部域。
  // 房间的「选择实体」和卡位的「绑定实体」各管各的开关，互不影响。
  const allEntities = getAllEntities() || {};
  const [anyRoomEntity, setAnyRoomEntity] = useState(false);
  const [anyCardEntity, setAnyCardEntity] = useState(false);
  const roomEntityId = selectedRoom ? selectedRoom.entity_id : null;
  const cardEntityId = selectedCard ? selectedCard.entityId : null;

  // ⚠️ 必须把「当前已选中的值」keep 进去：antd 的 Select 拿到不在 options 里的 value 时，
  //    下拉框上会退化成显示**裸实体 id**（拿不到友好名）。
  const roomEntityOptions = useMemo(
    () => buildEntityOptions(allEntities, { allowAny: anyRoomEntity, keep: [roomEntityId] }),
    [allEntities, anyRoomEntity, roomEntityId]
  );
  const cardEntityOptions = useMemo(
    () => buildEntityOptions(allEntities, { allowAny: anyCardEntity, keep: [cardEntityId] }),
    [allEntities, anyCardEntity, cardEntityId]
  );

  // 卡位绑的实体本身 + 它「可能的状态值」候选（给「运行时状态」下拉当选项）
  const cardEntity = cardEntityId ? allEntities[cardEntityId] : null;
  const cardStateOptions = candidateStates(
    cardEntityId,
    cardEntity,
    selectedCard ? selectedCard.onStates : null
  );

  // 图标下拉：直接渲染出图标样式（并带 searchText 供搜索）
  const iconOptions = useMemo(
    () =>
      getMdiIcons().map((ic) => ({
        value: ic.name,
        searchText: `${ic.name} ${ic.label}`,
        label: (
          <span className="loe-icon-option">
            <Icon icon={ic.name} width={16} />
            <span>{ic.label}</span>
          </span>
        ),
      })),
    []
  );

  // 可绑定的卡片
  const cardOptions = useMemo(
    () =>
      userCards.map((c) => ({
        value: String(c.id),
        label: `${(c.config && c.config.title) || c.type}（${c.type}）`,
      })),
    [userCards]
  );

  const updateRoom = (index, roomPatch) => {
    patch({ rooms: rooms.map((r, i) => (i === index ? { ...r, ...roomPatch } : r)) });
  };

  const updateCard = (index, cardPatch) => {
    patch({ cards: cardSlots.map((c, i) => (i === index ? { ...c, ...cardPatch } : c)) });
  };

  const addRoom = () => {
    const next = [
      ...rooms,
      {
        name: t('lightOverviewEditor.newRoom'),
        entity_id: '',
        icon: 'mdi:ceiling-light',
        position: { left: '50%', top: '50%' },
      },
    ];
    patch({ rooms: next });
    setSelected({ kind: 'room', index: next.length - 1 });
  };

  const addCard = () => {
    const next = [
      ...cardSlots,
      {
        name: t('lightOverviewEditor.newCard'),
        icon: 'mdi:card-outline',
        cardId: '',
        size: 30,
        width: 420,
        height: 320,
        position: { left: '50%', top: '50%' },
      },
    ];
    patch({ cards: next });
    setSelected({ kind: 'card', index: next.length - 1 });
  };

  const removeRoom = (index) => {
    patch({ rooms: rooms.filter((_, i) => i !== index) });
    setSelected(null);
  };

  const removeCard = (index) => {
    patch({ cards: cardSlots.filter((_, i) => i !== index) });
    setSelected(null);
  };

  const pickImage = async (file) => {
    if (!file) return '';
    try {
      const res = await configApi.uploadImage(file);
      return res.file_path;
    } catch (e) {
      console.error('图片上传失败:', e);
      return '';
    }
  };

  const beginDrag = (e, kind, index) => {
    if (e.button !== undefined && e.button !== 0) return; // 只响应左键
    e.preventDefault();
    e.stopPropagation();
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const target =
      kind === 'room' ? rooms[index] : kind === 'card' ? cardSlots[index] : null;
    setSelected({ kind, index });
    setDrag({
      kind,
      index,
      rect,
      sx: e.clientX,
      sy: e.clientY,
      l0: kind === 'bg' ? imageLeft : toNum(target?.position?.left, 50),
      t0: kind === 'bg' ? imageTop : toNum(target?.position?.top, 50),
    });
  };

  // 拖拽期间在 window 上监听：比 setPointerCapture 稳（捕获后事件不会再冒泡到容器）
  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => {
      const dx = ((e.clientX - drag.sx) / drag.rect.width) * 100;
      const dy = ((e.clientY - drag.sy) / drag.rect.height) * 100;
      if (drag.kind === 'bg') {
        patch({
          imageLeft: `${clamp(drag.l0 + dx, -150, 150).toFixed(2)}%`,
          imageTop: `${clamp(drag.t0 + dy, -150, 150).toFixed(2)}%`,
        });
        return;
      }
      const nextPos = {
        left: `${clamp(drag.l0 + dx, 0, 100).toFixed(2)}%`,
        top: `${clamp(drag.t0 + dy, 0, 100).toFixed(2)}%`,
      };
      if (drag.kind === 'room') {
        patch({
          rooms: rooms.map((r, i) =>
            i === drag.index ? { ...r, position: { ...(r.position || {}), ...nextPos } } : r
          ),
        });
      } else {
        patch({
          cards: cardSlots.map((c, i) =>
            i === drag.index ? { ...c, position: { ...(c.position || {}), ...nextPos } } : c
          ),
        });
      }
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, rooms, cardSlots, cfg, patch]);

  const iconPxOf = (room) => normalizeIconSize(room.iconSize);

  /** 右侧面板：没选中时给一句提示 */
  const sidePanel = !selected ? (
    <div className="loe-side-empty">
      <Icon icon="mdi:cursor-default-click-outline" width={26} />
      <span>{t('lightOverviewEditor.sideEmpty')}</span>
    </div>
  ) : selected.kind === 'bg' ? (
    <div className="loe-panel">
      <div className="loe-panel-title">
        <Icon icon="mdi:image-outline" width={14} />
        <span>{t('lightOverviewEditor.backgroundTitle')}</span>
      </div>

      <Row label={t('lightOverviewEditor.imageSize')}>
        <input
          type="range"
          min="50"
          max="200"
          step="1"
          value={imageSize}
          className="loe-range"
          onChange={(e) => patch({ imageSize: e.target.value })}
        />
        <span className="loe-value">{imageSize}%</span>
      </Row>

      <Row label={t('lightOverviewEditor.posX')}>
        <input
          type="range"
          min="-150"
          max="150"
          step="1"
          value={imageLeft}
          className="loe-range"
          onChange={(e) => patch({ imageLeft: `${e.target.value}%` })}
        />
        <span className="loe-value">{imageLeft}%</span>
      </Row>

      <Row label={t('lightOverviewEditor.posY')}>
        <input
          type="range"
          min="-150"
          max="150"
          step="1"
          value={imageTop}
          className="loe-range"
          onChange={(e) => patch({ imageTop: `${e.target.value}%` })}
        />
        <span className="loe-value">{imageTop}%</span>
      </Row>

      <div className="loe-panel-actions">
        <label className="loe-btn">
          <Icon icon="mdi:swap-horizontal" width={13} />
          {t('lightOverviewEditor.changeBackground')}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const p = await pickImage(e.target.files && e.target.files[0]);
              if (p) patch({ background: p });
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" className="loe-btn" onClick={() => setBgPickerOpen(true)}>
          <Icon icon="mdi:folder-image" width={13} />
          {t('lightOverviewEditor.pickFile')}
        </button>
      </div>
    </div>
  ) : selectedRoom ? (
    <div className="loe-panel">
      <div className="loe-panel-title">
        <Icon icon={selectedRoom.icon || 'mdi:ceiling-light'} width={14} />
        <span>{selectedRoom.name || t('lightOverviewEditor.lightTitle')}</span>
        <span className="loe-panel-sub">{t('lightOverviewEditor.lightTitle')}</span>
      </div>

      <Row label={t('configField.roomName')}>
        <Input
          size="small"
          value={selectedRoom.name || ''}
          onChange={(e) => updateRoom(selected.index, { name: e.target.value })}
          placeholder={t('configField.placeholderRoomName')}
        />
      </Row>

      <Row label={t('configField.selectEntity')}>
        <Select
          size="small"
          showSearch
          allowClear
          optionFilterProp="label"
          value={selectedRoom.entity_id || undefined}
          onChange={(v) => updateRoom(selected.index, { entity_id: v || '' })}
          options={roomEntityOptions}
          style={{ width: '100%' }}
          placeholder={t('configField.selectEntityPlaceholder')}
        />
      </Row>
      <AnyEntityToggle checked={anyRoomEntity} onChange={setAnyRoomEntity} indent={68} />

      <Row label={t('configField.selectIcon')}>
        <AutoComplete
          size="small"
          showSearch
          allowClear
          value={selectedRoom.icon || ''}
          onChange={(v) => updateRoom(selected.index, { icon: v })}
          options={iconOptions}
          filterOption={(input, option) =>
            String((option && option.searchText) || '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          placeholder={t('configField.selectIcon')}
        />
      </Row>

      {/* 灯光效果图：灯亮时叠在背景上的那张光晕图 */}
      <ImageRow
        label={t('lightOverviewEditor.lightImage')}
        value={selectedRoom.image}
        onChange={(p) => updateRoom(selected.index, { image: p })}
        t={t}
      />

      <Row label={t('lightOverviewEditor.iconSize')}>
        <input
          type="range"
          min={ICON_SIZE_MIN}
          max={ICON_SIZE_MAX}
          step="1"
          value={iconPxOf(selectedRoom)}
          className="loe-range"
          onChange={(e) => updateRoom(selected.index, { iconSize: e.target.value })}
        />
        <span className="loe-value">{iconPxOf(selectedRoom)}px</span>
      </Row>

      <Row label={t('lightOverviewEditor.position')}>
        <span className="loe-pos">
          {selectedRoom.position?.left || '50%'} / {selectedRoom.position?.top || '50%'}
        </span>
      </Row>

      <div className="loe-panel-actions">
        <Button size="small" danger onClick={() => removeRoom(selected.index)}>
          <Icon icon="mdi:delete-outline" width={13} />
          <span style={{ marginLeft: 4 }}>{t('lightOverviewEditor.removeLight')}</span>
        </Button>
      </div>
    </div>
  ) : selectedCard ? (
    <div className="loe-panel">
      <div className="loe-panel-title">
        <Icon icon={selectedCard.icon || 'mdi:card-outline'} width={14} />
        <span>{selectedCard.name || t('lightOverviewEditor.cardTitle')}</span>
        <span className="loe-panel-sub">{t('lightOverviewEditor.cardTitle')}</span>
      </div>

      <Row label={t('configField.roomName')}>
        <Input
          size="small"
          value={selectedCard.name || ''}
          onChange={(e) => updateCard(selected.index, { name: e.target.value })}
          placeholder={t('lightOverviewEditor.placeholderCardName')}
        />
      </Row>

      {/* 绑定的传感器：决定图标用哪个状态；没绑卡片时点按钮就是开关它 */}
      <Row label={t('lightOverviewEditor.bindEntity')}>
        <Select
          size="small"
          showSearch
          allowClear
          optionFilterProp="label"
          value={selectedCard.entityId || undefined}
          onChange={(v) => updateCard(selected.index, { entityId: v || '' })}
          options={cardEntityOptions}
          style={{ width: '100%' }}
          placeholder={t('lightOverviewEditor.placeholderBindEntity')}
        />
      </Row>
      <AnyEntityToggle checked={anyCardEntity} onChange={setAnyCardEntity} indent={68} />

      {/* 绑定的卡片：点了弹出它；不绑就只开关上面的传感器 */}
      <Row label={t('lightOverviewEditor.bindCard')}>
        <Select
          size="small"
          showSearch
          allowClear
          optionFilterProp="label"
          value={selectedCard.cardId ? String(selectedCard.cardId) : undefined}
          onChange={(v) => updateCard(selected.index, { cardId: v || '' })}
          options={cardOptions}
          style={{ width: '100%' }}
          placeholder={t('lightOverviewEditor.placeholderBindCard')}
        />
      </Row>

      {/* 绑了传感器 → 按状态显示「运行时 / 停止时」两张图标；
          没绑传感器 → 只用一个默认图标（可挑 mdi 图标，也可上传图片） */}
      {selectedCard.entityId ? (
        <>
          <Row label={t('lightOverviewEditor.onStates')}>
            <Select
              mode="tags"
              size="small"
              allowClear
              value={selectedCard.onStates || []}
              onChange={(v) => updateCard(selected.index, { onStates: v })}
              options={cardStateOptions.map((s) => ({ value: s, label: s }))}
              placeholder={t('lightOverviewEditor.onStatesPlaceholder')}
              style={{ width: '100%' }}
            />
          </Row>
          {/* ⚠️ 类名别叫 .loe-hint —— 那个类名这个文件里已经有了（工具栏的提示文字，
              带 `flex: 1 1 200px`），在竖向 flex 面板里会把这段提示撑成 200px 高。 */}
          <p className="loe-state-hint">{t('lightOverviewEditor.onStatesHint')}</p>
          <EntityData
            entityId={selectedCard.entityId}
            entity={cardEntity}
            onStates={selectedCard.onStates}
            onToggleState={(s) => {
              const cur = Array.isArray(selectedCard.onStates) ? selectedCard.onStates : [];
              updateCard(selected.index, {
                onStates: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
              });
            }}
            t={t}
          />
          <ImageRow
            label={t('lightOverviewEditor.imageOn')}
            value={selectedCard.imageOn}
            onChange={(p) => updateCard(selected.index, { imageOn: p })}
            t={t}
          />
          <ImageRow
            label={t('lightOverviewEditor.imageOff')}
            value={selectedCard.imageOff}
            onChange={(p) => updateCard(selected.index, { imageOff: p })}
            t={t}
          />
        </>
      ) : (
        <>
          <Row label={t('lightOverviewEditor.defaultIcon')}>
            <AutoComplete
              size="small"
              showSearch
              allowClear
              value={selectedCard.icon || ''}
              onChange={(v) => updateCard(selected.index, { icon: v })}
              options={iconOptions}
              filterOption={(input, option) =>
                String((option && option.searchText) || '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              placeholder={t('configField.selectIcon')}
            />
          </Row>
          <ImageRow
            label={t('lightOverviewEditor.defaultImage')}
            value={selectedCard.image}
            onChange={(p) => updateCard(selected.index, { image: p })}
            t={t}
          />
        </>
      )}

      <Row label={t('lightOverviewEditor.slotSize')}>
        <input
          type="range"
          min={ICON_SIZE_MIN}
          max={ICON_SIZE_MAX}
          step="1"
          value={normalizeIconSize(selectedCard.size, 30)}
          className="loe-range"
          onChange={(e) => updateCard(selected.index, { size: e.target.value })}
        />
        <span className="loe-value">{normalizeIconSize(selectedCard.size, 30)}px</span>
      </Row>

      <Row label={t('lightOverviewEditor.position')}>
        <span className="loe-pos">
          {selectedCard.position?.left || '50%'} / {selectedCard.position?.top || '50%'}
        </span>
      </Row>

      <div className="loe-panel-actions">
        <Button
          size="small"
          onClick={() => setEditingSlot({ index: selected.index, slot: selectedCard })}
        >
          <Icon icon="mdi:crop-free" width={13} />
          <span style={{ marginLeft: 4 }}>{t('lightOverviewEditor.editPosition')}</span>
        </Button>
        <Button size="small" danger onClick={() => removeCard(selected.index)}>
          <Icon icon="mdi:delete-outline" width={13} />
          <span style={{ marginLeft: 4 }}>{t('lightOverviewEditor.removeCard')}</span>
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="loe-root">
      <div className="loe-main">
        {/* ---------------- 图片区 ---------------- */}
        <div className="loe-area" ref={areaRef} onPointerDown={() => setSelected(null)}>
          {background ? (
            <img
              src={background}
              alt=""
              draggable={false}
              className={`loe-bg ${selected?.kind === 'bg' ? 'is-selected' : ''}`}
              style={{
                width: `${imageSize}%`,
                height: `${imageSize}%`,
                left: `${imageLeft}%`,
                top: `${imageTop}%`,
              }}
              onPointerDown={(e) => beginDrag(e, 'bg')}
            />
          ) : (
            <div className="loe-empty">
              <Icon icon="mdi:image-plus" width={28} />
              <span>{t('lightOverviewEditor.noBackground')}</span>
              <label className="loe-btn loe-btn-primary">
                <Icon icon="mdi:upload" width={14} />
                {t('lightOverviewEditor.uploadBackground')}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const p = await pickImage(e.target.files && e.target.files[0]);
                    if (p) {
                      patch({ background: p });
                      setSelected({ kind: 'bg', index: -1 });
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              <button type="button" className="loe-btn" onClick={() => setBgPickerOpen(true)}>
                <Icon icon="mdi:folder-image" width={14} />
                {t('lightOverviewEditor.pickFile')}
              </button>
            </div>
          )}

          {rooms.map((room, i) => {
            const isSel = selected?.kind === 'room' && selected.index === i;
            const iconPx = iconPxOf(room);
            return (
              <button
                // ⚠️ 必须带下标：两个房间绑同一个实体是合法配置（比如一个传感器管两处灯），
                //    只按 entity_id 做 key 会撞车 → React 重复 key 警告、元素可能重复/丢失。
                key={`${room.entity_id || 'room'}-${i}`}
                type="button"
                className={`loe-light-btn ${isSel ? 'is-selected' : ''}`}
                style={{
                  left: room.position?.left || '50%',
                  top: room.position?.top || '50%',
                  width: iconPx * 1.25,
                  height: iconPx * 1.25,
                }}
                onPointerDown={(e) => beginDrag(e, 'room', i)}
                title={room.name}
              >
                <Icon icon={room.icon || 'mdi:ceiling-light'} width={iconPx} />
              </button>
            );
          })}

          {cardSlots.map((slot, i) => {
            const isSel = selected?.kind === 'card' && selected.index === i;
            const slotPx = normalizeIconSize(slot.size, 30);
            // 用了自定义图片（含 GIF）就直接显示图片，并去掉圆形外框
            const img = slot.entityId ? slot.imageOn || slot.imageOff : slot.image;
            return (
              <button
                key={slot.cardId ? `${slot.cardId}-${i}` : `slot-${i}`}
                type="button"
                className={`loe-light-btn loe-card-slot ${isSel ? 'is-selected' : ''} ${img ? 'has-image' : ''}`}
                style={{
                  left: slot.position?.left || '50%',
                  top: slot.position?.top || '50%',
                  width: slotPx * 1.25,
                  height: slotPx * 1.25,
                }}
                onPointerDown={(e) => beginDrag(e, 'card', i)}
                title={slot.name}
              >
                {img ? (
                  <img src={img} alt="" className="loe-slot-img" draggable={false} />
                ) : (
                  <Icon icon={slot.icon || 'mdi:card-outline'} width={slotPx} />
                )}
              </button>
            );
          })}
        </div>

        {/* ---------------- 右侧设置面板 ---------------- */}
        <div className="loe-side">{sidePanel}</div>
      </div>

      {/* ---------------- 工具栏 ---------------- */}
      <div className="loe-toolbar">
        <span className="loe-hint">
          {background ? t('lightOverviewEditor.hint') : t('lightOverviewEditor.hintNoBg')}
        </span>
        <div className="loe-toolbar-actions">
          <Button size="small" onClick={addRoom}>
            <Icon icon="mdi:lightbulb-on-outline" width={13} />
            <span style={{ marginLeft: 4 }}>{t('lightOverviewEditor.addLight')}</span>
          </Button>
          <Button size="small" onClick={addCard}>
            <Icon icon="mdi:card-plus-outline" width={13} />
            <span style={{ marginLeft: 4 }}>{t('lightOverviewEditor.addCard')}</span>
          </Button>
        </div>
      </div>

      {/* 背景图：从附件管理里挑一个已上传的文件 */}
      <AttachmentManagerModal
        open={bgPickerOpen}
        onClose={() => setBgPickerOpen(false)}
        onPick={(it) => {
          patch({ background: it.url });
          setSelected({ kind: 'bg', index: -1 });
          setBgPickerOpen(false);
        }}
      />

      {/* 「编辑位置」：直接弹出卡片，自由拖动 + 拉伸，右下角保存 / 取消 */}
      {editingSlot ? (
        <CardSlotPopup
          slot={editingSlot.slot}
          cardDef={
            userCards.find((c) => String(c.id) === String(editingSlot.slot.cardId)) || null
          }
          editable
          onClose={() => setEditingSlot(null)}
          onSave={(rect) => {
            updateCard(editingSlot.index, {
              x: rect.x,
              y: rect.y,
              width: rect.w,
              height: rect.h,
            });
            setEditingSlot(null);
          }}
        />
      ) : null}
    </div>
  );
}
