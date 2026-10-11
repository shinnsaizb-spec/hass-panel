// ==============================================================================
// 户型图编辑器（React 封装）
// ------------------------------------------------------------------------------
// 引擎/编辑器来自 neonplan3d（MIT，https://github.com/PATCoder97/neonplan3d），
// 源码已按依赖闭包移植到 `frontend/src/neonplan3d/`（纯 JS）。
//
// 上游的编辑器是一个 **Lit 自定义元素** `<fp3d-editor>`，对外只有四个属性：
//   hass     —— HA 前端对象（states / entities / areas / devices / callService / callWS / language）
//   building —— 户型文档（**上游的 schema**，米制）
//   narrow   —— 窄屏（手机）布局
//   packs    —— 家具包
// 改动时它抛 `building-changed` 事件（detail.building 是新文档），**自己不负责存取** ——
// 持久化由外面（我们）负责。
//
// ⚠️ 两个自定义元素都要先注册才能用：
//   · `<fp3d-view3d>`（编辑器右侧的 3D 预览窗）—— 上游由主 bundle 注册，编辑器自己不引，
//     所以这里必须显式 import 一次。
//   · `<fp3d-editor>`（编辑器本体）
// 两者都走**动态 import**：加起来 1.5MB 多，不能塞进首屏包。
// ==============================================================================

import React from 'react';
import './style.css';

let modulesPromise = null;

/** 注册两个自定义元素（只做一次） */
function loadEditorModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('../neonplan3d/components/view3d.js'),
      import('../neonplan3d/components/editor.js'),
    ]);
  }
  return modulesPromise;
}

export default function FloorplanEditor({
  building,
  hass,
  narrow = false,
  packs = null,
  onBuildingChanged,
  className = '',
}) {
  const hostRef = React.useRef(null);
  const elRef = React.useRef(null);
  const cbRef = React.useRef(onBuildingChanged);
  const [failed, setFailed] = React.useState('');
  const [ready, setReady] = React.useState(false);

  // 最新的属性值放 ref：建元素时要**挂载前**就赋好值，但又不能让属性变化触发重建
  const propsRef = React.useRef({ building, hass, narrow, packs });
  React.useEffect(() => {
    propsRef.current = { building, hass, narrow, packs };
  }, [building, hass, narrow, packs]);

  React.useEffect(() => {
    cbRef.current = onBuildingChanged;
  }, [onBuildingChanged]);

  // 建元素（只做一次；两个模块异步到位后才建，因为要等自定义元素注册好）
  React.useEffect(() => {
    let cancelled = false;
    let el = null;
    let onChange = null;
    (async () => {
      try {
        await loadEditorModules();
      } catch (e) {
        if (!cancelled) setFailed(e && e.message ? e.message : '编辑器加载失败');
        return;
      }
      if (cancelled || !hostRef.current) return;
      el = document.createElement('fp3d-editor');
      // ⚠️ **必须在 appendChild 之前把属性赋好**：编辑器首帧就会读
      //    `this._doc3d.settings`，而 `_doc3d` 是它在生命周期里从 `building` 拷过来的。
      //    先挂载再赋值的话首帧 `_doc3d` 还是 undefined，直接抛
      //    「Cannot read properties of undefined (reading 'settings')」，
      //    整个模板渲染中断（连 3D 窗都不会出现）。（踩过）
      const p = propsRef.current;
      el.building = p.building;
      el.hass = p.hass;
      el.narrow = !!p.narrow;
      el.packs = p.packs;
      onChange = (e) => {
        if (cbRef.current) cbRef.current(e.detail && e.detail.building);
      };
      el.addEventListener('building-changed', onChange);
      hostRef.current.appendChild(el);
      elRef.current = el;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (el && onChange) el.removeEventListener('building-changed', onChange);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      elRef.current = null;
      setReady(false);
    };
  }, []);

  // ⚠️ 上游的属性全是 `attribute: false`，只能用**属性赋值**传，不能写 HTML attribute
  React.useEffect(() => {
    if (ready && elRef.current) elRef.current.building = building;
  }, [building, ready]);

  React.useEffect(() => {
    if (ready && elRef.current) elRef.current.hass = hass;
  }, [hass, ready]);

  React.useEffect(() => {
    if (ready && elRef.current) elRef.current.narrow = narrow;
  }, [narrow, ready]);

  React.useEffect(() => {
    if (ready && elRef.current) elRef.current.packs = packs;
  }, [packs, ready]);

  return (
    <div className={`fp-editor-host ${className}`}>
      <div ref={hostRef} className="fp-editor-mount" />
      {failed ? <div className="fp-editor-fail">编辑器加载失败：{failed}</div> : null}
      {!ready && !failed ? <div className="fp-editor-fail">正在加载编辑器…</div> : null}
    </div>
  );
}
