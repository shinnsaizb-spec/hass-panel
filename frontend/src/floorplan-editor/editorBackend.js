// ==============================================================================
// 新版编辑器（neonplan3d 移植版）的后端适配
// ------------------------------------------------------------------------------
// 上游编辑器把「历史版本 / 完整备份 / 图片」全走 HA 自定义组件的 WebSocket 命令：
//
//     hass.callWS({ type: 'neonplan3d/history/list' })      等等
//
// 我们没搬那个自定义组件（后端是 FastAPI），而**编辑器的调用点改不了**
// （`src/neonplan3d/` 是 vendored，禁手改），所以在这里把 `neonplan3d/*` 这一族
// 命令**拦下来**，转成我们自己的 REST 接口（`floorplanApi`）。
//
// 调用方（`useEditorHass`）只把 `neonplan3d/` 前缀的消息送进来，其余照旧走 HA 连接。
//
// 几个语义对应关系（照着上游行为对齐的）：
//   history/snapshot  = 「留一个还原点」→ 后端每次保存前都会自动备份，所以直接落盘当前文档
//   history/restore   = 还原某份备份；**编辑器还原后不会自己换文档**，得由我们回调刷新页面
//   backup/export     = 整份备份文件（编辑器会再往里塞图片）；导出**当前编辑中的**文档而不是盘上的
//   backup/import     = 用备份文件覆盖；先落盘再让编辑器 setDoc（那条路径会派发 building-changed）
//   image/get|set     = 底图 / 家具屏显图，存后端文件（见 routers/floorplan.py）
//   packs/* · license/* = 上游的付费家具包体系，我们没搬 —— 给安全的空值/错误码
// ==============================================================================

import {
  floorplanApi,
  isBuildingDocument,
} from '../floorplan/api';

export const EDITOR_WS_PREFIX = 'neonplan3d/';

/** 这条 WS 消息是不是归我们处理（否则要转给真正的 HA 连接） */
export function isEditorWS(msg) {
  return !!msg && typeof msg.type === 'string' && msg.type.startsWith(EDITOR_WS_PREFIX);
}

/**
 * 数一份文档里有几个房间 / 几件家具（还原点列表要显示这个）。
 * 两种格式都要认：旧 plan 是扁平 `rooms[]` / `bindings[]`，新版是 Building 包络，
 * 家具散在每层的 `furniture[]`（自己摆的）和 `placements[]`（绑 HA 实体的）。
 */
export function countsOf(doc) {
  if (isBuildingDocument(doc)) {
    const b = doc.building || {};
    let rooms = 0;
    let furniture = 0;
    for (const f of b.floors || []) {
      rooms += (f.rooms || []).length;
      furniture += (f.furniture || []).length + (f.placements || []).length;
    }
    return { rooms, furniture };
  }
  const p = doc || {};
  return {
    rooms: (p.rooms || []).length,
    furniture: (p.furniture || []).length + (p.bindings || []).length,
  };
}

/** 造一个带 code 的错误（编辑器会读 `err.code` 决定提示哪句文案） */
function codedError(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

/**
 * 处理一条 `neonplan3d/*` 命令。
 * @param {{type: string}} msg 原始 WS 消息
 * @param {object} ctx 由页面注入：
 *   - getBuilding()        返回**当前编辑中**的 Building（导出/快照要用它，不能用盘上的旧版）
 *   - getLegacyMeta()      返回旧格式的 name/gridSize/background（保存时随包络一起带上）
 *   - onDocumentRestored(doc)  历史版本被还原后回调，让页面重新加载文档
 *   - onExternalReplace()  即将由外部（导入备份）替换文档，让页面别把它标成「未保存」
 */
export async function handleEditorWS(msg, ctx = {}) {
  const type = msg.type.slice(EDITOR_WS_PREFIX.length);
  const live = () => (ctx.getBuilding ? ctx.getBuilding() : null);
  const meta = () => (ctx.getLegacyMeta ? ctx.getLegacyMeta() : null);

  switch (type) {
    // ---------- 文档 ----------
    case 'building/get':
      return { building: await floorplanApi.loadBuilding() };

    case 'building/save':
      await floorplanApi.saveBuilding(msg.building, meta());
      return { revision: Date.now() };

    // ---------- 历史版本（后端 floorplan_backups 目录）----------
    case 'history/list': {
      const items = await floorplanApi.listBackups();
      const snapshots = await Promise.all(
        items.map(async (it) => {
          const at = Date.parse(it.mtime);
          let counts = { rooms: 0, furniture: 0 };
          try {
            counts = countsOf(await floorplanApi.loadBackupDocument(it.name));
          } catch (e) {
            // 单份读不出来（格式怪 / 文件坏）不该把整个列表拖垮
            console.warn('[editorBackend] 读历史版本失败:', it.name, e && e.message);
          }
          return {
            id: it.name,
            // ⚠️ 编辑器是 `new Date(snap.saved_at * 1000)`，必须是 **Unix 秒**
            saved_at: Number.isFinite(at) ? Math.floor(at / 1000) : Math.floor(Date.now() / 1000),
            ...counts,
          };
        })
      );
      return { snapshots };
    }

    case 'history/snapshot': {
      // 「存一个还原点」：后端保存前会自动把旧版留一份，所以这里直接把当前文档落盘
      const b = live();
      if (b) await floorplanApi.saveBuilding(b, meta());
      return { revision: Date.now() };
    }

    case 'history/restore': {
      const doc = await floorplanApi.restoreDocument(msg.snapshot_id);
      // ⚠️ 编辑器还原后**只弹一句提示**，不会自己换文档（上游靠 subscribe 推送）。
      //    所以必须由我们把新文档推回页面，否则界面还是旧的、直到手动刷新。
      if (doc && ctx.onDocumentRestored) ctx.onDocumentRestored(doc);
      return { revision: Date.now() };
    }

    // ---------- 完整备份（整份导出 / 导入）----------
    case 'backup/export':
      return {
        format: 'neonplan3d-backup',
        version: 1,
        // 导出**当前编辑中的**文档：用户点导出时期待拿到眼前这份，而不是上次保存的那份
        building: live() || (await floorplanApi.loadBuilding()),
        // 我们没搬家具包体系，导出里没有包
        packs: [],
      };

    case 'backup/import': {
      await floorplanApi.saveBuilding(msg.building, meta());
      // ⚠️ 顺序要紧：编辑器拿到返回值后才会 setDoc 并派发 building-changed。
      //    先挂上「这次不算未保存」的标记，页面那边消费掉，才不会刚导入就提示未保存。
      if (ctx.onExternalReplace) ctx.onExternalReplace();
      return { building: msg.building, packs: 0, skipped: [] };
    }

    // ---------- 图片（底图 / 家具屏显图）----------
    case 'image/get': {
      const data = await floorplanApi.getImage(msg.image_id);
      if (!data) throw new Error('image not found');
      return { data };
    }

    case 'image/set':
      await floorplanApi.putImage(msg.image_id, msg.data);
      return {};

    case 'image/remove':
      await floorplanApi.deleteImage(msg.image_id);
      return {};

    // ---------- 家具包 / 授权：上游的付费体系，我们没搬 ----------
    case 'packs/list':
      return { packs: [] };
    case 'packs/import':
      throw codedError('bad_signature', '本项目没有家具包体系');
    case 'packs/remove':
    case 'packs/install':
      return {};
    case 'license/get':
      return { packs: [], key: null, activated: false };
    case 'license/activate':
      throw codedError('invalid_key', '本项目没有授权体系');
    case 'license/remove':
    case 'license/refresh':
      return {};

    default:
      // 未知的 neonplan3d/* 一律回空对象：宁可某个功能静默失效，也别让编辑器抛错把界面搞崩
      console.warn('[editorBackend] 未处理的命令:', msg.type);
      return {};
  }
}
