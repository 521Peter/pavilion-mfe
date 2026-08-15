import { api, http } from "./http";

export interface McpServer {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  transport: string;
  command: string | null;
  args: string[];
  env: Record<string, string>;
  url: string | null;
  headers: Record<string, string>;
  timeout: number;
  isActive: boolean;
  cachedTools: unknown[];
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMcpServerInput {
  name: string;
  identifier: string;
  description?: string;
  transport: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
  isActive?: boolean;
}

export interface UpdateMcpServerInput extends Partial<CreateMcpServerInput> {}

export interface McpTestResult {
  success: boolean;
  tools?: { name: string; description: string }[];
  error?: string;
}

export const mcpApi = {
  listServers: () => api.get<McpServer[]>("/mcp/servers"),
  getServer: (id: string) => api.get<McpServer>(`/mcp/servers/${id}`),
  createServer: (data: CreateMcpServerInput) => api.post<McpServer>("/mcp/servers", data),
  updateServer: (id: string, data: UpdateMcpServerInput) =>
    http<McpServer>(`/mcp/servers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteServer: (id: string) => http<{ success: boolean }>(`/mcp/servers/${id}`, { method: "DELETE" }),
  testConnection: (id: string) => api.post<McpTestResult>(`/mcp/servers/${id}/test`),
  syncTools: (id: string) =>
    api.post<{ success: boolean; tools?: unknown[]; error?: string }>(`/mcp/servers/${id}/sync`),
  getCachedTools: (id: string) => api.get<unknown[]>(`/mcp/servers/${id}/tools`)
};
