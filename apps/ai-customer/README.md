# AI 客服子应用

`ai-customer` 是 React 19 微前端子应用，开发端口为 `6030`，在主应用中的路由前缀为 `/customer-service`。它通过统一网关访问独立的 AI 客服服务。

## 请求链路

```text
ai-customer
  └─ /api/customer-service/*
      └─ llm-gateway :3000
          └─ customer-service 127.0.0.1:3100
```

子应用不会直连 `customer-service`。网关完成 JWT 校验后移除客户端伪造的内部身份头，再向下游注入 `auth-user-id`。网关必须在 `API_SERVICES` 中以 `prefix: "api/customer-service"` 注册客服服务；`CUSTOMER_SERVICE_URL` 不会被当前代码读取。

当前使用的业务接口：

- `GET /api/customer-service/support/session`：创建或恢复客服会话；
- `POST /api/customer-service/support/messages`：发送问题并获取客服回复；
- `POST /api/auth/login`：独立运行时登录。

## 启动与构建

先启动两个后端服务，再启动子应用：

```bash
pnpm --filter @pavilion-mfe/llm-gateway dev
pnpm --filter @pavilion-mfe/customer-service dev
pnpm --filter ai-customer dev

pnpm --filter ai-customer typecheck
pnpm --filter ai-customer build:dev
pnpm --filter ai-customer build
```

独立开发地址为 `http://localhost:6030`。Vite 将 `/api` 代理到 `VITE_BASE_API_URL`，未设置时使用 `http://localhost:3000`。

嵌入主应用时复用 `sessionStorage.pavilion_token`；独立运行且没有有效 token 时显示应用内登录页。
