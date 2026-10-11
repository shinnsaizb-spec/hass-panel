// ==============================================================================
// 给新版编辑器拼一个「HA 前端那一套」的 hass 对象
// ------------------------------------------------------------------------------
// 上游编辑器（`<fp3d-editor>`）只认 HA 前端里的那个 `hass` 对象，它读这些字段：
//
//   states    { entity_id: { state, attributes, last_changed, last_updated } }
//   language  'zh-Hans' 这种
//   entities  { entity_id: <实体注册表条目> }      ← 按 id 索引的**对象**，不是数组
//   areas     { area_id:   <区域> }
//   devices   { device_id: <设备> }
//   floors    { floor_id:  <楼层> }
//   user      { is_admin }                        ← 决定能不能编辑
//   callService(domain, service, data)            ← **位置参数**（HA 原生签名）
//   callWS(message)
//
// ⚠️ hakit **不直接提供**这个对象，但它 zustand store 里存着原始 WS 连接（`connection`）、
//    `config` 和 `entities`。四个注册表要用 `connection.sendMessagePromise` 走 WS 命令自己取：
//      config/entity_registry/list · config/area_registry/list
//      config/device_registry/list · config/floor_registry/list
//    home-assistant-js-websocket 本身**没有**这些辅助函数（查过了），只能发原始消息。
//
// ⚠️ 注册表拉下来后**按 id 建成对象**再给编辑器 —— 它写的是 `hass.areas?.[areaId]?.name`，
//    给数组会全部读不到（表现：实体选择器里没有区域分组、设备归属为空）。
//
// ⚠️ `callWS` 是**分派器**，不是直通：编辑器的「历史版本 / 完整备份 / 图片」走的是
//    上游 HA 自定义组件的命令（`neonplan3d/xxx`），我们没搬那个组件，
//    所以这类消息要拦下来转给我们自己的 REST 接口（见 `editorBackend.js`），
//    其余（HA 原生命令）才真正发给 HA 连接。
// ==============================================================================

import React from 'react';
import { useHass } from '@hakit/core';
import { handleEditorWS, isEditorWS } from './editorBackend';

/** 注册表缓存：同一个 connection 只拉一次（实体注册表在大户型上可能几百 KB） */
const registryCache = new WeakMap();

async function fetchRegistries(connection) {
  if (!connection) return { entities: {}, areas: {}, devices: {}, floors: {} };
  const cached = registryCache.get(connection);
  if (cached) return cached;

  const list = async (type) => {
    try {
      const r = await connection.sendMessagePromise({ type });
      return Array.isArray(r) ? r : [];
    } catch (e) {
      // 老版本 HA 可能没有某个注册表；缺了就当空，不要让整个编辑器挂掉
      console.warn('[useEditorHass] 取注册表失败:', type, e && e.message);
      return [];
    }
  };

  const [entities, areas, devices, floors] = await Promise.all([
    list('config/entity_registry/list'),
    list('config/area_registry/list'),
    list('config/device_registry/list'),
    list('config/floor_registry/list'),
  ]);

  const byId = (arr, key) => {
    const out = {};
    for (const item of arr) if (item && item[key] != null) out[item[key]] = item;
    return out;
  };

  const result = {
    entities: byId(entities, 'entity_id'),
    areas: byId(areas, 'area_id'),
    devices: byId(devices, 'id'),
    floors: byId(floors, 'floor_id'),
  };
  registryCache.set(connection, result);
  return result;
}

const EMPTY = { entities: {}, areas: {}, devices: {}, floors: {} };

/**
 * @param {object} options 给 `editorBackend` 用的回调（都可选）：
 *   - getBuilding()            当前编辑中的 Building（导出/快照用）
 *   - getLegacyMeta()          旧格式元数据（保存时随包络带上）
 *   - onDocumentRestored(doc)  历史版本还原后刷新页面
 *   - onExternalReplace()      文档即将被外部替换（导入备份），页面别标成未保存
 */
export default function useEditorHass(options = {}) {
  const { useStore, callService, getAllEntities } = useHass();
  const connection = useStore((s) => s.connection);
  const config = useStore((s) => s.config);
  // getAllEntities() 返回的就是 { entity_id: { state, attributes, ... } }，正好是 hass.states 要的形状
  const states = getAllEntities ? getAllEntities() : null;

  const [reg, setReg] = React.useState(EMPTY);

  // 回调放 ref：它们每次渲染都是新函数，不能让它们参与下面 useMemo 的依赖
  // （否则 hass 对象每次渲染都变，编辑器会被反复赋值）。
  const optionsRef = React.useRef(options);
  React.useEffect(() => {
    optionsRef.current = options;
  });

  React.useEffect(() => {
    if (!connection) return undefined;
    let cancelled = false;
    fetchRegistries(connection).then((r) => {
      if (!cancelled) setReg(r);
    });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return React.useMemo(
    () => ({
      // ⚠️ 界面固定走中文（用户明确要求）。要跟随 HA 语言就改成 `config?.language ?? navigator.language`，
      //    但注意上游 i18n 只内置德/英 + 我们补的中文，其它语言会回落英文。
      language: 'zh-Hans',
      states: states || {},
      entities: reg.entities,
      areas: reg.areas,
      devices: reg.devices,
      floors: reg.floors,
      config: config || null,
      // 面板自己的登录就是门槛，这里一律给管理员权限（编辑器里 isAdmin 默认也是 true）
      user: { is_admin: true },
      // HA 原生签名是**位置参数**：callService(domain, service, data)；
      // hakit 收的是对象、而且 entity_id 要放 target 里 —— 这里做一次转换。
      callService: (domain, service, data) => {
        const d = data && typeof data === 'object' ? { ...data } : {};
        const entityId = d.entity_id;
        delete d.entity_id;
        return callService({
          domain,
          service,
          serviceData: d,
          ...(entityId ? { target: { entity_id: entityId } } : {}),
        });
      },
      // 分派：`neonplan3d/*` 是我们自己的后端（历史版本/备份/图片），其余才发给 HA。
      callWS: (msg) => {
        if (isEditorWS(msg)) return handleEditorWS(msg, optionsRef.current);
        return connection ? connection.sendMessagePromise(msg) : Promise.resolve({});
      },
    }),
    [states, reg, config, connection, callService]
  );
}
