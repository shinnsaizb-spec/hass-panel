import React from 'react';
import * as THREE from 'three';
import { buildWalls, mmToM, planBounds } from '../../floorplan/model';
import './style.css';

// ==============================================================================
// 户型图 3D 渲染
// ------------------------------------------------------------------------------
// 输入就是 floorplan/model 里的那份纯 JSON，输出一个可交互的 3D 场景：
//   · 每个房间 = 一块地板 + 由房间矩形自动生成的墙
//   · 绑定了灯的实体 = 一个小圆盘，开着就发光（带实体自己的颜色）
//   · 点一下圆盘 = 回调出去（由调用方决定是开灯还是关灯）
//
// 两个刻意的设计（都是从 neonplan3d 那边学来的性能经验）：
//   1) **按需渲染**：只有相机动了 / 数据变了才排一帧，静止时完全不占 GPU。
//      不是常驻 60fps 循环。
//   2) 页面不可见 / 元素滚出视野时**不渲染**。
//
// 坐标：户型用毫米、X 向右、Y 向下；这里换成米，X→X、Y→Z（俯视图的两个轴），
// Y 轴向上。
// ==============================================================================

const WALL_THICKNESS_MM = 120;
const FLOOR_THICKNESS_MM = 120;

const COLOR_FLOOR = 0xd7dfe9;
const COLOR_WALL = 0xeef2f7;
const COLOR_WALL_EDGE = 0x9aa6b5;
const COLOR_FURNITURE = 0xb9c4d1;
const COLOR_LIGHT_OFF = 0xb0bac7;

/** 从实体状态里取灯的颜色（HA 的 rgb_color 是 0-255 的数组） */
function lightColorOf(state) {
  const rgb = state && state.attributes && state.attributes.rgb_color;
  if (Array.isArray(rgb) && rgb.length >= 3) {
    return new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  }
  return new THREE.Color(0xffc76b);
}

function isOn(state) {
  return !!state && (state.state === 'on' || state.state === 'open');
}

/** 简易轨道控制：左键转、右键/Shift 平移、滚轮缩放、单指转、双指缩放 */
function attachControls(dom, camera, target, invalidate) {
  const sph = new THREE.Spherical();
  const offset = new THREE.Vector3();

  const syncFromCamera = () => {
    offset.copy(camera.position).sub(target);
    sph.setFromVector3(offset);
  };
  const apply = () => {
    sph.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, sph.phi));
    sph.radius = Math.max(0.6, Math.min(400, sph.radius));
    offset.setFromSpherical(sph);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    invalidate();
  };
  syncFromCamera();

  let dragging = null;
  let lastX = 0;
  let lastY = 0;
  const pointers = new Map();
  let pinchDist = 0;

  const onDown = (e) => {
    dom.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      dragging = 'pinch';
      return;
    }
    dragging = e.button === 2 || e.shiftKey ? 'pan' : 'rotate';
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onMove = (e) => {
    if (!dragging) return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (dragging === 'pinch' && pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchDist > 0) {
        sph.radius *= pinchDist / Math.max(1, d);
        apply();
      }
      pinchDist = d;
      return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (dragging === 'rotate') {
      sph.theta -= dx * 0.006;
      sph.phi -= dy * 0.006;
      apply();
    } else if (dragging === 'pan') {
      const scale = sph.radius * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      target.addScaledVector(right, -dx * scale);
      target.addScaledVector(up, dy * scale);
      apply();
    }
  };

  const onUp = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) dragging = null;
    else if (pointers.size === 1) {
      const [p] = Array.from(pointers.values());
      lastX = p.x;
      lastY = p.y;
      dragging = 'rotate';
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    sph.radius *= e.deltaY > 0 ? 1.12 : 0.89;
    apply();
  };

  const onContext = (e) => e.preventDefault();

  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('pointercancel', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onContext);

  return {
    dispose() {
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContext);
    },
    /** 数据变化后重新取景 */
    frame(sizeX, sizeZ) {
      const r = Math.max(sizeX, sizeZ, 3) * 1.25;
      target.set(0, 0, 0);
      camera.position.set(r * 0.75, r * 0.95, r * 0.95);
      syncFromCamera();
      apply();
    },
    /** 俯视 / 45 度视角切换 */
    setView(kind) {
      const r = sph.radius;
      if (kind === 'top') {
        camera.position.set(0.001, r, 0.001);
      } else {
        camera.position.set(r * 0.6, r * 0.8, r * 0.8);
      }
      syncFromCamera();
      apply();
    },
  };
}

/** 建一个 viewer（命令式，React 只负责挂载和传数据） */
function createViewer(host, opts) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  renderer.shadowMap.enabled = false;
  host.appendChild(renderer.domElement);
  renderer.domElement.className = 'fp3d-canvas';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 500);

  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const dir = new THREE.DirectionalLight(0xffffff, 1.35);
  dir.position.set(6, 12, 8);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dir2.position.set(-8, 6, -6);
  scene.add(dir2);

  const world = new THREE.Group();
  scene.add(world);

  const matFloor = new THREE.MeshStandardMaterial({ color: COLOR_FLOOR, roughness: 0.95 });
  const matWall = new THREE.MeshStandardMaterial({
    color: COLOR_WALL,
    roughness: 0.85,
    transparent: true,
    opacity: 0.92,
  });
  const matEdge = new THREE.LineBasicMaterial({ color: COLOR_WALL_EDGE, transparent: true, opacity: 0.7 });
  const matLightOff = new THREE.MeshStandardMaterial({ color: COLOR_LIGHT_OFF, roughness: 0.6 });

  let frame = null;
  let disposed = false;
  let onScreen = true;
  let plan = null;
  let entityStates = {};
  /** 可点击的灯：mesh -> binding */
  const pickables = [];
  const lightNodes = [];

  const invalidate = () => {
    if (frame || disposed || document.hidden || !onScreen) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      renderer.render(scene, camera);
    });
  };

  const controls = attachControls(renderer.domElement, camera, new THREE.Vector3(), invalidate);

  // 点选：区分「拖动」和「点击」
  let downAt = null;
  const onPickDown = (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  };
  const onPickUp = (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return; // 拖动，不算点击

    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit && opts.onPick) opts.onPick(hit.object.userData.binding);
  };
  renderer.domElement.addEventListener('pointerdown', onPickDown);
  renderer.domElement.addEventListener('pointerup', onPickUp);

  // 视口尺寸
  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // 滚出视野 / 切到别的标签页时不渲染
  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0] ? entries[0].isIntersecting : true;
      invalidate();
    },
    { threshold: 0 }
  );
  io.observe(host);
  const onVisibility = () => invalidate();
  document.addEventListener('visibilitychange', onVisibility);

  const clearWorld = () => {
    pickables.length = 0;
    lightNodes.length = 0;
    while (world.children.length) {
      const child = world.children[0];
      world.remove(child);
      child.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material !== matFloor && o.material !== matWall && o.material !== matEdge) {
          o.material.dispose();
        }
      });
    }
  };

  const build = () => {
    clearWorld();
    if (!plan) return;
    const floors = plan.floors || [];
    const floorById = {};
    floors.forEach((f) => {
      floorById[f.id] = f;
    });

    const bounds = planBounds(plan);
    const cx = mmToM(bounds.minX + bounds.w / 2);
    const cz = mmToM(bounds.minY + bounds.h / 2);
    world.position.set(-cx, 0, -cz);

    const allWalls = [];
    (plan.rooms || []).forEach((room) => {
      const floor = floorById[room.floorId] || floors[0] || {};
      const wallH = mmToM(floor.wallHeight || 2700);
      const w = mmToM(room.w);
      const h = mmToM(room.h);
      const x = mmToM(room.x) + w / 2;
      const z = mmToM(room.y) + h / 2;

      // 地板
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, mmToM(FLOOR_THICKNESS_MM), h),
        matFloor
      );
      slab.position.set(x, -mmToM(FLOOR_THICKNESS_MM) / 2, z);
      world.add(slab);

      // 这块房间的四面墙（相邻房间重合的墙在 buildWalls 里会去重）
      buildWalls([room]).forEach((seg) => {
        allWalls.push({ ...seg, wallH });
      });
    });

    allWalls.forEach(({ a, b, wallH }) => {
      const ax = mmToM(a[0]);
      const az = mmToM(a[1]);
      const bx = mmToM(b[0]);
      const bz = mmToM(b[1]);
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.02) return;
      const th = mmToM(WALL_THICKNESS_MM);
      const geo = new THREE.BoxGeometry(len, wallH, th);
      const mesh = new THREE.Mesh(geo, matWall);
      mesh.position.set((ax + bx) / 2, wallH / 2, (az + bz) / 2);
      mesh.rotation.y = -Math.atan2(bz - az, bx - ax);
      world.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), matEdge);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      world.add(edges);
    });

    // 绑定了灯的实体 → 房间中央一个圆盘
    (plan.bindings || []).forEach((bd) => {
      if (!bd.entityId) return;
      const room = (plan.rooms || []).find((r) => r.id === bd.roomId);
      if (!room) return;
      const x = mmToM(room.x + room.w / 2);
      const z = mmToM(room.y + room.h / 2);
      const geo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24);
      const mesh = new THREE.Mesh(geo, matLightOff.clone());
      mesh.position.set(x, 0.03, z);
      mesh.userData.binding = bd;
      world.add(mesh);
      pickables.push(mesh);
      const point = new THREE.PointLight(0xffc76b, 0, 8);
      point.position.set(x, 1.9, z);
      world.add(point);
      lightNodes.push({ binding: bd, mesh, point });
    });

    resize();
    controls.frame(bounds.w / 1000, bounds.h / 1000);
    applyStates();
    invalidate();
  };

  const applyStates = () => {
    lightNodes.forEach((node) => {
      const st = entityStates[node.binding.entityId];
      const on = isOn(st);
      const color = lightColorOf(st);
      node.mesh.material.color.copy(on ? color : new THREE.Color(COLOR_LIGHT_OFF));
      node.mesh.material.emissive.copy(on ? color : new THREE.Color(0x000000));
      node.mesh.material.emissiveIntensity = on ? 0.85 : 0;
      node.point.color.copy(color);
      node.point.intensity = on ? 1.5 : 0;
    });
    invalidate();
  };

  resize();

  return {
    setPlan(next) {
      plan = next;
      build();
    },
    setEntityStates(next) {
      entityStates = next || {};
      applyStates();
    },
    setView(kind) {
      controls.setView(kind);
    },
    resize,
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('pointerdown', onPickDown);
      renderer.domElement.removeEventListener('pointerup', onPickUp);
      controls.dispose();
      clearWorld();
      matFloor.dispose();
      matWall.dispose();
      matEdge.dispose();
      matLightOff.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

/**
 * 户型图 3D 视图
 * @param {object}   plan           floorplan/model 里的户型文档
 * @param {object}   entityStates   { [entityId]: { state, attributes } }，用来决定灯亮不亮
 * @param {function} onPick         (binding) => void，点了某个绑定对象
 */
function Floorplan3D({ plan, entityStates, onPick, className = '', emptyHint = '还没有房间' }) {
  const hostRef = React.useRef(null);
  const viewerRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);

  // onPick 用 ref 传：场景只建一次，不能因为回调换了就重建
  const onPickRef = React.useRef(onPick);
  React.useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // 场景只建一次
  React.useEffect(() => {
    if (!hostRef.current) return undefined;
    const viewer = createViewer(hostRef.current, {
      onPick: (b) => {
        if (onPickRef.current) onPickRef.current(b);
      },
    });
    viewerRef.current = viewer;
    setReady(true);
    return () => {
      viewer.dispose();
      viewerRef.current = null;
      setReady(false);
    };
  }, []);

  React.useEffect(() => {
    if (ready) viewerRef.current?.setPlan(plan);
  }, [plan, ready]);

  React.useEffect(() => {
    if (ready) viewerRef.current?.setEntityStates(entityStates);
  }, [entityStates, ready]);

  const hasRooms = !!(plan && plan.rooms && plan.rooms.length);

  return (
    <div className={`fp3d-root ${className}`}>
      <div ref={hostRef} className="fp3d-host" />
      {!hasRooms ? (
        <div className="fp3d-empty">
          <span>{emptyHint}</span>
        </div>
      ) : null}
      {hasRooms ? (
        <div className="fp3d-toolbar">
          <button type="button" onClick={() => viewerRef.current?.setView('iso')}>
            45°
          </button>
          <button type="button" onClick={() => viewerRef.current?.setView('top')}>
            俯视
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Floorplan3D;
