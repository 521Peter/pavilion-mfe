# PavilionMfe

基于 **Module Federation** 的微前端开源框架。提取自生产环境的微前端实践，核心包含自研的路由调度器、JS 沙箱隔离、CSS 作用域隔离、路由事件系统、事件桥接和开发者工具链。

## 架构

```
┌──────────────────────────────────────────────────────┐
│                    主应用                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐       │
│  │  Router   │  │ EventBus │  │  Log System   │       │
│  │ 生命周期   │  │ 跨子应用通信  │  │ 分模块开关     │       │
│  │ +路由事件  │  │ +Storage │  │ configureLog() │       │
│  └────┬─────┘  └────┬─────┘  └───────────────┘       │
│       │             │                                  │
│  ┌────▼─────────────▼───────────────────────────────┐  │
│  │              #pavilion-mfe-container                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│  │  │ 子应用 A   │  │ 子应用 B   │  │ 子应用 C   │       │  │
│  │  │ (Vue)     │  │ (React)   │  │ (任意框架) │       │  │
│  │  │ + Sandbox │  │ + Sandbox │  │ + Sandbox │       │  │
│  │  │ +CSS:where│  │ +CSS:where│  │ +CSS:where│       │  │
│  │  │ +路由隔离  │  │ +路由隔离  │  │ +路由隔离  │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│         preloadPlugin (MF 运行时远程注册 + 预加载)        │
└──────────────────────────────────────────────────────┘
```

**主应用** 负责整体布局、生命周期编排、路由分发和子应用预加载。  
**子应用** 是独立的微前端应用，遵循统一的 `mount` / `unmount` 生命周期契约，可使用任意框架。子应用在运行时不含任何 `@pavilion-mfe/*` 代码，仅构建时依赖 `@pavilion-mfe/vite`。

### 包依赖关系

```
bridge (零依赖)    sandbox (零依赖, 含 logger)    tabs (零依赖)
    │                   │                            │
    │                   ▼                            │
    │               router ─────────────────────────┘
    │                   │
    ▼                   ▼
  runtime (聚合层, MF Remote 共享)
    │
    ▼
  vite (Vite 插件, 封装 @module-federation/vite, 仅构建时)
```

## 包

| 包名                    | 说明                                                    | 依赖                                                                  |
| ----------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `@pavilion-mfe/bridge`  | 主应用-子应用事件通信桥（EventBus + StorageSync）       | 零依赖                                                                |
| `@pavilion-mfe/sandbox` | JS 沙箱隔离（栈式副作用追踪 + 路由隔离 + 日志模块）     | 零依赖                                                                |
| `@pavilion-mfe/tabs`    | 多标签页状态管理（Vue 插件 + sessionStorage 持久化）    | 零依赖                                                                |
| `@pavilion-mfe/router`  | 微前端生命周期路由调度器（路由事件 + popstate 隔离）    | `@pavilion-mfe/sandbox` `@pavilion-mfe/tabs`                          |
| `@pavilion-mfe/runtime` | 共享运行时内核，作为 MF Remote 确保单例                 | `@pavilion-mfe/router` `@pavilion-mfe/bridge` `@pavilion-mfe/sandbox` |
| `@pavilion-mfe/vite`    | Vite 插件，封装 Module Federation + CSS 作用域          | `@module-federation/vite`                                             |
| `@pavilion-mfe/cli`     | 命令行工具（`pavilion-mfe dev` / `pavilion-mfe build`） |                                                                       |
| `create-pavilion-mfe`   | 项目脚手架（`npm create pavilion-mfe`）                 |                                                                       |

## 核心概念

### 生命周期

每个子应用导出统一的 `SubAppLifecycle` 契约：

```typescript
export default {
  bootstrap?: async (ctx) => {},   // 一次性初始化（可选）
  mount:      async (ctx, el) => { /* 挂载到 el */ },   // 必需
  unmount:    async (ctx, el) => { /* 清理 */ },        // 可选
  update?:    async (ctx, props) => {}, // 属性更新（可选）
}
```

状态机流转：`NOT_LOADED → LOADING → NOT_MOUNTED → MOUNTING → MOUNTED → UNMOUNTING → NOT_MOUNTED`

### 双层隔离

#### JS 沙箱（栈式副作用追踪）

`Sandbox` 使用模块级 `activeStack` 支持多实例并发。`patchGlobals()` 仅执行一次，拦截 `setTimeout` / `setInterval` / `addEventListener`，每个副作用归属于栈顶沙箱。unmount 时自动清理所有 timers / listeners / globals。

```typescript
import { Sandbox } from "@pavilion-mfe/sandbox";

const sandbox = new Sandbox("my-sub-app");
sandbox.activate(); // 开始追踪副作用
// ... 子应用运行期间的所有 setTimeout/addEventListener 被追踪
sandbox.deactivate(); // 自动清理所有副作用
```

#### CSS 作用域（`:where()` 零特异性）

PostCSS 插件自动为子应用的选择器包裹 `:where(.pavilion-{name})` 作用域前缀。`:where()` 伪类提供**零特异性**，使作用域后的样式保持与原始选择器相同的优先级，避免特异性污染。

```css
/* 输入 */
.card {
  color: red;
}

/* 输出 (prefix = pavilion-mfe-dashboard) */
:where(.pavilion-mfe-dashboard) .card {
  color: red;
}
```

同时自动前缀化 `@keyframes` 名称，防止动画冲突。

### 路由隔离

子应用级 `popstate` 事件隔离：沙箱的 `addEventListener` 补丁将 `popstate` 监听器包裹为代理，仅当 `routeMatcher(appCode, path)` 返回 `true` 时触发。非活跃子应用不会收到导航事件，避免路由冲突。

```typescript
// 路由启动时设置匹配器
import { setRouteMatcher } from "@pavilion-mfe/sandbox";

setRouteMatcher((appCode, path) => {
  return apps.some(app => app.name === appCode && app.activeWhen(path));
});
```

### 环境检测

主应用路由器 `start()` 时注入全局变量 `window.__PAVILION_MFE_ENV__ = true`，子应用可通过该变量判断是否运行在微前端环境中：

```typescript
// 子应用 main.ts / main.tsx

/** 独立运行时自启动 */
if (!window.__PAVILION_MFE_ENV__) {
  // standalone 模式：挂载到本地 #root 元素
  const el = document.getElementById("root");
  // ...
}
```

类型声明通过 `src/globals.d.ts` 提供（`export {}` + `declare global` 模块化方式）：

```typescript
// src/globals.d.ts
export {};

declare global {
  interface Window {
    __PAVILION_MFE_ENV__?: boolean;
  }
}
```

子应用**零运行时依赖**，无需引入 `@pavilion-mfe/*` 包即可检测环境。

### 路由事件系统

路由器在导航各阶段分发 `CustomEvent`，开发者可监听用于埋点、加载状态等：

| 事件                          | 触发时机                     | detail                             |
| ----------------------------- | ---------------------------- | ---------------------------------- |
| `pavilion-mfe:before-routing` | 路由开始切换前               | `{ url, trigger, path, appCode }`  |
| `pavilion-mfe:after-routing`  | 路由切换完成                 | `{ url, trigger, path, appCode }`  |
| `pavilion-mfe:sub-app-switch` | 活跃子应用发生变化           | `{ from: string[], to: string[] }` |
| `pavilion-mfe:before-cache`   | 子应用进入 Keep-Alive 缓存前 | `{ appCode }`                      |
| `pavilion-mfe:after-restore`  | 子应用从缓存恢复显示         | `{ appCode }`                      |
| `pavilion-mfe:sub-app-error`  | 子应用加载/挂载失败          | `{ appCode, phase, error }`        |

```typescript
window.addEventListener("pavilion-mfe:sub-app-switch", e => {
  const { from, to } = (e as CustomEvent).detail;
  console.log("子应用切换:", from, "→", to);
});
```

`trigger` 値：`init` / `pushState` / `replaceState` / `popstate`

事件 `detail` 包含 `{ url, trigger, path, appCode }`，其中 `path` 为解析后的路径名，`appCode` 为当前活跃子应用编码，可用于路由守卫：

```typescript
window.addEventListener("pavilion-mfe:before-routing", e => {
  const { path, appCode } = (e as CustomEvent).detail;
  // 权限检查、埋点、加载状态等
});
```

### 子应用 Keep-Alive 缓存

子应用注册时设置 `keepAlive: true`，切换离开时不销毁框架实例，仅隐藏 DOM（`display:none`）。切换回来时直接恢复显示，跳过重新 `mount`，子应用内状态完整保留：

```typescript
const pavilionMfeRouter = createPavilionMfeRouter({
  apps: mfeApps.map(seg => ({
    name: seg.appCode,
    load: async () => {
      /* ... */
    },
    activeWhen: path => seg.routes.some(/* ... */),
    keepAlive: true // ← 启用缓存
  }))
});
```

状态机增加 `CACHED` 状态：`MOUNTED → (unmount) → CACHED → (restore) → MOUNTED`

沙箱在缓存时**不** `deactivate()`——保留 popstate 代理，非活跃子应用不会收到导航事件。恢复时仅需 `display:block` + 跳过重新 mount。全局 LRU 驱逐时才执行完整的 `deactivate()` + `unmount()`。

### 运行时预加载

`preloadPlugin` 作为 Module Federation 运行时插件，在 `beforeInit` 阶段动态注册所有子应用为 MF 远程模块，并实现预加载策略：

- **当前子应用**：立即 `loadRemote` 加载（用户正在等待）
- **其他子应用**：1 秒后 `preloadRemote` 空闲预取

```typescript
// vite.config.ts (主应用)
PavilionMfe({
  role: "main-app",
  name: appCode, // 由环境变量 VITE_PAVILION_MFE_APP_CODE 注入
  runtimePlugins: ["./src/preloadPlugin"] // 替代静态 pavilionMfeRemotes
});
```

### 日志系统

分模块可配置的控制台日志，帮助开发者调试微前端运行时行为。所有日志使用 CSS 样式美化输出。

```typescript
import { configureLog } from "@pavilion-mfe/router";

configureLog({
  enabled: true,
  modules: {
    router: true, // 路由事件 + 子应用生命周期
    sandbox: true, // 沙箱激活/停用 + popstate 拦截
    preload: true, // MF 远程注册 + 预加载状态
    bridge: true // EventBus emit/subscribe + StorageSync
  }
});
```

日志输出示例：

```
[PavilionMfe] router    router-start       subApps=1
[PavilionMfe] router    sub-app-register   appCode=git-report-generator
[PavilionMfe] router    before-routing     trigger=pushState  url=/git
[PavilionMfe] sandbox   sandbox-activate   appCode=git-report-generator
[PavilionMfe] router    sub-app-load       appCode=git-report-generator  ms=320
[PavilionMfe] router    sub-app-mount      appCode=git-report-generator  ms=45
[PavilionMfe] router    sub-app-switch     main-app → git-report-generator
[PavilionMfe] sandbox   sandbox-deactivate  appCode=git-report-generator  timers=3  intervals=1  listeners=2
[PavilionMfe] preload   register           remotes=1  apps=git-report-generator
[PavilionMfe] bridge    event-emit         name=user-login  listeners=3
```

颜色：`[PavilionMfe]` 绿色 / 模块名 青色 / 事件名 橙色 / 键值对 灰色

也可以通过全局变量配置（在脚本加载前设置）：

```html
<script>
  window.__PAVILION_MFE_LOG__ = { modules: { sandbox: false } };
</script>
```

### 多标签页管理

`@pavilion-mfe/tabs` 提供框架无关的状态管理核心 + Vue / React 插件，支持主应用多标签页导航：

**Vue**

```typescript
// main.ts
import { tabsPlugin } from "@pavilion-mfe/tabs/vue";
app.use(tabsPlugin);

// 任意组件
import { useTabs } from "@pavilion-mfe/tabs/vue";

const { tabs, activeTabId, openTab, closeTab, closeOthers, closeAll } = useTabs();

openTab({ path: "/git", title: "git 报告" }); // 打开/切换到标签
closeOthers(tabId); // 关闭其他标签
closeAll(); // 关闭全部
```

**React**

```tsx
// App.tsx
import { TabsProvider } from "@pavilion-mfe/tabs/react";

<TabsProvider>
  <App />
</TabsProvider>;

// 任意组件
import { useTabs } from "@pavilion-mfe/tabs/react";

const { tabs, openTab, closeAll } = useTabs();
```

标签状态通过 `sessionStorage` 持久化，刷新页面后自动恢复。Vue 与 React 插件共享同一存储 key。

### 通信

`EventBus` 提供按 `appCode` 定向投递的 pub/sub 事件总线。`StorageSync` 提供 LocalStorage 响应式订阅。`@pavilion-mfe/runtime` 作为 MF Shared Remote，确保所有应用共享同一个 EventBus / StorageSync 实例。

### 注册中心

主应用通过 `mfe.json` 声明所有子应用：

```json
{
  "apps": [
    {
      "appCode": "git-report-generator",
      "name": "git 报告",
      "cdn": "",
      "routes": ["/git"],
      "devPort": 6010,
      "keepAlive": false
    }
  ]
}
```

路由注册 + 构建配置的单一事实来源。菜单数据由后端接口提供，与子应用配置解耦。

## 新增并接入子应用

完整步骤见根目录 [`AGENTS.md`](./AGENTS.md)，核心流程如下：

1. 在 `apps/<appCode>/` 新建子应用，参考 `apps/git-report-generator`；`package.json` 的 `name` 与 `appCode` 保持一致。
2. 配置 `.env` / `.env.develop`，设置 `VITE_PAVILION_MFE_APP_CODE`。
3. `vite.config.ts` 使用 `PavilionMfe({ role: 'sub-app', name: appCode, exposes: { './main': './src/main.tsx' }, port, openDevServe: true, shared: [], dts: false })`。
4. `src/main.tsx` 导出 `mount` / `unmount` 生命周期，并通过 `window.__PAVILION_MFE_ENV__` 保留独立运行分支。
5. 在 `apps/main-app/mfe.json` 注册 `appCode` / `name` / `routes` / `devPort` / `keepAlive`。
6. 菜单项加入 `apps/main-app/src/api/menu.ts`；需要静态类型时同步补充 `apps/main-app/src/remote-declarations.d.ts`。
7. 发布到 GitHub Pages 时同步更新 `.github/workflows/deploy.yml` 的构建和产物收集步骤。

子应用接入主应用后，由 `preloadPlugin` 在 MF 运行时动态注册，`createPavilionMfeRouter` 通过 `loadRemote('<appCode>/main')` 加载并按路由前缀激活，无需手写主应用 React Router 子路由。

## 构建优化

`@pavilion-mfe/vite` 在 build 模式自动应用以下优化：

| 优化项                       | 说明                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `esbuild.drop: ['debugger']` | 生产环境移除 debugger 语句                                        |
| `sourcemap: false`           | 禁用 sourcemap 减小体积                                           |
| `cssCodeSplit: true`         | CSS 按路由拆分                                                    |
| chunk 命名规则               | `static/js/[name]-[hash].js` / `static/[ext]/[name]-[hash].[ext]` |
| `publicDir: false`（主应用） | 主应用无静态资源目录                                              |
| Top-Level Await              | 自动注入 `vite-plugin-top-level-await`（MF shared 必需）          |

### Dev Server 代理

`PavilionMfePluginOptions.proxy` 支持配置 dev 模式代理规则：

```typescript
PavilionMfe({
  role: "main-app",
  proxy: { "/api": "http://localhost:3000" }
});
```

## 多仓库架构

实际项目中，主应用和各子应用分属不同 Git 仓库独立发布：

| 角色   | `@pavilion-mfe/*` 依赖                                                                       | 说明                                            |
| ------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 主应用 | `@pavilion-mfe/router` `@pavilion-mfe/sandbox` (runtime dep) + `@pavilion-mfe/vite` (devDep) | 运行时需要路由和沙箱                            |
| 子应用 | `@pavilion-mfe/vite` (devDep only)                                                           | 仅构建时需要，运行时不含 `@pavilion-mfe/*` 代码 |

子应用更新 `@pavilion-mfe/vite` 版本后独立发布即可，**不影响主应用运行时**，无需主应用重新构建。

## 快速开始

```bash
# 安装依赖
pnpm install

# 构建核心包
pnpm -r build

# 启动所有开发服务器（主应用 + 子应用）
pnpm dev
```

主应用运行在 `http://localhost:6019`，`git-report-generator` 运行在 `http://localhost:6010`，`ai-chat` 运行在 `http://localhost:6020`。后续新增子应用从 `6030` 开始按 `+10` 递增使用独立端口，并在 `mfe.json` 中登记 `devPort`。

### 使用 CLI

```bash
# 一键启动（自动构建依赖 + 并行 dev）
pnpm pavilion-mfe dev

# 生产构建
pnpm pavilion-mfe build

# 创建新项目
npm create pavilion-mfe
```

## 开发

```bash
# 仅启动主应用（需要子应用单独启动）
cd apps/main-app && pnpm dev

# 修改核心包后重新构建（按依赖顺序）
pnpm --filter @pavilion-mfe/sandbox build   # 先构建 sandbox（含 logger）
pnpm --filter @pavilion-mfe/bridge build    # bridge 独立
pnpm --filter @pavilion-mfe/router build    # router 依赖 sandbox
pnpm --filter @pavilion-mfe/vite build      # vite 独立
```

## GitHub Pages 部署

本项目支持一键部署到 GitHub Pages，使用 GitHub Actions 自动构建和发布。

### 自动部署（推荐）

推送代码到 `main` 分支即可自动触发部署。首次需要：

1. GitHub 仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**

CI 会依次构建核心包 → 子应用 → 主应用，最后把所有产物部署到 GitHub Pages。

### 环境变量

部署时可在仓库 **Settings** → **Secrets and variables** → **Variables** 中配置：

| 变量                    | 说明                     | 示例                                      |
| ----------------------- | ------------------------ | ----------------------------------------- |
| `VITE_PAVILION_MFE_CDN` | CDN 基础路径             | `/my-repo`（项目页面）或留空（用户页面）  |
| `VITE_DEPLOY_BASE`      | Vite/Vue Router 基础路径 | `/my-repo/`（项目页面）或 `/`（用户页面） |

- **用户页面**（`username.github.io`）：两个变量都留空或不设置
- **项目页面**（`username.github.io/my-repo`）：`CDN` 设为 `/my-repo`，`BASE` 设为 `/my-repo/`

### 手动部署

```bash
# 1. 构建所有子应用（设置 CDN 基础路径）
VITE_PAVILION_MFE_CDN=/my-repo pnpm --filter "./apps/segment-*" build

# 2. 构建主应用
VITE_DEPLOY_BASE=/my-repo/ pnpm --filter main-app build

# 3. 收集产物
mkdir -p dist-ghpages/mfe
cp -r apps/main-app/dist/* dist-ghpages/
cp -r apps/git-report-generator/dist/* dist-ghpages/mfe/git-report-generator/
cp dist-ghpages/index.html dist-ghpages/404.html  # SPA fallback

# 4. 部署到 GitHub Pages（任选一种方式）
# 方式 A：推送到 gh-pages 分支
# 方式 B：使用 gh-pages npm 包
npx gh-pages -d dist-ghpages
```

### 产物目录结构

```
dist-ghpages/
├── index.html                    # 主应用入口
├── 404.html                      # SPA fallback
├── mf-manifest-main.json
├── static/js/...                 # 主应用 chunk
├── mfe/
│   └── git-report-generator/
│       ├── mf-manifest-main.json
│       └── static/js/...
```

## License

MIT
