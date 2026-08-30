# Pavilion LLM 网关

`@pavilion-mfe/llm-gateway` 是仓库的统一 NestJS 后端，默认监听
`3000`。它在同一进程中承载平台控制面、OpenAI 兼容数据面、Agent 运行、MCP、下游代理、限流与可观测性。

旧 `platform-api` 已删除，前端 `/api` 请求只对接本服务。

## 运行依赖

- PostgreSQL 16 + pgvector；
- Redis 7；
- Node.js 与 pnpm；
- 可选的 Ollama、OpenAI 或 OpenAI-compatible Provider；
- AI 客服链路需要单独启动 `@pavilion-mfe/customer-service`。

仓库内 `docker-compose.yml` 提供本地 PostgreSQL（宿主端口 `5433`）和 Redis（宿主端口 `6380`）。

## 首次启动

```bash
cp services/llm-gateway/.env.example services/llm-gateway/.env
pnpm --filter @pavilion-mfe/llm-gateway docker:up
```

然后编辑 `services/llm-gateway/.env`：

- 为 `POSTGRES_USER`、`POSTGRES_PASSWORD` 和 `POSTGRES_DB` 设置部署环境专用值，并在 `DATABASE_URL` 中使用同一组配置；
- 为 `JWT_SECRET`、`SEED_ADMIN_USERNAME`、`SEED_ADMIN_PASSWORD` 和 `APPLICATION_KEY_PEPPER` 设置部署环境专用值；
- `CREDENTIAL_ENCRYPTION_KEY` 必须是 32 字节随机值的 Base64 编码，可用 `openssl rand -base64 32` 生成；
- 不要提交 `.env`，也不要在日志或前端变量中暴露这些值。

完成配置后：

```bash
pnpm --filter @pavilion-mfe/llm-gateway prisma:generate
pnpm --filter @pavilion-mfe/llm-gateway prisma:migrate
pnpm --filter @pavilion-mfe/llm-gateway prisma:seed
pnpm --filter @pavilion-mfe/llm-gateway dev
```

Prisma 命令以 `services/llm-gateway` 为工作目录加载该目录的 `.env`。环境变量都是字符串；布尔值只有精确的 `"true"`
才会启用对应代码分支。

## 环境变量

| 变量                          | 默认值/要求             | 用途                                              |
| ----------------------------- | ----------------------- | ------------------------------------------------- |
| `PORT`                        | `3000`                  | HTTP 监听端口                                     |
| `DATABASE_URL`                | 必填                    | PostgreSQL 连接串                                 |
| `REDIS_HOST` / `REDIS_PORT`   | `REDIS_PORT=6379`       | Redis 连接；Compose 端口为 `6380`                 |
| `JWT_SECRET`                  | 必填                    | JWT 签名                                          |
| `JWT_EXPIRES_IN`              | `1d`                    | JWT 有效期                                        |
| `SEED_ADMIN_USERNAME`         | seed 时必填             | seed 管理员用户名                                 |
| `SEED_ADMIN_PASSWORD`         | seed 时必填             | seed 管理员密码                                   |
| `CORS_ORIGIN`                 | `http://localhost:6019` | 逗号分隔的允许来源                                |
| `API_SERVICES`                | 空数组                  | 下游代理配置 JSON 数组；`host` 可从 `docUrl` 推导 |
| `CREDENTIAL_ENCRYPTION_KEY`   | 必填                    | Base64 编码的 32 字节 AES-256-GCM 密钥            |
| `APPLICATION_KEY_PEPPER`      | 必填                    | Application Key 哈希盐                            |
| `ALLOW_PRIVATE_PROVIDER_URLS` | 生产默认关闭            | 是否允许 Provider/MCP 指向私网地址                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 空                      | OTLP 导出地址；空值表示不导出                     |
| `LLM_RATE_LIMIT_PER_MINUTE`   | `60`                    | LLM 数据面每分钟限流                              |
| `LLM_CONCURRENCY_LIMIT`       | `10`                    | LLM 数据面并发限制                                |

Redis TLS 还支持 `REDIS_TLS`、`REDIS_TLS_CA_FILE`、`REDIS_TLS_CERT_FILE`、`REDIS_TLS_KEY_FILE`、`REDIS_TLS_SERVERNAME`
和 `REDIS_TLS_REJECT_UNAUTHORIZED`，具体解析以 `src/config/env.config.ts` 为准。

## 当前 API

### 平台控制面

控制面响应通常包装为 `{ code, data, msg }`，登录和注册是公开接口，其余接口由全局 JWT/RBAC 守卫保护。

| 路径                                                | 能力                                       |
| --------------------------------------------------- | ------------------------------------------ |
| `/api/auth/*`                                       | 登录、注册和当前用户                       |
| `/api/llm/providers*`、`/api/llm/models*`           | Provider 与模型管理                        |
| `/api/llm/deployments*`、`/api/llm/virtual-models*` | 模型部署和 Virtual Model                   |
| `/api/llm/chat/threads*`                            | 平台会话与消息管理                         |
| `/api/applications*`                                | Application 与一次性返回的 Application Key |
| `/api/agents*`                                      | Agent 定义和版本发布                       |
| `/api/tools*`                                       | Tool 定义                                  |
| `/api/skills*`                                      | 本地 Skill、文件、远程安装和仓库源         |
| `/api/mcp/servers*`                                 | MCP Server 配置、测试、同步和调用          |
| `/api/usage*`、`/api/audit*`                        | 用量和审计查询                             |

### LLM 数据面

| 路径                            | 能力                              |
| ------------------------------- | --------------------------------- |
| `GET /v1/models`                | 可访问的 Virtual Model 列表       |
| `POST /v1/chat/completions`     | OpenAI Chat Completions，支持 SSE |
| `POST /v1/responses`            | OpenAI Responses，支持 SSE        |
| `POST /v1/agents/:agentId/runs` | 创建固定 Agent Version 的运行     |
| `GET /v1/runs/:id`              | 查询运行状态                      |
| `POST /v1/runs/:id/cancel`      | 取消运行                          |

浏览器调用数据面时必须同时发送 `Authorization: Bearer <JWT>` 和 `X-Pavilion-App-Code`。后端服务使用
`x-api-key: pav_...`（也兼容 `Authorization: Bearer pav_...`）进行应用认证。模型执行只通过 `/v1/models`、
`/v1/chat/completions` 与 `/v1/responses`；`/api/llm/chat/threads*` 只管理平台会话和消息。推理管线实现 Virtual
Model 路由、ordered fallback、运行记录、Provider Attempt 和 Usage；流式响应已经发出首个块后不会再透明 fallback。

### 网关与运维入口

| 路径                           | 说明                                 |
| ------------------------------ | ------------------------------------ |
| `POST /mcp`                    | 网关自身的 MCP Server                |
| `/documents`、`/document-json` | 下游聚合 API 文档                    |
| `/swagger`                     | 本地 Swagger UI                      |
| `/health/live`                 | 进程存活检查                         |
| `/health/ready`                | PostgreSQL、Redis 和下游文档就绪检查 |

`API_SERVICES` 控制普通 REST/WebSocket 下游代理。接入客服服务时，应在部署环境中配置 `prefix: "api/customer-service"`
和指向客服 `/openapi-json` 的 `docUrl`。客户端提交的 `auth-user-id`、`auth-application-id`
等内部头会先被移除，认证通过后再由网关注入可信身份。代码不读取 `CUSTOMER_SERVICE_URL`，需要改地址时应修改
`API_SERVICES[].docUrl`（或显式填写同源 `host`）。

## 验证

```bash
pnpm --filter @pavilion-mfe/llm-gateway typecheck
pnpm --filter @pavilion-mfe/llm-gateway build
pnpm --filter @pavilion-mfe/llm-gateway test
pnpm --filter @pavilion-mfe/llm-gateway exec prisma validate
```

`prisma validate` 需要可解析的 `DATABASE_URL`，测试和就绪检查可能还需要可用的 PostgreSQL、Redis 或外部 Provider。

## 安全边界

- Provider Credential 使用 AES-256-GCM 加密，管理接口只应返回掩码；
- Application Key 只保存哈希，明文仅在创建时返回一次；
- 生产环境启动时强制要求 JWT、Credential Encryption Key 和 Application Key Pepper；
- 生产环境默认拒绝指向私网的 Provider/MCP HTTP URL；
- Skill 文件访问必须经过名称与路径规范化；
- 真实密钥只应存在于本地未跟踪的 `.env`、部署平台 Secret 或加密配置中。
