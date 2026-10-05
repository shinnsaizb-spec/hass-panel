// ==============================================================================
// Hass Panel 插件构建脚本
// ------------------------------------------------------------------------------
// 关键思路：插件是「独立构建的 JS 包」，运行时由宿主前端 import() 加载。
// 插件代码里像平时一样 import react / antd / @hakit/core，
// 本脚本通过 esbuild 插件把它们「重定向」到宿主在 window.HassPanelBridge 上
// 暴露的同一份实例（同一个 React、同一个 HA 连接），从而：
//   1) 插件包无需自带这些依赖，体积小；
//   2) 能与宿主共用 React 实例（hook 不会报错）；
//   3) 能拿到 @hakit 的 Context（useEntity 等可用）。
// ==============================================================================

import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE = 'window.HassPanelBridge';

// 可选：构建 plugin-dev 下的某个子插件目录（例如 `node build.mjs notify-pro`）。
// 不传参数时，构建本目录（demo 插件）。
const target = process.argv[2] || '';
const pluginRoot = target ? path.join(__dirname, target) : __dirname;

// 需要重定向到宿主全局的依赖
const REMAP = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOM',
  'antd': 'antd',
  '@hakit/core': 'hakit',
  '@mdi/react': 'Icon',
  '@mdi/js': 'mdiJs',
  'zustand': 'zustand',
  '@iconify/react': 'iconify',
  'hass-panel-sdk': '__self__',
};

// @hakit/core 常见具名导出（让 `import { useEntity } from '@hakit/core'` 可用）
const HAKIT_NAMES = [
  'useEntity', 'useHass', 'useIcon', 'useHistory', 'useLogs', 'useCamera',
  'useWeather', 'useService', 'useArea', 'useFloor', 'useScene', 'useFetch',
  'useHassUrl', 'useAlarmo', 'usePicture', 'ERROR', 'HassConnect',
  'HassProvider', 'callService', 'getEntity', 'getError', 'useIconByDomain',
];

function virtualModule(spec) {
  // hass-panel-sdk：直接把整个 bridge 暴露出来（含 BaseCard 等便捷导出）
  if (spec === 'hass-panel-sdk') {
    return [
      `const B = ${BRIDGE};`,
      `export default B;`,
      `export const React = B.React;`,
      `export const antd = B.antd;`,
      `export const hakit = B.hakit;`,
      `export const Icon = B.Icon;`,
      `export const mdiJs = B.mdiJs;`,
      `export const zustand = B.zustand;`,
      `export const registerCard = B.registerCard;`,
      `export const getCardComponent = B.getCardComponent;`,
      `export const BaseCard = B.BaseCard;`,
      `export const MarkdownView = B.MarkdownView;`,
      `export const useNotifyStore = B.useNotifyStore;`,
      `export const useLanguage = B.useLanguage;`,
      `export const notifyApi = B.notifyApi;`,
    ].join('\n');
  }
  const key = REMAP[spec];
  if (spec === '@hakit/core') {
    const named = HAKIT_NAMES.map(
      (n) =>
        `export const ${n} = (...a) => (${BRIDGE}.hakit && ${BRIDGE}.hakit['${n}'] ? ${BRIDGE}.hakit['${n}'](...a) : undefined);`
    ).join('\n');
    return [
      `const B = ${BRIDGE}.hakit;`,
      `const __ns = new Proxy({}, { get: (_, p) => (B ? B[p] : undefined) });`,
      `export default __ns;`,
      named,
    ].join('\n');
  }
  // 其余：default 导出对应全局（插件里用 `import x from 'xxx'` 再 x.xxx）
  return [
    `const B = ${BRIDGE}.${key};`,
    `const __ns = new Proxy({}, { get: (_, p) => (B ? B[p] : undefined) });`,
    `export default __ns;`,
  ].join('\n');
}

const externalsPlugin = {
  name: 'hass-panel-externals',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (Object.prototype.hasOwnProperty.call(REMAP, args.path)) {
        return { path: args.path, namespace: 'hp-bridge' };
      }
    });
    build.onLoad({ filter: /.*/, namespace: 'hp-bridge' }, (args) => ({
      contents: virtualModule(args.path),
      loader: 'js',
      resolveDir: __dirname,
    }));
  },
};

const outfile = path.join(pluginRoot, 'dist', 'plugin.js');

await esbuild.build({
  entryPoints: [path.join(pluginRoot, 'src', 'index.jsx')],
  bundle: true,
  format: 'esm',
  target: 'es2019',
  outfile,
  plugins: [externalsPlugin],
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  logLevel: 'info',
});

console.log('✅ 插件已构建到', outfile);
