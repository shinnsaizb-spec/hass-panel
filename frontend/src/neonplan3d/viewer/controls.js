/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/controls.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Orbit camera with inertia, pinch zoom, two-finger pan, taps and smooth flights.
// The owner calls update() each frame; it returns true while something still moves.

import { PerspectiveCamera, Vector3 } from "three";
const HOLD_MS = 500;
const MIN_PHI = 0.12;
const MAX_PHI = 1.35;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export class OrbitControls {
  view = {
    target: new Vector3(),
    radius: 16,
    theta: -0.6,
    phi: 0.85
  };
  minRadius = 2;
  maxRadius = 80;
  pointers = new Map();
  velocity = {
    theta: 0,
    phi: 0
  };
  flight = null;
  down = null;
  lastTap = 0;
  held = false;
  /** An object is being dragged: moves go to events.drag instead of the camera. */
  grabbing = false;
  /** A swipe on an object: vertical moves go to events.swipeMove. */
  swiping = null;
  pinch = null;
  listeners = [];
  constructor(el, camera, events) {
    this.el = el;
    this.camera = camera;
    this.events = events;
    const on = (type, fn, opts) => {
      el.addEventListener(type, fn, opts);
      this.listeners.push([type, fn]);
    };
    on("pointerdown", e => this.onDown(e));
    on("pointermove", e => this.onMove(e));
    on("pointerup", e => this.onUp(e));
    on("pointercancel", e => this.onUp(e));
    on("wheel", e => this.onWheel(e), {
      passive: false
    });
    on("contextmenu", e => e.preventDefault());
  }
  dispose() {
    clearTimeout(this.holdTimer);
    for (const [type, fn] of this.listeners) this.el.removeEventListener(type, fn);
  }

  /** A finger or the mouse holds the view, or a flight runs (an automatic orbit waits meanwhile). */
  get active() {
    return this.pointers.size > 0 || this.flight !== null;
  }

  /** Apply the view to the camera. Returns true while inertia or a flight is running. */
  update(now) {
    let active = false;
    if (this.flight) {
      const {
        from,
        to,
        start,
        duration
      } = this.flight;
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      this.view.target.lerpVectors(from.target, to.target, k);
      this.view.radius = from.radius + (to.radius - from.radius) * k;
      this.view.theta = from.theta + (to.theta - from.theta) * k;
      this.view.phi = from.phi + (to.phi - from.phi) * k;
      if (t >= 1) this.flight = null;
      active = true;
    } else if (this.pointers.size === 0 && (Math.abs(this.velocity.theta) > 1e-4 || Math.abs(this.velocity.phi) > 1e-4)) {
      this.view.theta += this.velocity.theta;
      this.view.phi = clamp(this.view.phi + this.velocity.phi, MIN_PHI, MAX_PHI);
      this.velocity.theta *= 0.9;
      this.velocity.phi *= 0.9;
      active = true;
    }
    const {
      target,
      radius,
      theta,
      phi
    } = this.view;
    this.camera.position.set(target.x + radius * Math.sin(phi) * Math.sin(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.cos(theta));
    this.camera.lookAt(target);
    return active;
  }
  flyTo(to, duration = 700) {
    const from = {
      ...this.view,
      target: this.view.target.clone()
    };
    // take the short way round
    let theta = to.theta ?? from.theta;
    while (theta - from.theta > Math.PI) theta -= 2 * Math.PI;
    while (theta - from.theta < -Math.PI) theta += 2 * Math.PI;
    const target = {
      target: (to.target ?? from.target).clone(),
      radius: to.radius ?? from.radius,
      theta,
      phi: to.phi ?? from.phi
    };
    this.velocity = {
      theta: 0,
      phi: 0
    };
    if (duration <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.view = target;
      this.flight = null;
    } else {
      this.flight = {
        from,
        to: target,
        start: performance.now(),
        duration
      };
    }
    this.events.change();
  }
  get busy() {
    return this.flight !== null || this.pointers.size > 0;
  }
  local(e) {
    const rect = this.el.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }
  onDown(e) {
    this.el.setPointerCapture(e.pointerId);
    if (this.pointers.size === 0 && e.button === 0 && this.events.grab?.(...this.local(e))) {
      this.grabbing = true;
      this.pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        button: e.button,
        type: e.pointerType
      });
      this.flight = null;
      this.velocity = {
        theta: 0,
        phi: 0
      };
      return;
    }
    this.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      type: e.pointerType
    });
    this.flight = null;
    this.velocity = {
      theta: 0,
      phi: 0
    };
    clearTimeout(this.holdTimer);
    this.held = false;
    if (this.pointers.size === 1) {
      this.down = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
        moved: false
      };
      const rect = this.el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.holdTimer = setTimeout(() => {
        if (!this.down || this.down.moved || this.pointers.size !== 1) return;
        this.held = true;
        this.events.hold(x, y);
      }, HOLD_MS);
    } else {
      this.down = null;
      this.pinch = this.pinchState();
    }
  }
  onMove(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    if (this.grabbing) {
      this.events.drag?.(...this.local(e));
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (this.swiping) {
      this.events.swipeMove?.(e.clientY - this.swiping.startY);
      return;
    }
    if (this.down && !this.down.moved && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) {
      this.down.moved = true;
      clearTimeout(this.holdTimer);
      const rect = this.el.getBoundingClientRect();
      if (this.pointers.size === 1 && p.button === 0 && !e.shiftKey && this.events.swipeStart?.(this.down.x - rect.left, this.down.y - rect.top, e.clientX - this.down.x, e.clientY - this.down.y)) {
        this.swiping = {
          startY: this.down.y
        };
        this.velocity = {
          theta: 0,
          phi: 0
        };
        this.events.swipeMove?.(e.clientY - this.down.y);
        return;
      }
    }
    if (this.pointers.size === 1) {
      if (this.down && !this.down.moved) {
        p.x = e.clientX;
        p.y = e.clientY;
        return;
      }
      const pan = p.button === 1 || p.button === 2 || e.shiftKey;
      if (pan) this.pan(dx, dy);else {
        const h = this.el.clientHeight || 1;
        const dTheta = -dx / h * 3.2;
        const dPhi = -dy / h * 2.4;
        this.view.theta += dTheta;
        this.view.phi = clamp(this.view.phi + dPhi, MIN_PHI, MAX_PHI);
        this.velocity = {
          theta: dTheta,
          phi: dPhi
        };
      }
      p.x = e.clientX;
      p.y = e.clientY;
    } else {
      p.x = e.clientX;
      p.y = e.clientY;
      const now = this.pinchState();
      if (this.pinch && now) {
        this.zoom(this.pinch.dist / Math.max(1, now.dist));
        this.pan(now.mid[0] - this.pinch.mid[0], now.mid[1] - this.pinch.mid[1]);
      }
      this.pinch = now;
    }
    this.events.change();
  }
  onUp(e) {
    if (!this.pointers.has(e.pointerId)) return;
    if (this.grabbing) {
      this.grabbing = false;
      this.pointers.delete(e.pointerId);
      this.events.drop?.();
      return;
    }
    this.pointers.delete(e.pointerId);
    if (this.swiping) {
      this.swiping = null;
      this.down = null;
      this.events.swipeEnd?.();
      return;
    }
    if (this.pointers.size < 2) this.pinch = null;
    clearTimeout(this.holdTimer);
    if (this.held) {
      this.held = false;
      this.down = null;
    } else if (this.down && !this.down.moved && e.type === "pointerup" && performance.now() - this.down.time < 400) {
      const rect = this.el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      if (now - this.lastTap < 320) {
        this.lastTap = 0;
        this.events.doubleTap(x, y);
      } else {
        this.lastTap = now;
        this.events.tap(x, y);
      }
    }
    if (this.pointers.size === 0) this.down = null;
    this.events.change();
  }
  onWheel(e) {
    e.preventDefault();
    this.flight = null;
    this.zoom(Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
    this.events.change();
  }
  zoom(factor) {
    this.view.radius = clamp(this.view.radius * factor, this.minRadius, this.maxRadius);
  }
  pan(dx, dy) {
    const h = this.el.clientHeight || 1;
    const perPixel = 2 * this.view.radius * Math.tan(this.camera.fov * Math.PI / 360) / h;
    const right = new Vector3(Math.cos(this.view.theta), 0, -Math.sin(this.view.theta));
    const forward = new Vector3(-Math.sin(this.view.theta), 0, -Math.cos(this.view.theta));
    this.view.target.addScaledVector(right, -dx * perPixel);
    this.view.target.addScaledVector(forward, dy * perPixel / Math.max(0.35, Math.cos(this.view.phi)));
  }
  pinchState() {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return null;
    const [a, b] = pts;
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mid: [(a.x + b.x) / 2, (a.y + b.y) / 2]
    };
  }
}
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}