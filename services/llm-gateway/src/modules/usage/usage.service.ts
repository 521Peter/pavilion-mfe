/* oxlint-disable eslint/no-underscore-dangle -- Prisma aggregate result field names are generated public API. */
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "@/database/prisma.service";
import type { UsageFilterDto, UsageRunsDto, UsageTimeseriesDto } from "./dto/usage-query.dto";
import type {
  UsageBreakdown,
  UsageDimensionBreakdownItem,
  UsageFailureAttemptBreakdownItem,
  UsageFallbackBreakdownItem,
  UsageOverview,
  UsageProviderBreakdownItem,
  UsageRunPage,
  UsageSnapshot,
  UsageTimeseriesPoint
} from "./usage.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_MS = 366 * DAY_MS;
const DEFAULT_RANGE_MS = 7 * DAY_MS;
const RECONCILE_PAGE_SIZE = 100;
const RECONCILE_MAX_PAGES = 10;

interface UsageRange {
  from: Date;
  to: Date;
}

interface RunTimeseriesRow {
  bucket: Date | string;
  totalRuns: number | bigint;
  completedRuns: number | bigint;
  failedRuns: number | bigint;
  cancelledRuns: number | bigint;
}

interface RecordTimeseriesRow {
  bucket: Date | string;
  inputTokens: number | bigint;
  outputTokens: number | bigint;
  cachedTokens: number | bigint;
  reasoningTokens: number | bigint;
  estimatedCost: unknown;
}

function decimalString(value: unknown): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return `${value}`;
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  throw new TypeError("用量费用不是有效 Decimal");
}

function numberValue(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function sumDecimalStrings(values: string[]): string {
  return values.reduce((total, value) => total.plus(value), new Prisma.Decimal(0)).toString();
}

function collapseDimensions<T extends UsageDimensionBreakdownItem>(items: T[], other: (tail: T[]) => T): T[] {
  const sorted = [...items].sort((left, right) => right.runs - left.runs);
  return sorted.length <= 10 ? sorted : [...sorted.slice(0, 10), other(sorted.slice(10))];
}

function baseOther(tail: UsageDimensionBreakdownItem[]): UsageDimensionBreakdownItem {
  return {
    id: "other",
    name: "其他",
    runs: tail.reduce((total, item) => total + item.runs, 0),
    inputTokens: tail.reduce((total, item) => total + item.inputTokens, 0),
    outputTokens: tail.reduce((total, item) => total + item.outputTokens, 0),
    estimatedCost: sumDecimalStrings(tail.map(item => item.estimatedCost))
  };
}

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
  private reconcileCursor?: string;

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
    const candidates: Array<{ snapshot: UsageSnapshot; cursorBefore?: string }> = [];
    let cursor = this.reconcileCursor;
    let exhausted = false;
    let invalidSnapshots = 0;
    let pages = 0;
    while (candidates.length < RECONCILE_PAGE_SIZE && pages < RECONCILE_MAX_PAGES) {
      // 游标依赖上一页的最后一条记录，分页查询必须顺序执行。
      // eslint-disable-next-line no-await-in-loop
      const runs = await this.prisma.run.findMany({
        where: { status: "completed", usageSnapshot: { not: Prisma.DbNull }, usageRecords: { none: {} } },
        select: { id: true, usageSnapshot: true },
        orderBy: [{ completedAt: "asc" }, { id: "asc" }],
        take: RECONCILE_PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      });
      pages += 1;
      if (runs.length === 0) {
        exhausted = true;
        break;
      }
      for (const run of runs) {
        const cursorBefore = cursor;
        cursor = run.id;
        if (!isUsageSnapshot(run.usageSnapshot)) {
          invalidSnapshots += 1;
          continue;
        }
        candidates.push({ snapshot: run.usageSnapshot, cursorBefore });
        if (candidates.length === RECONCILE_PAGE_SIZE) break;
      }
      if (runs.length < RECONCILE_PAGE_SIZE) {
        exhausted = true;
        break;
      }
    }
    if (invalidSnapshots > 0)
      this.logger.error({ event: "usage.reconcile.invalid_snapshots", count: invalidSnapshots });
    const repairs = await Promise.all(
      candidates.map(async ({ snapshot }) => {
        try {
          await this.record(snapshot);
          return 1;
        } catch (error) {
          this.logger.error({
            event: "usage.reconcile.deferred",
            requestId: snapshot.requestId,
            runId: snapshot.runId,
            errorType: error instanceof Error ? error.name : "UnknownError"
          });
          return 0;
        }
      })
    );
    const firstFailure = repairs.indexOf(0);
    this.reconcileCursor = firstFailure >= 0 ? candidates[firstFailure]?.cursorBefore : exhausted ? undefined : cursor;
    return repairs.reduce<number>((total, repaired) => total + repaired, 0);
  }

  async overview(filters: UsageFilterDto): Promise<UsageOverview> {
    const range = this.resolveRange(filters);
    const [statusRows, usage] = await Promise.all([
      this.prisma.run.groupBy({
        by: ["status"],
        where: this.runWhere(filters, range),
        _count: { _all: true }
      }),
      this.prisma.usageRecord.aggregate({
        where: this.usageWhere(filters, range),
        _sum: {
          inputTokens: true,
          outputTokens: true,
          cachedTokens: true,
          reasoningTokens: true,
          estimatedCost: true,
          fallbackCount: true
        },
        _avg: { latencyMs: true }
      })
    ]);
    const counts = new Map(statusRows.map(row => [row.status, row._count._all]));
    const completedRuns = counts.get("completed") ?? 0;
    const failedRuns = counts.get("failed") ?? 0;
    const denominator = completedRuns + failedRuns;

    return {
      totalRuns: statusRows.reduce((total, row) => total + row._count._all, 0),
      completedRuns,
      failedRuns,
      cancelledRuns: counts.get("cancelled") ?? 0,
      successRate: denominator === 0 ? 0 : completedRuns / denominator,
      inputTokens: usage._sum.inputTokens ?? 0,
      outputTokens: usage._sum.outputTokens ?? 0,
      cachedTokens: usage._sum.cachedTokens ?? 0,
      reasoningTokens: usage._sum.reasoningTokens ?? 0,
      estimatedCost: decimalString(usage._sum.estimatedCost),
      averageLatencyMs: numberValue(usage._avg.latencyMs),
      fallbackCount: usage._sum.fallbackCount ?? 0
    };
  }

  async timeseries(filters: UsageTimeseriesDto): Promise<UsageTimeseriesPoint[]> {
    const range = this.resolveRange(filters);
    const interval =
      filters.interval ?? (range.to.getTime() - range.from.getTime() <= 48 * 60 * 60 * 1000 ? "hour" : "day");
    if (interval !== "hour" && interval !== "day") throw new BadRequestException("不支持的时间粒度");

    // Prisma.Sql only ever receives one of these two literals; user input is never used as SQL text.
    const runBucket =
      interval === "hour"
        ? Prisma.sql`date_trunc('hour', r."created_at")`
        : Prisma.sql`date_trunc('day', r."created_at")`;
    const usageBucket =
      interval === "hour"
        ? Prisma.sql`date_trunc('hour', ur."created_at")`
        : Prisma.sql`date_trunc('day', ur."created_at")`;
    const runConditions = this.runSqlConditions(filters, range);
    const usageConditions = this.usageSqlConditions(filters, range);

    const [runRows, usageRows] = await Promise.all([
      this.prisma.$queryRaw<RunTimeseriesRow[]>(Prisma.sql`
        SELECT
          ${runBucket} AS "bucket",
          COUNT(*) AS "totalRuns",
          COUNT(*) FILTER (WHERE r."status" = 'completed') AS "completedRuns",
          COUNT(*) FILTER (WHERE r."status" = 'failed') AS "failedRuns",
          COUNT(*) FILTER (WHERE r."status" = 'cancelled') AS "cancelledRuns"
        FROM "runs" r
        WHERE ${Prisma.join(runConditions, " AND ")}
        GROUP BY 1
        ORDER BY 1
      `),
      this.prisma.$queryRaw<RecordTimeseriesRow[]>(Prisma.sql`
        SELECT
          ${usageBucket} AS "bucket",
          SUM(ur."input_tokens") AS "inputTokens",
          SUM(ur."output_tokens") AS "outputTokens",
          SUM(ur."cached_tokens") AS "cachedTokens",
          SUM(ur."reasoning_tokens") AS "reasoningTokens",
          SUM(ur."estimated_cost") AS "estimatedCost"
        FROM "usage_records" ur
        WHERE ${Prisma.join(usageConditions, " AND ")}
        GROUP BY 1
        ORDER BY 1
      `)
    ]);

    const points = new Map<string, UsageTimeseriesPoint>();
    const bucketMs = interval === "hour" ? 60 * 60 * 1000 : DAY_MS;
    const start = new Date(range.from);
    if (interval === "hour") start.setUTCMinutes(0, 0, 0);
    else start.setUTCHours(0, 0, 0, 0);
    for (let at = start.getTime(); at < range.to.getTime(); at += bucketMs) {
      const bucket = new Date(at).toISOString();
      points.set(bucket, {
        bucket,
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        cancelledRuns: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
        estimatedCost: "0"
      });
    }
    for (const row of runRows) {
      const point = points.get(new Date(row.bucket).toISOString());
      if (!point) continue;
      point.totalRuns = numberValue(row.totalRuns);
      point.completedRuns = numberValue(row.completedRuns);
      point.failedRuns = numberValue(row.failedRuns);
      point.cancelledRuns = numberValue(row.cancelledRuns);
    }
    for (const row of usageRows) {
      const point = points.get(new Date(row.bucket).toISOString());
      if (!point) continue;
      point.inputTokens = numberValue(row.inputTokens);
      point.outputTokens = numberValue(row.outputTokens);
      point.cachedTokens = numberValue(row.cachedTokens);
      point.reasoningTokens = numberValue(row.reasoningTokens);
      point.estimatedCost = decimalString(row.estimatedCost);
    }
    return [...points.values()];
  }

  async breakdown(filters: UsageFilterDto): Promise<UsageBreakdown> {
    const range = this.resolveRange(filters);
    const usageWhere = this.usageWhere(filters, range);
    const attemptRunWhere = this.runWhere(filters, range, false);
    const attemptWhere: Prisma.ProviderAttemptWhereInput = {
      status: "failed",
      run: { is: attemptRunWhere },
      deployment: filters.providerId ? { providerId: filters.providerId } : undefined
    };
    const [applicationRows, virtualModelRows, deploymentRows, failureRows, fallbackRows] = await Promise.all([
      this.prisma.usageRecord.groupBy({
        by: ["applicationId"],
        where: usageWhere,
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true, estimatedCost: true }
      }),
      this.prisma.usageRecord.groupBy({
        by: ["virtualModelId"],
        where: usageWhere,
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true, estimatedCost: true }
      }),
      this.prisma.usageRecord.groupBy({
        by: ["deploymentId"],
        where: usageWhere,
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true, estimatedCost: true }
      }),
      this.prisma.providerAttempt.groupBy({
        by: ["errorType", "deploymentId"],
        where: attemptWhere,
        _count: { _all: true }
      }),
      this.prisma.usageRecord.groupBy({
        by: ["deploymentId"],
        where: { ...usageWhere, fallbackCount: { gt: 0 } },
        _count: { _all: true },
        _sum: { fallbackCount: true }
      })
    ]);

    const applicationIds = applicationRows.flatMap(row => (row.applicationId ? [row.applicationId] : []));
    const virtualModelIds = virtualModelRows.flatMap(row => (row.virtualModelId ? [row.virtualModelId] : []));
    const deploymentIds = new Set<string>();
    for (const row of [...deploymentRows, ...failureRows, ...fallbackRows]) {
      if (row.deploymentId) deploymentIds.add(row.deploymentId);
    }
    const [applications, virtualModels, deployments] = await Promise.all([
      this.prisma.application.findMany({
        where: { id: { in: applicationIds } },
        select: { id: true, code: true, name: true }
      }),
      this.prisma.virtualModel.findMany({
        where: { id: { in: virtualModelIds } },
        select: { id: true, name: true, displayName: true }
      }),
      this.prisma.modelDeployment.findMany({
        where: { id: { in: [...deploymentIds] } },
        select: {
          id: true,
          name: true,
          upstreamModel: true,
          provider: { select: { id: true, name: true, type: true } }
        }
      })
    ]);
    const applicationById = new Map(applications.map(item => [item.id, item]));
    const virtualModelById = new Map(virtualModels.map(item => [item.id, item]));
    const deploymentById = new Map(deployments.map(item => [item.id, item]));

    const applicationItems: UsageDimensionBreakdownItem[] = applicationRows.map(row => {
      const application = row.applicationId ? applicationById.get(row.applicationId) : undefined;
      return {
        id: row.applicationId ?? "unknown",
        name: application?.name ?? "未归属应用",
        runs: row._count._all,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        estimatedCost: decimalString(row._sum.estimatedCost)
      };
    });
    const virtualModelItems: UsageDimensionBreakdownItem[] = virtualModelRows.map(row => {
      const model = row.virtualModelId ? virtualModelById.get(row.virtualModelId) : undefined;
      return {
        id: row.virtualModelId ?? "unknown",
        name: model?.displayName ?? model?.name ?? "未归属 Virtual Model",
        runs: row._count._all,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        estimatedCost: decimalString(row._sum.estimatedCost)
      };
    });

    const providerMap = new Map<string, UsageProviderBreakdownItem>();
    for (const row of deploymentRows) {
      const deployment = row.deploymentId ? deploymentById.get(row.deploymentId) : undefined;
      const provider = deployment?.provider;
      const id = provider?.id ?? "unknown";
      const current = providerMap.get(id) ?? {
        id,
        name: provider?.name ?? "未知 Provider",
        type: provider?.type ?? "unknown",
        runs: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: "0"
      };
      current.runs += row._count._all;
      current.inputTokens += row._sum.inputTokens ?? 0;
      current.outputTokens += row._sum.outputTokens ?? 0;
      current.estimatedCost = sumDecimalStrings([current.estimatedCost, decimalString(row._sum.estimatedCost)]);
      providerMap.set(id, current);
    }

    const failureMap = new Map<string, UsageFailureAttemptBreakdownItem>();
    for (const row of failureRows) {
      const deployment = deploymentById.get(row.deploymentId);
      const provider = deployment?.provider;
      const errorType = row.errorType ?? "UnknownError";
      const providerId = provider?.id ?? "unknown";
      const key = `${errorType}\u0000${providerId}`;
      const current = failureMap.get(key) ?? {
        errorType,
        providerId,
        providerName: provider?.name ?? "未知 Provider",
        providerType: provider?.type ?? "unknown",
        attemptCount: 0
      };
      current.attemptCount += row._count._all;
      failureMap.set(key, current);
    }
    const failureAttempts = [...failureMap.values()].sort((left, right) => right.attemptCount - left.attemptCount);
    const safeFailureAttempts =
      failureAttempts.length <= 10
        ? failureAttempts
        : [
            ...failureAttempts.slice(0, 10),
            {
              errorType: "其他",
              providerId: "other",
              providerName: "其他",
              providerType: "other",
              attemptCount: failureAttempts.slice(10).reduce((total, item) => total + item.attemptCount, 0)
            }
          ];

    const fallbacks: UsageFallbackBreakdownItem[] = fallbackRows
      .map(row => {
        const deployment = row.deploymentId ? deploymentById.get(row.deploymentId) : undefined;
        return {
          deploymentId: row.deploymentId ?? "unknown",
          deploymentName: deployment?.name ?? "未知 Deployment",
          upstreamModel: deployment?.upstreamModel ?? "unknown",
          providerId: deployment?.provider.id ?? "unknown",
          providerName: deployment?.provider.name ?? "未知 Provider",
          providerType: deployment?.provider.type ?? "unknown",
          runs: row._count._all,
          fallbackCount: row._sum.fallbackCount ?? 0
        };
      })
      .sort((left, right) => right.fallbackCount - left.fallbackCount);
    const safeFallbacks =
      fallbacks.length <= 10
        ? fallbacks
        : [
            ...fallbacks.slice(0, 10),
            {
              deploymentId: "other",
              deploymentName: "其他",
              upstreamModel: "other",
              providerId: "other",
              providerName: "其他",
              providerType: "other",
              runs: fallbacks.slice(10).reduce((total, item) => total + item.runs, 0),
              fallbackCount: fallbacks.slice(10).reduce((total, item) => total + item.fallbackCount, 0)
            }
          ];

    return {
      applications: collapseDimensions(applicationItems, baseOther),
      virtualModels: collapseDimensions(virtualModelItems, baseOther),
      providers: collapseDimensions([...providerMap.values()], tail => ({ ...baseOther(tail), type: "other" })),
      failureAttempts: safeFailureAttempts,
      fallbacks: safeFallbacks
    };
  }

  async runs(filters: UsageRunsDto): Promise<UsageRunPage> {
    const range = this.resolveRange(filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const where: Prisma.RunWhereInput = {
      ...this.runWhere(filters, range),
      requestId: filters.requestId ? { contains: filters.requestId } : undefined
    };
    const select = {
      id: true,
      requestId: true,
      status: true,
      createdAt: true,
      completedAt: true,
      user: { select: { id: true, username: true, nickname: true } },
      application: { select: { id: true, code: true, name: true } },
      virtualModel: { select: { id: true, name: true, displayName: true } },
      usageRecords: {
        select: {
          inputTokens: true,
          outputTokens: true,
          cachedTokens: true,
          reasoningTokens: true,
          estimatedCost: true,
          latencyMs: true,
          fallbackCount: true,
          deployment: {
            select: {
              id: true,
              name: true,
              upstreamModel: true,
              provider: { select: { id: true, name: true, type: true } }
            }
          }
        }
      },
      attempts: { select: { status: true, errorType: true }, orderBy: { attempt: "asc" as const } }
    } satisfies Prisma.RunSelect;
    const [total, items] = await Promise.all([
      this.prisma.run.count({ where }),
      this.prisma.run.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: items.map(item => ({
        id: item.id,
        requestId: item.requestId,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        completedAt: item.completedAt?.toISOString() ?? null,
        user: item.user,
        application: item.application,
        virtualModel: item.virtualModel,
        usageRecords: item.usageRecords.map(record => ({
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          cachedTokens: record.cachedTokens,
          reasoningTokens: record.reasoningTokens,
          estimatedCost: decimalString(record.estimatedCost),
          latencyMs: record.latencyMs,
          fallbackCount: record.fallbackCount,
          deployment: record.deployment
        })),
        attempts: item.attempts
      })),
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  private resolveRange(filters: Pick<UsageFilterDto, "from" | "to">): UsageRange {
    const to = filters.to ? new Date(filters.to) : new Date();
    const from = filters.from ? new Date(filters.from) : new Date(to.getTime() - DEFAULT_RANGE_MS);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()))
      throw new BadRequestException("时间必须为 ISO 8601 格式");
    if (from >= to) throw new BadRequestException("起始时间必须早于结束时间");
    if (to.getTime() - from.getTime() > MAX_RANGE_MS) throw new BadRequestException("查询时间跨度不能超过 366 天");
    return { from, to };
  }

  private runWhere(filters: UsageFilterDto, range: UsageRange, includeProvider = true): Prisma.RunWhereInput {
    return {
      createdAt: { gte: range.from, lt: range.to },
      applicationId: filters.applicationId,
      virtualModelId: filters.virtualModelId,
      status: filters.status,
      attempts:
        includeProvider && filters.providerId ? { some: { deployment: { providerId: filters.providerId } } } : undefined
    };
  }

  private usageWhere(filters: UsageFilterDto, range: UsageRange): Prisma.UsageRecordWhereInput {
    return {
      createdAt: { gte: range.from, lt: range.to },
      applicationId: filters.applicationId,
      virtualModelId: filters.virtualModelId,
      deployment: filters.providerId ? { providerId: filters.providerId } : undefined,
      run: filters.status ? { is: { status: filters.status } } : undefined
    };
  }

  private runSqlConditions(filters: UsageFilterDto, range: UsageRange): Prisma.Sql[] {
    const conditions = [Prisma.sql`r."created_at" >= ${range.from}`, Prisma.sql`r."created_at" < ${range.to}`];
    if (filters.applicationId) conditions.push(Prisma.sql`r."application_id" = ${filters.applicationId}`);
    if (filters.virtualModelId) conditions.push(Prisma.sql`r."virtual_model_id" = ${filters.virtualModelId}`);
    if (filters.status) conditions.push(Prisma.sql`r."status" = ${filters.status}`);
    if (filters.providerId) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1
        FROM "provider_attempts" pa
        JOIN "model_deployments" md ON md."id" = pa."deployment_id"
        WHERE pa."run_id" = r."id" AND md."provider_id" = ${filters.providerId}
      )`);
    }
    return conditions;
  }

  private usageSqlConditions(filters: UsageFilterDto, range: UsageRange): Prisma.Sql[] {
    const conditions = [Prisma.sql`ur."created_at" >= ${range.from}`, Prisma.sql`ur."created_at" < ${range.to}`];
    if (filters.applicationId) conditions.push(Prisma.sql`ur."application_id" = ${filters.applicationId}`);
    if (filters.virtualModelId) conditions.push(Prisma.sql`ur."virtual_model_id" = ${filters.virtualModelId}`);
    if (filters.providerId) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1
        FROM "model_deployments" md
        WHERE md."id" = ur."deployment_id" AND md."provider_id" = ${filters.providerId}
      )`);
    }
    if (filters.status) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1
        FROM "runs" filtered_run
        WHERE filtered_run."id" = ur."run_id" AND filtered_run."status" = ${filters.status}
      )`);
    }
    return conditions;
  }
}
