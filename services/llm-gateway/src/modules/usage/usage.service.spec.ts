/* oxlint-disable typescript/no-unsafe-type-assertion -- Prisma is mocked at its persistence boundary. */
import type { PrismaService } from "@/database/prisma.service";
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
    usageRecord: { upsert: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
    run: { findMany: jest.fn() }
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
});
