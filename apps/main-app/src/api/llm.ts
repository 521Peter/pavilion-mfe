import { api, http } from './http'

/** LLM Provider 供应商 */
export interface LlmProvider {
  id: string
  name: string
  type: string
  baseUrl: string | null
  apiKey: string | null
  isActive: boolean
  config: Record<string, unknown>
  models?: LlmModel[]
  createdAt: string
  updatedAt: string
}

/** LLM 模型 */
export interface LlmModel {
  id: string
  providerId: string
  modelName: string
  displayName: string | null
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateProviderInput {
  name: string
  type: string
  baseUrl?: string
  apiKey?: string
  isActive?: boolean
  config?: Record<string, unknown>
}

export interface UpdateProviderInput extends Partial<CreateProviderInput> {}

export interface CreateModelInput {
  modelName: string
  displayName?: string
  isActive?: boolean
  config?: Record<string, unknown>
}

export interface UpdateModelInput extends Partial<CreateModelInput> {}

/** LLM Provider / Model API */
export const llmApi = {
  // ── 平台元信息 ──
  getTypes: () => api.get<string[]>('/llm/types'),

  // ── Provider CRUD ──
  listProviders: () => api.get<LlmProvider[]>('/llm/providers'),
  getProvider: (id: string) => api.get<LlmProvider>(`/llm/providers/${id}`),
  createProvider: (data: CreateProviderInput) =>
    api.post<LlmProvider>('/llm/providers', data),
  updateProvider: (id: string, data: UpdateProviderInput) =>
    http<LlmProvider>(`/llm/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProvider: (id: string) =>
    http<{ success: boolean }>(`/llm/providers/${id}`, { method: 'DELETE' }),

  // ── Model CRUD ──
  listModels: (providerId: string) =>
    api.get<LlmModel[]>(`/llm/providers/${providerId}/models`),
  createModel: (providerId: string, data: CreateModelInput) =>
    api.post<LlmModel>(`/llm/providers/${providerId}/models`, data),
  updateModel: (id: string, data: UpdateModelInput) =>
    http<LlmModel>(`/llm/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteModel: (id: string) =>
    http<{ success: boolean }>(`/llm/models/${id}`, { method: 'DELETE' }),
}
