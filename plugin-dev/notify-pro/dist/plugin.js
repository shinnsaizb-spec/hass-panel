// hp-bridge:hass-panel-sdk
var B = window.HassPanelBridge;
var React = B.React;
var antd = B.antd;
var hakit = B.hakit;
var Icon = B.Icon;
var mdiJs = B.mdiJs;
var zustand = B.zustand;
var registerCard = B.registerCard;
var getCardComponent = B.getCardComponent;
var BaseCard = B.BaseCard;
var MarkdownView = B.MarkdownView;
var useNotifyStore = B.useNotifyStore;
var useLanguage = B.useLanguage;
var notifyApi = B.notifyApi;

// notify-pro/src/index.jsx
var CSS = `
.npro-actions { display:flex; align-items:center; gap:6px; flex-wrap:nowrap; }
.npro-badge {
  min-width:20px; height:20px; padding:0 6px; border-radius:10px;
  background:var(--color-error,#ff4444); color:#fff; font-size:11px;
  font-weight:600; line-height:20px; text-align:center;
}
.npro-btn {
  width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center;
  padding:0; border:none; border-radius:8px; background:transparent;
  color:var(--color-text-secondary); cursor:pointer;
  transition:background .15s ease, color .15s ease;
}
.npro-btn:hover:not(:disabled) { background:rgba(127,127,127,.18); color:var(--color-text-primary); }
.npro-btn:disabled { opacity:.32; cursor:default; }
.npro-page {
  min-width:30px; text-align:center; font-size:11px; color:var(--color-text-secondary);
  font-variant-numeric:tabular-nums; user-select:none;
}
/* \u26A0\uFE0F \u7528 .base-card \u524D\u7F00 + !important\uFF0C\u538B\u8FC7\u4E3B\u9875\u7684 .base-card > div:not(.card-header){overflow:visible} */
.base-card .npro-body {
  flex:1 1 0; min-height:0; overflow:hidden !important; padding:6px;
  display:flex; flex-direction:column; gap:6px;
}
.npro-empty {
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:8px; color:var(--color-text-secondary); font-size:13px;
}
.npro-item {
  height:52px; flex:0 0 52px; box-sizing:border-box; position:relative;
  display:flex; align-items:center; gap:8px; width:100%; padding:0 10px;
  border:none; border-radius:8px; background:transparent; cursor:pointer;
  text-align:left; color:var(--color-text-primary);
  transition:background .15s ease; overflow:hidden;
}
.npro-item:hover { background:rgba(127,127,127,.14); }
.npro-item.is-unread { background:rgba(255,183,77,.14); }
.npro-dot {
  flex:0 0 8px; width:8px; height:8px; border-radius:50%;
  background:var(--color-text-light,#90a4ae);
}
.npro-item.npro-lv-info .npro-dot { background:#42a5f5; }
.npro-item.npro-lv-success .npro-dot { background:#66bb6a; }
.npro-item.npro-lv-warning .npro-dot { background:#ffa726; }
.npro-item.npro-lv-error .npro-dot { background:#ef5350; }
.npro-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px; }
.npro-title { font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.npro-excerpt { font-size:12px; color:var(--color-text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.npro-time { flex:0 0 auto; font-size:11px; color:var(--color-text-light,#90a4ae); }
.npro-modal-meta { display:flex; align-items:center; gap:10px; margin-bottom:12px; font-size:12px; color:var(--color-text-secondary); }
.npro-modal-level { padding:1px 8px; border-radius:999px; font-size:11px; background:rgba(127,127,127,.16); }
.npro-modal-level.npro-lv-success { color:#2e7d32; }
.npro-modal-level.npro-lv-warning { color:#ef6c00; }
.npro-modal-level.npro-lv-error { color:#c62828; }
.npro-modal-tag { padding:1px 8px; border-radius:999px; font-size:11px; background:rgba(255,183,77,.22); color:var(--color-text-primary); }
.npro-modal-del { margin-left:auto; }
`;
if (typeof document !== "undefined" && !document.getElementById("npro-style")) {
  const styleEl = document.createElement("style");
  styleEl.id = "npro-style";
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);
}
var LEVEL_CLASS = {
  info: "npro-lv-info",
  success: "npro-lv-success",
  warning: "npro-lv-warning",
  error: "npro-lv-error"
};
var ROW_H = 52;
var ROW_GAP = 6;
var BODY_PAD = 12;
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function stripMd(md) {
  return String(md || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "[\u56FE\u7247]").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*`_~]/g, "").replace(/\s+/g, " ").trim();
}
function NotifyHistoryCardPro({ config }) {
  const cfg = config || {};
  const { t } = useLanguage();
  const items = useNotifyStore((s) => s.items);
  const total = useNotifyStore((s) => s.total);
  const unread = useNotifyStore((s) => s.unread);
  const ensureStream = useNotifyStore((s) => s.ensureStream);
  const refresh = useNotifyStore((s) => s.refresh);
  const markRead = useNotifyStore((s) => s.markRead);
  const markAllRead = useNotifyStore((s) => s.markAllRead);
  const remove = useNotifyStore((s) => s.remove);
  const clear = useNotifyStore((s) => s.clear);
  const [active, setActive] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [bodyH, setBodyH] = React.useState(0);
  const bodyRef = React.useRef(null);
  const maxTotal = (() => {
    const raw = cfg.maxTotal != null ? cfg.maxTotal : cfg.maxItems;
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), 1e3) : 100;
  })();
  const perPage = React.useMemo(() => {
    if (!bodyH) return 6;
    const usable = bodyH - BODY_PAD + ROW_GAP;
    const n = Math.floor(usable / (ROW_H + ROW_GAP));
    return Math.min(Math.max(n, 1), 100);
  }, [bodyH]);
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return void 0;
    const update = () => setBodyH(el.clientHeight);
    update();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, []);
  const effectiveTotal = Math.min(total || 0, maxTotal);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / perPage));
  const curPage = Math.min(page, totalPages - 1);
  React.useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);
  const prevPerPage = React.useRef(perPage);
  React.useEffect(() => {
    if (prevPerPage.current !== perPage) {
      prevPerPage.current = perPage;
      setPage(0);
    }
  }, [perPage]);
  React.useEffect(() => {
    ensureStream();
    refresh("all", perPage, curPage * perPage);
  }, [ensureStream, refresh, perPage, curPage]);
  const imageMode = cfg.directImage ? "direct" : "proxy";
  const title = cfg.title || t("cardTitles.notify") || "\u6D88\u606F\u901A\u77E5";
  const openItem = (it) => {
    setActive(it);
    markRead(it.id);
  };
  const headerRight = /* @__PURE__ */ React.createElement("div", { className: "npro-actions" }, unread > 0 ? /* @__PURE__ */ React.createElement("span", { className: "npro-badge" }, unread > 99 ? "99+" : unread) : null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "npro-btn",
      title: t("notify.prevPage"),
      disabled: curPage <= 0,
      onClick: () => setPage((p) => Math.max(0, p - 1))
    },
    /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiChevronLeft, size: 16 })
  ), /* @__PURE__ */ React.createElement("span", { className: "npro-page" }, curPage + 1, "/", totalPages), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "npro-btn",
      title: t("notify.nextPage"),
      disabled: curPage >= totalPages - 1,
      onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1))
    },
    /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiChevronRight, size: 16 })
  ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "npro-btn", title: t("notify.markAllRead"), onClick: markAllRead }, /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiCheckAll, size: 16 })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "npro-btn", title: t("notify.clear"), onClick: () => clear("all") }, /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiTrashCanOutline, size: 16 })));
  return /* @__PURE__ */ React.createElement(BaseCard, { title, titleVisible: cfg.titleVisible, icon: mdiJs.mdiBellRing, headerRight }, /* @__PURE__ */ React.createElement("div", { className: "npro-body", ref: bodyRef }, items.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "npro-empty" }, /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiBellOff, size: 24 }), /* @__PURE__ */ React.createElement("span", null, t("notify.empty"))) : items.map((it) => /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      key: it.id,
      className: `npro-item ${it.read ? "" : "is-unread"} ${LEVEL_CLASS[it.level] || ""}`,
      onClick: () => openItem(it)
    },
    /* @__PURE__ */ React.createElement("span", { className: "npro-dot" }),
    /* @__PURE__ */ React.createElement("span", { className: "npro-main" }, /* @__PURE__ */ React.createElement("span", { className: "npro-title" }, it.title || t("notify.untitled")), /* @__PURE__ */ React.createElement("span", { className: "npro-excerpt" }, it.format === "markdown" ? stripMd(it.message) : it.message)),
    /* @__PURE__ */ React.createElement("span", { className: "npro-time" }, fmtTime(it.timestamp))
  ))), /* @__PURE__ */ React.createElement(
    antd.Modal,
    {
      open: !!active,
      onCancel: () => setActive(null),
      footer: null,
      width: 640,
      title: active ? active.title || "" : "",
      destroyOnClose: true
    },
    active ? /* @__PURE__ */ React.createElement("div", { className: "npro-modal" }, /* @__PURE__ */ React.createElement("div", { className: "npro-modal-meta" }, /* @__PURE__ */ React.createElement("span", { className: `npro-modal-level ${LEVEL_CLASS[active.level] || ""}` }, active.level), /* @__PURE__ */ React.createElement("span", null, fmtTime(active.timestamp)), active.persist ? /* @__PURE__ */ React.createElement("span", { className: "npro-modal-tag" }, t("notify.persisted")) : null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "npro-btn npro-modal-del",
        title: t("notify.delete"),
        onClick: () => {
          remove(active.id);
          setActive(null);
        }
      },
      /* @__PURE__ */ React.createElement(Icon, { path: mdiJs.mdiTrashCanOutline, size: 16 })
    )), /* @__PURE__ */ React.createElement(MarkdownView, { text: active.message, format: active.format, imageMode })) : null
  ));
}
export {
  NotifyHistoryCardPro as default
};
