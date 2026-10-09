/**
 * 液态玻璃「折射」引擎
 * ---------------------------------------------------------------------------
 * 移植自刘念的《使用 CSS 和 SVG 实现苹果液态玻璃效果》
 *   https://liunian.js.org/posts/liquid-glass/
 * （同源思路：shuding/liquid-glass、https://github.com/shuding/svg-shaders）
 *
 * 和「纯磨砂」的区别：玻璃边缘会**真的弯折背后的画面**，所以看起来有厚度、有弧度，
 * 背景（尤其是视频壁纸）在边缘会流动。
 *
 * ── 文章的物理模型（这里完整保留）──────────────────────────────────────
 *   1. `bezelProfile()`：把「玻璃厚度 glassThickness / 边缘宽度 bezelWidth /
 *      折射率 refractiveIndex」换算成一条**折射曲线** —— 光线穿过玻璃板、在边缘
 *      斜面上按斯涅尔定律折射，得到沿边缘法线方向的横向位移量。
 *   2. `buildDisplacementMap()`：只在离边缘 `bezelWidth` 宽的一条「镜带」里按这条
 *      曲线写位移向量（R/G 通道），中间完全不动（128 = 0）。圆角按到圆心的距离
 *      判定，所以圆角是圆的。
 *   3. `buildSpecularMap()`：一张「镜面反射」贴图 —— 沿镜带、朝光源方向（60°）
 *      最亮的白色高光带，alpha 就是高光强度。
 *
 * ── ⚠️ 性能取舍（重要，别改回去）────────────────────────────────────────
 *   实测（6 张卡 / 视频壁纸 / 真实窗口 / RTX 4060）：
 *     · 纯磨砂（CSS blur）                     120 fps
 *     · CSS blur + 2~3 个 SVG 原语             60 fps
 *     · 文章原始的 9 原语整图（模糊在滤镜内）    20 fps  ← 不可用
 *   结论：`backdrop-filter: url()` 本身就有约 2 倍开销，且**开销随滤镜原语数量
 *   线性增长**（滤镜每帧都要对整块卡片区域重算）。所以这里做了三处降本：
 *     ① 模糊用 **CSS `blur()`**（快路径），不放进 SVG 滤镜；
 *     ② 折射只用 **feImage + feDisplacementMap + feColorMatrix** 三个原语；
 *     ③ 镜面反射层不做成滤镜原语，而是把贴图当**卡片的 background-image** 叠上去
 *        （CSS 合成，零滤镜开销），观感和文章一致。
 *   想更省性能就把「模糊等级」调大、或把折射关掉（退回纯磨砂）。
 *
 * ⚠️ 浏览器支持：`backdrop-filter: url()` 目前只有桌面版 Chrome / Edge 支持。
 *    不支持时本模块把 `--lg-refraction` 设成普通的 `blur() saturate()`（纯磨砂）。
 *
 * 参数来自「全局配置 → 液态玻璃」，运行时读 `window.globalConfigCache`；
 * 调参时 GlobalConfig 会广播 `hasspanel:global-config-changed` 做实时预览。
 */

/* ------------------------------------------------------------------ 默认参数 */

/** 卡片风格（「全局配置 → 卡片风格」里点击切换）。 */
export const CARD_STYLES = ['liquid', 'frosted', 'clear', 'solid'];

/** 默认参数（与「全局配置 → 液态玻璃」一一对应）。 */
export const LG_DEFAULTS = {
  /** 卡片风格：liquid=液态玻璃(折射) / frosted=毛玻璃 / clear=通透 / solid=实色 */
  style: 'liquid',
  enabled: true,
  /** 背景不透明度（相对该风格的默认外观）：1 = 默认，0 = 全透明 */
  opacity: 1,
  /** 模糊等级：CSS blur() 的半径（px） */
  blur: 18,
  /** 折射等级：位移强度的总倍率 */
  scaleRatio: 1,
  /** 玻璃厚度（px）：越厚折射越强 */
  glassThickness: 100,
  /** 边缘宽度（px）：镜带宽度 */
  bezelWidth: 18,
  /** 折射率：1.3 左右像普通玻璃，越大弯折越狠 */
  refractiveIndex: 1.3,
  /** 镜面反射透明度：0~1 */
  specularOpacity: 0.5,
  /** 镜面饱和度：feColorMatrix saturate 的强度（1.8 ≈ 原来的 CSS saturate(180%)） */
  specularSaturation: 2,
};

/** 卡片圆角（与 liquid-glass.css 的 --lg-radius 保持一致）。 */
const CARD_RADIUS = 20;
/** 镜面反射带的宽度（px），文章里写死 50。 */
const SPECULAR_WIDTH = 50;
/** 镜面光源方向（弧度），文章默认 60°。 */
const SPECULAR_ANGLE = Math.PI / 3;
/** 折射曲线的采样数。 */
const PROFILE_SAMPLES = 128;
/** 贴图缓存上限（位移图 / 镜面图各一份）。 */
const MAP_CACHE_MAX = 24;
/** 尺寸稳定多久后重建（ms）。 */
const RESIZE_SETTLE = 140;
/** 重新扫描卡片 DOM 的节流间隔（ms）。 */
const SCAN_THROTTLE = 180;
/** 小于这个尺寸的元素不处理（分组切换时的隐藏占位格）。 */
const MIN_SIZE = 24;

const TARGET_SELECTOR = '.react-grid-item > div';
/** GlobalConfig 每次改动都会广播它（含未保存的实时预览），关闭时用已保存快照再广播一次还原。 */
const EVENT_CONFIG_CHANGED = 'hasspanel:global-config-changed';

/* ------------------------------------------------------------------ 参数读取 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function num(v, fallback) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** 从一份 globalConfig（或 window.globalConfigCache）里取出液态玻璃参数。 */
export function readParams(gc) {
  const g = gc || (typeof window !== 'undefined' && window.globalConfigCache) || {};
  const d = LG_DEFAULTS;
  return {
    style: CARD_STYLES.includes(g.cardStyle) ? g.cardStyle : d.style,
    enabled: g.lgEnabled !== false,
    opacity: clamp(num(g.lgOpacity, d.opacity), 0, 1),
    blur: clamp(num(g.lgBlur, d.blur), 0, 40),
    scaleRatio: clamp(num(g.lgScaleRatio, d.scaleRatio), 0, 3),
    glassThickness: clamp(num(g.lgGlassThickness, d.glassThickness), 0, 400),
    bezelWidth: clamp(num(g.lgBezelWidth, d.bezelWidth), 1, 80),
    refractiveIndex: clamp(num(g.lgRefractiveIndex, d.refractiveIndex), 1.01, 2.5),
    specularOpacity: clamp(num(g.lgSpecularOpacity, d.specularOpacity), 0, 1),
    specularSaturation: clamp(num(g.lgSpecularSaturation, d.specularSaturation), 1, 12),
  };
}

/**
 * 把「卡片风格」写到 `<body data-card-style="...">` 上，CSS 据此切换卡片外观
 * （见 theme/liquid-glass.css 的 1b 段）；顺带把模糊半径透给 CSS 变量
 * `--lg-card-blur`，让毛玻璃 / 通透风格也跟着「模糊等级」滑块走。
 *
 * ⚠️ 只有「液态玻璃」需要折射引擎；其它风格纯 CSS，所以这个函数要独立于
 *    折射是否可用（不支持的浏览器也得能切换风格）。
 */
export function applyCardStyle(style, blur, opacity) {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.dataset.cardStyle = CARD_STYLES.includes(style) ? style : LG_DEFAULTS.style;
  if (Number.isFinite(blur)) {
    document.body.style.setProperty('--lg-card-blur', `${clamp(blur, 0, 40)}px`);
  }
  // 背景不透明度：只写一个倍数，三种风格的底色渐变都乘它（见 liquid-glass.css）。
  // 1 = 该风格的默认外观；不传 / 非法值就不写，让 CSS 的默认值生效。
  //
  // ⚠️ 必须写在 <html>（documentElement）而不是 <body>：`--lg-surface` 是在 `:root`
  //    里定义的，而 CSS 自定义属性是在**声明它的那个元素**上完成 var() 替换的，
  //    替换后的值再往下继承。写在 body 上的话 `:root` 解析时看不到它，
  //    只会拿到默认值 1 → 滑块看起来完全没反应。
  if (Number.isFinite(opacity)) {
    document.documentElement.style.setProperty('--lg-surface-alpha', String(clamp(opacity, 0, 1)));
  }
}

/* -------------------------------------------------------------- 能力检测 */

let supportCache = null;

/** 当前浏览器是否支持 `backdrop-filter: url(#f)`（目前 = 桌面版 Chrome / Edge）。 */
export function supportsRefraction() {
  if (supportCache !== null) return supportCache;
  try {
    supportCache =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      (CSS.supports('backdrop-filter', 'url(#hp-lg-probe)') ||
        CSS.supports('-webkit-backdrop-filter', 'url(#hp-lg-probe)'));
  } catch (e) {
    supportCache = false;
  }
  return supportCache;
}

/* ---------------------------------------------------------------- 折射曲线 */

/** 边缘高度曲线：缓出，让玻璃边缘平滑地收进（文章的 bezelHeightFn）。 */
function bezelHeight(t) {
  return Math.pow(1 - Math.pow(1 - t, 4), 1 / 4);
}

/**
 * 把「玻璃厚度 / 边缘宽度 / 折射率」换算成沿边缘的横向位移曲线。
 *
 * 对边缘上每一点：取切线方向的法线当入射面法线，按斯涅尔定律折射，再把折射方向
 * 按「玻璃厚度 + 该点高度 × 边缘宽度」的深度投影回表面 —— 得到该处应从多远的地方取色。
 */
function bezelProfile({ glassThickness, bezelWidth, refractiveIndex, samples = PROFILE_SAMPLES }) {
  const invIor = 1 / refractiveIndex;

  // 折射：入射方向 (a, l)（单位向量）→ 折射方向；全反射时返回 null
  const refract = (a, l) => {
    const c = 1 - invIor * invIor * (1 - l * l);
    if (c < 0) return null;
    const h = Math.sqrt(c);
    return [-(invIor * l + h) * a, invIor - (invIor * l + h) * l];
  };

  const out = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const height = bezelHeight(u);
    const eps = u < 1 ? 1e-4 : -1e-4; // 数值求导，端点用单侧差分
    const slope = (bezelHeight(u + eps) - height) / eps;
    const norm = Math.sqrt(slope * slope + 1);
    const v = refract(-slope / norm, -1 / norm);
    if (!v || !Number.isFinite(v[1]) || v[1] === 0) {
      out[i] = 0;
      continue;
    }
    const value = v[0] * ((height * bezelWidth + glassThickness) / v[1]);
    out[i] = Number.isFinite(value) ? value : 0;
  }
  return out;
}

/* ---------------------------------------------------------------- 贴图构建 */

function newCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

/** 镜带内某像素的几何量：到最近圆角圆心的方向、距离、边缘衰减。 */
function bandGeometry(x, y, W, H, r) {
  const nearLeft = x < r;
  const nearRight = x >= W - r;
  const nearTop = y < r;
  const nearBottom = y >= H - r;
  const spanW = W - r * 2;
  const spanH = H - r * 2;
  const dx = nearLeft ? x - r : nearRight ? x - r - spanW : 0;
  const dy = nearTop ? y - r : nearBottom ? y - r - spanH : 0;
  return { dx, dy, d2: dx * dx + dy * dy };
}

/**
 * 主位移贴图：只在「圆角半径往内 bezelWidth 宽」的镜带里写位移，中间保持 128（=0）。
 */
function buildDisplacementMap({ width, height, radius, bezelWidth, maxDisp, profile }) {
  const W = Math.max(2, Math.round(width));
  const H = Math.max(2, Math.round(height));
  const { canvas, ctx } = newCanvas(W, H);
  const image = ctx.createImageData(W, H);
  const data = image.data;
  new Uint32Array(data.buffer).fill(0xff008080); // R=G=128, B=0, A=255 → 零位移

  const r = radius;
  const r2 = r * r;
  const rOut2 = (r + 1) * (r + 1);
  const rIn2 = Math.max(0, r - bezelWidth) ** 2;
  const inner = Math.sqrt(r2);
  const outer = Math.sqrt(rOut2);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { dx, dy, d2 } = bandGeometry(x, y, W, H, r);
      if (d2 > rOut2 || d2 < rIn2) continue;
      const dist = Math.sqrt(d2);
      // 最外 1px 内把强度收到 0，避免边缘硬切
      const falloff = d2 < r2 ? 1 : 1 - (dist - inner) / (outer - inner);
      const depth = r - dist; // 0 = 最外圈，bezelWidth = 镜带内沿
      const amp = profile[Math.floor((depth / bezelWidth) * profile.length)] ?? 0;
      const dirX = dist > 0 ? dx / dist : 0;
      const dirY = dist > 0 ? dy / dist : 0;
      const o = (y * W + x) * 4;
      data[o] = 128 + ((-dirX * amp) / maxDisp) * 127 * falloff;
      data[o + 1] = 128 + ((-dirY * amp) / maxDisp) * 127 * falloff;
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

/**
 * 镜面反射贴图：沿镜带的白色高光，朝光源方向（默认 60°）最亮。
 * 透明度直接烘进 alpha（所以它可以直接当卡片的 background-image 用）。
 */
function buildSpecularMap({ width, height, radius, opacity }) {
  const W = Math.max(2, Math.round(width));
  const H = Math.max(2, Math.round(height));
  const { canvas, ctx } = newCanvas(W, H);
  const image = ctx.createImageData(W, H);
  const data = image.data;
  new Uint32Array(data.buffer).fill(0); // 全透明

  const r = radius;
  const r2 = r * r;
  const rOut2 = (r + 1) * (r + 1);
  const rIn2 = Math.max(0, r - SPECULAR_WIDTH) ** 2;
  const inner = Math.sqrt(r2);
  const outer = Math.sqrt(rOut2);
  const lx = Math.cos(SPECULAR_ANGLE);
  const ly = Math.sin(SPECULAR_ANGLE);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { dx, dy, d2 } = bandGeometry(x, y, W, H, r);
      if (d2 > rOut2 || d2 < rIn2) continue;
      const dist = Math.sqrt(d2);
      if (dist === 0) continue;
      const depth = r - dist;
      const falloff = d2 < r2 ? 1 : 1 - (dist - inner) / (outer - inner);
      // 法线方向（朝外）与光源方向的夹角 → 朗伯式高光；越靠外越亮
      const dot = Math.abs((dx / dist) * lx + (-dy / dist) * ly);
      const rim = Math.sqrt(Math.max(0, 1 - Math.pow(1 - depth, 2)));
      const intensity = Math.min(1, dot * rim);
      const v = intensity * 255;
      const o = (y * W + x) * 4;
      data[o] = v;
      data[o + 1] = v;
      data[o + 2] = v;
      data[o + 3] = Math.min(255, v * intensity * falloff * opacity);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

/* ------------------------------------------------------------------ 缓存 */

const dispCache = new Map();
const specCache = new Map();

function cached(cache, key, build) {
  const hit = cache.get(key);
  if (hit) return hit;
  const value = build();
  if (cache.size >= MAP_CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, value);
  return value;
}

function getDisplacement({ width, height, radius, bezelWidth, glassThickness, refractiveIndex }) {
  const key = [width, height, radius, bezelWidth, glassThickness, refractiveIndex].join('|');
  return cached(dispCache, key, () => {
    const profile = bezelProfile({ glassThickness, bezelWidth, refractiveIndex });
    const maxDisp = Math.max(1e-6, ...profile.map((v) => Math.abs(v)));
    return {
      maxDisp,
      url: buildDisplacementMap({ width, height, radius, bezelWidth, maxDisp, profile }),
    };
  });
}

function getSpecular({ width, height, radius, opacity }) {
  const key = [width, height, radius, opacity.toFixed(3)].join('|');
  return cached(specCache, key, () => buildSpecularMap({ width, height, radius, opacity }));
}

/* ------------------------------------------------------------------ 滤镜 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
let filterSeq = 0;

const el = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const k in attrs) {
    if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, String(attrs[k]));
  }
  return node;
};

/**
 * 只含 3 个原语的折射滤镜：feImage(位移贴图) → feDisplacementMap → feColorMatrix(饱和度)。
 * 模糊由 CSS 的 blur() 负责（见文件头的性能取舍）。
 */
function createFilter({ width, height, params, disp }) {
  const id = `hp-lg-${++filterSeq}`;
  const w = String(width);
  const h = String(height);

  const filter = el('filter', { id });
  filter.setAttribute('colorInterpolationFilters', 'sRGB');

  const image = el('feImage', { id: `${id}_map`, x: 0, y: 0, width: w, height: h, result: 'map' });
  image.setAttributeNS(XLINK_NS, 'href', disp.url);

  const displace = el('feDisplacementMap', {
    in: 'SourceGraphic',
    in2: 'map',
    scale: disp.maxDisp * params.scaleRatio,
    xChannelSelector: 'R',
    yChannelSelector: 'G',
    result: 'displaced',
  });

  const saturate = el('feColorMatrix', {
    in: 'displaced',
    type: 'saturate',
    values: params.specularSaturation,
    result: 'saturated',
  });

  filter.appendChild(image);
  filter.appendChild(displace);
  filter.appendChild(saturate);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('colorInterpolationFilters', 'sRGB');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const defs = el('defs');
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  return { id, svg };
}

/* ------------------------------------------------------- 单个元素的挂载 */

/** 不支持折射 / 关掉折射时用的普通磨砂写法。 */
function plainFilter(params) {
  return `blur(${params.blur}px) saturate(1.8)`;
}

/**
 * 给一个元素套上液态玻璃效果。
 * 返回 `{ update(params), destroy() }`；也用于「全局配置」里的实时预览。
 */
export function attachLiquidGlass(element, initialParams) {
  let current = initialParams || readParams();
  let svg = null;
  let filterId = '';
  let sizeW = 0;
  let sizeH = 0;
  let dispKey = '';
  let specKey = '';
  let destroyed = false;

  const removeFilter = () => {
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    svg = null;
    filterId = '';
  };

  const clearAll = () => {
    removeFilter();
    if (element) {
      element.style.removeProperty('--lg-refraction');
      element.style.removeProperty('--lg-specular-image');
    }
    dispKey = '';
    specKey = '';
  };

  const update = (params) => {
    if (destroyed || !element) return;
    current = params || current;

    const w = Math.round(element.offsetWidth);
    const h = Math.round(element.offsetHeight);
    if (w < MIN_SIZE || h < MIN_SIZE) {
      clearAll();
      return;
    }

    // 只有「液态玻璃」风格需要折射；其它风格（毛玻璃 / 通透 / 实色）完全由 CSS 定义
    // （见 theme/liquid-glass.css 的 1b 段），这里把内联变量清掉让 CSS 接管。
    if (current.style !== 'liquid') {
      clearAll();
      return;
    }

    if (!current.enabled || !supportsRefraction()) {
      removeFilter();
      element.style.setProperty('--lg-refraction', plainFilter(current));
      element.style.removeProperty('--lg-specular-image');
      sizeW = w;
      sizeH = h;
      dispKey = '';
      specKey = '';
      return;
    }

    // ① 镜面反射：当背景图叠上去（不用滤镜原语，零开销）
    const nextSpecKey = [w, h, CARD_RADIUS, current.specularOpacity.toFixed(3)].join('|');
    if (specKey !== nextSpecKey) {
      element.style.setProperty(
        '--lg-specular-image',
        current.specularOpacity > 0.001
          ? `url(${getSpecular({
              width: w,
              height: h,
              radius: CARD_RADIUS,
              opacity: current.specularOpacity,
            })})`
          : 'none'
      );
      specKey = nextSpecKey;
    }

    // ② 折射滤镜：贴图参数没变就只改标量，避免重建（拖滑块更顺）
    const nextDispKey = [
      w,
      h,
      CARD_RADIUS,
      current.bezelWidth,
      current.glassThickness,
      current.refractiveIndex,
    ].join('|');

    if (filterId && sizeW === w && sizeH === h && dispKey === nextDispKey) {
      const f = document.getElementById(filterId);
      if (f) {
        const disp = getDisplacement({
          width: w,
          height: h,
          radius: CARD_RADIUS,
          bezelWidth: current.bezelWidth,
          glassThickness: current.glassThickness,
          refractiveIndex: current.refractiveIndex,
        });
        const d = f.querySelector('feDisplacementMap');
        if (d) d.setAttribute('scale', String(disp.maxDisp * current.scaleRatio));
        const s = f.querySelector('feColorMatrix[type="saturate"]');
        if (s) s.setAttribute('values', String(current.specularSaturation));
      }
      element.style.setProperty('--lg-refraction', `blur(${current.blur}px) url(#${filterId})`);
      return;
    }

    removeFilter();
    const disp = getDisplacement({
      width: w,
      height: h,
      radius: CARD_RADIUS,
      bezelWidth: current.bezelWidth,
      glassThickness: current.glassThickness,
      refractiveIndex: current.refractiveIndex,
    });
    const created = createFilter({ width: w, height: h, params: current, disp });
    svg = created.svg;
    filterId = created.id;
    dispKey = nextDispKey;
    sizeW = w;
    sizeH = h;
    element.style.setProperty('--lg-refraction', `blur(${current.blur}px) url(#${filterId})`);
  };

  const destroy = () => {
    destroyed = true;
    removeFilter();
    if (element) {
      element.style.removeProperty('--lg-refraction');
      element.style.removeProperty('--lg-specular-image');
    }
  };

  update(current);
  return { update, destroy };
}

/* ------------------------------------------------------------------ 控制器 */

let controller = null;

class RefractionController {
  constructor() {
    /** @type {Map<Element, { handle: ReturnType<typeof attachLiquidGlass>, timer: number }>} */
    this.items = new Map();
    this.params = readParams();
    this.scanTimer = 0;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const e of entries) this.handleResize(e.target);
    });
    this.mutationObserver = new MutationObserver(() => this.scheduleScan());
    this.onConfigChanged = (e) => {
      const next = e && e.detail;
      this.params = readParams(next && typeof next === 'object' ? next : undefined);
      this.applyParams();
    };
  }

  /** 参数变化后：先切卡片风格（CSS），再让每张卡重建/更新滤镜。 */
  applyParams() {
    applyCardStyle(this.params.style, this.params.blur, this.params.opacity);
    for (const item of this.items.values()) item.handle.update(this.params);
  }

  start() {
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(EVENT_CONFIG_CHANGED, this.onConfigChanged);
    this.applyParams();
    this.scan();
  }

  stop() {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    window.removeEventListener(EVENT_CONFIG_CHANGED, this.onConfigChanged);
    clearTimeout(this.scanTimer);
    for (const target of Array.from(this.items.keys())) this.detach(target);
    this.items.clear();
    dispCache.clear();
    specCache.clear();
  }

  scheduleScan() {
    // 用节流而不是尾部防抖：DOM 一直变动时扫描也不会被饿死
    if (this.scanTimer) return;
    this.scanTimer = setTimeout(() => {
      this.scanTimer = 0;
      this.scan();
    }, SCAN_THROTTLE);
  }

  scan() {
    const targets = new Set(document.querySelectorAll(TARGET_SELECTOR));
    for (const target of Array.from(this.items.keys())) {
      if (!targets.has(target) || !target.isConnected) this.detach(target);
    }
    for (const target of targets) {
      if (!this.items.has(target)) this.attach(target);
    }
  }

  attach(target) {
    const handle = attachLiquidGlass(target, this.params);
    this.items.set(target, { handle, timer: 0 });
    this.resizeObserver.observe(target);
  }

  detach(target) {
    const item = this.items.get(target);
    if (!item) return;
    clearTimeout(item.timer);
    this.resizeObserver.unobserve(target);
    item.handle.destroy();
    this.items.delete(target);
  }

  handleResize(target) {
    const item = this.items.get(target);
    if (!item) return;
    // 尺寸还在变：先退回纯磨砂（旧贴图尺寸已经对不上），稳定后再重建
    const w = Math.round(target.offsetWidth);
    const h = Math.round(target.offsetHeight);
    if (w >= MIN_SIZE && h >= MIN_SIZE) {
      target.style.setProperty('--lg-refraction', plainFilter(this.params));
    }
    clearTimeout(item.timer);
    item.timer = setTimeout(() => {
      if (this.items.has(target)) item.handle.update(this.params);
    }, RESIZE_SETTLE);
  }
}

/* ------------------------------------------------------------------ 对外 API */

/** 开启折射。重复调用是安全的。返回是否真的开启了。 */
export function startRefraction() {
  if (controller) return false;
  if (!supportsRefraction()) return false;
  controller = new RefractionController();
  controller.start();
  return true;
}

/** 关闭折射并清理所有滤镜 / 监听。 */
export function stopRefraction() {
  if (!controller) return;
  controller.stop();
  controller = null;
}
