import { Inject, Injectable, Logger } from "@nestjs/common";
import { McpToolRegistryService } from "./mcp-tool-registry.service";
import { McpToolDefinition } from "../types/mcp-tool.type";
import { OpenApiService } from "../../restful/services/open-api.service";
import { ThrottlerService } from "../../throttlers/services/throttler.service";
import { RequestService } from "../../restful/services/request.service";
import { ProxyRequest } from "../../restful/models/proxy-request.model";
import { API_GATEWAY_OPTION } from "../../constants/api-gateway.constant";
import { ApiGatewayOption } from "../../types/api-gateway-option.type";
import { Pool, Dispatcher } from "undici";
import { IncomingMessage } from "http";
import RequestOptions = Dispatcher.RequestOptions;

@Injectable()
export class McpToolExecutorService {
  private logger = new Logger(McpToolExecutorService.name);
  private pools: Map<string, Pool> = new Map();

  constructor(
    private toolRegistryService: McpToolRegistryService,
    private openApiService: OpenApiService,
    private throttlerService: ThrottlerService,
    private requestService: RequestService,
    @Inject(API_GATEWAY_OPTION) private apiGatewayOption: ApiGatewayOption
  ) {
    for (const apiService of this.apiGatewayOption.apiServices) {
      this.pools.set(apiService.prefix, new Pool(apiService.host, this.apiGatewayOption.pool));
    }
  }

  async executeTool(
    toolName: string,
    args: Record<string, any>,
    request: IncomingMessage
  ): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
    const tool = this.toolRegistryService.getToolByName(toolName);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Tool not found: ${toolName}` }],
        isError: true
      };
    }

    try {
      // 网关已禁用请求体解析，MCP SDK 会自行消费原始请求流，因此 `/mcp` 的
      // `request.body` 始终为空。将工具参数（如 `path_projectId`）暴露到请求对象上，
      // 使网关中间件（尤其是项目权限检查）能像处理普通 REST 请求一样解析路径参数。
      Reflect.set(request, "body", args);

      await this.throttlerService.checkLimitOfRequest(
        tool.routerDetail,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- MCP SDK exposes IncomingMessage, while the gateway throttler reads the same Node request fields through its Express-compatible request contract
        request as Parameters<ThrottlerService["checkLimitOfRequest"]>[1]
      );

      const proxyRequest = new ProxyRequest();
      const isAllowed = await this.requestService.handle(tool.routerDetail, request, proxyRequest);
      if (!isAllowed) {
        return {
          content: [{ type: "text", text: "Request forbidden by gateway middleware" }],
          isError: true
        };
      }

      const response = await this.forwardToService(tool, args, proxyRequest);
      return {
        content: [{ type: "text", text: response }]
      };
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Tool execution failed: ${toolName}`, normalizedError.stack || normalizedError.message);
      return {
        content: [{ type: "text", text: `Error executing ${toolName}: ${normalizedError.message}` }],
        isError: true
      };
    }
  }

  private async forwardToService(
    tool: McpToolDefinition,
    args: Record<string, any>,
    proxyRequest: ProxyRequest
  ): Promise<string> {
    const pool = this.pools.get(tool.serviceName);
    if (!pool) {
      throw new Error(`Service unavailable: ${tool.serviceName}`);
    }

    const requestOptions = this.buildRequestOptions(tool, args, proxyRequest);
    const response = await pool.request(requestOptions);

    return this.readResponse(response);
  }

  private buildRequestOptions(
    tool: McpToolDefinition,
    args: Record<string, any>,
    proxyRequest: ProxyRequest
  ): RequestOptions {
    const { path, query, body, headers } = this.extractRequestParts(tool, args);
    const customHeaders = { ...proxyRequest.getKebabHeaders(), ...headers };

    const requestHeaders = new Map<string, string | string[]>();
    requestHeaders.set("content-type", "application/json");
    for (const [key, value] of Object.entries(customHeaders)) {
      if (value) {
        requestHeaders.set(key, value);
      }
    }

    const options: RequestOptions = {
      path,
      method: tool.httpMethod,
      headers: requestHeaders
    };

    if (query) {
      const queryString = new URLSearchParams(query).toString();
      if (queryString) {
        options.path = `${path}?${queryString}`;
      }
    }

    if (body && ["POST", "PUT", "PATCH"].includes(tool.httpMethod)) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  private async readResponse(response: Dispatcher.ResponseData): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of response.body) {
      chunks.push(Buffer.from(chunk));
    }
    const responseBody = Buffer.concat(chunks).toString("utf-8");

    if (response.statusCode >= 400) {
      throw new Error(`Downstream service returned ${response.statusCode}: ${responseBody}`);
    }

    return responseBody;
  }

  private extractRequestParts(
    tool: McpToolDefinition,
    args: Record<string, any>
  ): {
    path: string;
    query: Record<string, string>;
    body: any;
    headers: Record<string, string>;
  } {
    let path = tool.path;
    const query: Record<string, string> = {};
    const headers: Record<string, string> = {};
    let body = undefined;

    for (const [key, value] of Object.entries(args || {})) {
      if (key.startsWith("path_")) {
        const paramName = key.substring(5);
        path = path.replace(`{${paramName}}`, String(value));
      } else if (key.startsWith("query_")) {
        const paramName = key.substring(6);
        query[paramName] = String(value);
      } else if (key.startsWith("header_")) {
        const paramName = key.substring(7);
        headers[paramName] = String(value);
      } else if (key === "body") {
        body = value;
      }
    }

    if (!path.endsWith("/")) {
      path += "/";
    }

    return { path, query, body, headers };
  }
}
