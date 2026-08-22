# PavilionMfe 主应用

`main-app` 是 React 19 主应用，负责登录态、整体布局、菜单、多标签页、主应用页面和微前端生命周期编排。开发端口为 `6019`。

## 已实现功能

- 使用 `mfe.json` 注册子应用、路由前缀、开发端口和 Keep-Alive 开关；
- 开发模式直接配置 Module Federation remotes，构建模式通过 `preloadPlugin.ts` 动态注册和预加载；
- 使用 `@pavilion-mfe/router` 挂载子应用，并提供最多 5 个 Keep-Alive 缓存；
- 使用 `@pavilion-mfe/tabs/react` 保存标签状态到 `sessionStorage`；
- 提供登录、Provider、MCP Server、Skill 管理及错误页；
- 将 `/api` 代理到 `http://localhost:3000`。

主应用自有路由定义在 `src/router/index.tsx`，子应用 catch-all 页面是 `src/router/MFPage.tsx`。菜单当前由 `src/api/menu.ts` 模拟，和 `mfe.json` 相互独立。

## 启动与构建

在仓库根目录执行：

```bash
pnpm --filter main-app dev
pnpm --filter main-app typecheck
pnpm --filter main-app build:dev
pnpm --filter main-app build
pnpm --filter main-app preview
```

主应用启动前应先构建 `sandbox`、`router`、`tabs` 和 `vite` 等 workspace 依赖。访问业务页面需要 `llm-gateway` 可用；没有有效 `sessionStorage.pavilion_token` 时会跳转到 `/login`。

## 关键配置

| 文件                   | 作用                                           |
| ---------------------- | ---------------------------------------------- |
| `mfe.json`             | 子应用注册和路由的唯一事实来源                 |
| `vite.config.ts`       | MF、Tailwind、开发代理、部署前缀和 remote 配置 |
| `src/main.tsx`         | React 启动、日志配置和 PavilionMfe 路由启动    |
| `src/preloadPlugin.ts` | 生产构建中的 remote 注册与预加载               |
| `src/router/index.tsx` | 主应用自有路由与鉴权守卫                       |
| `src/api/menu.ts`      | 当前模拟菜单数据                               |

环境变量说明和子应用接入规则见仓库根目录 [`README.md`](../../README.md) 与 [`AGENTS.md`](../../AGENTS.md)。
