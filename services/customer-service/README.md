# Pavilion AI Customer Service

独立 AI 客服业务服务，只监听 `127.0.0.1:3100`，由 `llm-gateway` 通过
`/api/customer-service/*` 统一转发。

## 接口

- `GET /support/session`：获取当前用户客服会话。
- `POST /support/messages`：提交客服问题并返回演示回复。
- `GET /openapi-json`：供网关发现路由与鉴权要求。

业务接口都要求 `auth-user-id`。该请求头由网关在 JWT 校验成功后注入；网关会先移除客户端提交的同名请求头，避免身份伪造。

```bash
pnpm --filter @pavilion-mfe/customer-service dev
```
