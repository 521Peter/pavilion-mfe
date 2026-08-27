import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { toPrismaJson } from "@/database/prisma-json";
import { CreateDeploymentDto, CreateVirtualModelDto } from "./dto/model-routing.dto";

@Injectable()
export class ModelRoutingService {
  private readonly circuits = new Map<string, { failures: number; openUntil: number }>();

  constructor(private readonly prisma: PrismaService) {}

  listDeployments() {
    return this.prisma.modelDeployment.findMany({
      orderBy: { createdAt: "asc" },
      include: { provider: { select: { id: true, name: true, type: true } } }
    });
  }

  createDeployment(dto: CreateDeploymentDto) {
    return this.prisma.modelDeployment.create({
      data: {
        name: dto.name,
        providerId: dto.providerId,
        modelId: dto.modelId,
        credentialId: dto.credentialId,
        upstreamModel: dto.upstreamModel,
        config: toPrismaJson(dto.config ?? {}),
        inputPricePerM: dto.inputPricePerM ?? "0",
        outputPricePerM: dto.outputPricePerM ?? "0",
        isActive: dto.isActive ?? true
      }
    });
  }

  async deleteDeployment(id: string): Promise<void> {
    await this.prisma.modelDeployment.delete({ where: { id } });
  }

  listVirtualModels() {
    return this.prisma.virtualModel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      include: {
        routingPolicy: {
          include: { targets: { orderBy: { priority: "asc" }, include: { deployment: true } } }
        }
      }
    });
  }

  async createVirtualModel(dto: CreateVirtualModelDto) {
    if (dto.targets.length === 0) throw new BadRequestException("Virtual Model 至少需要一个 Route Target");
    const strategy = dto.strategy ?? "single";
    if (!["single", "fallback"].includes(strategy)) throw new BadRequestException("仅支持 single 或 fallback");
    return this.prisma.virtualModel.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        routingPolicy: {
          create: {
            strategy,
            requestTimeout: dto.requestTimeout ?? 60_000,
            maxRetries: dto.maxRetries ?? 0,
            targets: {
              create: dto.targets.map((target, index) => ({
                deploymentId: target.deploymentId,
                priority: target.priority ?? index,
                weight: target.weight ?? 100
              }))
            }
          }
        }
      },
      include: { routingPolicy: { include: { targets: true } } }
    });
  }

  async resolve(name: string, allowedModels?: string[]) {
    if (allowedModels && allowedModels.length > 0 && !allowedModels.includes(name)) {
      throw new BadRequestException(`Application 无权访问模型: ${name}`);
    }
    const virtualModel = await this.prisma.virtualModel.findUnique({
      where: { name },
      include: {
        routingPolicy: {
          include: {
            targets: {
              where: { isActive: true, deployment: { isActive: true } },
              orderBy: { priority: "asc" },
              include: { deployment: { include: { provider: true } } }
            }
          }
        }
      }
    });
    if (!virtualModel?.isActive || !virtualModel.routingPolicy)
      throw new NotFoundException(`Virtual Model 不存在: ${name}`);
    const targets = virtualModel.routingPolicy.targets.filter(target => this.isCircuitAvailable(target.deploymentId));
    if (targets.length === 0) throw new BadRequestException(`Virtual Model 当前无可用 Deployment: ${name}`);
    return {
      virtualModel,
      policy: virtualModel.routingPolicy,
      targets: virtualModel.routingPolicy.strategy === "single" ? targets.slice(0, 1) : targets
    };
  }

  recordSuccess(deploymentId: string): void {
    this.circuits.delete(deploymentId);
  }

  recordFailure(deploymentId: string, threshold: number, cooldownMs: number): void {
    const current = this.circuits.get(deploymentId) ?? { failures: 0, openUntil: 0 };
    current.failures += 1;
    if (current.failures >= threshold) current.openUntil = Date.now() + cooldownMs;
    this.circuits.set(deploymentId, current);
  }

  private isCircuitAvailable(deploymentId: string): boolean {
    const circuit = this.circuits.get(deploymentId);
    if (!circuit) return true;
    if (circuit.openUntil > Date.now()) return false;
    if (circuit.openUntil > 0) this.circuits.delete(deploymentId);
    return true;
  }
}
