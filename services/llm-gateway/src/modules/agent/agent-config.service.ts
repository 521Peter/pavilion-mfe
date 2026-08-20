import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@/../generated/prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateAgentDto, PublishAgentVersionDto } from './dto/agent.dto';

@Injectable()
export class AgentConfigService {
    constructor(private readonly prisma: PrismaService) {}

    list() {
        return this.prisma.agentDefinition.findMany({
            orderBy: { createdAt: 'asc' },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
        });
    }

    create(dto: CreateAgentDto) {
        return this.prisma.agentDefinition.create({ data: dto });
    }

    async publish(agentId: string, dto: PublishAgentVersionDto) {
        const agent = await this.prisma.agentDefinition.findUnique({ where: { id: agentId } });
        if (!agent) throw new NotFoundException('Agent 不存在');
        const latest = await this.prisma.agentVersion.aggregate({ where: { agentId }, _max: { version: true } });
        return this.prisma.$transaction(async (tx) => {
            const version = await tx.agentVersion.create({
                data: {
                    agentId,
                    version: (latest._max.version ?? 0) + 1,
                    virtualModelId: dto.virtualModelId,
                    systemPrompt: dto.systemPrompt,
                    runConfig: (dto.runConfig ?? {}) as Prisma.InputJsonValue,
                    toolBindings: {
                        create: (dto.tools ?? []).map((binding) => ({
                            toolId: binding.toolId,
                            approvalPolicy: binding.approvalPolicy ?? 'never',
                            config: (binding.config ?? {}) as Prisma.InputJsonValue
                        }))
                    },
                    skillBindings: {
                        create: (dto.skills ?? []).map((binding) => ({
                            skillVersionId: binding.skillVersionId,
                            selectionMode: binding.selectionMode ?? 'fixed'
                        }))
                    }
                },
                include: { toolBindings: true, skillBindings: true }
            });
            await tx.agentDefinition.update({ where: { id: agentId }, data: { currentVersionId: version.id } });
            return version;
        });
    }
}
