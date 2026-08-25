# PavilionMfe

PavilionMfe 是一个基于 Vite 与 Module Federation 的微前端 monorepo。主应用负责布局、鉴权、菜单、多标签页、路由调度和远程模块加载；子应用通过统一的 `mount` / `unmount` 生命周期接入。仓库还包含 Electron 桌面壳、统一 LLM Gateway 和独立 AI 客服服务。

本文描述当前代码已经实现的能力。新增子应用的完整操作清单见 [`AGENTS.md`](./AGENTS.md)。

## 当前组成

```text
apps/
  main-app/               React 主应用
  git-report-generator/   Git 报告子应用
  ai-chat/                AI 对话子应用
  ai-customer/            AI 客服子应用
packages/
  bridge/                 EventBus、StorageSync 与导航辅助函数
  sandbox/                副作用追踪、路由隔离和运行时日志
  tabs/                   框架无关状态核心及 React/Vue 适配层
  router/                 子应用生命周期路由器
  runtime/                bridge/router/sandbox 的聚合导出
  vite/                   Module Federation、CSS 作用域和端口发现插件
  cli/                    命令行工具骨架
  create-pavilion/        最小子应用脚手架
  desktop/                Electron 桌面壳
services/
  llm-gateway/            NestJS 统一后端、LLM 数据面和代理网关
  customer-service/       仅允许经网关访问的 AI 客服服务
```

当前应用及服务端口：

| 模块                   | 地址                    | 说明                              |
| ---------------------- | ----------------------- | --------------------------------- |
| `main-app`             | `http://localhost:6019` | 主应用                            |
| `git-report-generator` | `http://localhost:6010` | 路由前缀 `/git`                   |
| `ai-chat`              | `http://localhost:6020` | 路由前缀 `/chat`                  |
| `ai-customer`          | `http://localhost:6030` | 路由前缀 `/customer-service`      |
| `llm-gateway`          | `http://localhost:3000` | 统一 `/api`、`/v1` 和 `/mcp` 入口 |
| `customer-service`     | `http://127.0.0.1:3100` | 只监听回环地址                    |
| 开发端口发现服务       | `ws://localhost:8356`   | 由 CLI/子应用插件使用             |

下一个子应用应从未占用的 `6040` 开始，按 `+10` 递增。

## 架构与依赖

主应用在开发模式下根据 [`apps/main-app/mfe.json`](./apps/main-app/mfe.json) 生成静态 remote 配置；生产构建则由 [`preloadPlugin.ts`](./apps/main-app/src/preloadPlugin.ts) 在 Module Federation 初始化前动态注册 remote。路由器根据路径前缀加载生命周期，并把子应用挂载到 `#pavilion-mfe-container`。

核心包的代码依赖关系如下：

```text
sandbox ──> router ──┐
bridge ──────────────┼──> runtime
sandbox ─────────────┘

tabs                  （独立）
vite                  （独立的构建插件）
cli                   （独立的命令行工具）
```

| 包                      | 当前职责                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| `@pavilion-mfe/bridge`  | 发布订阅、按 `appCode` 定向投递、LocalStorage 同步与 `navigateTo`                 |
| `@pavilion-mfe/sandbox` | 追踪并清理定时器、全局事件监听器和显式登记的全局变量；隔离子应用 `popstate`       |
| `@pavilion-mfe/router`  | 注册、加载、挂载、卸载和 Keep-Alive 子应用；提供路由事件和生命周期 Hook           |
| `@pavilion-mfe/tabs`    | 标签状态核心、React Provider、Vue 插件和 `sessionStorage` 持久化                  |
| `@pavilion-mfe/runtime` | 聚合导出 router、bridge 和 sandbox 的公共能力；当前应用没有把它注册为共享 remote  |
| `@pavilion-mfe/vite`    | 封装 `@module-federation/vite`，处理构建路径、CSS 作用域、manifest 和开发端口发现 |
| `@pavilion-mfe/cli`     | 当前只启动端口发现进程并输出构建参数，尚未实现完整的 monorepo 编排                |
| `create-pavilion-mfe`   | 生成最小无框架示例；仓库内 React 子应用仍应优先参考现有应用和 `AGENTS.md`         |

主、子应用都显式使用 `shared: []`，React 等框架依赖由每个应用自行携带，以避免版本错配。

## 生命周期与隔离

子应用默认导出以下契约：

```typescript
export default {
  bootstrap: async context => {}, // 可选，只执行一次
  mount: async (context, element) => {
    // 必需；返回框架清理函数更稳妥
    return () => {};
  },
  unmount: async (context, element) => {}, // 可选
  update: async (context, props) => {} // 可选；路由器当前不主动调用
};
```

`context` 至少包含 `appCode` 和 `basename`。状态会在 `NOT_LOADED`、`LOADING`、`NOT_MOUNTED`、`MOUNTING`、`MOUNTED`、`UNMOUNTING` 和 `CACHED` 等状态间流转。

路由器在 `start()` 时设置 `window.__PAVILION_MFE_ENV__ = true`。子应用据此区分独立运行和嵌入运行，无需在运行时依赖 `@pavilion-mfe/*`。

沙箱会在挂载前激活并追踪：

- `setTimeout` / `clearTimeout`；
- `setInterval` / `clearInterval`；
- `window.addEventListener` / `window.removeEventListener`；
- 通过 `trackGlobal()` 显式登记的全局变量。

完整卸载时会清理这些副作用。`keepAlive: true` 时只隐藏容器并保留框架实例与沙箱；缓存数量超过 `maxCache`（主应用设置为 5）后按 LRU 完整卸载最早缓存的子应用。

### CSS 作用域

子应用构建时，Vite 插件把普通选择器改写到零特异性的作用域下，并给关键帧重命名：

```css
/* 输入 */
.card {
  color: red;
}

/* appCode = ai-chat 时的输出 */
:where(.pavilion-mfe-ai-chat) .card {
  color: red;
}
```

`html`、`body` 不加作用域前缀。Portal 必须挂载在子应用根容器内，否则作用域样式无法命中。子应用内部应使用 `height: 100%` / `h-full` 继承宿主容器高度，不应在业务容器使用 `100vh` / `h-screen`。

### 路由事件

路由器向 `window` 分发以下事件：

| 事件                          | `detail`                          | 时机                               |
| ----------------------------- | --------------------------------- | ---------------------------------- |
| `pavilion-mfe:before-routing` | `{ url, trigger, path, appCode }` | 路由切换前                         |
| `pavilion-mfe:after-routing`  | `{ url, trigger, path, appCode }` | 路由切换完成后                     |
| `pavilion-mfe:sub-app-switch` | `{ from, to }`                    | 活跃子应用集合变化后               |
| `pavilion-mfe:before-cache`   | `{ appCode }`                     | 子应用进入缓存时；名称沿用现有 API |
| `pavilion-mfe:after-restore`  | `{ appCode }`                     | 缓存恢复后                         |
| `pavilion-mfe:sub-app-error`  | `{ appCode, phase, error, ms }`   | 加载失败时                         |

`trigger` 为 `init`、`pushState`、`replaceState` 或 `popstate`。路由器也支持 `beforeLoad`、`afterLoad`、`beforeMount`、`afterMount`、`beforeUnmount`、`afterUnmount`、`beforeCache`、`afterRestore` 和 `onError` Hook。

## 快速开始

前置条件：Node.js、pnpm；运行后端还需要 Docker（或可用的 PostgreSQL 与 Redis）。

```bash
pnpm install

# 类型检查整个 workspace
pnpm typecheck

# 启动所有具有 dev 脚本的 workspace 包，桌面壳除外
pnpm dev
```

`pnpm dev` 会同时启动核心包监听构建、全部 Web 应用和两个后端服务。首次开发更容易排查的方式是按需启动：

```bash
# 先构建核心包
pnpm --filter @pavilion-mfe/sandbox build
pnpm --filter @pavilion-mfe/bridge build
pnpm --filter @pavilion-mfe/tabs build
pnpm --filter @pavilion-mfe/router build
pnpm --filter @pavilion-mfe/runtime build
pnpm --filter @pavilion-mfe/vite build

# 分别启动后端、主应用和需要的子应用
pnpm --filter @pavilion-mfe/llm-gateway dev
pnpm --filter @pavilion-mfe/customer-service dev
pnpm --filter main-app dev
pnpm --filter ai-chat dev
```

LLM Gateway 首次启动步骤和必需配置见 [`services/llm-gateway/README.md`](./services/llm-gateway/README.md)。

### 常用构建命令

```bash
pnpm build
pnpm build:dev
pnpm --filter main-app build:dev
pnpm --filter ai-chat build:dev
pnpm build:desktop
pnpm package:desktop
```

`@pavilion-mfe/cli` 中的 `pavilion-mfe dev/build` 当前不是完整工作流，请不要用它替代上述 pnpm workspace 命令。

## 子应用注册

[`apps/main-app/mfe.json`](./apps/main-app/mfe.json) 是子应用路由和 remote 注册的唯一事实来源：

```json
{
  "apps": [
    {
      "appCode": "ai-customer",
      "name": "AI 客服",
      "cdn": "",
      "routes": ["/customer-service"],
      "devPort": 6030,
      "keepAlive": false
    }
  ]
}
```

菜单与 remote 注册解耦，当前模拟菜单位于 [`apps/main-app/src/api/menu.ts`](./apps/main-app/src/api/menu.ts)。主应用自有路由位于 [`apps/main-app/src/router/index.tsx`](./apps/main-app/src/router/index.tsx)，新增前缀时必须同时检查这两处，避免冲突。

构建后的子应用应部署到：

```text
<cdn>/mfe/<appCode>/mf-manifest-main.json
<cdn>/mfe/<appCode>/static/...
```

## 环境变量

Vite 会按 mode 读取各应用目录中的环境文件。前端可见变量必须以 `VITE_` 开头，不能放置服务端密钥。

| 变量                         | 用途                                         |
| ---------------------------- | -------------------------------------------- |
| `VITE_PAVILION_MFE_APP_CODE` | MF 名称与 CSS 作用域名称，必须等于 `appCode` |
| `VITE_PAVILION_MFE_ENV`      | 环境标签，默认 `develop`                     |
| `VITE_BASE_API_URL`          | 子应用独立开发时的 `/api` 代理目标           |
| `VITE_PAVILION_MFE_CDN`      | 子应用产物的 CDN 前缀                        |
| `VITE_DEPLOY_BASE`           | 主应用部署基础路径                           |

服务端只提交 `.env.example`。本地 `.env` 应保存占位符替换后的私密值并保持不入库；生产环境应使用部署平台的 Secret 管理或加密环境文件。不要在日志、文档或前端变量中暴露 JWT、Provider Credential、Application Key Pepper 等密钥。

## GitHub Pages

现有 [部署工作流](./.github/workflows/deploy.yml) 在推送 `main` 后构建并发布主应用和 `git-report-generator`。它目前不会发布 `ai-chat` 或 `ai-customer`，因此线上只保证 `/git` 对应的 remote 存在；若要开放其他子应用，必须同步增加构建和 `dist-ghpages/mfe/<appCode>` 产物收集步骤。

工作流使用：

- `PAVILION_MFE_CDN`：默认 `/pavilion-mfe`；
- `VITE_DEPLOY_BASE`：默认 `/pavilion-mfe/`。

## 相关文档

- [`AGENTS.md`](./AGENTS.md)：新增和接入子应用的代码级约定
- [`apps/main-app/README.md`](./apps/main-app/README.md)：主应用说明
- [`apps/ai-chat/README.md`](./apps/ai-chat/README.md)：AI 对话子应用
- [`apps/ai-customer/README.md`](./apps/ai-customer/README.md)：AI 客服子应用
- [`apps/git-report-generator/README.md`](./apps/git-report-generator/README.md)：Git 报告子应用
- [`services/llm-gateway/README.md`](./services/llm-gateway/README.md)：统一后端
- [`services/customer-service/README.md`](./services/customer-service/README.md)：AI 客服服务
- [`PAVILION_LLM_GATEWAY_REFACTOR_PLAN.md`](./PAVILION_LLM_GATEWAY_REFACTOR_PLAN.md)：网关重构结果与历史决策

## 许可证

MIT
