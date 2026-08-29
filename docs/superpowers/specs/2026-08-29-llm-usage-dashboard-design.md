# LLM 用量统计与统一模型入口设计

## 背景

PavilionMfe 已由 `llm-gateway` 提供统一网关能力，并具备两类模型调用入口：

- `/v1/*` 数据面：经过 Virtual Model 路由、Provider Attempt、Run 和 UsageRecord，支持用户 JWT 与 Application Key；
- `/api/llm/chat*` 旧平台接口：按 `providerId`、`modelId` 直接获取模型实例，不经过统一用量记录链路。

当前 `ai-chat` 与 `git-report-generator` 使用旧接口，因此现有 UsageRecord 无法覆盖实际子应用调用。项目需要将模型调用统一收敛到 `/v1/*`，并在主应用提供仅管理员可见的“用量统计”页面。

本次只统计 LLM 用量，不统计普通 HTTP、WebSocket、静态资源或下游业务服务代理请求。`git-report-generator` 独立开发模式的 `/api` 代理和尚未调用模型的 `customer-service` 不在本次改造范围内。

## 目标

1. `/v1/*` 成为唯一公开的模型执行入口。
2. 浏览器子应用通过用户 JWT 调用模型，并以应用代码标记统计来源。
3. 后端服务通过 Application Key 调用模型，并以密钥所属应用作为可信来源。
4. 保留现有 Provider Adapter、Factory、Registry、密钥解密、模型缓存和热更新核心逻辑。
5. 完整记录成功、失败、取消、重试、fallback、Token、费用和延迟。
6. 在主应用新增仅管理员可见的“用量统计”页面，提供汇总、趋势、分布和调用明细。
7. 统计查询和补录故障不得影响模型数据面的可用性。

## 非目标

- 不采集普通网关请求数、状态码、流量或业务服务延迟。
- 不为 `customer-service` 增加模型调用。
- 不修改 `git-report-generator` 的独立开发代理配置。
- 不引入 Prometheus、ClickHouse、OpenMeter 或新的事件基础设施。
- 不将用量统计作为正式账单；费用始终标记为估算费用。
- 第一版不自动清理历史 Run、ProviderAttempt 或 UsageRecord，沿用当前持久化策略。

## 调研结论

- Apache APISIX 按 route、service、consumer 等稳定维度记录请求、状态、延迟和流量，并注意控制标签基数。
- OpenMeter 使用带唯一 ID 的用量事件、主体、分组维度和时间窗口聚合，并通过去重支持重试与补录。
- PavilionMfe 已有 Run、ProviderAttempt 和 UsageRecord，继续扩展现有模型可避免重复事实来源；请求 ID 可作为补录幂等键，应用、Virtual Model 和 Provider 可作为有限基数维度。

参考项目：

- <https://github.com/apache/apisix>
- <https://github.com/openmeterio/openmeter>

## 总体架构

```text
浏览器子应用                         后端服务
JWT + X-Pavilion-App-Code            x-api-key
          │                              │
          └──────────────┬───────────────┘
                         ▼
                 /v1 模型数据面
                         │
                 身份与来源应用解析
                         │
                  Virtual Model 路由
                         │
             LlmProviderService.getDeploymentModel
                         │
             ProviderFactory / Adapter Registry
                         │
                  OpenAI / Ollama Adapter
                         │
       Run + ProviderAttempt + UsageRecord
                         │
                管理员统计查询 API
                         │
               主应用“用量统计”页面
```

### 保留的 Provider 核心链路

`/v1/*` 已通过 `LlmProviderService.getDeploymentModel()` 调用 `ProviderFactory.create()`。因此本次不修改：

- `ProviderAdapterBuilder` 接口；
- `OpenAIAdapterBuilder` 与 `OllamaAdapterBuilder`；
- Provider Registry 的注册方式；
- Provider Credential 解密；
- LangChain `BaseChatModel` 构造方式；
- 模型实例缓存及配置更新后的缓存失效。

Virtual Model 只在 Adapter 之前提供逻辑模型路由、fallback、限流和权限控制。

## 身份与来源应用

### 用户 JWT

通过 JWT 调用 `/v1/*` 时，客户端必须发送：

```http
Authorization: Bearer <user-jwt>
X-Pavilion-App-Code: ai-chat
```

网关验证 JWT 后，根据 `X-Pavilion-App-Code` 查找启用的 Application：

- 缺少请求头：返回 400；
- 应用不存在或已停用：返回 400；
- 合法：同时把 `userId` 和来源 `applicationId` 写入 Run 与 UsageRecord。

应用代码是统计标签，不参与用户授权。已认证用户理论上可以声明另一个有效应用代码，因此它不能作为安全边界。

### Application Key

后端服务使用以下任一形式调用：

```http
x-api-key: pav_xxxxx
```

或：

```http
Authorization: Bearer pav_xxxxx
```

网关以密钥所属 Application 作为可信调用来源，并忽略 `X-Pavilion-App-Code` 对归属的覆盖。无效、过期或已撤销的密钥返回 401。

### 应用登记

- 保留已有 `main-app`、`ai-chat` 种子数据；
- 新增 `git-report-generator` Application；
- 应用代码与微前端 `appCode` 保持一致。

## 模型调用入口迁移

### 子应用

`ai-chat` 与 `git-report-generator` 从：

```text
POST /api/llm/chat/stream
```

迁移到：

```text
POST /v1/chat/completions
```

请求使用 Virtual Model 名称，不再把 Provider ID 和物理 Model ID 作为执行协议的一部分。流式响应按 OpenAI 兼容 SSE 解析，并处理最终 `[DONE]` 事件。

### 旧接口

完成两个子应用迁移并通过测试后：

- 移除 `/api/llm/chat` 与 `/api/llm/chat/stream` 模型执行路由；
- 保留 `/api/llm/chat/threads*` 会话管理路由；
- 不保留未计量的公开模型执行旁路。

## 数据模型与统计事实

### Run

Run 是一次逻辑模型请求的明细主记录，负责表达：

- 请求 ID；
- 用户和来源应用；
- Virtual Model；
- 状态：queued、running、completed、failed、cancelled；
- 开始、完成或取消时间；
- RunStep、RunEvent 和 ProviderAttempt 关系。

JWT 调用允许 `userId` 与 `applicationId` 同时存在。Application Key 调用只设置 `applicationId`。

### ProviderAttempt

ProviderAttempt 表达一次实际上游尝试，记录 Deployment、尝试序号、状态、错误类型、状态码、首 Token 延迟、总延迟及已知 Token。它用于分析重试、fallback 和 Provider 故障。

### UsageRecord

UsageRecord 表达一次正常完成的模型用量，保存：

- 输入、输出、缓存和推理 Token；
- 调用发生时计算的估算费用；
- 总延迟；
- fallback 次数；
- Run、用户、来源 Application、Virtual Model 和实际 Deployment。

费用使用调用当时的 Deployment 单价计算并持久化，后续修改价格不会重算历史费用。第一版约定
`inputPricePerM`、`outputPricePerM` 和 `estimatedCost` 的币种均为美元，页面以 USD 展示。

### 索引与幂等

- 保留现有 `createdAt`、`applicationId + createdAt`、`virtualModelId + createdAt` 索引；
- 根据最终查询计划补充 Run 的状态时间索引和 UsageRecord 的 Deployment 时间索引；
- UsageRecord 对一个成功 Run 只允许一条最终用量记录，以 `runId` 唯一约束或等价 upsert 保证补录幂等；
- 所有统计查询必须限定时间范围，避免无界扫描。

## 统计口径

- 调用数：指定范围内创建的全部 Run。
- 成功数：`Run.status = completed`。
- 失败数：`Run.status = failed`。
- 取消数：`Run.status = cancelled`，独立展示。
- 成功率：`completed / (completed + failed)`；queued、running、cancelled 不进入分母。
- 成功率分母为 0 时返回 0，而不是 `null`。
- Token 与费用：成功 Run 对应 UsageRecord 的合计。
- 平均延迟：成功 UsageRecord 中有效 `latencyMs` 的平均值。
- fallback：UsageRecord 的 `fallbackCount` 以及 ProviderAttempt 数量共同呈现。
- 流式调用中途断开：Run 标记为 cancelled 或 failed，不将不完整 Token 和费用加入汇总。

旧接口迁移前产生且没有 UsageRecord 的调用不做历史回填；页面只展示已有可验证数据。

## 用量写入与补录

流式响应可能已经向客户端发送内容，不能因为最后一次 UsageRecord 写入失败而把已完成响应改成失败。完成模型调用时：

1. 在 Run 的完成快照中保存用量、Deployment、费用计算输入等最小恢复字段；不为统计 API 返回提示词或模型输出。
2. 尝试幂等写入 UsageRecord。
3. 写入失败时记录结构化错误，但正常结束客户端响应。
4. 定时补录任务扫描“completed 且缺少 UsageRecord”的 Run，根据完成快照执行 upsert。
5. 补录任务限制批次大小和重试频率，单条失败不阻塞其他记录。

统计数据允许短暂最终一致，但统计故障不得降低模型调用可用性。

## 管理员统计 API

所有接口沿用 `@PlatformApi()` 与 `@Roles("ADMIN")`，普通用户和 Application Key 均无权访问。普通用户通过 JWT
认证后因角色不足返回 403；Application Key 不是 Platform API 凭据，返回 401。

### `GET /api/usage/overview`

返回调用数、成功/失败/取消数、成功率、各类 Token、估算费用、平均延迟和 fallback 数。

### `GET /api/usage/timeseries`

按小时或天返回调用数、成功/失败数、Token 和费用趋势。默认根据查询跨度选择粒度，也允许显式指定受支持粒度。

### `GET /api/usage/breakdown`

按以下有限维度分组：

- Application；
- Virtual Model；
- Provider/Deployment。

### `GET /api/usage/runs`

服务端分页返回调用明细，支持时间、Application、Virtual Model、Provider、状态和请求 ID 筛选。响应只选择统计所需字段，不返回 Run.input、Run.output、对话消息、密钥或 Credential。

所有接口默认最近 7 天，接受 ISO 8601 起止时间，单次查询跨度最多 366 天。数据库、时间桶和接口使用
UTC，页面按浏览器本地时区展示。明细默认每页 20 条、最多 100 条，分页替换现有固定 `take: 500`
行为。分布接口每个维度默认返回前 10 项，其余合并为“其他”。

## 主应用“用量统计”页面

### 接入

- 路由：`/usage`；
- 菜单：`AI 能力中心 → 用量统计`；
- 页面：`apps/main-app/src/pages/Usage.tsx`；
- API：`apps/main-app/src/api/usage.ts`；
- 在 `routeMeta` 中登记“用量统计”，接入现有 Tab 体系。

### 页面布局

1. 筛选区：最近 24 小时、7 天、30 天、自定义时间，以及 Application、Virtual Model、Provider 和状态。
2. 指标卡：总调用数、成功率、输入 Token、输出 Token、估算费用、平均延迟。
3. 趋势图：调用量、Token、费用三个视图，使用本地 SVG 组件，不新增大型图表依赖。
4. 分布区：来源应用、Virtual Model、Provider/Deployment、失败与 fallback 排行。
5. 明细表：时间、请求 ID、状态、来源应用、调用身份、Virtual Model、实际 Provider/模型、Token、估算费用、延迟、fallback 次数。

### 交互与状态

- 首次加载显示 Skeleton；
- 各统计区域独立处理错误和重试，不因单个接口失败导致整页白屏；
- 无数据时保留筛选条件并显示空状态；
- 筛选变化时取消过期请求；
- 明细使用服务端分页，请求 ID 支持复制；
- 小额费用保留足够精度并明确标注“估算费用”；
- 窄屏指标卡换行，明细表横向滚动；页面容器使用 `height: 100%` 体系，不引入 `100vh`。

## 错误处理与安全

- 来源应用错误、认证错误、模型权限错误返回明确且可区分的客户端错误。
- Provider 错误写入 Run 与 ProviderAttempt；对外错误不包含 Credential、内部 URL 或堆栈。
- 用量写入、补录和统计查询错误使用结构化日志记录。
- 统计 API 不返回提示词、模型输出或完整内部错误对象。
- 查询参数通过 DTO 验证，限制时间跨度、分页大小、排序字段和分组维度。
- `X-Pavilion-App-Code` 仅作为统计来源，不参与授权决策。

## 测试策略

### 后端单元与集成测试

- JWT + 合法、缺失、非法、停用 App Code；
- Application Key 的优先级、过期、撤销和来源归属；
- `/v1` 非流式、流式、失败、取消、重试和 fallback 的 Run/UsageRecord；
- UsageRecord 幂等写入与失败补录；
- overview、timeseries、breakdown、runs 的时间、筛选、分组、分页和统计口径；
- ADMIN 可访问，普通用户返回 403，Application Key 返回 401；
- 统计响应不包含输入消息、模型输出和 Credential；
- OpenAI/Ollama Adapter、ProviderFactory 和 Registry 的既有行为保持通过。

### 前端测试与验证

- 两个子应用的 OpenAI 兼容 SSE 解析、`[DONE]`、错误与取消；
- 请求携带 JWT 与正确的 `X-Pavilion-App-Code`；
- 用量页面加载、筛选、空状态、局部错误重试、过期请求取消和分页；
- 响应式布局和现有主应用 Tab/菜单行为。

### 完成验证

- `pnpm --filter @pavilion-mfe/llm-gateway typecheck`
- `pnpm --filter @pavilion-mfe/llm-gateway test`
- `pnpm --filter @pavilion-mfe/llm-gateway build`
- `pnpm --filter main-app typecheck`
- `pnpm --filter main-app build:dev`
- `pnpm --filter ai-chat build:dev`
- `pnpm --filter git-report-generator build:dev`
- Prisma schema validate 与相关迁移验证

## 实施顺序

1. 调整来源身份模型、Application 种子数据、UsageRecord 幂等约束及查询索引。
2. 完善 Inference Run 完成快照、UsageRecord 写入和定时补录。
3. 新增管理员统计查询 DTO、Service 和 Controller API。
4. 迁移 `ai-chat` 与 `git-report-generator` 到 `/v1/chat/completions`。
5. 移除旧模型执行路由，保留会话管理路由。
6. 新增主应用“用量统计”路由、菜单、API 和页面。
7. 更新网关与子应用文档并执行完整验证。

## 验收标准

- 两个现有模型子应用的每次成功调用都生成 Run、ProviderAttempt 和 UsageRecord。
- JWT 调用可按来源 Application 和用户追踪；Application Key 调用可按密钥所属应用追踪。
- 所有公开模型执行都经过 `/v1`、Virtual Model 和现有 Adapter 链路。
- 管理员能查看汇总、趋势、分布和分页明细，普通用户无法访问。
- 失败和取消调用出现在明细与状态统计中，不产生完整用量汇总。
- 用量写入临时失败不打断已完成响应，后续补录不产生重复记录。
- 页面和 API 不暴露提示词、模型输出或密钥。
- OpenAI/Ollama Adapter 核心实现保持不变，相关测试、类型检查和构建通过。
