import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PlatformApi } from "@/common/decorators/platform-api.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { AgentConfigService } from "./agent-config.service";
import { CreateAgentDto, PublishAgentVersionDto } from "./dto/agent.dto";

@PlatformApi()
@Roles("ADMIN")
@Controller("api/agents")
export class AgentAdminController {
  constructor(private readonly agents: AgentConfigService) {}
  @Get() list() {
    return this.agents.list();
  }

  @Post() create(@Body() dto: CreateAgentDto) {
    return this.agents.create(dto);
  }

  @Post(":id/versions") publish(@Param("id") id: string, @Body() dto: PublishAgentVersionDto) {
    return this.agents.publish(id, dto);
  }
}
