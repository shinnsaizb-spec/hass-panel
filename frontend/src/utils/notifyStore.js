import { create } from 'zustand';
import { notifyApi } from './api';

// 全局只维持一条 SSE 连接：弹窗（NotificationPopup）和历史卡片（NotifyHistoryCard）
// 都从这里取数据，避免开两条连接、收到重复消息。
let _es = null;
let _started = false;

export const useNotifyStore = create((set, get) => ({
  toasts: [], // 弹窗用的实时消息（临时，会按配置时长自动消失）
  items: [], // 历史列表（含未读状态）
  unread: 0,
  total: 0,
  loading: false,
  connected: false,
  token: '', // webhook token，图片代理要用

  /** 建立 SSE 连接（幂等，重复调用只连一次）。 */
  ensureStream: () => {
    if (_started || typeof window === 'undefined') return;
    _started = true;
    try {
      _es = new EventSource('./api/notify/stream');
      _es.addEventListener('ready', () => set({ connected: true }));
      _es.addEventListener('message', (e) => {
        let data;
        try {
          data = JSON.parse(e.data);
        } catch (_) {
          return;
        }
        const id = data.id || `${Date.now()}-${Math.random()}`;
        const toastKey = `${id}-${Date.now()}`;
        const item = { ...data, id, read: false };
        set((s) => ({
          toasts: [...s.toasts, { ...item, _toastKey: toastKey, _at: Date.now() }],
          items: [item, ...s.items].slice(0, 200),
          unread: s.unread + 1,
          total: s.total + 1,
        }));
      });
      _es.onerror = () => set({ connected: false });
    } catch (_) {
      _started = false;
    }
  },

  removeToast: (toastKey) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t._toastKey !== toastKey) })),

  /** 拉取历史列表（分页）。limit=每页条数，offset=起始位置。 */
  refresh: async (type = 'all', limit = 100, offset = 0) => {
    set({ loading: true });
    try {
      const res = await notifyApi.getHistory(type, limit, offset);
      if (res && res.code === 200 && res.data) {
        set({
          items: res.data.items || [],
          unread: res.data.unread || 0,
          total: res.data.total || 0,
        });
      }
    } catch (_) {
      /* 未登录/网络异常时保持现状 */
    } finally {
      set({ loading: false });
    }
  },

  /** 取 webhook token（图片代理用），只取一次并缓存。 */
  loadToken: async () => {
    if (get().token) return get().token;
    try {
      const res = await notifyApi.getInfo();
      if (res && res.code === 200 && res.data) {
        set({ token: res.data.token || '' });
        return res.data.token || '';
      }
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  markRead: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (!target || target.read) return;
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
      unread: Math.max(0, s.unread - 1),
    }));
    try {
      await notifyApi.markRead({ id });
    } catch (_) {
      /* ignore */
    }
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })), unread: 0 }));
    try {
      await notifyApi.markRead({ all: true });
    } catch (_) {
      /* ignore */
    }
  },

  remove: async (id) => {
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
    }));
    try {
      await notifyApi.removeMessage(id);
    } catch (_) {
      /* ignore */
    }
  },

  clear: async (type = 'all') => {
    set({ items: [], unread: 0, total: 0 });
    try {
      await notifyApi.clear(type);
    } catch (_) {
      /* ignore */
    }
  },
}));
