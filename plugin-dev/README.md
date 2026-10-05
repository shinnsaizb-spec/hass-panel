# Hass Panel 卡片插件开发工具（plugin-dev）

目标：用**和内置卡片几乎一样的写法**开发一张卡片，构建出一个 JS 包，丢进宿主的插件目录，重启（或重扫）就生效——类似 MoviePilot 的插件机制。

> 因为前端是 CRA 静态构建（没有运行时编译能力），插件**不能**是源码，必须是「预构建的 JS 包」，运行时由宿主前端 `import()` 加载。

---

## 一、目录约定

插件就是一个文件夹，放在宿主的：

```
/config/hass-panel/plugins/<你的插件id>/
├── manifest.json     # 插件元数据
└── plugin.js         # 构建产出的 JS 包（默认名，可在 manifest.entry 改）
```

- Docker / 飞牛 NAS 部署时，`/config/hass-panel` 对应卷 `./data/hass-panel`（见 `docker-compose.yml`）。
  把文件夹放到宿主机上的 `./data/hass-panel/plugins/<id>/` 即可，重启容器不丢。
- 不需要动核心代码，也不需要重新构建前端镜像。

---

## 二、开发流程

```bash
cd plugin-dev
npm install            # 安装 esbuild（Windows 沙箱里用 npm install --ignore-scripts）
npm run build          # 构建本目录 demo：读取 src/index.jsx，产出 dist/plugin.js
node build.mjs notify-pro   # 构建子插件目录：读取 notify-pro/src/index.jsx，产出 notify-pro/dist/plugin.js
```

打包成 zip（压缩包里根目录放 `manifest.json` + `plugin.js` 即可，两种方式任选）：

**方式 A：界面里上传（推荐，最简单）**
1. 把 `manifest.json` 和 `dist/plugin.js` 放进同一个文件夹，打包成 `xxx.zip`；
2. 打开面板主页，点顶栏「全局配置」齿轮**左边**的「上传插件」按钮；
3. 把 zip 拖进去 → 上传成功即自动生效，无需重启。

> 本目录已生成一份可直接上传的示例包：`demo-plugin.zip`。

**方式 B：手动放进插件目录**
把 `manifest.json` 和 `dist/plugin.js` 复制到宿主机：

```
宿主机 ./data/hass-panel/plugins/demo-plugin/manifest.json
宿主机 ./data/hass-panel/plugins/demo-plugin/plugin.js
```

## 三、生效方式（三选一）

1. **界面「上传插件」按钮**：上传 zip 后自动重扫，立即生效（推荐）。
2. **重启容器**（MoviePilot 式，最稳）：宿主启动时会重新扫描插件目录。
3. **不重启热加载**：调用一次
   ```
   POST /api/plugins/rescan
   ```
   即可让新插件立即出现（需登录态）。

前端刷新页面后，新卡片类型会出现在「配置 → 添加卡片」列表里，拖到面板上就能用。

---

## 四、manifest.json 字段说明

| 字段 | 含义 |
| --- | --- |
| `id` | 插件唯一 id（也是文件夹名） |
| `name` | 配置页里显示的卡片名称 |
| `version` | 版本号 |
| `author` | 作者 |
| `cardType` | 注册进卡片系统的类型名（必须唯一，建议与组件名一致） |
| `icon` | 图标，写 `@mdi/js` 的图标名字符串，如 `"mdiBellRing"` |
| `group` | 配置页分组，默认 `"plugin"` |
| `entry` | bundle 文件名，默认 `"plugin.js"` |
| `defaultHeight` | 卡片默认高度（grid 单位，对应内置的 `cardHeights`） |
| `configFields` | 卡片配置字段（见下），会出现在「编辑卡片」面板 |

`configFields` 的 `type` 复用宿主已有的编辑器类型，常用的有：
`text` / `number` / `switch` / `entity`（实体选择器）/ `group-select`（分组）等。

---

## 五、在插件代码里怎么引依赖

构建脚本会把下面这些「重定向到宿主全局」，你只管像平常一样 import：

| 你想用的 | 写法 | 说明 |
| --- | --- | --- |
| React | `import React from 'react'` | 与宿主**同一份实例**（hook 不会报错） |
| antd | `import antd from 'antd'` 然后 `antd.Button` | 用默认导入拿命名空间（别用 `import { Button }`） |
| @hakit/core | `import { useEntity } from '@hakit/core'` | 具名导入可用，复用宿主 HA 连接 |
| @mdi/react | `import Icon from '@mdi/react'` | 图标组件 |
| @mdi/js | `import mdi from '@mdi/js'` 然后 `mdi.mdiXxx` | 默认导入拿命名空间 |
| zustand | `import zustand from 'zustand'` | 命名空间 |
| 便捷桥 | `import { BaseCard } from 'hass-panel-sdk'` | 直接拿到 `BaseCard` / `registerCard` 等 |

**推荐**：宿主组件/能力都从 `hass-panel-sdk` 具名导入，最省心（拿到的是**真实组件/实例**，不是 Proxy）：

```jsx
import {
  React, antd, Icon, mdiJs,          // 与宿主同一份 React / antd / 图标
  BaseCard, MarkdownView,            // 卡片外壳、Markdown 渲染
  useNotifyStore, useLanguage,       // 通知数据 store（实时 SSE / 未读 / 已读）、多语言 t()
  notifyApi,                         // 通知相关接口
} from 'hass-panel-sdk';
```

> ⚠️ 只有从 `hass-panel-sdk` 具名导入的 `Icon` 才是**可直接渲染的组件**；若用 `import Icon from '@mdi/react'` 拿到的是 Proxy，不能直接当组件渲染（会报 Element type is invalid）。图标一律走 SDK。

### 示例插件：消息通知（升级版）

`plugin-dev/notify-pro/` 是「消息通知卡片」的升级修复版，可直接上传试用（成品包：`notify-pro/notify-history-pro.zip`）：

- 配置项从内置的「最多显示条数」改为「**翻页最多条数**」（能翻到的消息总上限）；
- **每页显示多少条由卡片高度自动计算**：用 `ResizeObserver` 量出卡片内容区高度，
  `每页条数 = floor((内容区高度 - 内边距) / 单条高度)`，卡片拉高就自动多显示，拉矮就少显示；
- 其余能力（点开看详情、未读高亮、标记已读/全部已读/清空、实时 SSE）与内置一致。

`BaseCard` 的用法与内置卡片一致：`{title, icon, headerRight, children, className, style}`。

### 最小示例（src/index.jsx）

```jsx
import React from 'react';
import { useEntity } from '@hakit/core';
import { BaseCard } from 'hass-panel-sdk';

export default function MyCard({ config }) {
  const entityId = (config && config.entity_id) || '';
  return (
    <BaseCard title={(config && config.title) || '我的卡片'}>
      <div style={{ padding: 12 }}>
        {entityId ? <p>实体状态：{useEntity(entityId).entity?.state}</p>
                  : <p>在配置里填 entity_id</p>}
      </div>
    </BaseCard>
  );
}
```

> ⚠️ Hook 规则：不要在条件分支里调用 `useEntity` 等 hook。需要条件使用时，拆成子组件。

---

## 六、安全提醒（重要）

插件 = **可信代码**。它被加载到与面板相同的 JS 运行环境里，能够：
- 读取 `localStorage` 里的登录 token；
- 调用宿主后端 API（含 HA 凭证）；
- 访问页面 DOM。

所以**只安装你信任的插件**（自己写的，或可信来源）。不要随意安装来源不明的插件 zip。
这与 MoviePilot 的插件模型一致——插件拥有宿主同等权限，不提供沙箱隔离。
