# AGENTS.md

本仓库是 `PavilionMfe` 微前端 monorepo，基于 Module Federation + Vite，主应用负责布局、路由调度、生命周期编排和预加载，子应用以统一的 `mount` / `unmount` 生命周期接入。

## 项目结构

```text
apps/
  main-app/               # 主应用：React + Module Federation 主入口
  git-report-generator/   # 已接入的子应用，作为新增子应用的参考实现
  ai-chat/                # 已接入的 AI 聊天子应用（含独立开发自动登录鉴权层）
packages/
  bridge/                 # 主应用-子应用事件通信（EventBus + StorageSync）
  sandbox/                # JS 沙箱、副作用追踪、路由隔离、日志
  tabs/                   # 多标签页状态管理
  router/                 # 微前端生命周期路由调度器
  runtime/                # MF Remote 共享运行时聚合层
  vite/                   # Vite 插件：MF + CSS 作用域 + WS 端口发现
  cli/                    # CLI：pavilion-mfe dev / build
  create-pavilion/        # 子应用脚手架
  desktop/                # Electron 桌面壳
services/
  platform-api/           # NestJS 后端服务
```

## 常用命令

```bash
pnpm install
pnpm dev                  # 并行启动主应用和全部子应用开发服务器
pnpm typecheck
pnpm --filter main-app dev
pnpm --filter git-report-generator dev
pnpm --filter main-app build:dev
pnpm --filter git-report-generator build:dev
```

开发端口约定：

| 应用                   | 端口 |
| ---------------------- | ---- |
| `main-app`             | 6019 |
| `git-report-generator` | 6010 |
| `ai-chat`              | 6020 |
| WS 端口发现服务        | 8356 |

新增子应用时从 `6030` 开始按 `+10` 递增使用未被占用的端口，并在 `apps/main-app/mfe.json` 中登记 `devPort`。

## 核心约定

- 子应用 `appCode` 必须全局唯一，使用 kebab-case，通常与 `package.json` 的 `name`、Vite 插件 `name`、MF remote name 保持一致。
- 子应用路由使用前缀匹配，`mfe.json` 的 `routes` 是路由注册的唯一事实来源；新路由前缀不能与其他子应用或主应用自有路由重叠。
- 子应用运行时不得引入 `@pavilion-mfe/*` 代码，只能把 `@pavilion-mfe/vite` 作为 devDependency；独立运行和微前端运行共用同一份 `main.tsx`。
- 子应用通过 `window.__PAVILION_MFE_ENV__` 区分运行环境，该变量由主应用路由 `start()` 注入。
- 主应用 `PavilionMfe({ shared: [] })`，子应用同样使用 `shared: []`，框架依赖各自携带，避免版本错配。
- 修改核心包后按依赖顺序构建：`sandbox` / `bridge` / `tabs` → `router` → `runtime` → `vite`。

## 如何新增子应用

### 1. 创建应用目录

在 `apps/` 下新建目录，目录名使用 `appCode`：

```bash
mkdir apps/my-dashboard
```

可以直接复制 `apps/git-report-generator` 作为模板，也可以参考 `packages/create-pavilion` 的脚手架生成内容。pnpm workspace 已包含 `apps/*`，无需额外注册。

### 2. 配置 package.json

```json
{
  "name": "my-dashboard",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:dev": "vite build --mode develop",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@pavilion-mfe/vite": "workspace:*"
  }
}
```

注意：

- 不要给子应用加 `@pavilion-mfe/router`、`@pavilion-mfe/sandbox` 等运行时依赖。
- React 子应用自行携带 `react` / `react-dom`；Vue 子应用自行携带 `vue`，不依赖主应用共享。

### 3. 配置环境变量

至少创建 `.env` 和 `.env.develop`：

```bash
# .env
VITE_PAVILION_MFE_APP_CODE=my-dashboard

# .env.develop
VITE_PAVILION_MFE_ENV=develop
VITE_BASE_API_URL=http://localhost:3000
VITE_PAVILION_MFE_CDN=
```

`VITE_PAVILION_MFE_APP_CODE` 会被 Vite 插件用作 MF 应用名和 CSS 作用域前缀，必须与 `mfe.json` 的 `appCode` 一致。

### 4. 配置 vite.config.ts

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv } from "vite";
import { PavilionMfe } from "@pavilion-mfe/vite";

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appCode = env.VITE_PAVILION_MFE_APP_CODE;

  return {
    plugins: [
      react(),
      PavilionMfe({
        role: "sub-app",
        name: appCode,
        cdn: process.env.VITE_PAVILION_MFE_CDN || env.VITE_PAVILION_MFE_CDN || "",
        exposes: {
          "./main": "./src/main.tsx"
        },
        openDevServe: true,
        port: 6030,
        shared: [],
        dts: false
      })
    ],
    server: { port: 6030 }
  };
});
```

关键字段：

- `role: "sub-app"`：启用 CSS 作用域和构建产物路径。
- `exposes: { "./main": "./src/main.tsx" }`：暴露生命周期入口，主应用通过 `<appCode>/main` 加载。
- `openDevServe: true` + `port`：注册到本地 WS 端口发现服务。
- `shared: []`：不共享框架，避免版本冲突。

### 5. 实现生命周期入口

`src/main.tsx` 必须导出默认生命周期对象，并保留独立运行分支：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";

const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE;

if (!window.__PAVILION_MFE_ENV__) {
  const root = document.getElementById("root");
  if (root) {
    root.classList.add(`pavilion-mfe-${appCode}`);
    createRoot(root).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    );
  }
}

export default {
  mount: async (_ctx, el: HTMLElement) => {
    const root = createRoot(el);
    root.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    );
    return () => root.unmount();
  },
  unmount: async (_ctx, el: HTMLElement) => {
    el.innerHTML = "";
  }
};
```

同时创建 `src/globals.d.ts`：

```typescript
export {};

declare global {
  interface Window {
    __PAVILION_MFE_ENV__?: boolean;
  }
}
```

子应用内部使用 `BrowserRouter` 时，`Routes` 的路径要覆盖 `mfe.json` 中登记的 `routes`，例如登记 `/git` 时子应用内路由为 `/git/*`。

## 如何把子应用接入主应用

### 1. 在 mfe.json 注册

编辑 `apps/main-app/mfe.json`：

```json
{
  "apps": [
    {
      "appCode": "my-dashboard",
      "name": "我的面板",
      "cdn": "",
      "routes": ["/dashboard"],
      "devPort": 6030,
      "keepAlive": false
    }
  ]
}
```

字段说明：

| 字段        | 必填 | 说明                                                      |
| ----------- | ---- | --------------------------------------------------------- |
| `appCode`   | 是   | 全局唯一编码，也是 MF remote name                         |
| `name`      | 是   | 展示名称，用于加载失败兜底等场景                          |
| `routes`    | 是   | 路由前缀数组，顺序在前者优先匹配                          |
| `cdn`       | 否   | 子应用独立 CDN 前缀；留空使用全局 `VITE_PAVILION_MFE_CDN` |
| `devPort`   | 是   | 本地开发端口，主应用 dev 模式按此生成 remote              |
| `keepAlive` | 否   | 是否启用 Keep-Alive 缓存，默认 `false`                    |

### 2. 确认主应用接入链路

不需要手写 React Router 子路由。主应用已内置完整链路：

1. `apps/main-app/vite.config.ts`：dev 模式从 `mfe.json` 生成 `remotes`。
2. `apps/main-app/src/preloadPlugin.ts`：build 模式在 MF `beforeInit` 阶段动态注册所有子应用，并预加载当前子应用。
3. `apps/main-app/src/main.tsx`：`createPavilionMfeRouter` 遍历 `mfe.json`，用 `loadRemote('<appCode>/main')` 加载生命周期，用 `createPathMatcher(routes)` 匹配路径。
4. `apps/main-app/src/router/index.tsx`：`*` catch-all 由 `MFPage` 处理，让 React Router 保持路径同步。
5. `apps/main-app/src/layout/MainLayout.tsx`：提供 `#pavilion-mfe-container`、加载骨架和 Tab 同步。

### 3. 添加菜单

菜单与 `mfe.json` 解耦。当前菜单数据在 `apps/main-app/src/api/menu.ts` 中模拟，新增菜单项时在 `menusData` 中加入对应 `menuUrl`：

```typescript
{
  menuCode: "my-dashboard",
  menuName: "我的面板",
  menuTp: "0",
  parentCode: "",
  orderNo: 6,
  status: "1",
  menuUrl: "/dashboard",
  menuIcon: "Grid",
  childrenMenuInfoList: [],
}
```

### 4. 补充 TypeScript 声明

若主应用需要静态引用子应用类型，在 `apps/main-app/src/remote-declarations.d.ts` 增加：

```typescript
declare module "my-dashboard/main" {
  import type { SubAppLifecycle } from "@pavilion-mfe/router";
  const lifecycle: SubAppLifecycle;
  export default lifecycle;
}
```

### 5. 验证

```bash
# 子应用独立运行
pnpm --filter my-dashboard dev
# 打开 http://localhost:6030

# 主应用 + 子应用联调
pnpm dev
# 打开 http://localhost:6019/dashboard
```

验证点：

- 子应用单独启动时可正常访问。
- 主应用进入 `/dashboard` 能加载、挂载并显示侧边栏菜单。
- 切换离开后 `pavilion-mfe:sub-app-switch` 事件正常触发。
- 打开控制台日志（`configureLog`）能看到 `register` / `sub-app-load` / `sub-app-mount`。
- `pnpm --filter my-dashboard build:dev` 产物包含 `mf-manifest-main.json`，且 `@keyframes` 已被 `pavilion-mfe-my-dashboard-` 前缀化。

## 生命周期契约

```typescript
export default {
  bootstrap?: async (ctx) => {},          // 可选，仅执行一次
  mount: async (ctx, el) => { /* 挂载 */ },  // 必需，返回清理函数更佳
  unmount?: async (ctx, el) => { /* 清理 */ },
  update?: async (ctx, props) => {},      // 可选
}
```

主应用沙箱会自动追踪并清理子应用产生的 timers、intervals 和事件监听器。`keepAlive: true` 时切换不销毁框架实例，只隐藏容器；全局 LRU 驱逐时才完整卸载。

## 部署产物约定

子应用 build 产物由 `@pavilion-mfe/vite` 写入：

```text
dist/
  mf-manifest-main.json
  static/js/...
  static/css/...
```

部署时放到：

```text
<cdn>/mfe/<appCode>/
```

主应用 `preloadPlugin` 会按该路径查找 manifest：

```text
<cdn>/mfe/<appCode>/mf-manifest-main.json
```

## 注意事项

- 新增路由前先检查 `apps/main-app/mfe.json` 和 `apps/main-app/src/router/index.tsx` 的 `routeMeta`，避免与主应用自有路由冲突。
- 子应用样式会被自动加上 `:where(.pavilion-mfe-<appCode>)` 作用域；需要排除的文件可用 `cssExclude` 配置。
- `BrowserRouter` 必须设置与主应用一致的部署前缀；本地开发通常不需要，GitHub Pages 场景使用 `VITE_DEPLOY_BASE`。
