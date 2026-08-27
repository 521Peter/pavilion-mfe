import { RouterPathType } from "./router-path.type";

/**
 * 端点详情，用于在 Swagger 中定义端点文档
 */
export type EndpointDetail = {
  title: string;
  version: string;
  docUrl: string;
  router: RouterPathType;
};
