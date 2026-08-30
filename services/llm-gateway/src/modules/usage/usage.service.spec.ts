/* oxlint-disable typescript/no-unsafe-type-assertion -- Prisma is mocked at its persistence boundary. */
import type { PrismaService } from "@/database/prisma.service";
import { Prisma } from "../../../generated/prisma/client";
import { UsageService } from "./usage.service";
import type { UsageSnapshot } from "./usage.types";

const snapshot: UsageSnapshot = {
  occurredAt: "2026-08-29T01:02:03.000Z",
  requestId: "request-1",
  runId: "run-1",
  userId: "user-1",
  applicationId: "application-1",
  virtualModelId: "virtual-model-1",
  deploymentId: "deployment-1",
  inputTokens: 1_000,
  outputTokens: 2_000,
  cachedTokens: 100,
  reasoningTokens: 200,
  inputPricePerM: 2,
  outputPricePerM: 3,
  latencyMs: 400,
  fallbackCount: 1
};

describe("UsageService", () => {
  const prisma = {
    $queryRaw: jest.fn(),
    usageRecord: { upsert: jest.fn(), findMany: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
    run: { findMany: jest.fn(), groupBy: jest.fn(), count: jest.fn() },
    application: { findMany: jest.fn() },
    virtualModel: { findMany: jest.fn() },
    modelDeployment: { findMany: jest.fn() },
    providerAttempt: { groupBy: jest.fn() }
  };
  const service = new UsageService(prisma as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it("为每个完成的 Run 使用固定幂等键写入一条用量", async () => {
    prisma.usageRecord.upsert.mockResolvedValue({ id: "usage-1" });

    await service.record(snapshot);

    expect(prisma.usageRecord.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: "run:run-1" },
      create: expect.objectContaining({
        idempotencyKey: "run:run-1",
        estimatedCost: 0.008,
        createdAt: new Date("2026-08-29T01:02:03.000Z")
      }),
      update: expect.objectContaining({ estimatedCost: 0.008 })
    });
  });

  it("补录没有用量记录的已完成 Run，并保留原始请求时间", async () => {
    prisma.run.findMany.mockResolvedValue([{ id: "run-1", usageSnapshot: snapshot }]);
    prisma.usageRecord.upsert.mockResolvedValue({ id: "usage-1" });

    await expect(service.reconcile()).resolves.toBe(1);

    expect(prisma.run.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "completed" }), take: 100 })
    );
    expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ createdAt: new Date(snapshot.occurredAt) }) })
    );
  });

  it("补录单条失败时继续处理其余快照", async () => {
    prisma.run.findMany.mockResolvedValue([
      { id: "run-1", usageSnapshot: snapshot },
      { id: "run-2", usageSnapshot: { ...snapshot, runId: "run-2", requestId: "request-2" } }
    ]);
    prisma.usageRecord.upsert
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce({ id: "usage-2" });

    await expect(service.reconcile()).resolves.toBe(1);
    expect(prisma.usageRecord.upsert).toHaveBeenCalledTimes(2);
  });

  it("按 completed / (completed + failed) 计算成功率并排除 cancelled", async () => {
    prisma.run.groupBy.mockResolvedValue([
      { status: "completed", _count: { _all: 8 } },
      { status: "failed", _count: { _all: 2 } },
      { status: "cancelled", _count: { _all: 2 } }
    ]);
    prisma.usageRecord.aggregate.mockResolvedValue({
      _sum: {
        inputTokens: 100,
        outputTokens: 60,
        cachedTokens: 10,
        reasoningTokens: 5,
        estimatedCost: new Prisma.Decimal("1.23450000"),
        fallbackCount: 3
      },
      _avg: { latencyMs: 250 }
    });

    await expect(
      service.overview({
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-08T00:00:00.000Z",
        providerId: "11111111-1111-4111-8111-111111111111"
      })
    ).resolves.toEqual({
      totalRuns: 12,
      completedRuns: 8,
      failedRuns: 2,
      cancelledRuns: 2,
      successRate: 0.8,
      inputTokens: 100,
      outputTokens: 60,
      cachedTokens: 10,
      reasoningTokens: 5,
      estimatedCost: "1.2345",
      averageLatencyMs: 250,
      fallbackCount: 3
    });
    expect(prisma.run.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          attempts: { some: { deployment: { providerId: "11111111-1111-4111-8111-111111111111" } } }
        })
      })
    );
    expect(prisma.usageRecord.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deployment: { providerId: "11111111-1111-4111-8111-111111111111" } })
      })
    );
  });

  it("成功率分母为零时返回 0", async () => {
    prisma.run.groupBy.mockResolvedValue([{ status: "cancelled", _count: { _all: 4 } }]);
    prisma.usageRecord.aggregate.mockResolvedValue({ _sum: {}, _avg: {} });

    await expect(
      service.overview({ from: "2026-08-01T00:00:00.000Z", to: "2026-08-02T00:00:00.000Z" })
    ).resolves.toMatchObject({ totalRuns: 4, completedRuns: 0, failedRuns: 0, cancelledRuns: 4, successRate: 0 });
  });

  it("缺省时间固定为最近 7 天，并拒绝倒置或超过 366 天的范围", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-30T12:00:00.000Z"));
    prisma.run.groupBy.mockResolvedValue([]);
    prisma.usageRecord.aggregate.mockResolvedValue({ _sum: {}, _avg: {} });

    await service.overview({});

    expect(prisma.run.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: new Date("2026-08-23T12:00:00.000Z"), lt: new Date("2026-08-30T12:00:00.000Z") }
        })
      })
    );
    await expect(
      service.overview({ from: "2026-08-02T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z" })
    ).rejects.toThrow("起始时间必须早于结束时间");
    await expect(
      service.overview({ from: "2025-08-29T00:00:00.000Z", to: "2026-08-31T00:00:00.000Z" })
    ).rejects.toThrow("查询时间跨度不能超过 366 天");
    jest.useRealTimers();
  });

  it("时序查询只使用白名单 UTC 粒度，并补齐缺失 bucket", async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          bucket: new Date("2026-08-01T00:00:00.000Z"),
          totalRuns: 2,
          completedRuns: 1,
          failedRuns: 1,
          cancelledRuns: 0
        }
      ])
      .mockResolvedValueOnce([
        {
          bucket: new Date("2026-08-01T01:00:00.000Z"),
          inputTokens: 30,
          outputTokens: 20,
          cachedTokens: 4,
          reasoningTokens: 2,
          estimatedCost: new Prisma.Decimal("0.12340000")
        }
      ]);

    const points = await service.timeseries({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-01T03:00:00.000Z"
    });

    expect(points).toEqual([
      {
        bucket: "2026-08-01T00:00:00.000Z",
        totalRuns: 2,
        completedRuns: 1,
        failedRuns: 1,
        cancelledRuns: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
        estimatedCost: "0"
      },
      {
        bucket: "2026-08-01T01:00:00.000Z",
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        cancelledRuns: 0,
        inputTokens: 30,
        outputTokens: 20,
        cachedTokens: 4,
        reasoningTokens: 2,
        estimatedCost: "0.1234"
      },
      {
        bucket: "2026-08-01T02:00:00.000Z",
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        cancelledRuns: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
        estimatedCost: "0"
      }
    ]);
    const sql = prisma.$queryRaw.mock.calls.map(([query]) => String(query.sql ?? query.text ?? query)).join("\n");
    expect(sql).toContain("date_trunc('hour'");
    expect(sql).not.toContain("minute");
    await expect(
      service.timeseries({
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-01T03:00:00.000Z",
        interval: "minute" as "hour"
      })
    ).rejects.toThrow("不支持的时间粒度");
  });

  it("按 Provider identity 聚合，并按 attempt 计数且将 null errorType 归入 UnknownError", async () => {
    prisma.usageRecord.groupBy.mockImplementation(async ({ by, where }) => {
      if ("fallbackCount" in where) {
        return [
          {
            deploymentId: "deployment-2",
            _count: { _all: 2 },
            _sum: { fallbackCount: 5 }
          }
        ];
      }
      if (by[0] === "applicationId")
        return [
          {
            applicationId: "application-1",
            _count: { _all: 12 },
            _sum: { inputTokens: 100, outputTokens: 50, estimatedCost: "1.25" }
          }
        ];
      if (by[0] === "virtualModelId")
        return [
          {
            virtualModelId: "model-1",
            _count: { _all: 12 },
            _sum: { inputTokens: 100, outputTokens: 50, estimatedCost: "1.25" }
          }
        ];
      return [
        {
          deploymentId: "deployment-1",
          _count: { _all: 8 },
          _sum: { inputTokens: 80, outputTokens: 40, estimatedCost: "1" }
        },
        {
          deploymentId: "deployment-2",
          _count: { _all: 4 },
          _sum: { inputTokens: 20, outputTokens: 10, estimatedCost: "0.25" }
        }
      ];
    });
    prisma.application.findMany.mockResolvedValue([{ id: "application-1", code: "ai-chat", name: "AI Chat" }]);
    prisma.virtualModel.findMany.mockResolvedValue([{ id: "model-1", name: "chat", displayName: "Chat" }]);
    prisma.modelDeployment.findMany.mockResolvedValue([
      {
        id: "deployment-1",
        name: "gpt-primary",
        upstreamModel: "gpt-5",
        provider: { id: "provider-1", name: "OpenAI", type: "openai" }
      },
      {
        id: "deployment-2",
        name: "gpt-backup",
        upstreamModel: "gpt-5-mini",
        provider: { id: "provider-1", name: "OpenAI", type: "openai" }
      }
    ]);
    prisma.providerAttempt.groupBy.mockResolvedValue([
      // 同一 Run 的两次失败 attempt 会进入同一 errorType + deployment 分组，并分别计数。
      { errorType: null, deploymentId: "deployment-1", _count: { _all: 2 } },
      { errorType: "TimeoutError", deploymentId: "deployment-1", _count: { _all: 1 } }
    ]);

    const breakdown = await service.breakdown({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-08T00:00:00.000Z"
    });

    expect(breakdown.providers).toEqual([
      {
        id: "provider-1",
        name: "OpenAI",
        type: "openai",
        runs: 12,
        inputTokens: 100,
        outputTokens: 50,
        estimatedCost: "1.25"
      }
    ]);
    expect(breakdown.failureAttempts).toEqual([
      {
        errorType: "UnknownError",
        providerId: "provider-1",
        providerName: "OpenAI",
        providerType: "openai",
        attemptCount: 2
      },
      {
        errorType: "TimeoutError",
        providerId: "provider-1",
        providerName: "OpenAI",
        providerType: "openai",
        attemptCount: 1
      }
    ]);
    const failureWhere = prisma.providerAttempt.groupBy.mock.calls[0][0].where;
    expect(failureWhere).not.toHaveProperty("errorType");
    expect(breakdown.fallbacks).toEqual([
      {
        deploymentId: "deployment-2",
        deploymentName: "gpt-backup",
        upstreamModel: "gpt-5-mini",
        providerId: "provider-1",
        providerName: "OpenAI",
        providerType: "openai",
        runs: 2,
        fallbackCount: 5
      }
    ]);
    expect(JSON.stringify(breakdown)).not.toContain("credential");
    expect(JSON.stringify(breakdown)).not.toContain("stack");
  });

  it("明细使用同一 Run 过滤器分页且不选择输入、输出或完整错误", async () => {
    prisma.run.count.mockResolvedValue(1);
    prisma.run.findMany.mockResolvedValue([
      {
        id: "run-1",
        requestId: "request-1",
        status: "failed",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        completedAt: new Date("2026-08-01T00:00:01.000Z"),
        user: { id: "user-1", username: "member", nickname: "Member" },
        application: { id: "application-1", code: "ai-chat", name: "AI Chat" },
        virtualModel: { id: "model-1", name: "chat", displayName: "Chat" },
        usageRecords: [
          {
            inputTokens: 10,
            outputTokens: 5,
            cachedTokens: 1,
            reasoningTokens: 0,
            estimatedCost: new Prisma.Decimal("0.00012000"),
            latencyMs: 900,
            fallbackCount: 0,
            deployment: {
              id: "deployment-1",
              name: "gpt-primary",
              upstreamModel: "gpt-5",
              provider: { id: "provider-1", name: "OpenAI", type: "openai" }
            }
          }
        ],
        attempts: [{ status: "failed", errorType: "TimeoutError" }]
      }
    ]);

    const page = await service.runs({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-08T00:00:00.000Z",
      providerId: "provider-1",
      page: 1,
      pageSize: 20,
      requestId: "request-1"
    });

    expect(page).toMatchObject({ total: 1, page: 1, pageSize: 20, totalPages: 1 });
    expect(page.items[0]).not.toHaveProperty("input");
    expect(page.items[0]).not.toHaveProperty("output");
    expect(page.items[0]).not.toHaveProperty("error");
    expect(page.items[0].usageRecords[0].estimatedCost).toBe("0.00012");
    const countWhere = prisma.run.count.mock.calls[0][0].where;
    const findWhere = prisma.run.findMany.mock.calls[0][0].where;
    expect(findWhere).toEqual(countWhere);
    expect(findWhere).toMatchObject({
      requestId: { contains: "request-1" },
      attempts: { some: { deployment: { providerId: "provider-1" } } }
    });
    const select = prisma.run.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("input");
    expect(select).not.toHaveProperty("output");
    expect(select).not.toHaveProperty("error");
    expect(select.attempts.select).toEqual({ status: true, errorType: true });
  });
});
