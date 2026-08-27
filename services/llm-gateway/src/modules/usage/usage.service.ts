import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";

export interface UsageInput {
  requestId: string;
  runId?: string;
  userId?: string;
  applicationId?: string;
  virtualModelId?: string;
  deploymentId?: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  inputPricePerM?: number;
  outputPricePerM?: number;
  latencyMs?: number;
  fallbackCount?: number;
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: UsageInput) {
    const estimatedCost =
      (input.inputTokens * (input.inputPricePerM ?? 0) + input.outputTokens * (input.outputPricePerM ?? 0)) / 1_000_000;
    return this.prisma.usageRecord.create({ data: { ...input, estimatedCost } });
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
