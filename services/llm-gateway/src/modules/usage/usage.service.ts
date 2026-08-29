import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "@/database/prisma.service";
import type { UsageSnapshot } from "./usage.types";

function isUsageSnapshot(value: unknown): value is UsageSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const fields = new Map(Object.entries(value));
  const strings = ["occurredAt", "requestId", "runId", "applicationId", "virtualModelId", "deploymentId"];
  const numbers = [
    "inputTokens",
    "outputTokens",
    "cachedTokens",
    "reasoningTokens",
    "inputPricePerM",
    "outputPricePerM",
    "latencyMs",
    "fallbackCount"
  ];
  return (
    strings.every(key => {
      const field = fields.get(key);
      return typeof field === "string" && field.length > 0;
    }) &&
    numbers.every(key => {
      const field = fields.get(key);
      return typeof field === "number" && Number.isFinite(field);
    }) &&
    (fields.get("userId") === undefined || typeof fields.get("userId") === "string") &&
    !Number.isNaN(new Date(String(fields.get("occurredAt"))).getTime())
  );
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(snapshot: UsageSnapshot): Promise<void> {
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
    const idempotencyKey = `run:${snapshot.runId}`;
    await this.prisma.usageRecord.upsert({
      where: { idempotencyKey },
      create: { ...data, idempotencyKey, estimatedCost, createdAt: new Date(snapshot.occurredAt) },
      update: { ...data, estimatedCost }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async reconcile(): Promise<number> {
    const runs = await this.prisma.run.findMany({
      where: { status: "completed", usageSnapshot: { not: Prisma.DbNull }, usageRecords: { none: {} } },
      select: { usageSnapshot: true },
      orderBy: { completedAt: "asc" },
      take: 100
    });
    const repairs = await Promise.all(
      runs.map(async run => {
        if (!isUsageSnapshot(run.usageSnapshot)) {
          this.logger.error({ event: "usage.reconcile.invalid_snapshot" });
          return 0;
        }
        try {
          await this.record(run.usageSnapshot);
          return 1;
        } catch (error) {
          this.logger.error({
            event: "usage.reconcile.deferred",
            requestId: run.usageSnapshot.requestId,
            runId: run.usageSnapshot.runId,
            errorType: error instanceof Error ? error.name : "UnknownError"
          });
          return 0;
        }
      })
    );
    return repairs.reduce<number>((total, repaired) => total + repaired, 0);
  }

  list(filters: { userId?: string; applicationId?: string; virtualModelId?: string; from?: Date; to?: Date }) {
    return this.prisma.usageRecord.findMany({
      where: {
        userId: filters.userId,
        applicationId: filters.applicationId,
        virtualModelId: filters.virtualModelId,
        createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined
      },
      orderBy: { createdAt: "desc" },
      take: 500
    });
  }

  summary(filters: { applicationId?: string; virtualModelId?: string; from?: Date; to?: Date }) {
    return this.prisma.usageRecord.aggregate({
      where: {
        applicationId: filters.applicationId,
        virtualModelId: filters.virtualModelId,
        createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cachedTokens: true,
        reasoningTokens: true,
        estimatedCost: true
      },
      _count: true
    });
  }
}
