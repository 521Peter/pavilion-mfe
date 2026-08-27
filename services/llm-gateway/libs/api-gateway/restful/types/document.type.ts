/**
 * HTTP 操作类型
 */
type OperationType = {
  operationId: string;
  description?: string;
  parameters: NodeJS.Dict<any>[];
  responses: NodeJS.Dict<any>;
  xRouterPath?: string;
  xRateLimits?: import("./router-path.type").RateLimit[];
};

/**
 * 路径类型
 */
type PathType = Record<string, Record<string, OperationType>>;

/**
 * 文档类型，用于在 Swagger 中定义 API 文档
 */
export type DocumentType = {
  openapi: string;
  paths: PathType;
  info: {
    title: string;
    description: string;
    version: string;
    contact: NodeJS.Dict<any>;
  };
  tags: { name: string; description: string }[];
  servers: [];
  components: {
    securitySchemes: NodeJS.Dict<any>;
    schemas: NodeJS.Dict<any>;
  };
};
