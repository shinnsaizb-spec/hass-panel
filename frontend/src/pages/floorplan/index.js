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
  mdiDoor,
  mdiWindowClosed,
  mdiWall,
  mdiGarage,
  mdiVectorPolygon,
  mdiFormatLineStyle,
  mdiFitToPageOutline,
  mdiViewSplitVertical,
  mdiClose,
  mdiSofaOutline,
  mdiRotateRight,
  mdiContentCopy,
  mdiRulerSquare,
  mdiAutoFix,
} from '@mdi/js';
import { AutoComplete, Input, InputNumber, Button, Slider, Modal, message, Select } from 'antd';
import { useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import { configApi } from '../../utils/api';
// 3D 预览：用移植过来的 neonplan3d 引擎（原来那个简易版已删除）
import Floorplan3D from '../../floorplan3d';
import { planToBuilding, buildingToPlan, mergePlanIntoBuilding } from '../../floorplan3d/adapter';
import FloorplanEditor from '../../floorplan-editor';
import useEditorHass from '../../floorplan-editor/useEditorHass';
import {
  documentToBuilding,
  documentToPlan,
  isBuildingDocument,
  legacyMetaFromPlan,
  buildingDocument,
  floorplanApi,
} from '../../floorplan/api';
import FurnitureLibrary from './FurnitureLibrary';
import CalibrateModal from './CalibrateModal';
import AiFloorplanModal from './AiFloorplanModal';
import { furnitureLabel } from '../../floorplan/furniture';
import {
  createEmptyPlan,
  createRoom,
  createPolyRoom,
  createBinding,
  createOpening,
  createFreeWall,
  createFurniture,
  furnitureCorners,
  freeWallLength,
  roomBounds,
  setRoomRect,
  getRoomPolygon,
  edgeLength,
  isRectRoom,
  OPENING_TYPES,
  openingDefaults,
  roomAreaM2,
  BINDING_KINDS,
} from '../../floorplan/model';
import { generateWalls, splitWallByOpenings } from '../../floorplan/walls';
import { snapPoint, nearestRoomEdge, clampOpeningOffset, SNAP_PX } from '../../floorplan/snap';
import './style.css';

// ==============================================================================
// 户型图编辑器（整页）
// ------------------------------------------------------------------------------
// 左边 2D 画，右边 3D 实时预览 —— 画完立刻能看到立体效果。
//
// 坐标：SVG 的 user unit 就是**毫米**，viewBox 直接跟着缩放走，
// 所以鼠标位置只要过一次 CTM 逆变换就是毫米坐标，不用手写换算。
//
// 房间支持两种画法：拖框 = 矩形；多边形模式逐点点击 = 任意形状。
// 墙由房间多边形现算（见 floorplan/walls.js），带厚度、可单独覆盖；
// 另外还能画不依附房间的自由隔断墙。底图可以当描图纸：
// 上传户型图 → 调比例和偏移 → 对着描。
// ==============================================================================

const MODE_SELECT = 'select';
const MODE_DRAW = 'draw';
/** 放门窗：在墙上点一下落一个洞，然后可以沿墙拖 */
const MODE_OPENING = 'opening';
/** 画自由多边形房间：逐点点击，双击闭合 */
const MODE_POLY = 'poly';
/** 画自由隔断墙：按住拖一条线 */
const MODE_FREEWALL = 'freewall';
/** 摆放家具：在画布上点一下放一件（选中的类型见 furnType） */
const MODE_FURNITURE = 'furniture';

// ---------- 编辑器版本偏好（classic / new）----------
// ⚠️ 存储键**带版本号**，别改成裸字符串：上一版实现是「裸字符串 + 每次挂载都自动写回」，
//    所以凡是打开过户型图页的浏览器，localStorage 里都躺着一个 'classic'。
//    只把默认值翻成 'new' 对这些人**完全无效**（读到的永远是那个 'classic'）。
//    带 v 号之后旧值自动作废，默认值才真正生效；用户显式切换仍会被尊重。
const EDITOR_PREF_KEY = 'hasspanel:floorplan-editor';
const EDITOR_PREF_VERSION = 2;
const DEFAULT_EDITOR_VERSION = 'new';

/** 读编辑器版本偏好；没存过 / 存的是上一版的裸字符串 → 一律回默认（新版）。 */
function readEditorPref() {
  try {
    const raw = localStorage.getItem(EDITOR_PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.v === EDITOR_PREF_VERSION &&
        (parsed.editor === 'classic' || parsed.editor === 'new')
      ) {
        return parsed.editor;
      }
    }
  } catch (_) {
    /* 上一版存的是裸字符串 'classic'，JSON.parse 会抛 —— 当作没存过 */
  }
  return DEFAULT_EDITOR_VERSION;
}

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

/**
 * 安全地捕获指针。
 * ⚠️ 合成的 pointer 事件（自动化测试、脚本触发）没有「活动指针」，
 *    setPointerCapture 会抛 NotFoundError 把控制台弄脏。真实指针不会走到 catch。
 */
function capturePointer(el, pointerId) {
  try {
    el.setPointerCapture(pointerId);
  } catch (_) {
    /* 没有活动指针时忽略 */
  }
}

function FloorplanPage() {
  const { t } = useLanguage();
  const { getAllEntities, callService } = useHass();
  const allEntities = (getAllEntities && getAllEntities()) || {};

  const svgRef = React.useRef(null);
  const hostRef = React.useRef(null);
  /** 右侧栏（3D + 检查器）的 DOM，分隔条拖动时要读它的当前宽度 */
  const sideRef = React.useRef(null);
  /** 是否已经自动适应过窗口（只在首次加载时做一次，之后交给用户） */
  const didFitRef = React.useRef(false);

  const [plan, setPlan] = React.useState(createEmptyPlan);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [mode, setMode] = React.useState(MODE_DRAW);
  const [selectedId, setSelectedId] = React.useState(null);
  const [hostSize, setHostSize] = React.useState({ w: 800, h: 600 });
  const [view, setView] = React.useState({ cx: 0, cy: 0, pxPerMm: 0.06 });
  const [draft, setDraft] = React.useState(null);
  /**
   * ⚠️ draft 的「真相」放在 ref 里。
   * 只用 state 的话，onPointerUp 可能读到「最后一次 pointermove 之前」的旧值
   * （React 还没 flush 就松手了）→ 拿不到尺寸，房间根本建不出来。
   */
  const draftRef = React.useRef(null);
  const putDraft = React.useCallback((d) => {
    draftRef.current = d;
    setDraft(d);
  }, []);
  const [backupsOpen, setBackupsOpen] = React.useState(false);
  const [backups, setBackups] = React.useState([]);
  const [selectedOpeningId, setSelectedOpeningId] = React.useState(null);
  const [selectedFreeWallId, setSelectedFreeWallId] = React.useState(null);
  const [openingType, setOpeningType] = React.useState('door');
  /** 正在画的多边形房间的顶点（毫米）；≥3 点时双击闭合 */
  const [polyPoints, setPolyPoints] = React.useState([]);
  /** 多边形的橡皮筋预览点 */
  const [polyCursor, setPolyCursor] = React.useState(null);
  /** 吸附辅助线（[{axis:'x'|'y', value}]），画图时给视觉提示 */
  const [guides, setGuides] = React.useState([]);
  /** 右侧栏宽度（px）。null = 用 CSS 默认（42%）；0 = 收起 */
  const [sideWidth, setSideWidth] = React.useState(null);
  const dragRef = React.useRef(null);

  // ---------- 家具 ----------
  const [furnLibOpen, setFurnLibOpen] = React.useState(false);
  /** 家具库里选中的类型（+ 它的默认尺寸），点画布就放这个 */
  const [furnType, setFurnType] = React.useState(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = React.useState(null);

  const floorId = (plan.floors[0] && plan.floors[0].id) || null;
  const floor = plan.floors[0] || {};
  const selected = (plan.rooms || []).find((r) => r.id === selectedId) || null;
  const selectedOpening =
    (plan.openings || []).find((o) => o.id === selectedOpeningId) || null;
  const selectedFreeWall =
    (plan.freeWalls || []).find((w) => w.id === selectedFreeWallId) || null;
  const selectedFurniture =
    (plan.furniture || []).find((f) => f.id === selectedFurnitureId) || null;

  // ---------- 新版编辑器（移植自 neonplan3d）----------
  // 'new' = 参考项目那套（**默认**）；'classic' = 本项目的 2D 编辑器（已降级为回退入口）。
  // 选择记在 localStorage 里。
  const [editorVersion, setEditorVersion] = React.useState(readEditorPref);
  const [newBuilding, setNewBuilding] = React.useState(null);
  const [newDirty, setNewDirty] = React.useState(false);
  /** 最近一次保存的完整 Building；旧版 plan 投影只用于编辑/显示 */
  const baseBuildingRef = React.useRef(null);
  /** 旧 plan 才有、Building 没有直接字段承载的图片/名称/网格元数据 */
  const legacyMetaRef = React.useRef(null);
  /** 当前编辑中的 Building 的 ref —— 编辑器的「导出/存还原点」要用它拿最新值（state 会滞后） */
  const newBuildingRef = React.useRef(null);
  /**
   * 「这次 building 变化是外部替换（导入备份），别标成未保存」的计数。
   * 编辑器 `setDoc()` 一定会派发 `building-changed`，我们没法告诉它「这次是导入」，
   * 所以导入前挂一个标记，在 `handleNewBuildingChanged` 里消费掉。
   */
  const suppressDirtyRef = React.useRef(0);

  React.useEffect(() => {
    newBuildingRef.current = newBuilding;
  }, [newBuilding]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        EDITOR_PREF_KEY,
        JSON.stringify({ v: EDITOR_PREF_VERSION, editor: editorVersion })
      );
    } catch (_) {
      /* 隐私模式 / 存储写满时 localStorage 会抛，忽略即可 */
    }
  }, [editorVersion]);

  const handleNewBuildingChanged = React.useCallback((b) => {
    if (!b) return;
    setNewBuilding(b);
    if (suppressDirtyRef.current > 0) {
      // 外部替换（导入备份）：内容已经落盘了，不该提示「有未保存的修改」
      suppressDirtyRef.current -= 1;
      setNewDirty(false);
    } else {
      setNewDirty(true);
    }
  }, []);

  /** 用一份后端文档覆盖当前编辑状态（历史版本还原 / 载入完成时用）。 */
  const adoptDocument = React.useCallback((doc) => {
    const p = documentToPlan(doc);
    const b = documentToBuilding(doc);
    setPlan(p);
    setNewBuilding(b);
    setNewDirty(false);
    setDirty(false);
    baseBuildingRef.current = JSON.parse(JSON.stringify(b));
    legacyMetaRef.current = isBuildingDocument(doc)
      ? doc.legacyMeta || legacyMetaFromPlan(p)
      : legacyMetaFromPlan(p);
  }, []);

  /** 切到新版：从当前编辑中的 plan 和上次保存的完整 Building 合并，避免丢屋顶/室外等字段。 */
  const switchToNewEditor = () => {
    if (!newBuilding) {
      const base = baseBuildingRef.current || planToBuilding(plan);
      setNewBuilding(mergePlanIntoBuilding(plan, base));
    } else if (editorVersion === 'classic' && dirty) {
      setNewBuilding(mergePlanIntoBuilding(plan, baseBuildingRef.current || newBuilding));
    }
    setEditorVersion('new');
  };

  /** 切回旧版：生成可编辑的旧 plan 投影；不写盘，只有点保存才持久化。 */
  const switchToClassicEditor = () => {
    if (newBuilding) {
      setPlan(documentToPlan(buildingDocument(newBuilding, legacyMetaRef.current || legacyMetaFromPlan(plan))));
      setDirty(newDirty);
    }
    setEditorVersion('classic');
  };

  /**
   * 编辑器要的 `hass` 形状（HA 前端那一套）。
   * ⚠️ hakit 不直接给这个对象，`useEditorHass` 里用它的 WS 连接去取实体/区域/设备/楼层注册表再拼。
   *    详见 floorplan-editor/useEditorHass.js 的注释。
   * 下面这几个回调是给 `editorBackend.js` 用的（编辑器的历史版本/备份/图片走我们自己的后端）。
   */
  const editorHass = useEditorHass({
    getBuilding: () => newBuildingRef.current,
    getLegacyMeta: () => legacyMetaRef.current,
    onDocumentRestored: adoptDocument,
    onExternalReplace: () => {
      suppressDirtyRef.current += 1;
    },
  });

  // ---------- 底图标定 / 自动生成（任务 6）----------
  // 新版编辑器把底图放在 `building.floors[0].background`，图片本身存在后端。
  // 这里把图片取回来量一下真实像素尺寸 —— 标定要在**原图**上量，生成时也要用宽高比换算坐标。
  const [calibrateOpen, setCalibrateOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  /** { id, url, w, h, aspect } —— 当前底图的原图信息 */
  const [bgImage, setBgImage] = React.useState(null);
  const bgRef = editorVersion === 'new' ? newBuilding?.floors?.[0]?.background ?? null : null;
  const bgImageId = bgRef?.image_id;

  React.useEffect(() => {
    if (!bgImageId) {
      setBgImage(null);
      return undefined;
    }
    let alive = true;
    floorplanApi
      .getImage(bgImageId)
      .then((url) => {
        if (!alive || !url) return;
        const im = new window.Image();
        im.onload = () => {
          if (!alive) return;
          const w = im.naturalWidth || 1;
          const h = im.naturalHeight || 1;
          setBgImage({ id: bgImageId, url, w, h, aspect: h / w });
        };
        im.onerror = () => {
          if (alive) setBgImage(null);
        };
        im.src = url;
      })
      .catch(() => {
        if (alive) setBgImage(null);
      });
    return () => {
      alive = false;
    };
  }, [bgImageId]);

  /** 标定结果 → 写回底图的真实宽度（米）。 */
  const applyBackgroundWidth = (widthMeters) => {
    // ⚠️ updater 必须是纯函数（StrictMode 会跑两次），所以不要在里面生成 id / 发请求
    setNewBuilding((prev) => {
      const f = prev?.floors?.[0];
      if (!f || !f.background) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.floors[0].background.width = Math.round(widthMeters * 1000) / 1000;
      return next;
    });
    setNewDirty(true);
    setCalibrateOpen(false);
    message.success(t('floorplan.calibrateApplied', { w: Number(widthMeters).toFixed(3) }));
  };

  /** 模型识别结果 → 写进当前楼层。id 已经在 `aiResultToBuildingParts` 里生成好了。 */
  const applyGenerated = (parts, { replace } = {}) => {
    setNewBuilding((prev) => {
      const f = prev?.floors?.[0];
      if (!f) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const fl = next.floors[0];
      fl.rooms = replace ? [...parts.rooms] : [...(fl.rooms || []), ...parts.rooms];
      if (parts.walls.length) fl.walls = [...(fl.walls || []), ...parts.walls];
      return next;
    });
    setNewDirty(true);
    setAiOpen(false);
    message.success(t('floorplan.aiDone', { rooms: parts.rooms.length, walls: parts.walls.length }));
  };

  // 墙：从房间多边形现算（每次改房间/墙厚都会重算）。
  // 门窗是挂在「房间 + 边 + 偏移」上的，所以要把 openings 一起传进去，
  // 每面墙才知道自己身上有哪些洞。自由隔断墙也一起传。
  const walls = React.useMemo(
    () =>
      generateWalls(
        plan.rooms || [],
        {
          exterior: floor.exteriorThickness,
          interior: floor.interiorThickness,
          wallHeight: floor.wallHeight,
        },
        plan.openings || [],
        plan.freeWalls || []
      ),
    [
      plan.rooms,
      plan.openings,
      plan.freeWalls,
      floor.exteriorThickness,
      floor.interiorThickness,
      floor.wallHeight,
    ]
  );

  // 吸附半径：按当前缩放把「屏幕 8px」换算成毫米，放大后吸附依然跟手
  const snapThreshold = SNAP_PX / Math.max(0.004, view.pxPerMm);

  // ---------- 读 ----------
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const doc = await floorplanApi.loadDocument();
        if (alive) adoptDocument(doc);
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
      let toSave;
      if (editorVersion === 'new') {
        if (!newBuilding) throw new Error('新版户型还没有加载完成');
        toSave = newBuilding;
      } else {
        // 旧编辑器只认识毫米制 plan。合并回完整 Building，保住屋顶/室外/能源等它不认识的字段。
        toSave = mergePlanIntoBuilding(plan, baseBuildingRef.current || planToBuilding(plan));
      }

      await floorplanApi.saveBuilding(toSave, legacyMetaFromPlan(plan));
      baseBuildingRef.current = JSON.parse(JSON.stringify(toSave));
      legacyMetaRef.current = legacyMetaFromPlan(plan);
      setNewBuilding(JSON.parse(JSON.stringify(toSave)));
      setDirty(false);
      setNewDirty(false);
      message.success(t('floorplan.saved'));
    } catch (e) {
      message.error(`${t('floorplan.saveFailed')}: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ---------- 视图 ----------
  // ⚠️ 必须用**实时**的画布尺寸算 viewBox：hostSize 来自 ResizeObserver，会滞后一帧。
  //    宽高比一旦对不上，SVG 默认的 preserveAspectRatio="xMidYMid meet" 就会 letterbox，
  //    可视区域比画布小 —— 表现就是「内容画到边上就看不见了 / 适应窗口之后还是被裁」。
  const liveW = (hostRef.current && hostRef.current.clientWidth) || hostSize.w;
  const liveH = (hostRef.current && hostRef.current.clientHeight) || hostSize.h;
  const vw = liveW / view.pxPerMm;
  const vh = liveH / view.pxPerMm;
  const viewBox = `${view.cx - vw / 2} ${view.cy - vh / 2} ${vw} ${vh}`;
  const grid = plan.gridSize || 100;
  // 网格太密就不画了（屏幕上一个格子小于 6px 时）
  const showGrid = grid * view.pxPerMm > 6;

  /**
   * ⚠️ 滚轮缩放必须用**原生非被动**监听：React 的 onWheel 是 passive 的，
   *    里面调 preventDefault() 会被忽略并刷一条
   *    「Unable to preventDefault inside passive event listener」的报错。
   */
  const onWheelRef = React.useRef(null);
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const handler = (e) => {
      if (onWheelRef.current) onWheelRef.current(e);
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
    // ⚠️ 依赖必须带上 loading：加载中时组件渲染的是 loading 占位、SVG 还不存在，
    //    只写 [] 的话 effect 在那一帧就跑完了，svgRef.current 是 null，监听永远挂不上。
  }, [loading]);

  const onWheel = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const before = toMm(svg, e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;

    // 缩放下限 = 「适应窗口」的 85%：再小就不让缩了。
    // ⚠️ 不设下限的话可以一直缩小，内容最后缩成一小块缩在角落里，
    //    剩下的画布全是空的 —— 看起来就像「能用的地方被限制在了一小块」。
    const box = contentBounds();
    let minZoom = 0.004;
    if (box) {
      const cw = Math.max(1000, box.maxX - box.minX);
      const ch = Math.max(1000, box.maxY - box.minY);
      const fit = Math.min(liveW / (cw * 1.16), liveH / (ch * 1.16));
      minZoom = Math.max(0.004, fit * 0.85);
    }
    const nextZoom = Math.max(minZoom, Math.min(1.2, view.pxPerMm * factor));
    if (nextZoom === view.pxPerMm) return;

    setView((v) => {
      // 用实时的画布尺寸，别用会滞后的 hostSize
      const nvw = liveW / nextZoom;
      const nvh = liveH / nextZoom;
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

  onWheelRef.current = onWheel;

  // ---------- 交互 ----------
  /** 当前吸附上下文 */
  const snapCtx = (extra = {}) => ({
    grid,
    rooms: plan.rooms || [],
    threshold: snapThreshold,
    ...extra,
  });

  /** 取消正在进行的绘制：清掉拖框 / 多边形顶点 / 辅助线，模式保持不变 */
  const cancelDrawing = React.useCallback(() => {
    dragRef.current = null;
    putDraft(null);
    setPolyPoints([]);
    setPolyCursor(null);
    setGuides([]);
  }, [putDraft]);

  /** 是否正在画东西（决定要不要显示「取消绘制」按钮） */
  const isDrawing = !!draft || polyPoints.length > 0;

  // Esc = 取消绘制（再按一次退回选择模式）
  React.useEffect(() => {
    const onKey = (ev) => {
      if (ev.key !== 'Escape') return;
      if (draftRef.current || polyPoints.length > 0) {
        cancelDrawing();
      } else if (mode !== MODE_SELECT) {
        setMode(MODE_SELECT);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelDrawing, polyPoints.length, mode]);

  /**
   * 右键：取消正在画的 > 退出当前工具 > 什么都不做（交给 pointerdown 去平移）。
   *
   * ⚠️ 为什么取消逻辑要挂在 contextmenu 上而不是只挂在 pointerdown 上：
   *   按 Pointer Events 规范，`pointerdown` 只在「从没按键 → 有按键」时触发。
   *   左键按住拖框的过程中再按右键，**不会再触发 pointerdown**（只更新 buttons），
   *   所以「拖框途中右键取消」必须靠 contextmenu 事件才能收到。
   */
  const onContextMenu = (e) => {
    e.preventDefault();
    if (draftRef.current || polyPoints.length > 0) {
      cancelDrawing();
    } else if (mode !== MODE_SELECT) {
      setMode(MODE_SELECT);
    }
  };

  const onPointerDown = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const mm = toMm(svg, e.clientX, e.clientY);

    // ---------- 右键：取消 > 退出工具 > 平移 ----------
    // 画到一半（多边形点了几个点、或正在拖一个框）时右键 = 取消这次绘制；
    // 没在画但还在某个绘制模式里，右键 = 退回选择模式；都不是才平移画布。
    if (e.button === 2) {
      if (draftRef.current || polyPoints.length > 0) {
        cancelDrawing();
        return;
      }
      if (mode !== MODE_SELECT) {
        setMode(MODE_SELECT);
        return;
      }
      dragRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, cx: view.cx, cy: view.cy };
      capturePointer(svg, e.pointerId);
      return;
    }

    // 中键 = 平移画布
    if (e.button === 1) {
      dragRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, cx: view.cx, cy: view.cy };
      capturePointer(svg, e.pointerId);
      return;
    }
    if (e.button !== 0) return;

    const target = e.target;
    const attr = (name) => (target && target.getAttribute ? target.getAttribute(name) : null);
    const handle = attr('data-handle');
    const roomId = attr('data-room');
    const openingId = attr('data-opening');
    const freeWallId = attr('data-freewall');
    const furnitureId = attr('data-furniture');

    // 点中隔断墙 → 选中它；按住可以整条拖走
    if (freeWallId) {
      const fw = (plan.freeWalls || []).find((w) => w.id === freeWallId);
      if (!fw) return;
      setSelectedFreeWallId(freeWallId);
      setSelectedId(null);
      setSelectedOpeningId(null);
      setSelectedFurnitureId(null);
      setMode(MODE_SELECT);
      dragRef.current = {
        kind: 'moveFree',
        id: freeWallId,
        start: mm,
        origA: [...fw.a],
        origB: [...fw.b],
      };
      capturePointer(svg, e.pointerId);
      return;
    }

    // 画自由隔断墙：按住拖一条线
    if (mode === MODE_FREEWALL) {
      const s = snapPoint([mm.x, mm.y], snapCtx());
      dragRef.current = { kind: 'freewall', sx: s.x, sy: s.y };
      putDraft({ x: s.x, y: s.y, w: 0, h: 0, kind: 'line' });
      capturePointer(svg, e.pointerId);
      return;
    }

    // 画自由多边形房间：点一下加一个点，双击/点回起点闭合
    if (mode === MODE_POLY) {
      const s = snapPoint([mm.x, mm.y], snapCtx());
      const first = polyPoints[0];
      const closing =
        polyPoints.length >= 3 &&
        first &&
        Math.hypot(s.x - first[0], s.y - first[1]) < Math.max(snapThreshold, grid);
      // ⚠️ 建房间必须放在 updater **外面**：在 setState 的 updater 里调 mutate 是副作用，
      //    StrictMode 会把 updater 跑两次 → 房间被建两遍（踩过）
      if (closing) {
        const room = createPolyRoom(floorId, polyPoints, '');
        mutate((p) => ({ ...p, rooms: p.rooms.concat([room]) }));
        setSelectedId(room.id);
        setPolyPoints([]);
        setPolyCursor(null);
        setMode(MODE_SELECT);
      } else {
        setPolyPoints((prev) => prev.concat([[s.x, s.y]]));
      }
      return;
    }

    // 点中门窗 → 选中它（所有模式下都优先）
    if (openingId) {
      setSelectedOpeningId(openingId);
      setSelectedId(null);
      setMode(MODE_SELECT);
      capturePointer(svg, e.pointerId);
      return;
    }

    // ⚠️ 放门窗必须排在「拖房间」之前：墙的 polygon 是 pointer-events:none，
    //    点击会穿透到下面的房间上，先判房间就永远轮不到放门窗了。
    if (mode === MODE_OPENING) {
      // ⚠️ 必须传 [x, y] 数组：nearestRoomEdge 按数组下标取分量，
      //    传 {x, y} 对象会静默算出 NaN（踩过）
      const hit = nearestRoomEdge([mm.x, mm.y], plan.rooms || [], snapThreshold * 3);
      if (!hit) return;
      const room = plan.rooms.find((r) => r.id === hit.roomId);
      const def = openingDefaults(openingType);
      const width = Math.min(def.defaultWidth, Math.max(200, edgeLength(room, hit.edge) - 200));
      const offset = clampOpeningOffset(room, hit.edge, hit.offset - width / 2, width, plan.openings, null);
      const op = createOpening(room.id, floorId, hit.edge, offset, openingType, { width });
      mutate((p) => ({ ...p, openings: (p.openings || []).concat([op]) }));
      setSelectedOpeningId(op.id);
      setSelectedId(null);
      setMode(MODE_SELECT);
      return;
    }

    // 点中家具 → 选中它；按住可以拖走
    // ⚠️ 必须排在「放家具」之前：不然家具模式下点已有家具会又叠一件上去，永远选不中也拖不动。
    //    同时排在绘制类模式之后，这样画多边形/门窗时点一下不会变成选家具。
    if (furnitureId) {
      const fu = (plan.furniture || []).find((f) => f.id === furnitureId);
      if (!fu) return;
      setSelectedFurnitureId(furnitureId);
      setSelectedId(null);
      setSelectedOpeningId(null);
      setSelectedFreeWallId(null);
      // 本来就在家具模式就留在里面（拖完还能接着放），否则退回选择模式
      if (mode !== MODE_FURNITURE) setMode(MODE_SELECT);
      dragRef.current = {
        kind: 'moveFurniture',
        id: furnitureId,
        start: mm,
        origX: fu.x,
        origY: fu.y,
      };
      capturePointer(svg, e.pointerId);
      return;
    }

    // 放家具：点空白处放一件（放完保持在放置模式，可以连着放好几件）
    if (mode === MODE_FURNITURE) {
      if (!furnType) return;
      const s = snapPoint([mm.x, mm.y], snapCtx());
      const fu = createFurniture(floorId, furnType.type, s.x, s.y, furnType.size);
      mutate((p) => ({ ...p, furniture: (p.furniture || []).concat([fu]) }));
      setSelectedFurnitureId(fu.id);
      setSelectedId(null);
      setSelectedOpeningId(null);
      setSelectedFreeWallId(null);
      return;
    }

    // 拖顶点（多边形房间）/ 拖角缩放（矩形房间）
    if (handle && selected) {
      if (handle.startsWith('v')) {
        dragRef.current = { kind: 'vertex', id: selected.id, index: Number(handle.slice(1)) };
      } else {
        dragRef.current = {
          kind: 'resize',
          corner: handle,
          id: selected.id,
          orig: roomBounds(selected),
        };
      }
      capturePointer(svg, e.pointerId);
      return;
    }
    // 拖动房间
    if (roomId) {
      const room = plan.rooms.find((r) => r.id === roomId);
      setSelectedId(roomId);
      setSelectedOpeningId(null);
      dragRef.current = {
        kind: 'move',
        id: roomId,
        start: mm,
        origBounds: roomBounds(room),
        origPoints: getRoomPolygon(room).map((p) => [...p]),
      };
      capturePointer(svg, e.pointerId);
      return;
    }

    // 空白处：画新房间
    if (mode === MODE_DRAW) {
      const s = snapPoint([mm.x, mm.y], snapCtx());
      putDraft({ x: s.x, y: s.y, w: 0, h: 0, kind: 'rect' });
      dragRef.current = { kind: 'draw', sx: s.x, sy: s.y };
      capturePointer(svg, e.pointerId);
    } else {
      setSelectedId(null);
      setSelectedOpeningId(null);
      setSelectedFurnitureId(null);
      setSelectedFreeWallId(null);
    }
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!svg) return;
    const mm = toMm(svg, e.clientX, e.clientY);

    // 多边形模式：没在拖也要更新橡皮筋预览
    if (!drag) {
      if (mode === MODE_POLY && polyPoints.length > 0) {
        const s = snapPoint([mm.x, mm.y], snapCtx());
        setPolyCursor([s.x, s.y]);
        setGuides(s.guides);
      }
      return;
    }

    if (drag.kind === 'pan') {
      const dx = (e.clientX - drag.startX) / view.pxPerMm;
      const dy = (e.clientY - drag.startY) / view.pxPerMm;
      let cx = drag.cx - dx;
      let cy = drag.cy - dy;
      // 软边界：最多允许拖到「内容边缘再往外一个视口」，再多就拉不动了。
      // 不加的话一直往右拖会把内容拖出视野，看起来像「消失了」，还得靠适应窗口找回来。
      const box = contentBounds();
      if (box) {
        // 用渲染期算好的 vw/vh（来自实时画布尺寸），别用会滞后的 hostSize
        const cwBox = box.maxX - box.minX;
        const chBox = box.maxY - box.minY;
        if (cwBox <= vw) {
          // 内容比视口窄：不许拖出视野，最多贴左/贴右 —— 否则会缩在角落里找不回来
          cx = Math.max(box.maxX - vw / 2, Math.min(box.minX + vw / 2, cx));
        } else {
          // 内容比视口宽：最多让中心跑到内容边缘外 30% 视口（至少还有 20% 重叠）
          cx = Math.max(box.minX - vw * 0.3, Math.min(box.maxX + vw * 0.3, cx));
        }
        if (chBox <= vh) {
          cy = Math.max(box.maxY - vh / 2, Math.min(box.minY + vh / 2, cy));
        } else {
          cy = Math.max(box.minY - vh * 0.3, Math.min(box.maxY + vh * 0.3, cy));
        }
      }
      setView((v) => ({ ...v, cx, cy }));
      return;
    }
    if (drag.kind === 'freewall') {
      const s = snapPoint([mm.x, mm.y], snapCtx({ from: [drag.sx, drag.sy], ortho: !e.shiftKey }));
      setGuides(s.guides);
      putDraft({ x: drag.sx, y: drag.sy, w: s.x - drag.sx, h: s.y - drag.sy, kind: 'line' });
      return;
    }
    if (drag.kind === 'moveFree') {
      const s = snapPoint(
        [drag.origA[0] + (mm.x - drag.start.x), drag.origA[1] + (mm.y - drag.start.y)],
        snapCtx({ ortho: false })
      );
      setGuides(s.guides);
      const dx = s.x - drag.origA[0];
      const dy = s.y - drag.origA[1];
      mutate((p) => ({
        ...p,
        freeWalls: (p.freeWalls || []).map((w) =>
          w.id === drag.id
            ? {
                ...w,
                a: [Math.round(drag.origA[0] + dx), Math.round(drag.origA[1] + dy)],
                b: [Math.round(drag.origB[0] + dx), Math.round(drag.origB[1] + dy)],
              }
            : w
        ),
      }));
      return;
    }
    if (drag.kind === 'moveFurniture') {
      // 家具的 x/y 是中心点，所以吸附的也是「中心」
      const s = snapPoint(
        [drag.origX + (mm.x - drag.start.x), drag.origY + (mm.y - drag.start.y)],
        snapCtx({ ortho: false })
      );
      setGuides(s.guides);
      mutate((p) => ({
        ...p,
        furniture: (p.furniture || []).map((f) =>
          f.id === drag.id ? { ...f, x: Math.round(s.x), y: Math.round(s.y) } : f
        ),
      }));
      return;
    }
    if (drag.kind === 'vertex') {
      const s = snapPoint([mm.x, mm.y], snapCtx({ skipId: drag.id, ortho: false }));
      setGuides(s.guides);
      mutate((p) => ({
        ...p,
        rooms: p.rooms.map((r) => {
          if (r.id !== drag.id) return r;
          const pts = getRoomPolygon(r).map((q) => [...q]);
          pts[drag.index] = [s.x, s.y];
          return { ...r, points: pts };
        }),
      }));
      return;
    }
    if (drag.kind === 'draw') {
      // ⚠️ 画矩形**不能**加正交约束！snapCtx 里带 from + ortho 会把终点强行对齐到
      //    起点的水平/垂直线 → 永远画出一条线（h 或 w 恒为 0），矩形根本建不出来。
      //    正交约束是给「拖一条直线」的隔断墙用的（见 freewall 分支）。
      const s = snapPoint([mm.x, mm.y], snapCtx());
      setGuides(s.guides);
      putDraft({ x: drag.sx, y: drag.sy, w: s.x - drag.sx, h: s.y - drag.sy, kind: 'rect' });
      return;
    }
    if (drag.kind === 'move') {
      // 吸附的是「房间的左上角」而不是位移量 —— 这样房间才能对齐到别的房间角/边/网格
      const s = snapPoint(
        [drag.origBounds.x + (mm.x - drag.start.x), drag.origBounds.y + (mm.y - drag.start.y)],
        snapCtx({ skipId: drag.id, ortho: false })
      );
      setGuides(s.guides);
      const dx = s.x - drag.origBounds.x;
      const dy = s.y - drag.origBounds.y;
      mutate((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id === drag.id
            ? { ...r, points: drag.origPoints.map(([x, y]) => [Math.round(x + dx), Math.round(y + dy)]) }
            : r
        ),
      }));
      return;
    }
    if (drag.kind === 'resize') {
      const o = drag.orig;
      const s = snapPoint([mm.x, mm.y], snapCtx({ skipId: drag.id, ortho: false }));
      setGuides(s.guides);
      // 固定对角，拖动角吸附
      let x = o.x;
      let y = o.y;
      let w = o.w;
      let h = o.h;
      const right = s.x;
      const bottom = s.y;
      if (drag.corner === 'se') {
        w = right - o.x;
        h = bottom - o.y;
      } else if (drag.corner === 'sw') {
        x = right;
        w = o.x + o.w - right;
        h = bottom - o.y;
      } else if (drag.corner === 'ne') {
        y = bottom;
        w = right - o.x;
        h = o.y + o.h - bottom;
      } else {
        x = right;
        y = bottom;
        w = o.x + o.w - right;
        h = o.y + o.h - bottom;
      }
      mutate((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id === o.id
            ? setRoomRect(r, Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h))
            : r
        ),
      }));
      return;
    }
    if (drag.kind === 'opening') {
      // 沿墙滑动门窗：找最近的房间边，把洞挪过去（同样要传数组）
      const hit = nearestRoomEdge([mm.x, mm.y], plan.rooms || [], snapThreshold * 4);
      if (!hit) return;
      const room = plan.rooms.find((r) => r.id === hit.roomId);
      const op = (plan.openings || []).find((o) => o.id === drag.id);
      if (!room || !op) return;
      const width = Math.min(op.width, edgeLength(room, hit.edge));
      const offset = clampOpeningOffset(
        room,
        hit.edge,
        hit.offset - width / 2,
        width,
        plan.openings,
        op.id
      );
      mutate((p) => ({
        ...p,
        openings: p.openings.map((o) =>
          o.id === drag.id
            ? { ...o, roomId: room.id, floorId: room.floorId, edge: hit.edge, offset: Math.round(offset) }
            : o
        ),
      }));
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setGuides([]);
    if (!drag) return;
    if (drag.kind === 'freewall') {
      const d = draftRef.current; // 用 ref，别用可能滞后的 state
      putDraft(null);
      if (!d) return;
      const a = [d.x, d.y];
      const b = [d.x + d.w, d.y + d.h];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < grid) return; // 太短，误点
      const fw = createFreeWall(floorId, a, b, {
        thickness: floor.interiorThickness,
        height: floor.wallHeight,
      });
      mutate((p) => ({ ...p, freeWalls: (p.freeWalls || []).concat([fw]) }));
      setSelectedFreeWallId(fw.id);
      setSelectedId(null);
      setMode(MODE_SELECT);
      return;
    }
    if (drag.kind === 'draw') {
      const d = draftRef.current; // 用 ref，别用可能滞后的 state
      putDraft(null);
      if (!d) return;
      // 太小就不建（误点）
      if (Math.abs(d.w) < grid || Math.abs(d.h) < grid) return;
      const room = createRoom(
        floorId,
        Math.min(d.x, d.x + d.w),
        Math.min(d.y, d.y + d.h),
        Math.abs(d.w),
        Math.abs(d.h),
        ''
      );
      mutate((p) => ({ ...p, rooms: p.rooms.concat([room]) }));
      setSelectedId(room.id);
      setMode(MODE_SELECT);
    }
  };

  const removeSelected = () => {
    // 选中的是家具 → 只删家具
    if (selectedFurniture) {
      mutate((p) => ({
        ...p,
        furniture: (p.furniture || []).filter((f) => f.id !== selectedFurniture.id),
      }));
      setSelectedFurnitureId(null);
      return;
    }
    if (!selected) return;
    mutate((p) => ({
      ...p,
      rooms: p.rooms.filter((r) => r.id !== selected.id),
      bindings: p.bindings.filter((b) => b.roomId !== selected.id),
    }));
    setSelectedId(null);
  };

  /** 改一件家具的字段 */
  const patchFurniture = (id, patch) =>
    mutate((p) => ({
      ...p,
      furniture: (p.furniture || []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  /** 复制一件家具（往右下挪一格，免得和原件完全重叠看不出来） */
  const duplicateFurniture = (f) => {
    const copy = { ...f, id: createFurniture(f.floorId, f.type, f.x, f.y, [f.w, f.d, f.h]).id, x: f.x + grid, y: f.y + grid };
    mutate((p) => ({ ...p, furniture: (p.furniture || []).concat([copy]) }));
    setSelectedFurnitureId(copy.id);
  };

  /** 把选中的家具旋转 90° */
  const rotateFurniture = (f, deg) => patchFurniture(f.id, { rotation: (Number(f.rotation) || 0) + deg });

  // 离开家具模式就把「待放置的类型」清掉，免得库面板还高亮着却点不动
  React.useEffect(() => {
    if (mode !== MODE_FURNITURE && furnType) setFurnType(null);
  }, [mode, furnType]);

  // ---------- 底图 ----------
  const [imgSize, setImgSize] = React.useState({ w: 1000, h: 700 });
  /** 底图是否已经量到真实尺寸（自动适应窗口要等它） */
  const [imgMeasured, setImgMeasured] = React.useState(false);
  const bg = plan.background;
  React.useEffect(() => {
    if (!bg || !bg.url) {
      setImgMeasured(false);
      return;
    }
    const im = new window.Image();
    im.onload = () => {
      setImgSize({ w: im.naturalWidth || 1000, h: im.naturalHeight || 700 });
      setImgMeasured(true);
    };
    // 量不到也别卡住「自动适应」
    im.onerror = () => setImgMeasured(true);
    im.src = bg.url;
  }, [bg && bg.url]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 内容（底图 + 房间 + 隔断墙 + 家具）的包围盒（毫米）。没有内容时返回 null。
   * 「适应窗口」和平移边界都用它。
   */
  const contentBounds = React.useCallback(
    (target) => {
      const p = target || plan;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const grow = (x, y) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      };
      (p.rooms || []).forEach((r) => getRoomPolygon(r).forEach(([x, y]) => grow(x, y)));
      (p.freeWalls || []).forEach((w) => {
        grow(w.a[0], w.a[1]);
        grow(w.b[0], w.b[1]);
      });
      // 家具可能摆到房间外面（比如院子里的树），也要算进包围盒
      (p.furniture || []).forEach((f) => furnitureCorners(f).forEach(([x, y]) => grow(x, y)));
      const b = p.background;
      if (b && b.url && imgMeasured) {
        const w = imgSize.w * (b.scale || 8);
        const h = imgSize.h * (b.scale || 8);
        grow(b.offsetX || 0, b.offsetY || 0);
        grow((b.offsetX || 0) + w, (b.offsetY || 0) + h);
      }
      if (!Number.isFinite(minX)) return null;
      return { minX, minY, maxX, maxY };
    },
    [plan, imgSize, imgMeasured]
  );

  /**
   * 把视图「适应窗口」：把内容包围盒整体缩放到画布内（留 8% 边距）。
   * 不加这个的话，底图往往比画布大 —— 看不全、还老要来回拖，拖远了就找不回来了。
   */
  const fitView = React.useCallback(
    (target) => {
      const host = hostRef.current;
      if (!host) return;
      const box = contentBounds(target);
      if (!box) return; // 什么都没有，保持原样
      const bw = host.clientWidth || 800;
      const bh = host.clientHeight || 600;
      const pad = 0.08;
      const cw = Math.max(1000, box.maxX - box.minX);
      const ch = Math.max(1000, box.maxY - box.minY);
      const zoom = Math.min(bw / (cw * (1 + pad * 2)), bh / (ch * (1 + pad * 2)));
      setView({
        cx: (box.minX + box.maxX) / 2,
        cy: (box.minY + box.maxY) / 2,
        pxPerMm: Math.max(0.004, Math.min(1.2, zoom)),
      });
    },
    [contentBounds]
  );

  // 首次加载完自动适应一次（之后不再打扰用户的操作）
  React.useEffect(() => {
    if (loading || didFitRef.current) return;
    const hasBg = !!(plan.background && plan.background.url);
    const hasContent = hasBg || (plan.rooms || []).length > 0 || (plan.freeWalls || []).length > 0;
    if (!hasContent) {
      didFitRef.current = true;
      return;
    }
    if (hasBg && !imgMeasured) return; // 等底图量到尺寸
    fitView();
    didFitRef.current = true;
  }, [loading, plan.background, plan.rooms, plan.freeWalls, imgMeasured, fitView]);

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

  // ---------- 门窗 ----------
  const patchOpening = (id, patch) =>
    mutate((p) => ({
      ...p,
      openings: (p.openings || []).map((o) => {
        if (o.id !== id) return o;
        const next = { ...o, ...patch };
        const room = p.rooms.find((r) => r.id === next.roomId);
        if (!room) return next;
        const len = edgeLength(room, next.edge);
        // 宽度不能超过墙长，位置夹在墙内
        next.width = Math.max(100, Math.min(Math.round(next.width), Math.round(len - 100)));
        next.height = Math.max(100, Math.round(next.height));
        next.sill = Math.max(0, Math.round(next.sill));
        next.offset = Math.round(
          clampOpeningOffset(room, next.edge, next.offset, next.width, p.openings, id)
        );
        return next;
      }),
    }));

  const removeOpening = (id) => {
    mutate((p) => ({ ...p, openings: (p.openings || []).filter((o) => o.id !== id) }));
    setSelectedOpeningId(null);
  };

  const patchFloor = (patch) =>
    mutate((p) => ({ ...p, floors: p.floors.map((f, i) => (i === 0 ? { ...f, ...patch } : f)) }));

  /**
   * 设房间某条边的墙厚 / 墙高（下标与 points 的边一一对应）。
   * 传 null = 恢复成楼层默认。数组会先补齐到顶点数，避免下标越界。
   * ⚠️ 墙高设 0 表示这条边没有墙（两个房间连成一个空间）。
   */
  const patchRoomEdge = (roomId, edge, key, value) =>
    mutate((p) => ({
      ...p,
      rooms: p.rooms.map((r) => {
        if (r.id !== roomId) return r;
        const n = getRoomPolygon(r).length;
        const arr = [...(r[key] || [])];
        while (arr.length < n) arr.push(null);
        const isBlank = value === null || value === '' || value === undefined;
        arr[edge] = isBlank ? null : Math.round(value);
        return { ...r, [key]: arr };
      }),
    }));

  const selectedRoomOpenings = selected
    ? (plan.openings || []).filter((o) => o.roomId === selected.id)
    : [];

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
      adoptDocument(await floorplanApi.restoreDocument(name));
      setBackupsOpen(false);
      message.success(t('floorplan.restored'));
    } catch (e) {
      message.error(e.message);
    }
  };

  // ---------- 左右分栏 ----------
  /** 右侧栏默认宽度（px）——和 CSS 里的 42% 大致相当 */
  const DEFAULT_SIDE_W = 420;
  const [sideDragging, setSideDragging] = React.useState(false);

  /**
   * 拖动分隔条调整左右比例。
   * 往左拖到很窄（< 160px）就直接**收起右侧**，把整个宽度让给画图区；
   * 收起后往右拖回来即可恢复。双击复位成默认宽度。
   */
  const onSplitterDown = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const startX = e.clientX;
    const startW = sideRef.current ? sideRef.current.offsetWidth : DEFAULT_SIDE_W;
    const bodyW = el.parentElement ? el.parentElement.clientWidth : 1200;
    const maxW = Math.round(bodyW * 0.78);
    capturePointer(el, e.pointerId);
    setSideDragging(true);
    const move = (ev) => {
      // ⚠️ 方向：分隔条在右侧栏的**左边**。往左拖（dx<0）右侧应该变窄，
      //    所以是 startW + dx，不是 startW - dx（第一版写反了，往左拖反而越拖越宽）。
      const dx = ev.clientX - startX;
      const next = Math.round(startW + dx);
      setSideWidth(next < 160 ? 0 : Math.max(240, Math.min(maxW, next)));
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      setSideDragging(false);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  // 新版编辑器内存中的 Building → 旧 3D 卡片使用的 building prop。
  // 经典编辑器的实时预览则把当前 plan 合回上次保存的 Building，保留不支持编辑的内容。
  const previewBuilding = React.useMemo(() => {
    if (editorVersion === 'new') return newBuilding;
    if (!plan || !plan.floors || plan.floors.length === 0) return null;
    return mergePlanIntoBuilding(plan, baseBuildingRef.current || planToBuilding(plan));
  }, [editorVersion, newBuilding, plan]);

  if (loading) {
    return (
      <div className="fp-page fp-page-loading">
        <span>{t('loading')}</span>
      </div>
    );
  }

  // ---------- 新版编辑器（移植自 neonplan3d）----------
  if (editorVersion === 'new') {
    return (
      <div className="fp-page">
        <div className="fp-toolbar">
          <div className="fp-toolbar-group">
            <span className="fp-new-badge">{t('floorplan.newEditorBadge')}</span>
            {newDirty ? <span className="fp-new-dirty">{t('floorplan.unsaved')}</span> : null}
          </div>
          <div className="fp-toolbar-spacer" />
          <div className="fp-toolbar-group">
            <Button
              size="small"
              icon={<Icon path={mdiRulerSquare} size={14} />}
              disabled={!bgImage}
              onClick={() => setCalibrateOpen(true)}
              title={bgImage ? t('floorplan.calibrateHint') : t('floorplan.calibrateNoBg')}
            >
              {t('floorplan.calibrate')}
            </Button>
            <Button
              size="small"
              icon={<Icon path={mdiAutoFix} size={14} />}
              disabled={!bgImage}
              onClick={() => setAiOpen(true)}
              title={bgImage ? t('floorplan.aiIntro') : t('floorplan.calibrateNoBg')}
            >
              {t('floorplan.autoGenerate')}
            </Button>
          </div>
          <div className="fp-toolbar-spacer" />
          <div className="fp-toolbar-group">
            <Button
              size="small"
              type="primary"
              loading={saving}
              disabled={!newDirty || saving}
              onClick={handleSave}
            >
              {saving ? t('config.saving') : t('config.save')}
            </Button>
            <Button size="small" onClick={switchToClassicEditor}>
              {t('floorplan.backToClassic')}
            </Button>
          </div>
        </div>
        <div className="fp-new-editor-wrap">
          {/* ⚠️ 别在 building 为空时挂载编辑器：上游首帧就读 `_doc3d.settings`，
              拿到 null 会抛错、整个模板渲染中断。加载失败时给个占位，别让它崩。 */}
          {newBuilding ? (
            <FloorplanEditor
              building={newBuilding}
              hass={editorHass}
              onBuildingChanged={handleNewBuildingChanged}
            />
          ) : (
            <div className="fp-new-empty">{t('floorplan.loadFailed')}</div>
          )}
        </div>
        <CalibrateModal
          open={calibrateOpen}
          onCancel={() => setCalibrateOpen(false)}
          image={bgImage?.url || null}
          currentWidth={bgRef?.width}
          onApply={applyBackgroundWidth}
        />
        <AiFloorplanModal
          open={aiOpen}
          onCancel={() => setAiOpen(false)}
          image={bgImage?.url || null}
          bg={bgRef}
          aspect={bgImage?.aspect}
          onApply={applyGenerated}
        />
      </div>
    );
  }

  return (
    <div className="fp-page">
      {/* ---------- 工具栏 ---------- */}
      <div className="fp-toolbar">
        <div className="fp-toolbar-group">
          <span className="fp-legacy-badge" title={t('floorplan.legacyHint')}>
            {t('floorplan.legacyBadge')}
          </span>
        </div>
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
          <button
            type="button"
            className={`fp-btn ${mode === MODE_POLY ? 'active' : ''}`}
            onClick={() => {
              setPolyPoints([]);
              setPolyCursor(null);
              setMode(mode === MODE_POLY ? MODE_SELECT : MODE_POLY);
            }}
            title={t('floorplan.modePoly')}
          >
            <Icon path={mdiVectorPolygon} size={15} />
            {t('floorplan.modePoly')}
          </button>
          <button
            type="button"
            className={`fp-btn ${mode === MODE_FREEWALL ? 'active' : ''}`}
            onClick={() => setMode(mode === MODE_FREEWALL ? MODE_SELECT : MODE_FREEWALL)}
            title={t('floorplan.modeFreeWall')}
          >
            <Icon path={mdiFormatLineStyle} size={15} />
            {t('floorplan.modeFreeWall')}
          </button>
          {/* 家具：点开是家具库，选一件后在画布上点一下放下 */}
          <button
            type="button"
            className={`fp-btn ${mode === MODE_FURNITURE ? 'active' : ''}`}
            onClick={() => {
              setFurnLibOpen((v) => {
                const next = !v;
                if (!next) setMode(MODE_SELECT);
                return next;
              });
            }}
            title={t('floorplan.modeFurniture')}
          >
            <Icon path={mdiSofaOutline} size={15} />
            {t('floorplan.modeFurniture')}
          </button>
          <button
            type="button"
            className="fp-btn"
            onClick={removeSelected}
            disabled={!selected && !selectedFurniture}
          >
            <Icon path={mdiDeleteOutline} size={15} />
            {selectedFurniture ? t('floorplan.deleteFurniture') : t('floorplan.deleteRoom')}
          </button>
          {/* 画到一半才出现：取消这次绘制（右键 / Esc 同效） */}
          {isDrawing ? (
            <button type="button" className="fp-btn fp-btn-cancel" onClick={cancelDrawing}>
              <Icon path={mdiClose} size={15} />
              {t('floorplan.cancelDraw')}
            </button>
          ) : null}
        </div>

        {/* 门窗：选一个类型 → 在墙上点一下就落一个洞，之后可以沿墙拖 */}
        <div className="fp-toolbar-group">
          <span className="fp-label">{t('floorplan.openings')}</span>
          {[
            { type: 'door', icon: mdiDoor },
            { type: 'window', icon: mdiWindowClosed },
            { type: 'passage', icon: mdiWall },
            { type: 'garage', icon: mdiGarage },
          ].map(({ type, icon }) => {
            const def = openingDefaults(type);
            const active = mode === MODE_OPENING && openingType === type;
            return (
              <button
                key={type}
                type="button"
                className={`fp-btn ${active ? 'active' : ''}`}
                title={t(`floorplan.opening_${type}`)}
                onClick={() => {
                  setOpeningType(type);
                  setMode(active ? MODE_SELECT : MODE_OPENING);
                }}
              >
                <Icon path={icon} size={15} />
                {def.label}
              </button>
            );
          })}
          <button
            type="button"
            className="fp-btn"
            disabled={!selectedOpening}
            onClick={() => {
              mutate((p) => ({
                ...p,
                openings: (p.openings || []).filter((o) => o.id !== selectedOpeningId),
              }));
              setSelectedOpeningId(null);
            }}
          >
            <Icon path={mdiDeleteOutline} size={15} />
            {t('floorplan.deleteOpening')}
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
          <button
            type="button"
            className="fp-btn"
            onClick={() => fitView()}
            title={t('floorplan.fitHint')}
          >
            <Icon path={mdiFitToPageOutline} size={15} />
            {t('floorplan.fitView')}
          </button>
          <button
            type="button"
            className={`fp-btn ${sideWidth === 0 ? '' : 'active'}`}
            onClick={() => setSideWidth(sideWidth === 0 ? null : 0)}
            title={t('floorplan.toggle3dHint')}
          >
            <Icon path={mdiViewSplitVertical} size={15} />
            {t('floorplan.toggle3d')}
          </button>
        </div>

        <div className="fp-toolbar-spacer" />

        <div className="fp-toolbar-group">
          {/* 旧版已降级为回退：新版是默认，这里只提供「切回新版」和旧版独有的历史版本 */}
          <button type="button" className="fp-btn" onClick={switchToNewEditor}>
            <Icon path={mdiSofaOutline} size={15} />
            {t('floorplan.backToNew')}
          </button>
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
          {/* 家具库：浮在画布左上角，选一件后在画布上点一下放下 */}
          <FurnitureLibrary
            open={furnLibOpen}
            activeType={furnType && furnType.type}
            onPick={(type, size) => {
              setFurnType({ type, size });
              setMode(MODE_FURNITURE);
            }}
            onClose={() => {
              setFurnLibOpen(false);
              setFurnType(null);
              setMode(MODE_SELECT);
            }}
          />
          <svg
            ref={svgRef}
            className={`fp-svg fp-mode-${mode}`}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onContextMenu={onContextMenu}
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

            {/* 房间：多边形填充（墙会盖在上面，所以这里只铺地面） */}
            {(plan.rooms || []).map((room) => {
              const isSel = room.id === selectedId;
              const pts = getRoomPolygon(room);
              const c = roomBounds(room);
              return (
                <g key={room.id}>
                  <polygon
                    data-room={room.id}
                    points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
                    className={`fp-room ${isSel ? 'selected' : ''}`}
                    strokeWidth={2 / view.pxPerMm}
                  />
                  {room.name ? (
                    <text
                      x={c.x + c.w / 2}
                      y={c.y + c.h / 2}
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

            {/* 家具：2D 里画成「带名字的方块 + 朝向标记」。
                ⚠️ 真模型只在 3D 视图里画 —— 引擎的 2D 符号表（furniture-symbols/）
                   没有移植，硬塞 3D 渲染图进俯视图反而看不清。 */}
            {(plan.furniture || []).map((f) => {
              const isSel = f.id === selectedFurnitureId;
              const rot = Number(f.rotation) || 0;
              const hw = f.w / 2;
              const hd = f.d / 2;
              // 朝向标记：局部 +y（画布下方）= 正面
              const tri = Math.min(hd * 0.5, 160);
              const tw = Math.min(hw, 200);
              return (
                <g key={f.id} className={`fp-furn-group ${isSel ? 'selected' : ''}`} transform={`rotate(${rot} ${f.x} ${f.y})`}>
                  <rect
                    data-furniture={f.id}
                    x={f.x - hw}
                    y={f.y - hd}
                    width={f.w}
                    height={f.d}
                    rx={Math.min(80, hw * 0.2, hd * 0.2)}
                    className="fp-furniture"
                    strokeWidth={2 / view.pxPerMm}
                    style={{ cursor: 'move' }}
                  />
                  <polygon
                    points={`${f.x},${f.y + hd - tri} ${f.x - tw},${f.y + hd} ${f.x + tw},${f.y + hd}`}
                    className="fp-furniture-front"
                    style={{ pointerEvents: 'none' }}
                  />
                  {f.w >= 500 ? (
                    <text
                      x={f.x}
                      y={f.y}
                      className="fp-furniture-label"
                      fontSize={Math.max(60, 200 / Math.max(0.5, view.pxPerMm * 10))}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ pointerEvents: 'none' }}
                    >
                      {furnitureLabel(f.type)}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* 墙：按 footprint 画成有厚度的带。
                内墙居中、外墙从房间边向外长（见 floorplan/walls.js）。
                ⚠️ 这里用 splitWallByOpenings 把墙按洞口切成段来画 ——
                   洞口就成了**真的缺口**（能看到底图），而不是盖一层色块。 */}
            {walls.map((w) => {
              const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
              const ptOn = (d) => [w.a[0] + w.dir[0] * d, w.a[1] + w.dir[1] * d];
              const nl = [w.normal[0] * w.left, w.normal[1] * w.left];
              const nr = [-w.normal[0] * w.right, -w.normal[1] * w.right];
              return splitWallByOpenings(w)
                // ⚠️ 2D 平面图只画「通高的墙垛」：窗台墙和过梁是 3D 才有的竖向概念，
                //    在平面视图里画出来会把洞口又填上（尤其是门洞的过梁）。
                //    没有洞口时 splitWallByOpenings 返回的是 kind='full'（整面墙），别漏掉。
                .filter((s) => s.kind === 'pier' || s.kind === 'full')
                .map((s, i) => {
                // 只有墙自己的两端才外延补转角，被洞口切开的地方不外延
                const e0 = s.from <= 0.5 ? w.thickness / 2 : 0;
                const e1 = s.to >= len - 0.5 ? w.thickness / 2 : 0;
                const p0 = ptOn(s.from - e0);
                const p1 = ptOn(s.to + e1);
                const quad = [
                  [p0[0] + nl[0], p0[1] + nl[1]],
                  [p1[0] + nl[0], p1[1] + nl[1]],
                  [p1[0] + nr[0], p1[1] + nr[1]],
                  [p0[0] + nr[0], p0[1] + nr[1]],
                ];
                return (
                  <polygon
                    key={`${w.id}-${i}`}
                    {...(w.free ? { 'data-freewall': w.free } : {})}
                    points={quad.map(([x, y]) => `${x},${y}`).join(' ')}
                    className={`fp-wall ${w.exterior ? 'exterior' : 'interior'}${
                      w.free ? ' free' : ''
                    }${w.free && w.free === selectedFreeWallId ? ' selected' : ''}`}
                    style={
                      w.free
                        ? { cursor: 'move' }
                        : { pointerEvents: 'none' }
                    }
                  />
                );
              });
            })}

            {/* 门窗：只画标记（洞本身是上面墙段的缺口）+ 一个可点选的透明区 */}
            {walls.map((w) =>
              (w.openings || []).map((o) => {
                const ptOn = (d) => [w.a[0] + w.dir[0] * d, w.a[1] + w.dir[1] * d];
                const p0 = ptOn(o.from);
                const p1 = ptOn(o.to);
                const mid = [
                  p0[0] + (w.normal[0] * (w.left - w.right)) / 2,
                  p0[1] + (w.normal[1] * (w.left - w.right)) / 2,
                ];
                const mid2 = [
                  p1[0] + (w.normal[0] * (w.left - w.right)) / 2,
                  p1[1] + (w.normal[1] * (w.left - w.right)) / 2,
                ];
                const nl = [w.normal[0] * w.left, w.normal[1] * w.left];
                const nr = [-w.normal[0] * w.right, -w.normal[1] * w.right];
                const quad = [
                  [p0[0] + nl[0], p0[1] + nl[1]],
                  [p1[0] + nl[0], p1[1] + nl[1]],
                  [p1[0] + nr[0], p1[1] + nr[1]],
                  [p0[0] + nr[0], p0[1] + nr[1]],
                ];
                const isSel = o.id === selectedOpeningId;
                const c = [(mid[0] + mid2[0]) / 2, (mid[1] + mid2[1]) / 2];
                const half = Math.max(60, 90 / Math.max(0.05, view.pxPerMm) / 100);
                return (
                  <g key={o.id}>
                    <polygon
                      data-opening={o.id}
                      points={quad.map(([x, y]) => `${x},${y}`).join(' ')}
                      className={`fp-opening-hit ${isSel ? 'selected' : ''}`}
                      strokeWidth={0}
                    />
                    {/* 门的开启弧线 / 窗的中线 —— 一眼区分门和窗 */}
                    {o.type === 'window' ? (
                      <line
                        x1={mid[0]}
                        y1={mid[1]}
                        x2={mid2[0]}
                        y2={mid2[1]}
                        className="fp-opening-mark"
                        strokeWidth={1.5 / view.pxPerMm}
                        style={{ pointerEvents: 'none' }}
                      />
                    ) : (
                      <line
                        x1={mid[0]}
                        y1={mid[1]}
                        x2={mid2[0]}
                        y2={mid2[1]}
                        className="fp-opening-mark dashed"
                        strokeWidth={1 / view.pxPerMm}
                        strokeDasharray={`${6 / view.pxPerMm} ${4 / view.pxPerMm}`}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {isSel ? (
                      <circle
                        data-opening={o.id}
                        cx={c[0]}
                        cy={c[1]}
                        r={half}
                        className="fp-opening-knob"
                        style={{ cursor: 'grab' }}
                      />
                    ) : null}
                  </g>
                );
              })
            )}

            {/* 选中房间的角把手：矩形给 4 个角，多边形给每个顶点 */}
            {selected
              ? getRoomPolygon(selected).map(([hx, hy], i) => (
                  <rect
                    key={`h${i}`}
                    data-handle={isRectRoom(selected) ? ['nw', 'ne', 'se', 'sw'][i] : `v${i}`}
                    x={hx - 5 / view.pxPerMm}
                    y={hy - 5 / view.pxPerMm}
                    width={10 / view.pxPerMm}
                    height={10 / view.pxPerMm}
                    className="fp-handle"
                  />
                ))
              : null}

            {/* 正在拖出来的新房间（矩形）或正在画的隔断墙（线段） */}
            {draft ? (
              draft.kind === 'line' ? (
                <line
                  x1={draft.x}
                  y1={draft.y}
                  x2={draft.x + draft.w}
                  y2={draft.y + draft.h}
                  className="fp-draft-line"
                  strokeWidth={Math.max(2, (floor.interiorThickness || 120) * view.pxPerMm)}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <rect
                  x={Math.min(draft.x, draft.x + draft.w)}
                  y={Math.min(draft.y, draft.y + draft.h)}
                  width={Math.abs(draft.w)}
                  height={Math.abs(draft.h)}
                  className="fp-draft"
                  strokeWidth={2 / view.pxPerMm}
                  style={{ pointerEvents: 'none' }}
                />
              )
            ) : null}

            {/* 正在画的多边形房间：已落的点 + 到光标的橡皮筋 */}
            {polyPoints.length > 0 ? (
              <g style={{ pointerEvents: 'none' }}>
                <polyline
                  points={[...polyPoints, ...(polyCursor ? [polyCursor] : [])]
                    .map(([x, y]) => `${x},${y}`)
                    .join(' ')}
                  className="fp-draft-line"
                  fill="none"
                  strokeWidth={2 / view.pxPerMm}
                />
                {polyPoints.map(([x, y], i) => (
                  <circle
                    key={`pp${i}`}
                    cx={x}
                    cy={y}
                    r={4 / view.pxPerMm}
                    className="fp-handle"
                  />
                ))}
              </g>
            ) : null}

            {/* 吸附辅助线 */}
            {guides.map((g, i) =>
              g.axis === 'x' ? (
                <line
                  key={`gx${i}`}
                  x1={g.value}
                  y1={view.cy - vh / 2}
                  x2={g.value}
                  y2={view.cy + vh / 2}
                  className="fp-guide"
                  strokeWidth={1 / view.pxPerMm}
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <line
                  key={`gy${i}`}
                  x1={view.cx - vw / 2}
                  y1={g.value}
                  x2={view.cx + vw / 2}
                  y2={g.value}
                  className="fp-guide"
                  strokeWidth={1 / view.pxPerMm}
                  style={{ pointerEvents: 'none' }}
                />
              )
            )}
          </svg>

          <div className="fp-hint">
            {mode === MODE_DRAW
              ? t('floorplan.hintDraw')
              : mode === MODE_OPENING
                ? t('floorplan.hintOpening')
                : mode === MODE_POLY
                  ? t('floorplan.hintPoly')
                  : mode === MODE_FREEWALL
                    ? t('floorplan.hintFreeWall')
                    : mode === MODE_FURNITURE
                      ? t('floorplan.hintFurniture')
                      : t('floorplan.hintSelect')}
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

        {/* ---------- 分隔条：拖动调整左右比例，双击复位 ---------- */}
        <div
          className={`fp-splitter${sideWidth === 0 ? ' collapsed' : ''}${
            sideDragging ? ' dragging' : ''
          }`}
          onPointerDown={onSplitterDown}
          onDoubleClick={() => setSideWidth(null)}
          title={t('floorplan.splitterHint')}
          role="separator"
          aria-orientation="vertical"
        >
          <span className="fp-splitter-grip" />
        </div>

        {/* ---------- 右侧 ---------- */}
        <div
          className="fp-side"
          ref={sideRef}
          style={
            sideWidth === null
              ? undefined
              : {
                  flexBasis: sideWidth === 0 ? 0 : `${sideWidth}px`,
                  maxWidth: sideWidth === 0 ? 0 : 'none',
                  display: sideWidth === 0 ? 'none' : undefined,
                }
          }
        >
          <div className="fp-preview">
            <Floorplan3D
              plan={plan}
              building={previewBuilding}
              entityStates={entityStates}
              theme="day"
              explode={false}
              emptyHint={t('floorplan.previewEmpty')}
              // 在 3D 预览里拖家具 → 回写坐标（引擎给的是**米**，本项目模型是**毫米**）
              onFurnitureMove={(id, x, z) =>
                patchFurniture(id, { x: Math.round(x * 1000), y: Math.round(z * 1000) })
              }
            />
          </div>

          <div className="fp-inspector">
            {selectedFurniture ? (
              /* ---------- 家具属性 ---------- */
              <>
                <div className="fp-inspector-title">
                  {furnitureLabel(selectedFurniture.type)}
                  <span className="fp-inspector-sub">{selectedFurniture.type}</span>
                </div>

                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnX')}</span>
                    <InputNumber
                      size="small"
                      step={grid}
                      value={selectedFurniture.x}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { x: Math.round(Number(v) || 0) })}
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnY')}</span>
                    <InputNumber
                      size="small"
                      step={grid}
                      value={selectedFurniture.y}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { y: Math.round(Number(v) || 0) })}
                    />
                  </div>
                </div>

                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnW')}</span>
                    <InputNumber
                      size="small"
                      min={100}
                      step={50}
                      value={selectedFurniture.w}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { w: Math.max(100, Math.round(Number(v) || 0)) })}
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnD')}</span>
                    <InputNumber
                      size="small"
                      min={100}
                      step={50}
                      value={selectedFurniture.d}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { d: Math.max(100, Math.round(Number(v) || 0)) })}
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnH')}</span>
                    <InputNumber
                      size="small"
                      min={50}
                      step={50}
                      value={selectedFurniture.h}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { h: Math.max(50, Math.round(Number(v) || 0)) })}
                    />
                  </div>
                </div>

                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnRotation')}</span>
                    <InputNumber
                      size="small"
                      step={15}
                      value={selectedFurniture.rotation}
                      onChange={(v) => patchFurniture(selectedFurniture.id, { rotation: Math.round(Number(v) || 0) })}
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.furnMountY')}</span>
                    <InputNumber
                      size="small"
                      min={0}
                      step={50}
                      placeholder={t('floorplan.furnMountYAuto')}
                      value={selectedFurniture.mountY}
                      onChange={(v) =>
                        patchFurniture(selectedFurniture.id, {
                          mountY: v === null || v === undefined || v === '' ? null : Math.max(0, Math.round(Number(v))),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="fp-field-row">
                  <Button size="small" icon={<Icon path={mdiRotateRight} size={14} />} onClick={() => rotateFurniture(selectedFurniture, 90)}>
                    {t('floorplan.furnRotate90')}
                  </Button>
                  <Button size="small" onClick={() => rotateFurniture(selectedFurniture, -90)}>
                    -90°
                  </Button>
                  <Button size="small" icon={<Icon path={mdiContentCopy} size={14} />} onClick={() => duplicateFurniture(selectedFurniture)}>
                    {t('floorplan.furnDuplicate')}
                  </Button>
                  <Button size="small" danger onClick={removeSelected}>
                    {t('floorplan.deleteFurniture')}
                  </Button>
                </div>

                <div className="fp-inspector-hint">{t('floorplan.furnHint')}</div>
              </>
            ) : selectedFreeWall ? (
              /* ---------- 隔断墙属性 ---------- */
              <>
                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.freeWallThickness')}</span>
                    <InputNumber
                      size="small"
                      min={60}
                      max={600}
                      step={10}
                      value={selectedFreeWall.thickness}
                      onChange={(v) =>
                        mutate((p) => ({
                          ...p,
                          freeWalls: (p.freeWalls || []).map((w) =>
                            w.id === selectedFreeWall.id ? { ...w, thickness: v || 120 } : w
                          ),
                        }))
                      }
                      addonAfter="mm"
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.freeWallHeight')}</span>
                    <InputNumber
                      size="small"
                      min={300}
                      max={6000}
                      step={100}
                      value={selectedFreeWall.height}
                      onChange={(v) =>
                        mutate((p) => ({
                          ...p,
                          freeWalls: (p.freeWalls || []).map((w) =>
                            w.id === selectedFreeWall.id ? { ...w, height: v || 2700 } : w
                          ),
                        }))
                      }
                      addonAfter="mm"
                    />
                  </div>
                </div>
                <div className="fp-meta">
                  {t('floorplan.freeWallLength')}: {freeWallLength(selectedFreeWall)} mm
                </div>
                <Button
                  size="small"
                  danger
                  block
                  onClick={() => {
                    mutate((p) => ({
                      ...p,
                      freeWalls: (p.freeWalls || []).filter((w) => w.id !== selectedFreeWall.id),
                      openings: (p.openings || []).filter((o) => o.wallId !== selectedFreeWall.id),
                    }));
                    setSelectedFreeWallId(null);
                  }}
                >
                  {t('floorplan.deleteFreeWall')}
                </Button>
              </>
            ) : selectedOpening ? (
              /* ---------- 门窗属性 ---------- */
              <>
                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.openingType')}</span>
                  <Select
                    size="small"
                    value={selectedOpening.type}
                    onChange={(v) => {
                      const d = openingDefaults(v);
                      patchOpening(selectedOpening.id, {
                        type: v,
                        width: d.defaultWidth,
                        height: d.defaultHeight,
                        sill: d.defaultSill,
                      });
                    }}
                    options={OPENING_TYPES.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </div>
                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.openingWidth')}</span>
                    <InputNumber
                      size="small"
                      min={100}
                      max={6000}
                      step={50}
                      value={selectedOpening.width}
                      onChange={(v) => patchOpening(selectedOpening.id, { width: v || 100 })}
                      addonAfter="mm"
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.openingHeight')}</span>
                    <InputNumber
                      size="small"
                      min={100}
                      max={4000}
                      step={50}
                      value={selectedOpening.height}
                      onChange={(v) => patchOpening(selectedOpening.id, { height: v || 100 })}
                      addonAfter="mm"
                    />
                  </div>
                </div>
                {selectedOpening.type === 'window' ? (
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.openingSill')}</span>
                    <InputNumber
                      size="small"
                      min={0}
                      max={2500}
                      step={50}
                      value={selectedOpening.sill}
                      onChange={(v) => patchOpening(selectedOpening.id, { sill: v || 0 })}
                      addonAfter="mm"
                    />
                  </div>
                ) : null}
                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.openingOffset')}</span>
                  <InputNumber
                    size="small"
                    min={0}
                    step={50}
                    value={selectedOpening.offset}
                    onChange={(v) => patchOpening(selectedOpening.id, { offset: v || 0 })}
                    addonAfter="mm"
                  />
                </div>
                {selectedOpening.type === 'door' ? (
                  <div className="fp-field-row">
                    <div className="fp-field">
                      <span className="fp-field-label">{t('floorplan.openingHinge')}</span>
                      <Select
                        size="small"
                        value={selectedOpening.hinge}
                        onChange={(v) => patchOpening(selectedOpening.id, { hinge: v })}
                        options={[
                          { value: 'left', label: t('floorplan.hingeLeft') },
                          { value: 'right', label: t('floorplan.hingeRight') },
                        ]}
                      />
                    </div>
                    <div className="fp-field">
                      <span className="fp-field-label">{t('floorplan.openingSwing')}</span>
                      <Select
                        size="small"
                        value={selectedOpening.swing}
                        onChange={(v) => patchOpening(selectedOpening.id, { swing: v })}
                        options={[
                          { value: 'in', label: t('floorplan.swingIn') },
                          { value: 'out', label: t('floorplan.swingOut') },
                        ]}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="fp-meta">
                  {selectedOpening.width} × {selectedOpening.height} mm · {t('floorplan.openingOffset')}{' '}
                  {selectedOpening.offset} mm
                </div>
                <Button size="small" danger block onClick={() => removeOpening(selectedOpening.id)}>
                  {t('floorplan.deleteOpening')}
                </Button>
              </>
            ) : selected ? (
              /* ---------- 房间属性 ---------- */
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
                {(() => {
                  const b = roomBounds(selected);
                  return (
                    <div className="fp-meta">
                      {isRectRoom(selected)
                        ? `${b.w} × ${b.h} mm`
                        : `${getRoomPolygon(selected).length} 个顶点 · ${b.w} × ${b.h} mm`}{' '}
                      · {roomAreaM2(selected)} m²
                    </div>
                  );
                })()}

                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.perWall')}</span>
                  <div className="fp-wall-head">
                    <span />
                    <span>{t('floorplan.thicknessShort')}</span>
                    <span>{t('floorplan.heightShort')}</span>
                  </div>
                  {getRoomPolygon(selected).map((_, i) => {
                    const th = (selected.wallThickness || [])[i];
                    const hh = (selected.wallHeights || [])[i];
                    return (
                      <div className="fp-wall-row" key={`edge${i}`}>
                        <span className="fp-wall-row-label">
                          {i + 1} · {Math.round(edgeLength(selected, i))}
                        </span>
                        <InputNumber
                          size="small"
                          min={60}
                          max={600}
                          step={10}
                          value={th ?? null}
                          placeholder={String(floor.exteriorThickness || 240)}
                          onChange={(v) => patchRoomEdge(selected.id, i, 'wallThickness', v)}
                        />
                        <InputNumber
                          size="small"
                          min={0}
                          max={6000}
                          step={100}
                          value={hh ?? null}
                          placeholder={String(floor.wallHeight || 2700)}
                          onChange={(v) => patchRoomEdge(selected.id, i, 'wallHeights', v)}
                        />
                      </div>
                    );
                  })}
                  <div className="fp-meta">{t('floorplan.perWallHint')}</div>
                </div>

                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.roomOpenings')}（{selectedRoomOpenings.length}）</span>
                  {selectedRoomOpenings.length === 0 ? (
                    <div className="fp-meta">{t('floorplan.noRoomOpenings')}</div>
                  ) : (
                    selectedRoomOpenings.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`fp-opening-row ${o.id === selectedOpeningId ? 'active' : ''}`}
                        onClick={() => setSelectedOpeningId(o.id)}
                      >
                        <Icon
                          path={
                            o.type === 'window'
                              ? mdiWindowClosed
                              : o.type === 'garage'
                                ? mdiGarage
                                : o.type === 'passage'
                                  ? mdiWall
                                  : mdiDoor
                          }
                          size={14}
                        />
                        <span>{openingDefaults(o.type).label}</span>
                        <span className="fp-opening-row-meta">
                          {o.width} × {o.height}
                        </span>
                      </button>
                    ))
                  )}
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
              /* ---------- 没选中：显示楼层级设置 ---------- */
              <>
                <div className="fp-inspector-empty">{t('floorplan.selectHint')}</div>
                <div className="fp-field-row">
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.exteriorThickness')}</span>
                    <InputNumber
                      size="small"
                      min={60}
                      max={600}
                      step={10}
                      value={floor.exteriorThickness}
                      onChange={(v) => patchFloor({ exteriorThickness: v || 240 })}
                      addonAfter="mm"
                    />
                  </div>
                  <div className="fp-field">
                    <span className="fp-field-label">{t('floorplan.interiorThickness')}</span>
                    <InputNumber
                      size="small"
                      min={60}
                      max={400}
                      step={10}
                      value={floor.interiorThickness}
                      onChange={(v) => patchFloor({ interiorThickness: v || 120 })}
                      addonAfter="mm"
                    />
                  </div>
                </div>
                <div className="fp-field">
                  <span className="fp-field-label">{t('floorplan.wallHeight')}</span>
                  <InputNumber
                    size="small"
                    min={1800}
                    max={6000}
                    step={100}
                    value={floor.wallHeight}
                    onChange={(v) => patchFloor({ wallHeight: v || 2700 })}
                    addonAfter="mm"
                  />
                </div>
                <div className="fp-meta">
                  {t('floorplan.wallCount')}: {walls.length} ·{' '}
                  {t('floorplan.openingCount')}: {(plan.openings || []).length}
                </div>
              </>
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
