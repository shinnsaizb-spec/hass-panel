// ==============================================================================
// 插件桥（Plugin Bridge）
// ------------------------------------------------------------------------------
// 前端是 CRA 静态构建，插件是「独立构建的 JS 包」，不能直接 import 宿主的依赖，
// 也拿不到 @hakit/core 的 React Context（HA 连接）。
//
// 解决办法：宿主在启动时把「共享能力」挂到 window.HassPanelBridge，
// 插件包构建时把 react / antd / @hakit/core / @mdi 等 remap 到这个全局对象，
// 运行时直接读。这样插件包体积更小，且能和宿主共用同一个 React 实例与 HA 连接。
//
// 注意：本文件必须在「加载插件」之前被 import（在 App.js 顶部以副作用方式引入）。
// ==============================================================================

import React from 'react';
import * as antd from 'antd';
import * as hakit from '@hakit/core';
import Icon from '@mdi/react';
import * as mdiJs from '@mdi/js';
import * as zustand from 'zustand';
import { registerCard, getCardComponent } from '../cards/registry';
import BaseCard from '../components/BaseCard';
import MarkdownView from '../components/MarkdownView';
import { useNotifyStore } from '../utils/notifyStore';
import { useLanguage } from '../i18n/LanguageContext';
import { notifyApi } from '../utils/api';

// 只设置一次
if (typeof window !== 'undefined' && !window.HassPanelBridge) {
  window.HassPanelBridge = {
    React,
    antd,
    hakit,
    Icon,
    mdiJs,
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

export const HassPanelBridge = (typeof window !== 'undefined' && window.HassPanelBridge) || {};
export default HassPanelBridge;
