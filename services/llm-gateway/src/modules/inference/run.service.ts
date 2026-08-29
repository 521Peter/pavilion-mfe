import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "@/database/prisma.service";
import { toPrismaJson } from "@/database/prisma-json";
import type { InferencePrincipal, NormalizedLlmRequest } from "./inference.types";

@Injectable()
export class RunService {
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly prisma: PrismaService) {}

  async create(request: NormalizedLlmRequest, virtualModelId: string) {
    const run = await this.prisma.run.create({
      data: {
        requestId: request.requestId,
        userId: request.principal.userId,
        applicationId: request.principal.applicationId,
        agentVersionId: request.agentVersionId,
        virtualModelId,
        status: "running",
        input: toPrismaJson({ model: request.model, messages: request.messages }),
        startedAt: new Date(),
        events: { create: { sequence: 1, type: "run.started", data: {} } }
      }
    });
    const controller = new AbortController();
    this.controllers.set(run.id, controller);
    return { run, controller };
  }

  async finish(id: string, output: Prisma.InputJsonValue): Promise<void> {
    this.controllers.delete(id);
    const updated = await this.prisma.run.updateMany({
      where: { id, status: { in: ["queued", "running"] } },
      data: { status: "completed", output, completedAt: new Date() }
    });
    if (updated.count > 0) {
      await this.prisma.runEvent.upsert({
        where: { runId_sequence: { runId: id, sequence: 2 } },
        create: { runId: id, sequence: 2, type: "run.completed", data: {} },
        update: { type: "run.completed", data: {} }
      });
    }
  }

  async fail(id: string, error: unknown, cancelled = false): Promise<void> {
    this.controllers.delete(id);
    const message = error instanceof Error ? error.message : String(error);
    const updated = await this.prisma.run.updateMany({
      where: { id, status: { in: ["queued", "running"] } },
      data: {
        status: cancelled ? "cancelled" : "failed",
        error: { message },
        cancelledAt: cancelled ? new Date() : undefined,
        completedAt: new Date()
      }
    });
    if (updated.count > 0) {
      await this.prisma.runEvent.upsert({
        where: { runId_sequence: { runId: id, sequence: 2 } },
        create: { runId: id, sequence: 2, type: cancelled ? "run.cancelled" : "run.failed", data: { message } },
        update: { type: cancelled ? "run.cancelled" : "run.failed", data: { message } }
      });
    }
  }

  async get(id: string, principal: InferencePrincipal) {
    const run = await this.prisma.run.findFirst({
      where: {
        id,
        ...(principal.authenticationType === "user"
          ? { userId: principal.userId }
          : { applicationId: principal.applicationId })
      },
      include: {
        steps: { orderBy: { sequence: "asc" } },
        events: { orderBy: { sequence: "asc" } },
        attempts: { orderBy: { attempt: "asc" } },
        usageRecords: true
      }
    });
    if (!run) throw new NotFoundException("Run 不存在");
    return run;
  }

  async cancel(id: string, principal: InferencePrincipal): Promise<void> {
    const run = await this.prisma.run.findFirst({
      where: {
        id,
        ...(principal.authenticationType === "user"
          ? { userId: principal.userId }
          : { applicationId: principal.applicationId })
      }
    });
    if (!run) throw new NotFoundException("Run 不存在");
    this.controllers.get(id)?.abort(new Error("Run cancelled"));
    if (["queued", "running"].includes(run.status)) await this.fail(id, new Error("Run cancelled"), true);
  }
}
