# Pavilion AI 客服服务

`@pavilion-mfe/customer-service` 是独立的 NestJS AI 客服演示服务。它默认只监听 `127.0.0.1:3100`，设计上不直接暴露给浏览器，而是由 `llm-gateway` 统一转发 `/api/customer-service/*`。

## 接口

- `GET /support/session`：创建或恢复当前用户的客服会话；
- `POST /support/messages`：提交客服问题并返回规则化演示回复；
- `GET /openapi-json`：供网关发现路由与鉴权要求；
- `GET /swagger`：本服务 Swagger UI。

两个 `/support` 接口都要求 `auth-user-id`。该请求头应由网关在 JWT 校验成功后注入；缺失时服务返回 403。不要把本服务直接部署到公网，也不要允许客户端绕过网关自行设置该请求头。

## 启动与验证

```bash
pnpm --filter @pavilion-mfe/customer-service dev
pnpm --filter @pavilion-mfe/customer-service typecheck
pnpm --filter @pavilion-mfe/customer-service test
pnpm --filter @pavilion-mfe/customer-service build
pnpm --filter @pavilion-mfe/customer-service start:prod
```

可通过 `PORT` 修改监听端口，但监听地址固定为 `127.0.0.1`。完整链路还需要启动 `llm-gateway`，并在网关的 `API_SERVICES` 中使用 `prefix: "api/customer-service"` 注册本服务的 `/openapi-json`。网关代码不读取 `CUSTOMER_SERVICE_URL`。
