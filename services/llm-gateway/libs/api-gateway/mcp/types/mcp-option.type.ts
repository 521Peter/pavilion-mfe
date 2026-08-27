import { RouterDetail } from "../../restful/types/router-path.type";

export type McpParameterFilterContext = {
  serviceName: string;
  path: string;
  method: string;
};

export type McpToolNameContext = {
  serviceName: string;
  method: string;
  operationId: string;
  path: string;
  /** 默认命名策略生成的工具名称。 */
  defaultName: string;
};

export type McpOption = {
  enabled: boolean;
  path?: string;
  allowedServices?: string[];
  allowedOperations?: string[];
  filter?: (serviceName: string, routerDetail: RouterDetail) => boolean;
  parameterFilter?: (param: any, context: McpParameterFilterContext) => boolean;
  toolName?: (context: McpToolNameContext) => string;
  serverInfo?: {
    name?: string;
    version?: string;
  };
};
