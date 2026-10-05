// ==============================================================================
// 插件加载器（运行时）
// ------------------------------------------------------------------------------
// 1. 启动后从 /api/plugins 拉取插件清单；
// 2. 对每个插件做 import(entryUrl) —— 这是运行时 URL，用 webpackIgnore 跳过编译期打包；
// 3. 插件包默认导出一个 React 组件（卡片），按 manifest.cardType 注册进 registry；
// 4. 同时把插件的展示元数据（name/icon/configFields/默认高度）记下来，供配置页/首页合并。
// ==============================================================================

import { registerCard } from '../cards/registry';

const PLUGIN_API = '/api/plugins';

const loaded = new Set();

// 插件展示元数据的运行时代码缓存（配置页/首页读取）
let pluginCards = [];

function setPluginCards(list) {
  pluginCards = (list || []).map((p) => ({
    cardType: p.cardType,
    name: p.name,
    icon: p.icon || 'mdiHelpCircle',
    group: p.group || 'plugin',
    defaultHeight: p.defaultHeight || 300,
    configFields: p.configFields || [],
  }));
  // 挂到 window 方便其它模块（配置页）同步读取，并广播事件触发重渲染
  if (typeof window !== 'undefined') {
    window.__HASS_PANEL_PLUGIN_CARDS__ = pluginCards;
    window.dispatchEvent(new Event('hasspanel:plugins-loaded'));
  }
}

/** 插件卡片目录（供配置页 add-card 列表合并）。 */
export function getPluginCardCatalog() {
  if (typeof window !== 'undefined' && window.__HASS_PANEL_PLUGIN_CARDS__) {
    return window.__HASS_PANEL_PLUGIN_CARDS__;
  }
  return pluginCards;
}

/** 插件卡片默认高度（供首页 cardHeights 合并）。 */
export function getPluginCardHeights() {
  const h = {};
  getPluginCardCatalog().forEach((c) => {
    h[c.cardType] = c.defaultHeight;
  });
  return h;
}

/** 启动加载所有插件。幂等，重复调用不会重复注册。 */
export async function loadPlugins() {
  try {
    // no-store：避免浏览器缓存旧的插件清单（entry 地址可能已变化）
    const res = await fetch(PLUGIN_API, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) {
      console.warn('[plugins] 获取插件列表失败：', res.status);
      return;
    }
    const data = await res.json();
    const plugins = data.plugins || [];
    setPluginCards(plugins);

    for (const p of plugins) {
      if (loaded.has(p.id)) continue;
      try {
        // webpackIgnore: 这是运行时 URL，绝不能让 webpack 在编译期尝试打包它
        const mod = await import(/* webpackIgnore: true */ p.entry);
        const Component = mod && mod.default;
        if (Component) {
          registerCard(p.cardType, Component);
          loaded.add(p.id);
          console.log(`[plugins] 已加载插件卡片：${p.cardType}（${p.name}）`);
        } else {
          console.warn(`[plugins] 插件 ${p.id} 未导出默认组件，跳过注册`);
        }
      } catch (e) {
        console.error(`[plugins] 加载插件 ${p.id} 失败：`, e);
      }
    }
  } catch (e) {
    console.warn('[plugins] 加载插件过程出错：', e);
  }
}
