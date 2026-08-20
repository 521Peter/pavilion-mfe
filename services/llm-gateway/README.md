# Pavilion LLM Gateway

Pavilion 的统一后端。它在一个 NestJS 进程内同时承载：

- 原 `platform-api` 的 `/api/*` 兼容接口；
- OpenAI-compatible `/v1/chat/completions` 与 `/v1/responses`；
- Virtual Model、ordered fallback、Provider Credential 和 Application Key；
- Agent Version、Tool/Skill 绑定、MCP Client 与 MCP Server；
- Run、Provider Attempt、Token/费用 Usage、Audit 和 OpenTelemetry；
- 下游 REST/WebSocket 流式代理与 OpenAPI 聚合。

旧 `platform-api` 已完成切流并删除，开发和部署只使用本服务。

## 本地启动

```bash
cp services/llm-gateway/.env.example services/llm-gateway/.env
pnpm --filter @pavilion-mfe/llm-gateway docker:up
pnpm --filter @pavilion-mfe/llm-gateway prisma:generate
pnpm --filter @pavilion-mfe/llm-gateway prisma:migrate
pnpm --filter @pavilion-mfe/llm-gateway prisma:seed
pnpm dev:service
```

请先替换 `.env` 内的 JWT、Credential Encryption Key、Application Key Pepper 和数据库凭据。生产环境不要提交明文 `.env`。

## 主要入口

| 路径                                          | 用途                                                |
| --------------------------------------------- | --------------------------------------------------- |
| `/api/auth/*`                                 | 登录、注册和用户信息                                |
| `/api/llm/*`                                  | Provider、Model、Deployment 和 Virtual Model 控制面 |
| `/api/applications/*`                         | Application 与一次性展示的 Application Key          |
| `/api/agents/*`                               | Agent Definition 和不可变 Agent Version             |
| `/api/tools/*`、`/api/skills/*`、`/api/mcp/*` | Tool、Skill 与 MCP 管理                             |
| `/api/usage/*`、`/api/audit/*`                | 用量、费用与审计查询                                |
| `/v1/models`                                  | OpenAI-compatible 模型列表                          |
| `/v1/chat/completions`                        | Chat Completions，支持 SSE                          |
| `/v1/responses`                               | Responses，支持 SSE                                 |
| `/v1/agents/:agentId/runs`                    | 固定 Agent Version 的运行入口                       |
| `/v1/runs/:runId`                             | Run 状态、步骤、事件、Attempt 与 Usage              |
| `/mcp`                                        | 网关 MCP Server                                     |
| `/health/live`、`/health/ready`               | 存活和就绪检查                                      |

数据面支持用户 JWT，或 `Authorization: Bearer pav_...` / `x-api-key` Application Key。

## 验证

```bash
pnpm --filter @pavilion-mfe/llm-gateway build
pnpm --filter @pavilion-mfe/llm-gateway test
DATABASE_URL='postgresql://user:password@localhost:5432/pavilion' \
  pnpm --filter @pavilion-mfe/llm-gateway exec prisma validate
```
