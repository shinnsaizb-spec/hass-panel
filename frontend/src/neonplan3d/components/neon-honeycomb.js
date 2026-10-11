/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/neon-honeycomb.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { css, html, LitElement, nothing } from "lit";
import { HONEYCOMB_GEOMETRY, HONEYCOMB_MOTION, honeycombFrameProgress, honeycombPoints, nextDirectionalIndex } from "../neon-menu.js";
import { honeycombTokens } from "../styles.js";
import "./neon-pad.js";
export class NeonHoneycomb extends LitElement {
  static properties = {
    model: {
      attribute: false
    },
    low: {
      type: Boolean,
      reflect: true
    },
    dock: {
      type: Boolean,
      reflect: true
    },
    sheet: {
      type: Boolean,
      reflect: true
    },
    pausedAt: {
      type: Number,
      attribute: "paused-at"
    },
    _pageId: {
      state: true
    },
    _pageLeaving: {
      state: true
    },
    _closing: {
      state: true
    },
    _focusIndex: {
      state: true
    }
  };
  restoreFocus = null;
  openedAt = 0;
  constructor() {
    super();
    this.model = {
      id: "empty",
      entity: "",
      initialPage: "main",
      pages: []
    };
    this.low = false;
    this.dock = false;
    this.sheet = false;
    this.pausedAt = null;
    this._pageId = "main";
    this._pageLeaving = false;
    this._closing = false;
    this._focusIndex = 0;
  }
  connectedCallback() {
    this.restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.openedAt = performance.now();
    super.connectedCallback();
  }
  disconnectedCallback() {
    clearTimeout(this.closeTimer);
    clearTimeout(this.pageTimer);
    super.disconnectedCallback();
  }
  willUpdate(changed) {
    if (changed.has("model") && !this.model.pages.some(p => p.id === this._pageId)) this._pageId = this.model.initialPage;
  }
  firstUpdated() {
    queueMicrotask(() => this.focusables()[0]?.focus());
    requestAnimationFrame(() => this.dispatchEvent(new CustomEvent("neon-metrics", {
      detail: {
        openMs: performance.now() - this.openedAt,
        nodes: this.renderRoot.querySelectorAll("*").length
      },
      bubbles: true,
      composed: true
    })));
  }
  page() {
    return this.model.pages.find(p => p.id === this._pageId) ?? this.model.pages[0];
  }
  buttons() {
    return [...this.renderRoot.querySelectorAll("button:not(:disabled)")];
  }
  focusables() {
    const pad = this.renderRoot.querySelector("neon-pad:not([disabled])");
    return pad ? [pad, ...this.buttons()] : this.buttons();
  }
  requestClose(immediate = false) {
    if (this._closing) return;
    clearTimeout(this.pageTimer);
    this._pageLeaving = false;
    this._closing = true;
    const done = () => {
      this.dispatchEvent(new CustomEvent("close", {
        bubbles: true,
        composed: true
      }));
      if (this.restoreFocus?.isConnected) this.restoreFocus.focus();
    };
    if (immediate || matchMedia("(prefers-reduced-motion: reduce)").matches) done();else this.closeTimer = setTimeout(done, HONEYCOMB_MOTION.closeDuration + HONEYCOMB_MOTION.stagger * 2);
  }
  activate(item) {
    if (this._closing || this._pageLeaving) return;
    if (item.action.type === "page") {
      const target = item.action.page;
      if (target !== this._pageId && this.model.pages.some(p => p.id === target)) {
        this._pageLeaving = true;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.pageTimer = setTimeout(() => {
          if (!this.model.pages.some(p => p.id === target)) {
            this._pageLeaving = false;
            return;
          }
          this._pageId = target;
          this._pageLeaving = false;
          this._focusIndex = 0;
          this.updateComplete.then(() => this.focusables()[0]?.focus());
        }, reduced ? 80 : HONEYCOMB_MOTION.pageSwitchDelay);
      }
      return;
    }
    this.dispatchEvent(new CustomEvent("neon-action", {
      detail: {
        item
      },
      bubbles: true,
      composed: true
    }));
  }
  keydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.requestClose();
      return;
    }
    const buttons = this.buttons();
    const active = this.shadowRoot?.activeElement;
    const current = buttons.indexOf(active);
    if (event.key === "Tab") {
      const focusables = this.focusables();
      if (!focusables.length) return;
      event.preventDefault();
      const focusIndex = focusables.indexOf(active ?? focusables[0]);
      focusables[(focusIndex + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length]?.focus();
      return;
    }
    const direction = event.key === "ArrowRight" ? "right" : event.key === "ArrowLeft" ? "left" : event.key === "ArrowUp" ? "up" : event.key === "ArrowDown" ? "down" : null;
    if (direction && current >= 0) {
      event.preventDefault();
      const boxes = buttons.map(button => {
        const r = button.getBoundingClientRect();
        return {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2
        };
      });
      const next = nextDirectionalIndex(boxes, current, direction);
      buttons[next]?.focus();
    }
  }
  button(item, center, index = 0) {
    const style = item.color ? `--item-color:${item.color};` : "";
    return html`<button
      class="hex ${center ? "center" : "outer"} ${item.active ? "active" : ""} ${item.busy ? "busy" : ""} ${item.unavailable ? "unavailable" : ""}"
      style="${style}--i:${center ? 0 : Math.max(0, index - 1)}"
      aria-label=${`${item.label}${item.value ? `, ${item.value}` : ""}`}
      aria-pressed=${item.active === undefined ? nothing : String(item.active)}
      aria-busy=${item.busy ? "true" : "false"}
      tabindex=${this._focusIndex === index ? 0 : -1}
      ?disabled=${item.disabled}
      title=${item.label}
      @focus=${() => this._focusIndex = index}
      @click=${e => {
      e.stopPropagation();
      this.activate(item);
    }}
    ><span class="hex-shape ${item.image ? "has-image" : ""}" style=${item.image ? `background-image:url(${JSON.stringify(item.image)})` : ""}><ha-icon .icon=${item.icon}></ha-icon><span class="label">${item.label}</span>${item.value ? html`<b>${item.value}</b>` : nothing}</span></button>`;
  }
  render() {
    const p = this.page();
    if (!p) return nothing;
    const points = honeycombPoints(p.items.length);
    const pause = this.pausedAt === null ? "" : `--pause:${Math.max(0, Math.min(100, this.pausedAt)) / 100};`;
    return html`<section
      class="dialog ${this._closing ? "closing" : ""} ${this._pageLeaving ? "page-leaving" : ""} ${this.pausedAt === null ? "" : "paused"}"
      style=${pause}
      role="dialog"
      aria-modal="true"
      aria-label=${p.title ?? p.center.label}
      @keydown=${this.keydown}
      @click=${e => e.stopPropagation()}
      @pointerdown=${e => e.stopPropagation()}
    >
      <div class="cluster">
        <div class="center-wrap ${p.pad?.y ? "has-pad" : ""}">${p.pad?.y ? html`<div class="pad-stack"><neon-pad .axis=${p.pad.y} label=${p.title ?? p.center.label} ?disabled=${p.center.disabled}></neon-pad>${this.button(p.center, true)}</div>` : this.button(p.center, true)}</div>
        ${p.items.map((item, i) => html`<div class="at" style="--x:${points[i].x}px;--y:${points[i].y}px;--i:${i};--paused-delay:${-honeycombFrameProgress(this.pausedAt ?? 100, i, p.items.length) * HONEYCOMB_MOTION.duration}ms">${this.button(item, false, i + 1)}</div>`)}
      </div>
      <span class="sr" aria-live="polite">${p.title ?? p.center.label}</span>
    </section>`;
  }
  static styles = [honeycombTokens, css`
    :host { display:block; width:${HONEYCOMB_GEOMETRY.cluster}px; height:${HONEYCOMB_GEOMETRY.cluster}px; --hex-width:${HONEYCOMB_GEOMETRY.size}px; --hex-height:${HONEYCOMB_GEOMETRY.height}px; --motion:${HONEYCOMB_MOTION.duration}ms; --stagger:${HONEYCOMB_MOTION.stagger}ms; color:var(--fp3d-menu-text,#e6eefc);font-family:var(--fp3d-font,system-ui,sans-serif); }
    .dialog,.cluster { position:relative; width:100%; height:100%; }
    .cluster { display:grid; place-items:center; filter:drop-shadow(0 14px 28px rgba(0,0,0,.48)); }
    .center-wrap { position:absolute; z-index:3; animation:center-in var(--motion) cubic-bezier(.18,.86,.28,1.12) both; }
    .pad-stack { display:flex; flex-direction:column; align-items:center; gap:0; }
    .pad-stack neon-pad { height:72px; }
    .pad-stack .hex.center { width:48px; height:54px; --hex-width:48px; --hex-height:54px; }
    .pad-stack .center .label { max-width:38px; font-size:8px; }
    .pad-stack .center b { font-size:9px; }
    .at { position:absolute; left:50%; top:50%; width:var(--hex-width); height:var(--hex-height); margin-left:calc(var(--hex-width) / -2); margin-top:calc(var(--hex-height) / -2); transform:translate(var(--x),var(--y)); z-index:2; }
    .hex { width:var(--hex-width); height:var(--hex-height); padding:0; border:0; background:transparent; color:var(--fp3d-menu-text,#e6eefc); cursor:pointer; font:inherit; -webkit-tap-highlight-color:transparent; }
    .hex.center { width:${HONEYCOMB_GEOMETRY.centerSize}px; height:${HONEYCOMB_GEOMETRY.centerHeight}px; --hex-width:${HONEYCOMB_GEOMETRY.centerSize}px; --hex-height:${HONEYCOMB_GEOMETRY.centerHeight}px; }
    .hex.outer { animation:item-in var(--motion) cubic-bezier(.18,.86,.28,1.12) calc(var(--i) * var(--stagger)) both; }
    .hex-shape { box-sizing:border-box; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:8px; clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); border:1px solid var(--fp3d-honeycomb-border); background:linear-gradient(145deg,var(--fp3d-honeycomb-glass-a),var(--fp3d-honeycomb-glass-b)); position:relative; isolation:isolate; transition:filter 120ms ease,transform 100ms ease;color:var(--item-color,var(--fp3d-accent,#37e0ff)); }
    .hex-shape::before { content:"";position:absolute;inset:1px;clip-path:inherit;background:linear-gradient(145deg,color-mix(in srgb,currentColor 45%,transparent),rgba(40,120,160,.08));z-index:-2; }
    .hex-shape::after { content:"";position:absolute;inset:2px;clip-path:inherit;background:linear-gradient(145deg,var(--fp3d-honeycomb-core-a),var(--fp3d-honeycomb-core-b));z-index:-1; }
    .hex-shape.has-image { background-size:cover;background-position:center; }
    .hex-shape.has-image::after { background:linear-gradient(rgba(4,12,24,.18),rgba(4,12,24,.86)); }
    ha-icon { --mdc-icon-size:22px; }
    .label { max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:var(--fp3d-menu-text,#e6eefc);line-height:1.05; }
    b { font-size:10px;color:var(--fp3d-menu-text,#e6eefc);white-space:nowrap; }
    .center .label { max-width:62px;font-size:10px; }
    .center b { font-size:12px; }
    .hex:hover .hex-shape,.hex:focus-visible .hex-shape { filter:brightness(1.28) drop-shadow(0 0 8px currentColor); }
    .hex:focus-visible { outline:none; }
    .hex:focus-visible .hex-shape::before { background:currentColor; }
    .hex:active .hex-shape { transform:scale(${HONEYCOMB_MOTION.pressScale}); }
    .hex.active .hex-shape { filter:brightness(1.24) drop-shadow(0 0 10px var(--item-color,var(--fp3d-accent,#37e0ff))); }
    .hex:disabled { opacity:.38;cursor:not-allowed; }
    .hex.unavailable .hex-shape { filter:saturate(.2); }
    .hex.busy ha-icon { animation:spin .8s linear infinite; }
    .page-leaving { pointer-events:none; }
    .closing .center-wrap,.page-leaving .center-wrap { animation:center-out ${HONEYCOMB_MOTION.closeDuration}ms ease-in both; }
    .closing .hex.outer,.page-leaving .hex.outer { animation:item-out ${HONEYCOMB_MOTION.closeDuration}ms ease-in calc((5 - var(--i)) * 14ms) both; }
    .paused .center-wrap { animation-delay:calc(var(--pause) * -1 * var(--motion));animation-play-state:paused; }
    .paused .hex.outer { animation-delay:var(--paused-delay);animation-play-state:paused; }
    .sr { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }
    :host([dock]) { --hex-width:56px; --hex-height:64px; }
    :host([dock]) .center-wrap { left:80px; top:auto; bottom:0; }
    :host([dock]) .at { left:0; top:0; margin:0; transform:none; }
    :host([dock]) .at:nth-child(2) { left:0; top:20px; }
    :host([dock]) .at:nth-child(3) { left:58px; top:20px; }
    :host([dock]) .at:nth-child(4) { left:116px; top:20px; }
    :host([dock]) .at:nth-child(5) { left:29px; top:69px; }
    :host([dock]) .at:nth-child(6) { left:87px; top:69px; }
    :host([dock]) .at:nth-child(7) { left:145px; top:69px; }
    :host([sheet]) { overflow:auto; overscroll-behavior:contain; border-radius:18px 18px 0 0; background:color-mix(in srgb,var(--fp3d-honeycomb-core-b) 88%,transparent); box-shadow:0 -10px 32px rgba(0,0,0,.34); }
    :host([sheet]) .dialog,:host([sheet]) .cluster { width:max(260px,100%); min-width:260px; height:max(180px,100%); min-height:180px; }
    :host([sheet]) { --hex-width:56px; --hex-height:64px; }
    :host([sheet]) .center-wrap { left:10px; top:54px; bottom:auto; }
    :host([sheet]) .center-wrap.has-pad { top:30px; }
    :host([sheet]) .at:nth-child(2) { left:92px; top:28px; }
    :host([sheet]) .at:nth-child(3) { left:148px; top:28px; }
    :host([sheet]) .at:nth-child(4) { left:204px; top:28px; }
    :host([sheet]) .at:nth-child(5) { left:92px; top:84px; }
    :host([sheet]) .at:nth-child(6) { left:148px; top:84px; }
    :host([sheet]) .at:nth-child(7) { left:204px; top:84px; }
    :host([low]) .cluster { filter:none; }
    :host([low]) .hex-shape { transition:transform 100ms ease; }
    @keyframes item-in { from { opacity:0;transform:translate(calc(var(--x) * -.195),calc(var(--y) * -.195)) scale(${HONEYCOMB_MOTION.startScale}); } to { opacity:1;transform:none; } }
    @keyframes item-out { to { opacity:0;transform:translate(calc(var(--x) * -.195),calc(var(--y) * -.195)) scale(.78); } }
    @keyframes center-in { from { opacity:0;transform:scale(${HONEYCOMB_MOTION.startScale}); } }
    @keyframes center-out { to { opacity:0;transform:scale(.82); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion:reduce) { .center-wrap,.hex.outer,.closing .center-wrap,.closing .hex.outer,.page-leaving .center-wrap,.page-leaving .hex.outer { animation-duration:80ms;animation-delay:0ms;transform:none; } .hex-shape { transition:none; } }
  `];
}
if (!customElements.get("neon-honeycomb")) customElements.define("neon-honeycomb", NeonHoneycomb);