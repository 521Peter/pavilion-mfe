import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { DataPlaneAuthGuard, type DataPlaneRequest } from "@/modules/inference/data-plane-auth.guard";
import { InferenceRateLimitGuard } from "@/modules/inference/inference-rate-limit.guard";
import { AgentRunService } from "./agent-run.service";
import { RunAgentDto } from "./dto/agent.dto";

@UseGuards(DataPlaneAuthGuard, InferenceRateLimitGuard)
@Controller("v1/agents")
export class AgentRunController {
  constructor(private readonly runs: AgentRunService) {}
  @Post(":agentId/runs")
  @HttpCode(200)
  run(@Req() request: DataPlaneRequest, @Param("agentId") agentId: string, @Body() dto: RunAgentDto) {
    return this.runs.run(agentId, dto, request.principal);
  }
}
