# LLM Usage Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有子应用模型调用收敛到 `/v1` 数据面，并在主应用提供仅管理员可见、包含汇总和明细的“用量统计”页面。

**Architecture:** 继续以 Run、ProviderAttempt 和 UsageRecord 作为唯一统计事实来源。JWT 调用通过 `X-Pavilion-App-Code` 关联来源 Application，Application Key 调用使用密钥所属 Application；Virtual Model 路由后仍由现有 ProviderFactory 和 OpenAI/Ollama Adapter 创建模型实例。统计写入采用幂等记录和最终一致补录，管理员 API 从现有事实表聚合数据。

**Tech Stack:** NestJS 11、Prisma 7、PostgreSQL、Jest、React 19、Vite 8、HeroUI、Tailwind CSS、原生 SVG。

**Spec:** `docs/superpowers/specs/2026-08-29-llm-usage-dashboard-design.md`

## Global Constraints

- 仅统计 LLM 用量，不采集普通 HTTP、WebSocket、静态资源或下游业务代理请求。
- `/v1/*` 是唯一公开模型执行入口；保留 `/api/llm/chat/threads*`，移除旧模型执行路由。
- 不修改 `ProviderAdapterBuilder`、OpenAI/Ollama Adapter、ProviderFactory、Provider Registry、Credential 解密和模型缓存核心行为。
- 浏览器模型调用使用 JWT + `X-Pavilion-App-Code`；后端服务使用 `x-api-key` 或 `Bearer pav_...`。
- `X-Pavilion-App-Code` 只用于统计，不参与授权；Application Key 所属 Application 是服务调用的可信来源。
- 统计页面和 API 名称统一为“用量统计”，路由固定为 `/usage`，仅 `ADMIN` 可访问。
- 费用使用 USD，并明确显示为“估算费用”；默认查询最近 7 天，最大跨度 366 天。
- 统计 API 不返回 Run.input、Run.output、提示词、模型输出、密钥、Credential 或完整内部错误。
- 子应用继续满足微前端高度规则，不新增 `100vh`、`h-screen` 或 `min-h-screen`。
- 不修改 `git-report-generator` 独立开发模式的 Vite `/api` 代理，不为 `customer-service` 增加模型调用。
- 每个任务遵循红—绿—重构循环，并在本任务测试通过后单独提交。

## File Structure

### 后端数据与身份

- `services/llm-gateway/prisma/schema.prisma`：Run 完成快照、UsageRecord 幂等键及查询索引。
- `services/llm-gateway/prisma/migrations/20260829090000_add_usage_analytics/migration.sql`：数据库迁移和历史幂等键回填。
- `services/llm-gateway/prisma/seed.ts`：登记 `git-report-generator` Application。
- `services/llm-gateway/src/modules/inference/data-plane-auth.guard.ts`：解析 JWT 来源应用和 Application Key。
- `services/llm-gateway/src/modules/inference/inference.types.ts`：明确认证类型与来源 Application。
- `services/llm-gateway/src/modules/inference/inference-rate-limit.guard.ts`：继续按认证主体限流，不让统计标签改变限流主体。

### 后端用量写入与查询

- `services/llm-gateway/src/modules/inference/run.service.ts`：保存可补录的完成快照。
- `services/llm-gateway/src/modules/inference/inference.service.ts`：完成 Run 后执行非阻断幂等用量写入。
- `services/llm-gateway/src/modules/usage/usage.types.ts`：统计输入、筛选和响应类型。
- `services/llm-gateway/src/modules/usage/usage.service.ts`：用量 upsert、补录和管理员聚合查询。
- `services/llm-gateway/src/modules/usage/usage.controller.ts`：四个管理员查询端点。
- `services/llm-gateway/src/modules/usage/dto/usage-query.dto.ts`：时间、筛选、粒度和分页校验。

### 子应用迁移

- `apps/ai-chat/src/api/openai-stream.ts`：解析 OpenAI Chat Completions SSE。
- `apps/ai-chat/src/api/chat.ts`、`apps/ai-chat/src/api/http.ts`：调用 `/v1/models` 和 `/v1/chat/completions`。
- `apps/ai-chat/src/App.tsx`、`apps/ai-chat/src/components/assistant-ui/thread.tsx`：Virtual Model 选择展示。
- `apps/git-report-generator/src/openai-stream.ts`：独立的 OpenAI SSE 解析器。
- `apps/git-report-generator/src/api.ts`、`src/types.ts`、`src/pages/Git.tsx`：Virtual Model 请求与展示。
- `services/llm-gateway/src/modules/llm/controllers/llm-chat.controller.ts`：仅保留会话管理路由。
- `services/llm-gateway/src/modules/llm/services/llm-chat.service.ts`：删除无公开调用方的直接模型执行服务。

### 主应用页面

- `apps/main-app/src/api/usage.ts`：统计 API 类型、查询序列化和请求函数。
- `apps/main-app/src/pages/usage/usage-format.ts`：金额、Token、延迟和时间格式化。
- `apps/main-app/src/pages/usage/UsageFilters.tsx`：时间和维度筛选。
- `apps/main-app/src/pages/usage/UsageMetrics.tsx`：核心指标卡。
- `apps/main-app/src/pages/usage/UsageTrendChart.tsx`：本地 SVG 趋势图。
- `apps/main-app/src/pages/usage/UsageBreakdowns.tsx`：应用、模型和 Provider 排行。
- `apps/main-app/src/pages/usage/UsageRunsTable.tsx`：调用明细与分页。
- `apps/main-app/src/pages/Usage.tsx`：页面数据编排、取消过期请求和局部错误状态。
- `apps/main-app/src/router/index.tsx`、`src/api/menu.ts`：路由、Tab 标题和菜单。

---

### Task 1: 数据库用量恢复字段与幂等约束

**Files:**

- Modify: `services/llm-gateway/prisma/schema.prisma`
- Create: `services/llm-gateway/prisma/migrations/20260829090000_add_usage_analytics/migration.sql`
- Modify: `services/llm-gateway/prisma/seed.ts`
- Modify: `services/llm-gateway/test/platform-contract.spec.ts`

**Interfaces:**

- Produces: `Run.usageSnapshot: Json | null`、`UsageRecord.idempotencyKey: string | null`。
- Produces: 数据库唯一键 `usage_records.idempotency_key`，后续使用 `run:<runId>` upsert。
- Produces: Application `code = "git-report-generator"`。

- [ ] **Step 1: 写失败的 schema 合约测试**

在 `platform-contract.spec.ts` 增加对 schema 和 seed 文本的合约断言：

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

it("declares recoverable and idempotent usage storage", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const seed = readFileSync(join(process.cwd(), "prisma/seed.ts"), "utf8");
  expect(schema).toContain("usageSnapshot Json?");
  expect(schema).toContain("idempotencyKey String?");
  expect(schema).toContain("@@index([status, createdAt])");
  expect(schema).toContain("@@index([deploymentId, createdAt])");
  expect(seed).toContain('code: "git-report-generator"');
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- platform-contract.spec.ts`

Expected: FAIL，提示 schema 尚无 `usageSnapshot` 或 seed 尚无 `git-report-generator`。

- [ ] **Step 3: 修改 Prisma schema**

在 Run 和 UsageRecord 中加入字段与索引：

```prisma
model Run {
  // existing fields
  usageSnapshot Json? @map("usage_snapshot")

  @@index([status, createdAt])
}

model UsageRecord {
  // existing fields
  idempotencyKey String? @unique @map("idempotency_key")

  @@index([deploymentId, createdAt])
}
```

- [ ] **Step 4: 创建可回滚数据库迁移**

迁移文件写入：

```sql
ALTER TABLE "runs" ADD COLUMN "usage_snapshot" JSONB;
ALTER TABLE "usage_records" ADD COLUMN "idempotency_key" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT "run_id" FROM "usage_records"
    WHERE "run_id" IS NOT NULL
    GROUP BY "run_id" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate usage_records.run_id prevents idempotency migration';
  END IF;
END $$;

UPDATE "usage_records"
SET "idempotency_key" = 'run:' || "run_id"
WHERE "run_id" IS NOT NULL;

CREATE UNIQUE INDEX "usage_records_idempotency_key_key"
ON "usage_records"("idempotency_key");
CREATE INDEX "runs_status_created_at_idx"
ON "runs"("status", "created_at");
CREATE INDEX "usage_records_deployment_id_created_at_idx"
ON "usage_records"("deployment_id", "created_at");
```

迁移中的 DO block 会检查现有 `run_id` 是否重复；若存在重复，迁移失败并报告数据问题，不静默删除历史记录。

- [ ] **Step 5: 登记 Git 报告应用**

在 seed 的 `Promise.all` 中加入：

```ts
prisma.application.upsert({
  where: { code: "git-report-generator" },
  update: {},
  create: { code: "git-report-generator", name: "Pavilion Git Report Generator", allowedModels: [] }
});
```

- [ ] **Step 6: 生成 Prisma Client 并验证**

Run: `pnpm --filter @pavilion-mfe/llm-gateway prisma:generate`

Run: `pnpm --filter @pavilion-mfe/llm-gateway exec prisma validate`

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- platform-contract.spec.ts`

Expected: Prisma validate 成功，合约测试 PASS。

- [ ] **Step 7: 提交**

```bash
git add services/llm-gateway/prisma services/llm-gateway/test/platform-contract.spec.ts
git commit -m "feat(llm-gateway): 扩展用量统计存储"
```

### Task 2: 数据面调用来源归属

**Files:**

- Modify: `services/llm-gateway/src/modules/inference/inference.types.ts`
- Modify: `services/llm-gateway/src/modules/inference/data-plane-auth.guard.ts`
- Modify: `services/llm-gateway/src/modules/inference/inference-rate-limit.guard.ts`
- Create: `services/llm-gateway/src/modules/inference/data-plane-auth.guard.spec.ts`
- Create: `services/llm-gateway/src/modules/inference/inference-rate-limit.guard.spec.ts`

**Interfaces:**

- Produces: `InferencePrincipal.authenticationType: "user" | "application"`。
- Produces: `InferencePrincipal.userId?: string`、`applicationId: string`、`allowedModels?: string[]`。
- Consumes: Application `code` and `isActive` from Prisma。

- [ ] **Step 1: 写 JWT 来源应用失败测试**

创建 guard 测试，覆盖缺少头、非法应用和合法应用：

```ts
it("requires an active source application for JWT callers", async () => {
  jwt.verifyAsync.mockResolvedValue({ sub: "user-1" });
  prisma.user.findUnique.mockResolvedValue({ id: "user-1", status: "ACTIVE" });
  prisma.application.findUnique.mockResolvedValue({ id: "app-1", code: "ai-chat", isActive: true });

  await expect(activate({ authorization: "Bearer jwt" })).rejects.toThrow("X-Pavilion-App-Code");
  await expect(activate({ authorization: "Bearer jwt", "x-pavilion-app-code": "ai-chat" })).resolves.toBe(true);
  expect(currentRequest.principal).toEqual({
    authenticationType: "user",
    userId: "user-1",
    applicationId: "app-1"
  });
});
```

另写测试证明 Application Key 的 `applicationId` 优先，伪造 App Code 不覆盖它。

- [ ] **Step 2: 写限流主体失败测试**

```ts
it("rate limits JWT callers by user even when a source application is present", async () => {
  request.principal = { authenticationType: "user", userId: "user-1", applicationId: "app-1" };
  await guard.canActivate(context);
  expect(redis.eval).toHaveBeenCalledWith(
    expect.any(String),
    1,
    expect.stringContaining("user:user-1"),
    60_000,
    expect.any(Number)
  );
});
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- data-plane-auth.guard.spec.ts inference-rate-limit.guard.spec.ts`

Expected: FAIL，当前 principal 没有来源应用解析，限流优先使用 applicationId。

- [ ] **Step 4: 实现明确的 principal 类型**

将类型改为：

```ts
export interface InferencePrincipal {
  authenticationType: "user" | "application";
  userId?: string;
  applicationId: string;
  allowedModels?: string[];
}
```

同步把所有 `principal.type` 判断替换为 `principal.authenticationType`。

- [ ] **Step 5: 在 JWT 分支解析来源应用**

实现严格的单值头校验，并只查询启用应用：

```ts
const appCodeHeader = request.headers["x-pavilion-app-code"];
if (
  typeof appCodeHeader !== "string" ||
  appCodeHeader.length > 64 ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appCodeHeader)
) {
  throw new BadRequestException("缺少或无效的 X-Pavilion-App-Code");
}
const application = await this.prisma.application.findUnique({ where: { code: appCodeHeader } });
if (!application?.isActive) throw new BadRequestException("来源应用不存在或已停用");
request.principal = {
  authenticationType: "user",
  userId: user.id,
  applicationId: application.id
};
```

Application Key 分支设置 `authenticationType: "application"`，并忽略统计头。

- [ ] **Step 6: 修正限流和 Run 所有权判断**

限流 key 必须由认证类型决定：

```ts
const subject =
  request.principal.authenticationType === "application"
    ? `app:${request.principal.applicationId}`
    : `user:${request.principal.userId}`;
```

Run 查询和取消继续按认证主体判断：用户按 `userId`，Application Key 按 `applicationId`。

- [ ] **Step 7: 运行相关测试和类型检查**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- data-plane-auth.guard.spec.ts inference-rate-limit.guard.spec.ts inference-contract.spec.ts`

Run: `pnpm --filter @pavilion-mfe/llm-gateway typecheck`

Expected: 全部 PASS；OpenAI 兼容合约 fixture 使用新的 principal 字段。

- [ ] **Step 8: 提交**

```bash
git add services/llm-gateway/src/modules/inference services/llm-gateway/test/inference-contract.spec.ts
git commit -m "feat(llm-gateway): 记录模型调用来源应用"
```

### Task 3: 非阻断幂等用量写入与补录

**Files:**

- Create: `services/llm-gateway/src/modules/usage/usage.types.ts`
- Modify: `services/llm-gateway/src/modules/usage/usage.service.ts`
- Modify: `services/llm-gateway/src/modules/inference/run.service.ts`
- Modify: `services/llm-gateway/src/modules/inference/inference.service.ts`
- Create: `services/llm-gateway/src/modules/usage/usage.service.spec.ts`
- Create: `services/llm-gateway/src/modules/inference/inference.service.spec.ts`

**Interfaces:**

- Produces: `UsageSnapshot` with `requestId`、`runId`、caller IDs、model IDs、Token、prices、latency and fallback count。
- Produces: `UsageService.record(snapshot): Promise<void>` using idempotent upsert。
- Produces: `UsageService.reconcile(): Promise<number>` returning repaired row count。
- Produces: `RunService.finish(id, output, usageSnapshot?): Promise<void>`。

- [ ] **Step 1: 写 UsageService 幂等与补录失败测试**

```ts
it("upserts one usage row per completed run", async () => {
  await service.record(snapshot);
  expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ where: { idempotencyKey: "run:run-1" } })
  );
});

it("reconciles completed runs missing usage records", async () => {
  prisma.run.findMany.mockResolvedValue([{ id: "run-1", usageSnapshot: snapshot }]);
  await expect(service.reconcile()).resolves.toBe(1);
  expect(prisma.usageRecord.upsert).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: 写统计写入失败不改变成功响应的测试**

构造单 Deployment 成功模型，令 `usage.record()` reject：

```ts
usage.record.mockRejectedValue(new Error("usage unavailable"));
await expect(service.execute(request)).resolves.toMatchObject({ content: "ok" });
expect(runs.finish).toHaveBeenCalledWith(
  "run-1",
  expect.anything(),
  expect.objectContaining({ runId: "run-1", deploymentId: "deployment-1" })
);
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- usage.service.spec.ts inference.service.spec.ts`

Expected: FAIL，当前使用 create 且写入错误会冒泡。

- [ ] **Step 4: 定义可序列化 UsageSnapshot**

```ts
export interface UsageSnapshot {
  occurredAt: string;
  requestId: string;
  runId: string;
  userId?: string;
  applicationId: string;
  virtualModelId: string;
  deploymentId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  inputPricePerM: number;
  outputPricePerM: number;
  latencyMs: number;
  fallbackCount: number;
}
```

- [ ] **Step 5: 实现幂等 record**

计算 USD 费用后 upsert：

```ts
const estimatedCost =
  (snapshot.inputTokens * snapshot.inputPricePerM + snapshot.outputTokens * snapshot.outputPricePerM) / 1_000_000;
const data = {
  requestId: snapshot.requestId,
  runId: snapshot.runId,
  userId: snapshot.userId,
  applicationId: snapshot.applicationId,
  virtualModelId: snapshot.virtualModelId,
  deploymentId: snapshot.deploymentId,
  inputTokens: snapshot.inputTokens,
  outputTokens: snapshot.outputTokens,
  cachedTokens: snapshot.cachedTokens,
  reasoningTokens: snapshot.reasoningTokens,
  latencyMs: snapshot.latencyMs,
  fallbackCount: snapshot.fallbackCount
};
const createdAt = new Date(snapshot.occurredAt);
await this.prisma.usageRecord.upsert({
  where: { idempotencyKey: `run:${snapshot.runId}` },
  create: { ...data, idempotencyKey: `run:${snapshot.runId}`, estimatedCost, createdAt },
  update: { ...data, estimatedCost }
});
```

- [ ] **Step 6: 保存 Run 用量快照**

扩展 `RunService.finish`：

```ts
async finish(
  id: string,
  output: Prisma.InputJsonValue,
  usageSnapshot?: UsageSnapshot
): Promise<void> {
  await this.prisma.run.updateMany({
    where: { id, status: { in: ["queued", "running"] } },
    data: {
      status: "completed",
      output,
      usageSnapshot: usageSnapshot ? toPrismaJson(usageSnapshot) : undefined,
      completedAt: new Date()
    }
  });
  // existing completion event
}
```

- [ ] **Step 7: 调整非流式和流式成功顺序**

两条成功路径构造 snapshot 时把请求开始时间写为 `occurredAt: new Date(started).toISOString()`，然后都先
`runs.finish(..., snapshot)`，再执行：

```ts
try {
  await this.usage.record(snapshot);
} catch (error) {
  this.logger.error("Usage record deferred", error instanceof Error ? error.stack : String(error));
}
```

流式 `done` 事件仍正常发送；不要在日志中打印 messages 或 output。

- [ ] **Step 8: 实现定时补录**

在 UsageService 增加 `@Cron(CronExpression.EVERY_MINUTE)` 方法，单批读取最多 100 条：

```ts
const runs = await this.prisma.run.findMany({
  where: { status: "completed", usageSnapshot: { not: Prisma.DbNull }, usageRecords: { none: {} } },
  select: { usageSnapshot: true },
  orderBy: { completedAt: "asc" },
  take: 100
});
```

逐条验证 snapshot 形状并调用 upsert；单条失败只记录 requestId/runId，继续处理其余记录。

- [ ] **Step 9: 运行用量、推理与合约测试**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- usage.service.spec.ts inference.service.spec.ts inference-contract.spec.ts`

Run: `pnpm --filter @pavilion-mfe/llm-gateway typecheck`

Expected: 全部 PASS。

- [ ] **Step 10: 提交**

```bash
git add services/llm-gateway/src/modules/usage services/llm-gateway/src/modules/inference
git commit -m "feat(llm-gateway): 增加可靠的模型用量记录"
```

### Task 4: 管理员统计查询 API

**Files:**

- Create: `services/llm-gateway/src/modules/usage/dto/usage-query.dto.ts`
- Modify: `services/llm-gateway/src/modules/usage/usage.types.ts`
- Modify: `services/llm-gateway/src/modules/usage/usage.service.ts`
- Modify: `services/llm-gateway/src/modules/usage/usage.controller.ts`
- Modify: `services/llm-gateway/src/modules/usage/usage.module.ts`
- Create: `services/llm-gateway/src/modules/usage/usage.controller.spec.ts`
- Extend: `services/llm-gateway/src/modules/usage/usage.service.spec.ts`

**Interfaces:**

- Produces: `UsageFilterDto` with `from`、`to`、`applicationId`、`virtualModelId`、`providerId`、`status`。
- Produces: `UsageOverview`、`UsageTimeseriesPoint[]`、`UsageBreakdown`、`UsageRunPage`。
- Produces: GET `/api/usage/overview|timeseries|breakdown|runs`。

- [ ] **Step 1: 写 controller 权限和路由失败测试**

使用 Nest testing module + supertest：

```ts
it.each(["overview", "timeseries", "breakdown", "runs"])("exposes admin usage %s", async endpoint => {
  const response = await request(app.getHttpServer()).get(`/api/usage/${endpoint}`).expect(200);
  expect(response.body).toMatchObject({ code: 0, msg: "ok" });
});

it("marks the controller as ADMIN only", () => {
  expect(Reflect.getMetadata(ROLES_KEY, UsageController)).toEqual(["ADMIN"]);
});
```

另建未覆盖 RolesGuard 的测试应用，以普通 USER JWT 请求并断言 403。

- [ ] **Step 2: 写统计口径和隐私失败测试**

覆盖成功率分母、零分母、取消排除、筛选和明细字段：

```ts
expect(await service.overview(filters)).toMatchObject({
  totalRuns: 12,
  completedRuns: 8,
  failedRuns: 2,
  cancelledRuns: 2,
  successRate: 0.8
});

const page = await service.runs({ ...filters, page: 1, pageSize: 20 });
expect(page.items[0]).not.toHaveProperty("input");
expect(page.items[0]).not.toHaveProperty("output");
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- usage.controller.spec.ts usage.service.spec.ts`

Expected: FAIL，当前只有旧 list/summary 接口。

- [ ] **Step 4: 实现 DTO 校验**

DTO 使用 `@IsISO8601()`、`@IsIn()`、`@IsInt()`、`@Min()`、`@Max()` 和 `@Type(() => Number)`；规则固定为：

```ts
export class UsageFilterDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsUUID() applicationId?: string;
  @IsOptional() @IsUUID() virtualModelId?: string;
  @IsOptional() @IsUUID() providerId?: string;
  @IsOptional() @IsIn(["completed", "failed", "cancelled"]) status?: string;
}

export class UsageTimeseriesDto extends UsageFilterDto {
  @IsOptional() @IsIn(["hour", "day"]) interval?: "hour" | "day";
}

export class UsageRunsDto extends UsageFilterDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() requestId?: string;
}
```

Service 统一将缺失时间设为最近 7 天，并在跨度超过 366 天或 `from >= to` 时抛出 BadRequestException。

- [ ] **Step 5: 实现 overview 和 timeseries**

overview 使用 Run `groupBy({ by: ["status"] })` 与 UsageRecord `aggregate()`。Application、Virtual Model 和状态直接
过滤 Run；Provider 对 Run 使用 `attempts.some.deployment.providerId`，因此失败调用也能被筛选且每个 Run 只计一次；
UsageRecord 的 Provider 过滤最终 Deployment relation。成功率分母为零时返回 0。

timeseries 使用 `$queryRaw`，仅从白名单选择 `date_trunc('hour', ...)` 或 `date_trunc('day', ...)`。查询跨度不超过
48 小时时默认 hour，否则默认 day。SQL 分别聚合 Run 状态和 UsageRecord Token/费用，再按 UTC bucket 合并，
缺失 bucket 补零。不要把用户输入直接拼接进 SQL。

- [ ] **Step 6: 实现 breakdown 和 runs**

breakdown 分别按 `applicationId`、`virtualModelId`、`deploymentId` 聚合，批量查名称，返回前 10 项并把余项合并为“其他”。

runs 使用同一 where builder 执行 `count` 与 `findMany`，只 select：

```ts
{
  id: true,
  requestId: true,
  status: true,
  createdAt: true,
  completedAt: true,
  user: { select: { id: true, username: true, nickname: true } },
  application: { select: { id: true, code: true, name: true } },
  virtualModel: { select: { id: true, name: true, displayName: true } },
  usageRecords: { select: { inputTokens: true, outputTokens: true, cachedTokens: true, reasoningTokens: true, estimatedCost: true, latencyMs: true, fallbackCount: true, deployment: { select: { id: true, name: true, upstreamModel: true, provider: { select: { id: true, name: true, type: true } } } } } },
  attempts: { select: { status: true, errorType: true }, orderBy: { attempt: "asc" } }
}
```

错误信息只返回 `errorType`，不返回 Run.error。

- [ ] **Step 7: 替换 controller**

在类级别添加 `@Roles("ADMIN")`，删除旧 list/summary 路由，四个方法分别调用 service：

```ts
@Get("overview") overview(@Query() query: UsageFilterDto) { return this.usage.overview(query); }
@Get("timeseries") timeseries(@Query() query: UsageTimeseriesDto) { return this.usage.timeseries(query); }
@Get("breakdown") breakdown(@Query() query: UsageFilterDto) { return this.usage.breakdown(query); }
@Get("runs") runs(@Query() query: UsageRunsDto) { return this.usage.runs(query); }
```

- [ ] **Step 8: 运行测试、类型检查和构建**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- usage.controller.spec.ts usage.service.spec.ts`

Run: `pnpm --filter @pavilion-mfe/llm-gateway typecheck`

Run: `pnpm --filter @pavilion-mfe/llm-gateway build`

Expected: 全部 PASS。

- [ ] **Step 9: 提交**

```bash
git add services/llm-gateway/src/modules/usage
git commit -m "feat(llm-gateway): 提供管理员用量统计接口"
```

### Task 5: 迁移 AI Chat 到 OpenAI 兼容数据面

**Files:**

- Create: `apps/ai-chat/src/api/openai-stream.ts`
- Create: `apps/ai-chat/src/api/openai-stream.spec.ts`
- Modify: `apps/ai-chat/src/api/http.ts`
- Modify: `apps/ai-chat/src/api/chat.ts`
- Modify: `apps/ai-chat/src/lib/model-store.ts`
- Modify: `apps/ai-chat/src/App.tsx`
- Modify: `apps/ai-chat/src/components/assistant-ui/thread.tsx`
- Modify: `apps/ai-chat/vite.config.ts`
- Modify: `apps/main-app/vite.config.ts`
- Modify: `apps/ai-chat/package.json`
- Modify: `services/llm-gateway/test/inference-contract.spec.ts`

**Interfaces:**

- Consumes: GET `/v1/models` returning OpenAI list with Pavilion `display_name` extension。
- Consumes: POST `/v1/chat/completions` with `{ model, messages, stream: true }`。
- Produces: `VirtualModelOption { id: string; displayName: string; ownedBy: string }`。

- [ ] **Step 1: 扩展数据面模型合约测试**

修改 fixture 增加 displayName，并断言：

```ts
expect(response.body.data[0]).toMatchObject({
  id: "pavilion-default",
  object: "model",
  owned_by: "pavilion",
  display_name: "Pavilion Default"
});
```

先运行 `pnpm --filter @pavilion-mfe/llm-gateway test -- inference-contract.spec.ts`，确认 FAIL，再在 InferenceController 的 models 映射中加入 `display_name: model.displayName ?? model.name` 并确认 PASS。

- [ ] **Step 2: 写 SSE 解析失败测试**

使用 Node 内置 test runner，不增加测试依赖：

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseChatCompletionEvent } from "./openai-stream.ts";

test("parses content, errors and DONE", () => {
  assert.deepEqual(parseChatCompletionEvent('{"choices":[{"delta":{"content":"你"}}]}'), {
    type: "delta",
    delta: "你"
  });
  assert.deepEqual(parseChatCompletionEvent("[DONE]"), { type: "done" });
  assert.deepEqual(parseChatCompletionEvent('{"error":{"message":"failed"}}'), { type: "error", message: "failed" });
});
```

在 package.json 加脚本：

```json
"test": "node --experimental-strip-types --test src/api/openai-stream.spec.ts"
```

Run: `pnpm --filter ai-chat test`

Expected: FAIL，解析器尚不存在。

- [ ] **Step 3: 实现 SSE 解析器**

解析器返回严格联合类型，只读取 `choices[0].delta.content`、`error.message` 和 `[DONE]`。另导出 `readOpenAiStream(response, signal)`，正确处理跨 chunk 的 `\n\n` 边界并在 abort 时取消 reader。

- [ ] **Step 4: 增加数据面 fetch**

在 `http.ts` 保留原 `/api` envelope 请求供 threads 使用，并新增：

```ts
export async function dataPlaneFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Pavilion-App-Code", import.meta.env.VITE_PAVILION_MFE_APP_CODE);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(path, { ...options, headers });
}
```

复用现有 401 清理和嵌入/独立登录处理。

- [ ] **Step 5: 让开发服务器转发 `/v1`**

在 ai-chat 和 main-app 的 Vite server.proxy 中加入与现有 `/api` 相同目标的 `/v1` 规则：

```ts
proxy: {
  "/api": { target: apiBase || "http://localhost:3000", changeOrigin: true },
  "/v1": { target: apiBase || "http://localhost:3000", changeOrigin: true }
}
```

main-app 当前规则若继续使用固定 `http://localhost:3000`，则 `/api` 与 `/v1` 必须保持同一个固定目标。本任务不修改
git-report-generator 的 Vite proxy；它在挂载模式下通过 main-app 的 `/v1` 代理调用网关。

- [ ] **Step 6: 替换模型与聊天协议**

将类型改为：

```ts
export type VirtualModelOption = {
  id: string;
  displayName: string;
  ownedBy: string;
};
```

`listModels()` 请求 `/v1/models` 并映射 `id`、`display_name`、`owned_by`。`streamChat()` 请求：

```ts
await dataPlaneFetch("/v1/chat/completions", {
  method: "POST",
  body: JSON.stringify({ model: body.model, messages: body.messages, stream: true }),
  signal
});
```

App 只传 `model.id`；模型下拉主文本使用 displayName，副文本使用 Virtual Model `id`，不再显示物理 Provider。

- [ ] **Step 7: 运行测试和构建**

Run: `pnpm --filter ai-chat test`

Run: `pnpm --filter ai-chat build:dev`

Expected: PASS，构建产物生成成功。

- [ ] **Step 8: 提交**

```bash
git add apps/ai-chat apps/main-app/vite.config.ts services/llm-gateway/src/modules/inference/inference.controller.ts services/llm-gateway/test/inference-contract.spec.ts
git commit -m "feat(ai-chat): 迁移到统一模型数据面"
```

### Task 6: 迁移 Git Report Generator 到 OpenAI 兼容数据面

**Files:**

- Create: `apps/git-report-generator/src/openai-stream.ts`
- Create: `apps/git-report-generator/src/openai-stream.spec.ts`
- Modify: `apps/git-report-generator/src/api.ts`
- Modify: `apps/git-report-generator/src/types.ts`
- Modify: `apps/git-report-generator/src/pages/Git.tsx`
- Modify: `apps/git-report-generator/package.json`

**Interfaces:**

- Consumes: GET `/v1/models` and POST `/v1/chat/completions`。
- Produces: `AvailableModel { id: string; displayName: string; ownedBy: string }`。

- [ ] **Step 1: 写 Git Report SSE 解析失败测试**

使用与该应用独立入口匹配的测试：

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseChatCompletionEvent } from "./openai-stream.ts";

test("accepts OpenAI chat completion stream frames", () => {
  assert.deepEqual(parseChatCompletionEvent('{"choices":[{"delta":{"content":"report"}}]}'), {
    type: "delta",
    delta: "report"
  });
  assert.deepEqual(parseChatCompletionEvent("[DONE]"), { type: "done" });
});
```

package.json 增加：

```json
"test": "node --experimental-strip-types --test src/openai-stream.spec.ts"
```

Run: `pnpm --filter git-report-generator test`

Expected: FAIL，解析器不存在。

- [ ] **Step 2: 实现独立解析器和数据面请求头**

解析器与 ai-chat 保持协议一致，但文件保留在本子应用内，避免新增 `@pavilion-mfe/*` 运行时依赖。保留
`authorizedFetch` 供平台 `/api` 请求使用，新增数据面函数：

```ts
async function dataPlaneFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("pavilion_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Pavilion-App-Code", import.meta.env.VITE_PAVILION_MFE_APP_CODE);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    sessionStorage.removeItem("pavilion_token");
    window.location.href = "/login";
  }
  return response;
}
```

- [ ] **Step 3: 替换类型和模型列表**

```ts
export interface AvailableModel {
  id: string;
  displayName: string;
  ownedBy: string;
}
```

`listModels()` 读取 `/v1/models` 的原始 OpenAI 响应，不再读取平台 envelope。

- [ ] **Step 4: 替换报告生成请求**

`generateAiReport` 入参删除 providerId/modelId，改为：

```ts
{
  model: selectedModel.id,
  messages,
  temperature,
  max_tokens: maxTokens,
  stream: true
}
```

请求路径改为 `/v1/chat/completions`；Git 页面模型选择显示 `${displayName} · ${id}`。

- [ ] **Step 5: 运行测试和构建**

Run: `pnpm --filter git-report-generator test`

Run: `pnpm --filter git-report-generator build:dev`

Expected: PASS。不要修改该应用 Vite server.proxy。

- [ ] **Step 6: 提交**

```bash
git add apps/git-report-generator
git commit -m "feat(git-report-generator): 使用统一模型数据面"
```

### Task 7: 移除未计量的旧模型执行路由

**Files:**

- Modify: `services/llm-gateway/src/modules/llm/controllers/llm-chat.controller.ts`
- Delete: `services/llm-gateway/src/modules/llm/services/llm-chat.service.ts`
- Modify: `services/llm-gateway/src/modules/llm/llm.module.ts`
- Create: `services/llm-gateway/src/modules/llm/providers/provider.factory.spec.ts`
- Modify: `services/llm-gateway/test/platform-contract.spec.ts`
- Modify: `services/llm-gateway/README.md`

**Interfaces:**

- Removes: POST `/api/llm/chat` and POST `/api/llm/chat/stream`。
- Preserves: `/api/llm/chat/threads*`。

- [ ] **Step 1: 把旧 SSE 合约测试改为禁止旁路**

```ts
it.each(["/api/llm/chat", "/api/llm/chat/stream"])("does not expose legacy model execution at %s", async path => {
  await request(app.getHttpServer()).post(path).send({}).expect(404);
});
```

同时保留一个 thread list 测试，断言 GET `/api/llm/chat/threads` 仍为 200 envelope。

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- platform-contract.spec.ts`

Expected: FAIL，旧路由仍返回 200/400 而非 404。

- [ ] **Step 3: 删除旧执行入口**

从 LlmChatController 删除 `chatService` 依赖、`chat()`、`chatStream()` 和 Response import。删除 LlmChatService 文件，并从 LlmModule providers/exports 移除它；只保留 ChatThreadService 和线程路由。

- [ ] **Step 4: 更新网关 README**

明确写出：

```text
浏览器：Authorization: Bearer <JWT> + X-Pavilion-App-Code
后端服务：x-api-key: pav_...
模型执行：/v1/models、/v1/chat/completions、/v1/responses
平台会话管理：/api/llm/chat/threads*
```

- [ ] **Step 5: 增加 Adapter 核心回归测试**

```ts
import { ProviderFactory } from "./provider.factory";
import "./index";

it("keeps OpenAI and Ollama builders registered", () => {
  expect(ProviderFactory.getSupportedTypes()).toEqual(expect.arrayContaining(["openai", "ollama"]));
  expect(
    ProviderFactory.create({ type: "openai", apiKey: "sk-test" }, { modelName: "gpt-test" }).constructor.name
  ).toBe("ChatOpenAI");
  expect(
    ProviderFactory.create({ type: "ollama", baseUrl: "http://localhost:11434" }, { modelName: "qwen-test" })
      .constructor.name
  ).toBe("ChatOllama");
});
```

- [ ] **Step 6: 运行合约、Adapter、类型检查和构建**

Run: `pnpm --filter @pavilion-mfe/llm-gateway test -- platform-contract.spec.ts inference-contract.spec.ts provider.factory.spec.ts`

Run: `pnpm --filter @pavilion-mfe/llm-gateway typecheck`

Run: `pnpm --filter @pavilion-mfe/llm-gateway build`

Expected: 全部 PASS，旧模型执行路由为 404，会话路由仍可用。

- [ ] **Step 7: 提交**

```bash
git add services/llm-gateway/src/modules/llm services/llm-gateway/test/platform-contract.spec.ts services/llm-gateway/README.md
git commit -m "refactor(llm-gateway): 移除旧模型调用旁路"
```

### Task 8: 主应用用量 API 与纯展示工具

**Files:**

- Create: `apps/main-app/src/api/usage.ts`
- Create: `apps/main-app/src/pages/usage/usage-format.ts`
- Create: `apps/main-app/src/pages/usage/usage-format.spec.ts`
- Modify: `apps/main-app/package.json`

**Interfaces:**

- Produces: `UsageFilters`、`UsageOverview`、`UsageTimeseriesPoint`、`UsageBreakdown`、`UsageRunPage`。
- Produces: `usageApi.overview|timeseries|breakdown|runs(filters, signal)`。
- Produces: `usageApi.options(signal)`，从现有 Application、Virtual Model 和 Deployment 管理接口构建筛选选项。
- Produces: `formatTokens`、`formatUsd`、`formatLatency`、`formatLocalTime`。

- [ ] **Step 1: 写格式化失败测试**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatLatency, formatTokens, formatUsd } from "./usage-format.ts";

test("formats usage values consistently", () => {
  assert.equal(formatTokens(1250000), "1.25M");
  assert.equal(formatLatency(850), "850 ms");
  assert.equal(formatLatency(1850), "1.85 s");
  assert.equal(formatUsd(0.00001234), "$0.000012");
});
```

package.json 增加：

```json
"test": "node --experimental-strip-types --test src/pages/usage/usage-format.spec.ts"
```

Run: `pnpm --filter main-app test`

Expected: FAIL，格式化模块尚不存在。

- [ ] **Step 2: 实现格式化函数**

Token 使用 K/M/B 紧凑格式；延迟小于 1000 使用 ms，否则使用秒；USD 大于等于 0.01 保留 2 位，小额最多保留 6 位；时间使用 `Intl.DateTimeFormat` 的浏览器本地时区。

- [ ] **Step 3: 定义统计 API 类型**

`UsageFilters` 包含：

```ts
export type UsageFilters = {
  from: string;
  to: string;
  applicationId?: string;
  virtualModelId?: string;
  providerId?: string;
  status?: "completed" | "failed" | "cancelled";
};

export type UsageRunsQuery = UsageFilters & {
  page: number;
  pageSize: number;
  requestId?: string;
};
```

响应字段必须与 Task 4 类型一一对应，Decimal 从 JSON envelope 读取为 string 并在展示边界转换为 number。

- [ ] **Step 4: 实现可取消请求**

使用现有 `http<T>(path, options)`，query builder 只追加已定义值：

```ts
function query(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export const usageApi = {
  overview: (filters: UsageFilters, signal?: AbortSignal) =>
    http<UsageOverview>(`/usage/overview?${query(filters)}`, { signal }),
  timeseries: (filters: UsageFilters, interval: "hour" | "day" | undefined, signal?: AbortSignal) =>
    http<UsageTimeseriesPoint[]>(`/usage/timeseries?${query({ ...filters, interval })}`, { signal }),
  breakdown: (filters: UsageFilters, signal?: AbortSignal) =>
    http<UsageBreakdown>(`/usage/breakdown?${query(filters)}`, { signal }),
  runs: (filters: UsageRunsQuery, signal?: AbortSignal) =>
    http<UsageRunPage>(`/usage/runs?${query(filters)}`, { signal }),
  options: (signal?: AbortSignal) => loadUsageOptions(signal)
};
```

- [ ] **Step 5: 实现筛选选项加载**

定义最小响应类型并复用现有管理员接口：

```ts
export async function loadUsageOptions(signal?: AbortSignal): Promise<UsageOptions> {
  const [applications, virtualModels, deployments] = await Promise.all([
    http<ApplicationOption[]>("/applications", { signal }),
    http<VirtualModelOption[]>("/llm/virtual-models", { signal }),
    http<DeploymentOption[]>("/llm/deployments", { signal })
  ]);
  const providers = Array.from(new Map(deployments.map(item => [item.provider.id, item.provider])).values());
  return { applications, virtualModels, providers };
}
```

只把 `id`、`code/name`、Virtual Model `name/displayName` 和 Provider `id/name/type` 暴露给筛选组件。

- [ ] **Step 6: 运行测试、类型检查和构建**

Run: `pnpm --filter main-app test`

Run: `pnpm --filter main-app typecheck`

Run: `pnpm --filter main-app build:dev`

Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add apps/main-app/src/api/usage.ts apps/main-app/src/pages/usage apps/main-app/package.json
git commit -m "feat(main-app): 增加用量统计客户端"
```

### Task 9: 主应用“用量统计”页面与导航

**Files:**

- Create: `apps/main-app/src/pages/usage/UsageFilters.tsx`
- Create: `apps/main-app/src/pages/usage/UsageMetrics.tsx`
- Create: `apps/main-app/src/pages/usage/UsageTrendChart.tsx`
- Create: `apps/main-app/src/pages/usage/UsageBreakdowns.tsx`
- Create: `apps/main-app/src/pages/usage/UsageRunsTable.tsx`
- Create: `apps/main-app/src/pages/Usage.tsx`
- Modify: `apps/main-app/src/router/index.tsx`
- Modify: `apps/main-app/src/api/menu.ts`

**Interfaces:**

- Consumes: Task 8 `usageApi`、types and formatters。
- Produces: main-app route `/usage` and menu label `用量统计`。

- [ ] **Step 1: 先添加路由引用并确认类型检查失败**

在 router 中加入：

```tsx
import Usage from "../pages/Usage";

export const routeMeta = {
  // existing entries
  "/usage": "用量统计"
};

{ path: "/usage", element: <Usage /> }
```

Run: `pnpm --filter main-app typecheck`

Expected: FAIL，`../pages/Usage` 尚不存在。

- [ ] **Step 2: 实现筛选和页面编排**

Usage.tsx 持有 filters、page、筛选 options 和四个局部资源状态。页面挂载时调用 `usageApi.options(signal)` 一次；
每次筛选变化创建新 AbortController：

```tsx
useEffect(() => {
  const controller = new AbortController();
  setOverviewState({ status: "loading" });
  void usageApi
    .overview(filters, controller.signal)
    .then(data => setOverviewState({ status: "success", data }))
    .catch(error => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setOverviewState({ status: "error", message: error instanceof Error ? error.message : "加载失败" });
    });
  return () => controller.abort();
}, [filters]);
```

overview、timeseries、breakdown、runs 各自维护错误和重试 token；明细 page/filter 改变时只刷新明细。

- [ ] **Step 3: 实现指标卡和筛选组件**

UsageFilters 提供 24h、7d、30d、自定义时间，以及 Application、Virtual Model、Provider、状态。预设时间基于当前时间生成 ISO 字符串。

UsageMetrics 使用六张 HeroUI Card：总调用、成功率、输入 Token、输出 Token、估算费用、平均延迟；loading 显示固定高度 Skeleton，error 显示消息和重试按钮。

- [ ] **Step 4: 实现 SVG 趋势图**

UsageTrendChart 支持 requests、tokens、cost 三个 tab。将点映射到固定 `viewBox="0 0 800 240"`，零数据返回空状态；折线路径由以下纯映射生成：

```ts
const x = index * (800 / Math.max(points.length - 1, 1));
const y = 220 - (value / Math.max(maxValue, 1)) * 200;
```

提供 title/desc、可读坐标标签和列表式数值摘要，不能只靠颜色表达成功/失败。

- [ ] **Step 5: 实现分布和明细表**

UsageBreakdowns 渲染 Application、Virtual Model、Provider 三组前 10 排行，条形宽度按组内最大值归一化。

UsageRunsTable 使用语义 table，展示设计文档指定字段；状态使用文字 Chip；请求 ID 按钮调用 `navigator.clipboard.writeText`；分页按钮在首尾禁用；外层 `overflow-x-auto`。

- [ ] **Step 6: 接入菜单**

在 `AI 能力中心` children 中加入：

```ts
{
  menuCode: "ai-center/usage",
  menuName: "用量统计",
  menuTp: "1",
  parentCode: "ai-center",
  orderNo: 4,
  status: "1",
  menuUrl: "/usage",
  menuIcon: "DataAnalysis"
}
```

`Icon.tsx` 已有 `DataAnalysis` 时不修改该文件。

- [ ] **Step 7: 运行页面验证**

Run: `pnpm --filter main-app test`

Run: `pnpm --filter main-app typecheck`

Run: `pnpm --filter main-app build:dev`

Run: `rg -n "100vh|h-screen|min-h-screen" apps/main-app/src/pages/Usage.tsx apps/main-app/src/pages/usage`

Expected: 测试、类型检查和构建 PASS；最后一条命令无输出。

- [ ] **Step 8: 提交**

```bash
git add apps/main-app/src/pages/Usage.tsx apps/main-app/src/pages/usage apps/main-app/src/router/index.tsx apps/main-app/src/api/menu.ts
git commit -m "feat(main-app): 新增用量统计页面"
```

### Task 10: 文档、全链路验证与安全回归

**Files:**

- Modify: `apps/ai-chat/README.md`
- Modify: `apps/git-report-generator/README.md`
- Modify: `services/llm-gateway/README.md`
- Modify: `AGENTS.md`

**Interfaces:**

- Verifies: all previous tasks as one deployable feature。
- Produces: documented browser and service-to-service model calling contract。

- [ ] **Step 1: 更新调用约定文档**

文档必须明确：

```text
浏览器子应用模型调用：/v1/* + JWT + X-Pavilion-App-Code
后端服务模型调用：/v1/* + x-api-key
Provider 只由 llm-gateway Adapter 连接
旧 /api/llm/chat 与 /api/llm/chat/stream 已移除
用量统计：主应用 /usage，仅 ADMIN
生产反向代理必须把 /api/* 和 /v1/* 都转发到 llm-gateway
```

在 `AGENTS.md` 的核心约定中增加：“子应用不得直连 Provider 或业务子服务；模型调用统一使用 llm-gateway `/v1/*`”。
不要宣称 `X-Pavilion-App-Code` 是安全凭证。

- [ ] **Step 2: 运行后端完整验证**

Run: `pnpm --filter @pavilion-mfe/llm-gateway exec prisma validate`

Run: `pnpm --filter @pavilion-mfe/llm-gateway typecheck`

Run: `pnpm --filter @pavilion-mfe/llm-gateway test`

Run: `pnpm --filter @pavilion-mfe/llm-gateway build`

Expected: 全部 exit 0。

- [ ] **Step 3: 运行三个前端完整验证**

Run: `pnpm --filter ai-chat test && pnpm --filter ai-chat build:dev`

Run: `pnpm --filter git-report-generator test && pnpm --filter git-report-generator build:dev`

Run: `pnpm --filter main-app test && pnpm --filter main-app typecheck && pnpm --filter main-app build:dev`

Expected: 全部 exit 0。

- [ ] **Step 4: 执行静态安全扫描**

Run:

```bash
rg -n "apiKey|encryptedPayload|Run\.input|Run\.output|messages|content" \
  services/llm-gateway/src/modules/usage apps/main-app/src/api/usage.ts apps/main-app/src/pages/Usage.tsx apps/main-app/src/pages/usage
```

Expected: 统计响应 select 中无 Credential、input、output、messages 或 content；若命中测试说明或类型名，逐项人工确认不进入响应。

Run:

```bash
rg -n "(/api/llm/chat/stream|/api/llm/chat\b)" apps services/llm-gateway/src --glob '!**/*.spec.ts'
```

Expected: 无模型执行调用；仅允许 thread 子路径和迁移说明文档命中。

- [ ] **Step 5: 执行全仓质量检查**

Run: `pnpm format:check`

Run: `pnpm lint`

Run: `pnpm typecheck`

Expected: 全部 exit 0。若出现与本功能无关的既有失败，记录完整命令和错误，不修改无关代码。

- [ ] **Step 6: 提交文档与验证修正**

```bash
git add apps/ai-chat/README.md apps/git-report-generator/README.md services/llm-gateway/README.md AGENTS.md
git commit -m "docs: 说明统一模型入口与用量统计"
```
