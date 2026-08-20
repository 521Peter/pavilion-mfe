import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/database/prisma.service';
import { InferenceService } from '@/modules/inference/inference.service';
import type { InferencePrincipal, NormalizedLlmRequest } from '@/modules/inference/inference.types';
import { LlmAgentService } from '@/modules/llm/services/llm-agent.service';
import { RunAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentRunService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inference: InferenceService,
        private readonly agentRuntime: LlmAgentService
    ) {}

    async run(agentIdOrCode: string, dto: RunAgentDto, principal: InferencePrincipal) {
        const agent = await this.prisma.agentDefinition.findFirst({
            where: { OR: [{ id: agentIdOrCode }, { code: agentIdOrCode }], isActive: true }
        });
        if (!agent?.currentVersionId) throw new NotFoundException('Agent 不存在或尚未发布版本');
        const version = await this.prisma.agentVersion.findUnique({
            where: { id: agent.currentVersionId },
            include: {
                toolBindings: { include: { tool: true } },
                skillBindings: { include: { skillVersion: { include: { skill: true } } } }
            }
        });
        if (!version) throw new NotFoundException('Agent Version 不存在');
        const virtualModel = await this.prisma.virtualModel.findUnique({ where: { id: version.virtualModelId } });
        if (!virtualModel) throw new NotFoundException('Agent 绑定的 Virtual Model 不存在');
        const runConfig = (version.runConfig as Record<string, unknown>) ?? {};
        const maxSteps = Math.min(Math.max(Number(runConfig.maxSteps) || 20, 1), 50);
        const maxDuration = Math.min(Math.max(Number(runConfig.timeout) || 120_000, 1_000), 600_000);
        const request: NormalizedLlmRequest = {
            requestId: dto.requestId ?? randomUUID(),
            model: virtualModel.name,
            messages: dto.messages,
            principal,
            agentVersionId: version.id
        };
        const allowedTools = new Set(
            version.toolBindings
                .filter((binding) => binding.approvalPolicy === 'never' && binding.tool.isActive)
                .map((binding) => binding.tool.name)
        );
        const skills = version.skillBindings.map((binding) => ({
            name: binding.skillVersion.skill.name,
            skillMd: binding.skillVersion.content ?? ''
        }));
        return this.inference.execute(request, async (model, signal) => {
            const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(maxDuration)]);
            const content = await this.agentRuntime.run(
                model,
                { providerId: 'gateway', modelId: virtualModel.name, messages: dto.messages },
                {
                    systemPrompt: version.systemPrompt,
                    allowedToolNames: allowedTools,
                    skills,
                    maxSteps,
                    signal: combinedSignal
                }
            );
            return { content };
        });
    }
}
