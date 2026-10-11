/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/neon-pad.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { css, html, LitElement } from "lit";
export class NeonPad extends LitElement {
  static properties = {
    axis: {
      attribute: false
    },
    label: {
      type: String
    },
    disabled: {
      type: Boolean,
      reflect: true
    },
    _value: {
      state: true
    }
  };
  pointer = null;
  captureTarget = null;
  lastSent = 0;
  constructor() {
    super();
    this.axis = {
      min: 0,
      max: 100,
      step: 1,
      value: 0,
      commit: "release",
      action: {
        type: "service",
        domain: "",
        service: ""
      },
      valueKey: "value"
    };
    this.label = "Value";
    this.disabled = false;
    this._value = 0;
  }
  willUpdate(changed) {
    if (changed.has("axis") && this.pointer === null) this._value = this.axis.value;
    if (changed.has("disabled") && this.disabled && this.pointer !== null) {
      this.emit(true);
      this.cancelPointer(true);
    }
  }
  disconnectedCallback() {
    if (this.pointer !== null) this.emit(true);
    this.cancelPointer(false);
    super.disconnectedCallback();
  }
  focus(options) {
    const pad = this.renderRoot.querySelector(".pad");
    if (pad) pad.focus(options);else super.focus(options);
  }
  quantize(value) {
    const {
      min,
      max,
      step
    } = this.axis;
    return Math.max(min, Math.min(max, Math.round((value - min) / step) * step + min));
  }
  valueAt(event) {
    const r = this.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientY - r.top) / Math.max(1, r.height)));
    const logical = this.axis.invert ? 1 - ratio : ratio;
    return this.quantize(this.axis.min + logical * (this.axis.max - this.axis.min));
  }
  emit(final) {
    if (!final && this.axis.commit === "release") return;
    const now = performance.now();
    if (!final && this.lastSent > 0 && now - this.lastSent < (this.axis.throttleMs ?? 100)) return;
    this.lastSent = now;
    this.dispatchEvent(new CustomEvent("neon-pad-change", {
      detail: {
        axis: this.axis,
        value: this._value,
        final
      },
      bubbles: true,
      composed: true
    }));
  }
  down(event) {
    if (this.disabled || this.pointer !== null) return;
    event.preventDefault();
    event.stopPropagation();
    this.pointer = event.pointerId;
    this.captureTarget = event.currentTarget;
    this.captureTarget.setPointerCapture(event.pointerId);
    this._value = this.valueAt(event);
    this.emit(false);
  }
  move(event) {
    if (event.pointerId !== this.pointer) return;
    event.preventDefault();
    event.stopPropagation();
    this._value = this.valueAt(event);
    this.emit(false);
  }
  up(event) {
    if (event.pointerId !== this.pointer) return;
    event.preventDefault();
    event.stopPropagation();
    this._value = this.valueAt(event);
    this.emit(true);
    this.cancelPointer(true);
  }
  cancelPointer(release) {
    if (this.pointer === null) return;
    const pointer = this.pointer;
    const target = this.captureTarget;
    this.pointer = null;
    this.captureTarget = null;
    if (release && target?.hasPointerCapture(pointer)) target.releasePointerCapture(pointer);
  }
  cancelWithCommit(event, release) {
    if (event.pointerId !== this.pointer) return;
    this.emit(true);
    this.cancelPointer(release);
  }
  key(event) {
    const direction = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : event.key === "ArrowDown" || event.key === "ArrowLeft" ? -1 : 0;
    if (!direction || this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this._value = this.quantize(this._value + direction * this.axis.step);
    this.emit(true);
  }
  render() {
    const span = Math.max(1, this.axis.max - this.axis.min);
    const logical = (this._value - this.axis.min) / span;
    const top = (this.axis.invert ? 1 - logical : logical) * 100;
    return html`<div
      class="pad"
      role="slider"
      tabindex=${this.disabled ? -1 : 0}
      aria-label=${this.label}
      aria-valuemin=${this.axis.min}
      aria-valuemax=${this.axis.max}
      aria-valuenow=${this._value}
      aria-disabled=${this.disabled}
      @pointerdown=${this.down}
      @pointermove=${this.move}
      @pointerup=${this.up}
      @pointercancel=${e => this.cancelWithCommit(e, true)}
      @lostpointercapture=${e => this.cancelWithCommit(e, false)}
      @keydown=${this.key}
    ><span class="rail"></span><span class="thumb" style="top:${top}%"></span><output style="top:${top}%">${Math.round(this._value * 10) / 10}</output></div>`;
  }
  static styles = css`
    :host { display: block; width: 58px; height: 132px; }
    .pad { position: relative; width: 100%; height: 100%; touch-action: none; cursor: ns-resize; outline: none; }
    .rail { position: absolute; inset: 8px 23px; border-radius: 10px; background: linear-gradient(to top, rgba(55,224,255,.16), var(--fp3d-accent,#37e0ff)); border: 1px solid rgba(120,210,255,.42); }
    .thumb { position: absolute; left: 50%; width: 34px; height: 34px; transform: translate(-50%,-50%); border-radius: 50%; background: #101d31; border: 2px solid var(--fp3d-accent,#37e0ff); box-shadow: 0 0 18px color-mix(in srgb, var(--fp3d-accent,#37e0ff) 52%, transparent); }
    output { position: absolute; left: 50%; transform: translate(-50%,-50%); pointer-events:none; color: var(--fp3d-menu-text,#e6eefc); font: 700 9px var(--fp3d-font,system-ui,sans-serif); }
    .pad:focus-visible .thumb { outline: 2px solid #fff; outline-offset: 2px; }
    :host([disabled]) { opacity: .42; }
  `;
}
if (!customElements.get("neon-pad")) customElements.define("neon-pad", NeonPad);