// hp-bridge:react
var B = window.HassPanelBridge.React;
var __ns = new Proxy({}, { get: (_, p) => B ? B[p] : void 0 });
var react_default = __ns;

// hp-bridge:@hakit/core
var B2 = window.HassPanelBridge.hakit;
var __ns2 = new Proxy({}, { get: (_, p) => B2 ? B2[p] : void 0 });
var useEntity = (...a) => window.HassPanelBridge.hakit && window.HassPanelBridge.hakit["useEntity"] ? window.HassPanelBridge.hakit["useEntity"](...a) : void 0;

// hp-bridge:hass-panel-sdk
var B3 = window.HassPanelBridge;
var React = B3.React;
var antd = B3.antd;
var hakit = B3.hakit;
var Icon = B3.Icon;
var mdiJs = B3.mdiJs;
var zustand = B3.zustand;
var registerCard = B3.registerCard;
var getCardComponent = B3.getCardComponent;
var BaseCard = B3.BaseCard;

// src/index.jsx
function EntityState({ entityId }) {
  const { entity } = useEntity(entityId);
  return /* @__PURE__ */ react_default.createElement("p", null, "\u5B9E\u4F53 ", /* @__PURE__ */ react_default.createElement("b", null, entityId), " \u5F53\u524D\u72B6\u6001\uFF1A", entity ? entity.state : "\u52A0\u8F7D\u4E2D\u2026");
}
function DemoPluginCard({ config }) {
  const cfg = config || {};
  const entityId = cfg.entity_id || "";
  const title = cfg.title || "\u793A\u4F8B\u63D2\u4EF6\u5361\u7247";
  return /* @__PURE__ */ react_default.createElement(BaseCard, { title }, /* @__PURE__ */ react_default.createElement("div", { style: { padding: 12, color: "var(--color-text-primary)" } }, /* @__PURE__ */ react_default.createElement("p", null, "\u2705 \u8FD9\u5F20\u5361\u7247\u662F\u901A\u8FC7\u300C\u63D2\u4EF6\u673A\u5236\u300D\u8FD0\u884C\u65F6\u52A0\u8F7D\u7684\u3002"), entityId ? /* @__PURE__ */ react_default.createElement(EntityState, { entityId }) : /* @__PURE__ */ react_default.createElement("p", null, "\u5728\u5361\u7247\u914D\u7F6E\u91CC\u586B\u4E00\u4E2A ", /* @__PURE__ */ react_default.createElement("b", null, "entity_id"), " \u5C31\u80FD\u8BFB\u53D6 HA \u5B9E\u4F53\u72B6\u6001\u3002")));
}
export {
  DemoPluginCard as default
};
