// ==============================================================================
// 插件桥（Plugin Bridge）
// ------------------------------------------------------------------------------
// 前端是 CRA 静态构建，插件是「独立构建的 JS 包」，不能直接 import 宿主的依赖，
// 也拿不到 @hakit/core 的 React Context（HA 连接）。
//
// 解决办法：宿主把「共享能力」挂到 window.HassPanelBridge，
// 插件包构建时把 react / antd / @hakit/core / @mdi 等 remap 到这个全局对象，
// 运行时直接读。这样插件包体积更小，且能和宿主共用同一个 React 实例与 HA 连接。
//
// ⚠️ 用法：调用方（plugin/loader.js 的 loadPlugins）必须**先 await initBridge()**，
//    再加载任何插件 bundle —— 插件在模块求值时就会读 window.HassPanelBridge。
//    （原来靠 App.js 顶部 `import './plugin/bridge'` 的副作用，见下面 mdiJs 的说明，
//      那种写法会把整包拖进首屏主包。）
// ==============================================================================

import React from 'react';
import * as antd from 'antd';
import * as hakit from '@hakit/core';
import Icon from '@mdi/react';
import * as zustand from 'zustand';
import { registerCard, getCardComponent } from '../cards/registry';
import BaseCard from '../components/BaseCard';
import MarkdownView from '../components/MarkdownView';
import { useNotifyStore } from '../utils/notifyStore';
import { useLanguage } from '../i18n/LanguageContext';
import { notifyApi } from '../utils/api';
import loadAllMdi from './mdi-full';

// ⚠️ 这里**不能**写 `import * as mdiJs from '@mdi/js'`：
//    命名空间导入无法 tree-shake（需要全部导出），而 @mdi/js 是 6.3MB / 约 7000 个图标
//    的整包；插件桥又和主包共享这个模块，webpack 会把整包留在 **main** 里
//    （实测主包 6.1MB，其中主要就是它）。
//    改成动态加载：只在「确实要加载插件」时引入，没装插件的用户完全不付这份体积。
let _mdiJs = null;

function buildBridge() {
  return {
    React,
    antd,
    hakit,
    Icon,
    mdiJs: _mdiJs,
    zustand,
    registerCard,
    getCardComponent,
    BaseCard,
    // 常用宿主能力：方便插件复用（如消息通知卡片插件复用通知 store 与 Markdown 渲染）
    MarkdownView,
    useNotifyStore,
    useLanguage,
    notifyApi,
    // 插件 SDK 的默认导出就是整个 bridge
    version: 2,
  };
}

/**
 * 建立插件桥（幂等，异步）。
 * 加载插件之前必须 await 一次，否则插件拿不到 window.HassPanelBridge。
 */
export async function initBridge() {
  if (!_mdiJs) {
    _mdiJs = await loadAllMdi();
  }
  if (typeof window !== 'undefined' && !window.HassPanelBridge) {
    window.HassPanelBridge = buildBridge();
  }
  return (typeof window !== 'undefined' && window.HassPanelBridge) || {};
}

// 兼容旧引用：模块被静态 import 时（如某些测试/工具代码）拿到的是惰性对象，
// 真正要用请走 initBridge()。
export const HassPanelBridge = (typeof window !== 'undefined' && window.HassPanelBridge) || {};
export default HassPanelBridge;
