import { axiosInstance } from '../utils/api';
import { normalizePlan } from './model';

// ==============================================================================
// 户型图的读写（后端 /api/floorplan）
// ------------------------------------------------------------------------------
// ⚠️ 后端出错时也返回 HTTP 200，错误码只写在 body.code 里，所以统一在这里拆信封。
// ==============================================================================

function unwrap(resp) {
  const body = resp && resp.data;
  if (!body || body.code !== 200) {
    const msg = (body && (body.error || body.message)) || '请求失败';
    throw new Error(msg);
  }
  return body.data;
}

export const floorplanApi = {
  /** 读户型图（后端没有文件时会给一份空文档） */
  async load() {
    const data = unwrap(await axiosInstance.get('/floorplan'));
    return normalizePlan(data && data.plan);
  },

  /** 整份覆盖保存 */
  async save(plan) {
    const data = unwrap(await axiosInstance.put('/floorplan', { plan }));
    return data;
  },

  /** 历史版本列表 */
  async listBackups() {
    const data = unwrap(await axiosInstance.get('/floorplan/backups'));
    return (data && data.items) || [];
  },

  /** 恢复某个历史版本，返回恢复后的户型图 */
  async restore(name) {
    const data = unwrap(
      await axiosInstance.post(`/floorplan/backups/${encodeURIComponent(name)}/restore`)
    );
    return normalizePlan(data && data.plan);
  },
};
