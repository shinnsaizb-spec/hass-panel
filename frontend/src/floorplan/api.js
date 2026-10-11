import { axiosInstance } from '../utils/api';
import { normalizePlan } from './model';
import { emptyBuilding, normalizeBuilding } from '../neonplan3d/model.js';
import { buildingToPlan, planToBuilding } from '../floorplan3d/adapter';

// ============================================================================
// 户型图文档的读写（后端 /api/floorplan）
// ----------------------------------------------------------------------------
// 后端只负责把 `plan` 当 JSON 原样存起来（保存前自动备份），不限制里面的结构。
// 这里定义格式：
//
//   老格式（向后兼容）= 本项目毫米制扁平 plan，version 1/2
//   新格式 = { format: "neonplan3d-building-v1", building: <neonplan3d Building，米制> }
//
// 保存新版时先落盘一个**完整 Building**（屋顶/室外/能源/家具规则等都能保存），
// 旧编辑器和旧卡片通过 buildingToPlan() 取一个**仅用于显示的投影**；
// 旧编辑器保存时则 mergePlanIntoBuilding() 把 Building 独有字段保回来。
// ============================================================================

export const BUILDING_DOCUMENT_FORMAT = 'neonplan3d-building-v1';

function unwrap(resp) {
  const body = resp && resp.data;
  if (!body || body.code !== 200) {
    const msg = (body && (body.error || body.message)) || '请求失败';
    throw new Error(msg);
  }
  return body.data;
}

/** 后端返回的原始文档（可为旧 plan 或新版 Building envelope）。 */
export function isBuildingDocument(doc) {
  return !!(
    doc &&
    typeof doc === 'object' &&
    doc.format === BUILDING_DOCUMENT_FORMAT &&
    doc.building &&
    typeof doc.building === 'object'
  );
}

/** raw document → Building。旧格式会自动迁移到 Building，但不立刻写回后端。 */
export function documentToBuilding(doc) {
  if (isBuildingDocument(doc)) {
    // normalizeBuilding 会原地补字段，所以先深拷贝，不要改 API 缓存/调用方手里的对象。
    return normalizeBuilding(JSON.parse(JSON.stringify(doc.building)));
  }
  if (!doc || typeof doc !== 'object') return emptyBuilding();
  return planToBuilding(normalizePlan(doc));
}

/** raw document → 本项目旧编辑器能显示的毫米制 plan（有损投影，只能用于显示）。 */
export function documentToPlan(doc) {
  if (!isBuildingDocument(doc)) return normalizePlan(doc);
  const plan = buildingToPlan(documentToBuilding(doc));
  // 这些旧格式的全局字段在 Building 中没有一一对应项；放在 envelope.legacyMeta 里保留，
  // 这样老编辑器仍能看到底图、网格和名字。新编辑器保存时会继续带着这份元数据。
  const meta = doc.legacyMeta || {};
  return {
    ...plan,
    ...(typeof meta.name === 'string' ? { name: meta.name } : {}),
    ...(Number.isFinite(Number(meta.gridSize)) ? { gridSize: Number(meta.gridSize) } : {}),
    ...(meta.background !== undefined ? { background: meta.background } : {}),
  };
}

/** 当前旧 plan 中没有对应模型的全局字段，作为向后兼容元数据单独留存。 */
export function legacyMetaFromPlan(plan) {
  return {
    name: plan && typeof plan.name === 'string' ? plan.name : '',
    gridSize: Number(plan && plan.gridSize) || 100,
    background: plan ? plan.background ?? null : null,
  };
}

/** 装进显式格式 envelope，避免和旧版 plan.version 混淆。 */
export function buildingDocument(building, legacyMeta = null) {
  return {
    format: BUILDING_DOCUMENT_FORMAT,
    building: normalizeBuilding(JSON.parse(JSON.stringify(building || emptyBuilding()))),
    ...(legacyMeta ? { legacyMeta: JSON.parse(JSON.stringify(legacyMeta)) } : {}),
  };
}

export const floorplanApi = {
  /** 读原始户型文档（旧 plan 或 Building envelope）。 */
  async loadDocument() {
    const data = unwrap(await axiosInstance.get('/floorplan'));
    return (data && data.plan) || null;
  },

  /** 旧编辑器 / 旧 3D 卡片：读并转换成毫米制 plan 投影。 */
  async load() {
    return documentToPlan(await this.loadDocument());
  },

  /** 新编辑器 / 新 3D 卡片：读并转换成完整 Building。 */
  async loadBuilding() {
    return documentToBuilding(await this.loadDocument());
  },

  /** 整份保存旧 plan（仅供旧接口兼容；新版统一保存 Building envelope）。 */
  async save(plan) {
    const data = unwrap(await axiosInstance.put('/floorplan', { plan }));
    return data;
  },

  /** 整份保存新版 Building；后端会在覆盖前自动创建历史版本。 */
  async saveBuilding(building, legacyMeta = null) {
    const data = unwrap(await axiosInstance.put('/floorplan', { plan: buildingDocument(building, legacyMeta) }));
    return data;
  },

  /** 历史版本列表 */
  async listBackups() {
    const data = unwrap(await axiosInstance.get('/floorplan/backups'));
    return (data && data.items) || [];
  },

  /**
   * 读某份历史版本的**原始文档**。
   * 新版编辑器要在还原点列表里显示「几个房间 / 几件家具」，而房间数的算法在
   * 旧 plan 和 Building 包络两种格式下不一样 —— 所以拿原始文档，用适配器去数。
   */
  async loadBackupDocument(name) {
    const data = unwrap(await axiosInstance.get(`/floorplan/backups/${encodeURIComponent(name)}`));
    return (data && data.plan) || null;
  },

  /** 恢复某个历史版本，返回原始文档；让调用方保留完整 Building。 */
  async restoreDocument(name) {
    const data = unwrap(
      await axiosInstance.post(`/floorplan/backups/${encodeURIComponent(name)}/restore`)
    );
    return (data && data.plan) || null;
  },

  /** 旧调用方兼容：恢复后给一个毫米制 plan 投影。 */
  async restore(name) {
    return documentToPlan(await this.restoreDocument(name));
  },

  // ---------- 图片（新版编辑器的底图 / 家具屏显图）----------
  // 对应上游 HA 侧的 `neonplan3d/image/get|set`。内容就是 dataURL 原文。
  async getImage(imageId) {
    const data = unwrap(await axiosInstance.get(`/floorplan/images/${encodeURIComponent(imageId)}`));
    return (data && data.data) || null;
  },

  async putImage(imageId, data) {
    const r = unwrap(
      await axiosInstance.put(`/floorplan/images/${encodeURIComponent(imageId)}`, { data })
    );
    return r;
  },

  async deleteImage(imageId) {
    return unwrap(await axiosInstance.delete(`/floorplan/images/${encodeURIComponent(imageId)}`));
  },
};
