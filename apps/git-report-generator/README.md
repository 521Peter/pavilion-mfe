# Git 报告生成器子应用

`git-report-generator` 是一个 React 19 微前端示例，开发端口为 `6010`，在主应用中的路由前缀为 `/git`。它也是新增 React 子应用时最接近当前生命周期约定的参考实现。

## 启动与构建

```bash
pnpm --filter git-report-generator dev
pnpm --filter git-report-generator build:dev
pnpm --filter git-report-generator build
pnpm --filter git-report-generator preview
```

独立开发地址是 `http://localhost:6010/git`。应用内部使用 `BrowserRouter`，`src/App.tsx` 显式注册 `/git`。

## 接入方式

`vite.config.ts` 使用 `PavilionMfe({ role: "sub-app" })` 并暴露 `./main`。`src/main.tsx` 同时支持：

- 独立运行：挂载到本地 `#root`；
- 微前端运行：由主应用调用 `mount(context, element)`，返回 React 根节点清理函数。

构建产物包含根目录的 `mf-manifest-main.json` 和 `static/` 资源。生产部署路径为 `<cdn>/mfe/git-report-generator/`。

详细接入规范见仓库根目录 [`AGENTS.md`](../../AGENTS.md)。
