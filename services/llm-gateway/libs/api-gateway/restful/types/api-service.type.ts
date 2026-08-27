export type ApiServiceDetail = {
  prefix: string; // 服务前缀，例如 content-service
  docUrl: string; // 服务文档地址，例如 http://127.0.0.1:2009/documents-json
  host: string; // 服务主机，例如 http://127.0.0.1:2009
  directPrefixes?: string[]; // 原样转发且不移除的前缀，例如 ['oauth', 'oidc']
};
