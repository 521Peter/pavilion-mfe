import { Injectable, Logger } from "@nestjs/common";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import type { JSONSchema } from "@langchain/core/utils/json_schema";
import { McpClientService, type McpServerConfig, type McpTool } from "@/modules/mcp/services/mcp-client.service";
import { McpServerService } from "@/modules/mcp/services/mcp-server.service";

const MAX_TOOL_RESULT_LENGTH = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function toolName(serverIdentifier: string, name: string): string {
  return `${serverIdentifier}__${name}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function toolResultText(result: unknown): string {
  const text = typeof result === "string" ? result : (JSON.stringify(result) ?? String(result));
  if (text.length <= MAX_TOOL_RESULT_LENGTH) return text;
  return `${text.slice(0, MAX_TOOL_RESULT_LENGTH)}\n[工具结果已截断]`;
}

@Injectable()
export class AgentToolService {
  private readonly logger = new Logger(AgentToolService.name);

  constructor(
    private readonly serverService: McpServerService,
    private readonly clientService: McpClientService
  ) {}

  async listActiveTools(): Promise<StructuredToolInterface[]> {
    const servers = (await this.serverService.list()).filter(server => server.isActive && server.transport === "stdio");
    const tools: StructuredToolInterface[] = [];

    for (const server of servers) {
      if (!Array.isArray(server.cachedTools)) continue;
      const config: McpServerConfig = {
        id: server.id,
        transport: server.transport,
        command: server.command,
        args: Array.isArray(server.args) ? server.args.filter((arg): arg is string => typeof arg === "string") : [],
        env: stringRecord(server.env),
        url: server.url,
        headers: stringRecord(server.headers),
        timeout: server.timeout
      };

      for (const value of server.cachedTools) {
        if (!isRecord(value) || typeof value.name !== "string") continue;
        const mcpTool: McpTool = {
          name: value.name,
          description: typeof value.description === "string" ? value.description : "",
          inputSchema: isRecord(value.inputSchema) ? value.inputSchema : { type: "object", properties: {} }
        };
        const name = toolName(server.identifier, mcpTool.name);

        tools.push(
          tool(
            async input => {
              this.logger.log(`Agent 调用 MCP Tool: ${name}`);
              const args = isRecord(input) ? input : {};
              return toolResultText(await this.clientService.callTool(config, mcpTool.name, args));
            },
            {
              name,
              description: `[${server.name}] ${mcpTool.description || mcpTool.name}`,
              schema: mcpTool.inputSchema as JSONSchema
            }
          )
        );
      }
    }

    return tools;
  }
}
