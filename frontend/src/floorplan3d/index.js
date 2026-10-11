// ==============================================================================
// 户型图 3D 视图（React 封装）
// ------------------------------------------------------------------------------
// 引擎来自 neonplan3d（MIT，https://github.com/PATCoder97/neonplan3d），
// 源码已按依赖闭包移植到 `frontend/src/neonplan3d/` 下（纯 JS，无 TS 工具链依赖）。
//
// 这个组件只做四件事：
//   1) 把 FloorplanViewer 挂到一个 div 上（建一次，卸载时 dispose）
//   2) plan 变化 → 转成 Building → setBuilding（带防抖，编辑时不至于每帧重建）
//   3) 实体状态变化 → setDevices（灯亮不亮、窗帘开合、摄像头画面）
//   4) 主题/墙高/楼层/视角这些开关透传
//
// ⚠️ 引擎（连同 three.js、家具模型）是**按需加载**的，不放进首屏包：
//    引擎 + three 一共 1MB 多，静态 import 会让 main.js 超过 PWA 预缓存上限
//    （5MB）从而不被缓存。改回静态 import 之前先想清楚这件事。
// ==============================================================================

import React from 'react';
import '../neonplan3d/view3d.css';
import './style.css';

/** plan 变化后等一小会儿再重建场景：2D 里拖房间时不要每帧都重建 */
const REBUILD_DEBOUNCE_MS = 140;

const WALL_MODES = [
  { value: 'auto', label: '整墙' },
  { value: 'cut', label: '剖切' },
];

// 模块级缓存：多个卡片实例共用同一次加载
let enginePromise = null;
let adapterPromise = null;

function loadEngine() {
  if (!enginePromise) enginePromise = import('../neonplan3d/viewer/viewer3d.js');
  return enginePromise;
}

function loadAdapter() {
  if (!adapterPromise) adapterPromise = import('./adapter');
  return adapterPromise;
}

export default function Floorplan3D({
  plan,
  /** 新存储格式优先直接给完整 Building；旧版页面可只传 plan */
  building = null,
  entityStates,
  theme = 'day',
  wallMode = 'auto',
  floorId = null,
  explode = true,
  onDeviceTap,
  onRoomTap,
  onFloorTap,
  /** 松手时回调：(家具id, x米, z米)。3D 摆放模式开着才会触发 */
  onFurnitureMove,
  className = '',
  emptyHint = '还没有房间',
  showToolbar = true,
}) {
  const hostRef = React.useRef(null);
  const viewerRef = React.useRef(null);
  const adapterRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [activeFloor, setActiveFloor] = React.useState(floorId);
  const [mode, setMode] = React.useState(wallMode);
  /** 3D 摆放：开着的时候在 3D 里拖家具 = 移动它（此时拖空白处不再旋转视角） */
  const [furnish, setFurnish] = React.useState(false);

  // 回调放 ref：场景只建一次，不能因为回调换了就重建
  const cbRef = React.useRef({ onDeviceTap, onRoomTap, onFloorTap, onFurnitureMove });
  React.useEffect(() => {
    cbRef.current = { onDeviceTap, onRoomTap, onFloorTap, onFurnitureMove };
  }, [onDeviceTap, onRoomTap, onFloorTap, onFurnitureMove]);

  // 实体状态放 ref：重建场景时要拿「最新的」状态，但不能让状态变化触发重建
  const statesRef = React.useRef(entityStates);
  React.useEffect(() => {
    statesRef.current = entityStates;
  }, [entityStates]);

  // ---------- 建场景（只做一次，引擎异步到位）----------
  React.useEffect(() => {
    let cancelled = false;
    let viewer = null;
    (async () => {
      try {
        const [engine, adapter] = await Promise.all([loadEngine(), loadAdapter()]);
        if (cancelled || !hostRef.current) return;
        adapterRef.current = adapter;
        viewer = engine.createViewer(hostRef.current, {
          quality: 'auto',
          explode,
          onDeviceTap: (id, x, y) => cbRef.current.onDeviceTap && cbRef.current.onDeviceTap(id, x, y),
          onRoomTap: (fid, rid) => cbRef.current.onRoomTap && cbRef.current.onRoomTap(fid, rid),
          onFloorTap: (fid) => cbRef.current.onFloorTap && cbRef.current.onFloorTap(fid),
          onFurnitureMove: (id, x, z) => cbRef.current.onFurnitureMove && cbRef.current.onFurnitureMove(id, x, z),
        });
        viewerRef.current = viewer;
        setReady(true);
      } catch (e) {
        console.error('[Floorplan3D] 3D 引擎加载失败：', e);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      viewerRef.current = null;
      adapterRef.current = null;
      setReady(false);
      if (viewer) viewer.dispose();
    };
    // explode 只作为初始值，后续变化由下面的 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 主题 ----------
  React.useEffect(() => {
    if (ready) viewerRef.current?.setTheme(theme);
  }, [theme, ready]);

  // ---------- 墙高 / 剖切 ----------
  React.useEffect(() => {
    if (ready) viewerRef.current?.setWallMode(mode);
  }, [mode, ready]);

  // ---------- 3D 摆放模式 ----------
  React.useEffect(() => {
    if (ready) viewerRef.current?.setFurnishMode(furnish);
  }, [furnish, ready]);

  // ---------- 楼层 ----------
  React.useEffect(() => {
    setActiveFloor(floorId);
  }, [floorId]);

  React.useEffect(() => {
    if (ready) viewerRef.current?.setFloor(activeFloor);
  }, [activeFloor, ready]);

  // ---------- 户型数据（防抖重建）----------
  React.useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => {
      const viewer = viewerRef.current;
      const adapter = adapterRef.current;
      if (!viewer || !adapter) return;
      viewer.setBuilding(
        building
          ? JSON.parse(JSON.stringify(building))
          : plan
            ? adapter.planToBuilding(plan)
            : adapter.emptyBuilding()
      );
      const nextDevices = building
        ? adapter.buildingToDevices(building, statesRef.current)
        : plan
          ? adapter.planToDevices(plan, statesRef.current)
          : [];
      viewer.setDevices(nextDevices);
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // 新格式 Building 优先；plan 是旧编辑器显示投影和工具栏数据。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building, plan, ready]);

  // ---------- 设备状态（轻量，只更新标记与灯）----------
  // ⚠️ entityStates 的对象引用会频繁变化（HA 每秒都在推状态），
  //    直接依赖它会导致「每次渲染都重建所有设备标记」。
  //    只对文档里实际链接的实体 + 当前状态做签名，签名没变就不干活。
  const deviceIds = React.useMemo(() => {
    const ids = new Set((plan && plan.bindings ? plan.bindings : []).map((b) => b.entityId).filter(Boolean));
    (building && building.floors ? building.floors : []).forEach((f) => {
      (f.placements || []).forEach((p) => p.entity_id && ids.add(p.entity_id));
      (f.furniture || []).forEach((item) => item.entity && ids.add(item.entity));
    });
    return Array.from(ids).sort();
  }, [plan, building]);

  const deviceSig = React.useMemo(
    () => deviceIds.map((id) => `${id}=${entityStates && entityStates[id] ? entityStates[id].state : '?'}`).join('|'),
    [deviceIds, entityStates]
  );

  React.useEffect(() => {
    if (!ready || (!plan && !building)) return;
    const adapter = adapterRef.current;
    if (!adapter) return;
    const next = building
      ? adapter.buildingToDevices(building, statesRef.current)
      : adapter.planToDevices(plan, statesRef.current);
    viewerRef.current?.setDevices(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceSig, building, plan, ready]);

  const floors = (plan && plan.floors) || [];
  const hasRooms = !!(plan && plan.rooms && plan.rooms.length);
  const hasFurniture = !!(plan && plan.furniture && plan.furniture.length);
  const canSwitchFloor = floors.length > 1;
  const overlayText = failed ? '3D 加载失败' : !hasRooms ? emptyHint : '';

  return (
    <div className={`fp3d-root fp3d-light ${className}`}>
      <div ref={hostRef} className="fp3d-host" />

      {overlayText ? (
        <div className="fp3d-empty">
          <span>{overlayText}</span>
        </div>
      ) : null}

      {hasRooms && showToolbar && ready ? (
        <div className="fp3d-toolbar">
          {canSwitchFloor ? (
            <div className="fp3d-toolbar-seg">
              <button type="button" className={activeFloor === null ? 'is-on' : ''} onClick={() => setActiveFloor(null)}>
                整栋
              </button>
              {floors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={activeFloor === f.id ? 'is-on' : ''}
                  onClick={() => setActiveFloor(f.id)}
                >
                  {f.name || '楼层'}
                </button>
              ))}
            </div>
          ) : null}

          <div className="fp3d-toolbar-seg">
            {WALL_MODES.map((w) => (
              <button key={w.value} type="button" className={mode === w.value ? 'is-on' : ''} onClick={() => setMode(w.value)}>
                {w.label}
              </button>
            ))}
          </div>

          <button type="button" className="fp3d-toolbar-btn" onClick={() => viewerRef.current?.resetView()}>
            复位视角
          </button>

          {/* 有家具时才给「3D 摆放」开关：开着的时候拖家具=移动它，拖空白=不再转视角 */}
          {hasFurniture && onFurnitureMove ? (
            <button
              type="button"
              className={`fp3d-toolbar-btn ${furnish ? 'is-on' : ''}`}
              onClick={() => setFurnish((v) => !v)}
              title={furnish ? '退出 3D 摆放（恢复拖动转视角）' : '打开后可以在 3D 里直接拖家具'}
            >
              {furnish ? '摆放中' : '3D 摆放'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
