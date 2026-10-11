import { emptyBuilding, newFloor, LEVEL_HEIGHT, normalizeBuilding } from '../neonplan3d/model.js';
import { getRoomPolygon, polygonCentroid, pointInPolygon, createEmptyPlan, normalizePlan, uid, DEFAULT_GRID } from '../floorplan/model';
// 图标直接用项目里已有的 @mdi/js，避免手抄 path 抄错
import { mdiLightbulbOutline, mdiLightbulbOn, mdiToggleSwitchOutline, mdiWindowShutter, mdiThermometer, mdiCctv } from '@mdi/js';

// 顺手转出去：封装层在「没有户型数据」时要用它给引擎一份空文档
export { emptyBuilding };

const MM = 1000;
const m = (mm) => (Number(mm) || 0) / MM;
const mm = (v) => Math.round((Number(v) || 0) * MM);

/** 绑定类型 → 引擎的灯具安装方式 */
const MOUNT_OF_KIND = { light: 'ceiling', camera: 'wall', cover: 'wall' };

/** 从实体 id 反推本项目绑定的 kind */
function kindOfEntity(entityId) {
  const domain = String(entityId || '').split('.')[0];
  if (domain === 'light') return 'light';
  if (domain === 'camera') return 'camera';
  if (domain === 'cover') return 'cover';
  if (domain === 'switch' || domain === 'input_boolean') return 'switch';
  return 'sensor';
}

/** 洞口的「边高覆盖」：null 保持 null（= 用楼层默认），数字换成米 */
function edgeList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((v) => (v === null || v === undefined || v === '' ? null : m(v)));
}

/** 洞口类型：本项目多了「垭口」，映射成门 + passage 样式 */
function mapOpeningType(type) {
  if (type === 'garage') return 'garage';
  if (type === 'window') return 'window';
  return 'door';
}

/**
 * 户型文档 → Building
 * @param {object} plan floorplan/model 的户型文档
 */
export function planToBuilding(plan) {
  const building = emptyBuilding();
  const floors = (plan && plan.floors) || [];
  const rooms = (plan && plan.rooms) || [];
  const openings = (plan && plan.openings) || [];
  const freeWalls = (plan && plan.freeWalls) || [];
  const furniture = (plan && plan.furniture) || [];

  const first = floors[0] || {};
  building.settings = {
    ...building.settings,
    grid: m(plan && plan.gridSize) || 0.05,
    wall_exterior: m(first.exteriorThickness) || 0.24,
    wall_interior: m(first.interiorThickness) || 0.12,
    north: 0,
  };

  building.floors = floors.map((fl) => {
    const floor = newFloor(fl.id, fl.name || '楼层', (Number(fl.level) || 0) * LEVEL_HEIGHT);
    floor.height = m(fl.wallHeight) || 2.5;
    // 剖切高度：参考项目里 2.5m 层高对应 1.15m，这里按同样比例给
    floor.cut_height = floor.height * 0.46;

    floor.rooms = rooms
      .filter((r) => r.floorId === fl.id)
      .map((r) => ({
        id: r.id,
        name: r.name || '房间',
        area_id: null,
        // 本项目毫米 → 参考项目米
        points: getRoomPolygon(r).map(([x, y]) => [m(x), m(y)]),
        floor_material: 'wood',
        wall_thickness: edgeList(r.wallThickness),
        wall_heights: edgeList(r.wallHeights),
      }));

    floor.openings = openings
      .filter((o) => o.floorId === fl.id)
      .map((o) => ({
        id: o.id,
        room_id: o.roomId,
        edge: o.edge,
        offset: m(o.offset),
        width: m(o.width),
        type: mapOpeningType(o.type),
        sill: m(o.sill),
        height: m(o.height),
        hinge: o.hinge === 'right' ? 'right' : 'left',
        leaves: 1,
        swing: o.swing === 'out' ? 'out' : 'in',
        // 垭口/过道在参考项目里是「门」的一种样式
        style: o.type === 'passage' ? 'passage' : null,
        cover: null,
        contact: null,
        contact2: null,
        tilt: null,
      }));

    floor.walls = freeWalls
      .filter((w) => w.floorId === fl.id)
      .map((w) => ({
        id: w.id,
        a: [m(w.a[0]), m(w.a[1])],
        b: [m(w.b[0]), m(w.b[1])],
        thickness: m(w.thickness) || null,
        height: m(w.height) || null,
      }));

    // 家具：本项目 x/y 是**中心点**（毫米），引擎的 x/z 也是中心（米），直接除 1000；
    // rotation 两边都是角度、都是「x 向右 y/z 向下」的坐标系，不用转换。
    floor.furniture = furniture
      .filter((f) => f.floorId === fl.id && f.type)
      .map((f) => ({
        id: f.id,
        type: f.type,
        x: m(f.x),
        z: m(f.y),
        rotation: Number(f.rotation) || 0,
        w: m(f.w),
        d: m(f.d),
        h: m(f.h),
        variant: null,
        // 绑了实体的话，3D 里点它能直接开关（引擎按 furnitureId 认领）
        entity: f.entityId || null,
        power: null,
        mount_y: f.mountY === null || f.mountY === undefined ? null : m(f.mountY),
        ...(f.name ? { name: f.name } : {}),
      }));

    // 绑定 → 引擎的「设备摆放」（placements）。
    // 本项目的 binding 是「房间 + 实体 + 类型」，放在房间形心；引擎的 Placement 正好是这个形状。
    floor.placements = (plan && plan.bindings ? plan.bindings : [])
      .filter((bd) => bd.entityId)
      .map((bd) => ({ bd, room: rooms.find((r) => r.id === bd.roomId) }))
      .filter((x) => x.room && x.room.floorId === fl.id)
      .map(({ bd, room }) => {
        const [cx, cy] = polygonCentroid(getRoomPolygon(room));
        return {
          entity_id: bd.entityId,
          x: m(cx),
          z: m(cy),
          y: null,
          mount: MOUNT_OF_KIND[bd.kind] || null,
          rotation: 0,
          name: bd.name || null,
          ...(bd.kind === 'camera' ? { cone: true } : {}),
        };
      });

    return floor;
  });

  return normalizeBuilding(building);
}

// ---------------------------------------------------------------- 反向转换

/**
 * Building → 本项目的 plan。
 *
 * ⚠️ **这是有损的**：屋顶、室外、地面开洞、阳台/雨棚、能源设置、屏幕图片规则这些
 *    本项目的数据模型根本没有，转过来就没了。
 *    所以它只用于**旧版 2D 编辑器的显示**；旧版保存时必须走 `mergePlanIntoBuilding`
 *    把 Building 独有的字段保回来，否则一次保存就把那些数据抹掉了。
 */
export function buildingToPlan(building) {
  const b = building || emptyBuilding();
  const plan = createEmptyPlan();
  const settings = b.settings || {};

  plan.gridSize = mm(settings.grid) || DEFAULT_GRID;
  plan.floors = (b.floors || []).map((f, i) => ({
    id: f.id,
    name: f.name || `第 ${i + 1} 层`,
    level: Math.round((Number(f.elevation) || 0) / LEVEL_HEIGHT),
    wallHeight: mm(f.height) || 2500,
    exteriorThickness: mm(settings.wall_exterior) || 240,
    interiorThickness: mm(settings.wall_interior) || 120,
  }));

  (b.floors || []).forEach((f) => {
    (f.rooms || []).forEach((r) => {
      plan.rooms.push({
        id: r.id,
        floorId: f.id,
        name: r.name || '',
        points: (r.points || []).map(([x, z]) => [mm(x), mm(z)]),
        wallThickness: (r.wall_thickness || []).map((v) => (v == null ? null : mm(v))),
        wallHeights: (r.wall_heights || []).map((v) => (v == null ? null : mm(v))),
      });
    });

    (f.openings || []).forEach((o) => {
      plan.openings.push({
        id: o.id,
        roomId: o.room_id,
        floorId: f.id,
        edge: o.edge,
        offset: mm(o.offset),
        width: mm(o.width),
        height: mm(o.height),
        sill: mm(o.sill),
        // 垭口在引擎里是「门的一种样式」，转回来要还原成本项目的 passage
        type: o.type === 'garage' ? 'garage' : o.type === 'window' ? 'window' : o.style === 'passage' ? 'passage' : 'door',
        hinge: o.hinge === 'right' ? 'right' : 'left',
        swing: o.swing === 'out' ? 'out' : 'in',
      });
    });

    (f.walls || []).forEach((w) => {
      plan.freeWalls.push({
        id: w.id,
        floorId: f.id,
        a: [mm(w.a[0]), mm(w.a[1])],
        b: [mm(w.b[0]), mm(w.b[1])],
        thickness: mm(w.thickness) || 120,
        height: mm(w.height) || mm(f.height) || 2700,
      });
    });

    (f.furniture || []).forEach((fu) => {
      plan.furniture.push({
        id: fu.id,
        floorId: f.id,
        type: fu.type,
        x: mm(fu.x),
        y: mm(fu.z),
        w: mm(fu.w),
        d: mm(fu.d),
        h: mm(fu.h),
        rotation: Number(fu.rotation) || 0,
        mountY: fu.mount_y == null ? null : mm(fu.mount_y),
        name: fu.name || '',
        entityId: fu.entity || '',
      });
    });

    // placements → bindings：按坐标落在哪个房间里判断归属
    (f.placements || []).forEach((p) => {
      const room = (f.rooms || []).find((r) => pointInPolygon([p.x, p.z], r.points || []));
      plan.bindings.push({
        id: uid('bd'),
        roomId: room ? room.id : (f.rooms || [])[0]?.id || '',
        entityId: p.entity_id,
        kind: kindOfEntity(p.entity_id),
        name: p.name || '',
      });
    });
  });

  return normalizePlan(plan);
}

/**
 * 旧版编辑器保存时用：把 plan 转回 Building，但**保留 Building 里 plan 表达不了的字段**。
 * 不这么做的话，在旧版里随手改一下再保存，屋顶/室外/能源那些就被抹掉了。
 */
export function mergePlanIntoBuilding(plan, building) {
  const converted = planToBuilding(plan);
  const base = building || emptyBuilding();

  const out = {
    ...converted,
    settings: {
      ...base.settings,
      ...converted.settings,
      // 这几项 plan 管不到，保留原值
      roof: base.settings?.roof,
      menu_style: base.settings?.menu_style,
      lock_plan: base.settings?.lock_plan,
    },
    energy: base.energy,
    presence: base.presence,
  };

  out.floors = converted.floors.map((f) => {
    const old = (base.floors || []).find((x) => x.id === f.id) || {};
    return {
      ...f,
      // plan 表达不了的整块内容，原样保留
      roof: old.roof,
      outdoor: old.outdoor ?? [],
      background: old.background ?? null,
      ha_floor: old.ha_floor ?? null,
      cut_height: old.cut_height ?? f.cut_height,
      // placements 上 plan 管不到的字段（视场角/俯仰/图标…）按实体 id 对回去
      placements: (f.placements || []).map((p) => {
        const prev = (old.placements || []).find((q) => q.entity_id === p.entity_id);
        if (!prev) return p;
        return {
          ...p,
          fov: prev.fov,
          reach: prev.reach,
          tilt: prev.tilt,
          confirm: prev.confirm,
          marker: prev.marker,
          icon: prev.icon,
          show_name: prev.show_name,
          cone: prev.cone ?? p.cone,
        };
      }),
    };
  });

  return normalizeBuilding(out);
}

// ---------------------------------------------------------------- 设备标记

const ICON = {
  light: mdiLightbulbOutline,
  lightOn: mdiLightbulbOn,
  switch: mdiToggleSwitchOutline,
  cover: mdiWindowShutter,
  sensor: mdiThermometer,
  camera: mdiCctv,
};

/** 把 MDI 的 path 包成参考项目期望的内联 SVG（它按 fill 画，所以用 fill="currentColor"） */
function iconSvg(pathData) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${pathData}"/></svg>`;
}

const isOn = (st) => !!st && (st.state === 'on' || st.state === 'open' || st.state === 'playing');

/** 实体状态 → 标记上的短文案 */
function stateText(binding, st) {
  if (!st) return '—';
  if (binding.kind === 'sensor') {
    const v = st.state;
    const unit = (st.attributes && st.attributes.unit_of_measurement) || '';
    return unit ? `${v} ${unit}` : String(v);
  }
  if (st.state === 'unavailable') return '离线';
  if (st.state === 'unknown') return '未知';
  return isOn(st) ? '开' : '关';
}

function glowOf(binding, st) {
  if (binding.kind !== 'light' || !isOn(st)) return null;
  const rgb = st && st.attributes && st.attributes.rgb_color;
  const color = Array.isArray(rgb) && rgb.length >= 3 ? [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255] : [1, 0.78, 0.42];
  return { color, level: 1 };
}

/**
 * 绑定 → 3D 里的设备标记
 * @param {object} plan         户型文档
 * @param {object} entityStates { [entityId]: { state, attributes } }
 */
export function planToDevices(plan, entityStates) {
  const states = entityStates || {};
  const rooms = (plan && plan.rooms) || [];
  const out = [];

  (plan && plan.bindings ? plan.bindings : []).forEach((bd) => {
    if (!bd.entityId) return;
    const room = rooms.find((r) => r.id === bd.roomId);
    if (!room) return;
    const [cx, cy] = polygonCentroid(getRoomPolygon(room));
    const st = states[bd.entityId];
    const kind = bd.kind || 'light';
    const on = isOn(st);
    const icon = kind === 'light' && on ? ICON.lightOn : ICON[kind] || ICON.switch;

    out.push({
      id: bd.entityId,
      floorId: room.floorId,
      roomId: room.id,
      x: m(cx),
      z: m(cy),
      // 摄像头挂高一点，其余贴地放
      y: kind === 'camera' ? 2.2 : 0,
      icon: iconSvg(icon),
      name: (st && st.attributes && st.attributes.friendly_name) || bd.entityId,
      text: stateText(bd, st),
      active: on,
      unavailable: !st || st.state === 'unavailable',
      glow: glowOf(bd, st),
      // 灯在 3D 里画成真正的灯（吊灯），点它就能开关
      lamp: kind === 'light' ? 'ceiling' : null,
      model: kind === 'camera' ? 'camera_wall' : undefined,
      cone: kind === 'camera' ? true : undefined,
      pickable: true,
      showName: true,
    });
  });

  return out;
}

/**
 * 完整 Building + 实体状态 → 3D 设备标记。
 * 新版文档里不再依赖旧 plan.bindings：设备位置来自 floor.placements，
 * 灯具/带实体的家具位置来自 floor.furniture。
 */
export function buildingToDevices(building, entityStates) {
  const states = entityStates || {};
  const out = [];
  const lampModel = {
    lamp_ceiling: 'ceiling',
    lamp_downlight: 'downlight',
    lamp_spot: 'spot',
    lamp_panel: 'panel',
    lamp_pendant: 'pendant',
    lamp_floor: 'floor',
    lamp_table: 'table',
    lamp_wall: 'wall',
    lamp_uplight: 'uplight',
    lamp_bollard: 'bollard',
    lamp_garden: 'garden',
    led_strip: 'strip',
    fan_ceiling: 'fan',
    fan_ceiling_light: 'fan',
  };

  (building && building.floors ? building.floors : []).forEach((floor) => {
    const rooms = floor.rooms || [];
    const roomFor = (x, z) => rooms.find((r) => pointInPolygon([x, z], r.points || [])) || rooms[0] || null;
    const add = ({ id, x, z, y = 0, room, furnitureId = null, lamp = null, rotation = 0, model = null, cone = true }) => {
      if (!id) return;
      const st = states[id];
      const kind = kindOfEntity(id);
      const on = isOn(st);
      const icon = kind === 'light' && on ? ICON.lightOn : ICON[kind] || ICON.switch;
      out.push({
        id,
        floorId: floor.id,
        roomId: room ? room.id : null,
        x,
        z,
        y,
        rotation,
        icon: iconSvg(icon),
        name: (st && st.attributes && st.attributes.friendly_name) || id,
        text: stateText({ kind }, st),
        active: on,
        unavailable: !st || st.state === 'unavailable',
        glow: glowOf({ kind }, st),
        lamp,
        model,
        cone: model === 'camera_wall' ? cone : undefined,
        pickable: true,
        showName: true,
        ...(furnitureId ? { furnitureId } : {}),
      });
    };

    // 普通设备点位（非灯；normalizeBuilding 会把旧版的灯点位升级成灯具家具）
    (floor.placements || []).forEach((p) => {
      const kind = kindOfEntity(p.entity_id);
      const room = roomFor(p.x, p.z);
      add({
        id: p.entity_id,
        x: p.x,
        z: p.z,
        y: p.y == null ? (kind === 'camera' ? 2.2 : 0) : p.y,
        room,
        rotation: p.rotation || 0,
        model: kind === 'camera' ? 'camera_wall' : null,
        cone: p.cone !== false,
      });
    });

    // 带实体的家具（含 normalizeBuilding 自动生成的灯具家具）
    (floor.furniture || []).forEach((f) => {
      if (!f.entity) return;
      const kind = kindOfEntity(f.entity);
      const room = roomFor(f.x, f.z);
      add({
        id: f.entity,
        x: f.x,
        z: f.z,
        y: f.mount_y || 0,
        room,
        furnitureId: f.id,
        lamp: lampModel[f.type] || null,
        rotation: f.rotation || 0,
        model: kind === 'camera' || f.type === 'security_camera' ? 'camera_wall' : null,
      });
    });
  });

  return out;
}
