# AI 对话子应用

`ai-chat` 是基于 React 19、assistant-ui 和 Tailwind CSS 的微前端子应用，开发端口为 `6020`，在主应用中的路由前缀为 `/chat`。

## 功能

- 从 llm-gateway `/v1/models` 加载可访问的 Virtual Model；
- 通过 OpenAI 兼容的 `/v1/chat/completions` 接收 SSE 流式回复；
- 创建、读取、重命名、归档和删除聊天会话；
- 将 assistant-ui 消息保存到后端会话；
- 嵌入主应用时复用同源 `sessionStorage.pavilion_token`；
- 独立运行时显示登录页，使用与主应用相同的账号认证；

## 启动与构建

```bash
pnpm --filter ai-chat dev
pnpm --filter ai-chat typecheck
pnpm --filter ai-chat build:dev
pnpm --filter ai-chat build
pnpm --filter ai-chat preview
```

独立开发地址是 `http://localhost:6020`。Vite 将 `/api` 代理到 `VITE_BASE_API_URL`，未设置时使用 `http://localhost:3000`。
同时，Vite 也将 `/v1` 代理到同一网关。

## 模型调用约定

模型列表和聊天补全统一调用 llm-gateway 数据面：

```text
GET  /v1/models
POST /v1/chat/completions
```

浏览器请求携带登录 JWT，并附加 `X-Pavilion-App-Code: ai-chat` 作为统计来源标签。该请求头不是授权凭证。
聊天会话管理仍使用平台控制面 `/api/llm/chat/threads*`；子应用不直接连接 Provider。

## 环境变量

| 变量                         | 说明                     |
| ---------------------------- | ------------------------ |
| `VITE_PAVILION_MFE_APP_CODE` | 必须为 `ai-chat`         |
| `VITE_PAVILION_MFE_ENV`      | 构建环境标签             |
| `VITE_BASE_API_URL`          | 独立开发时的后端代理目标 |
| `VITE_PAVILION_MFE_CDN`      | 子应用部署 CDN 前缀      |

`VITE_` 变量会进入浏览器产物，不得用于传递账号、密码或其他凭据。

## 微前端入口

`src/main.tsx` 暴露 `./main`，导出 `mount` / `unmount`。独立运行时挂载到 `#root`；嵌入运行时由主应用传入容器。下拉菜单 Portal 已固定在 `.pavilion-mfe-ai-chat` 容器内，以匹配 CSS 作用域。
