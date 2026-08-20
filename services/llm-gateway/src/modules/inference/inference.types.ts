export interface InferencePrincipal {
    type: 'user' | 'application';
    userId?: string;
    applicationId?: string;
    allowedModels?: string[];
}

export interface NormalizedMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface NormalizedLlmRequest {
    requestId: string;
    model: string;
    messages: NormalizedMessage[];
    temperature?: number;
    maxTokens?: number;
    principal: InferencePrincipal;
    signal?: AbortSignal;
    agentVersionId?: string;
}

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    reasoningTokens: number;
}

export interface InferenceResult {
    id: string;
    requestId: string;
    model: string;
    content: string;
    usage: TokenUsage;
    deploymentId: string;
}

export type InferenceStreamEvent =
    | { type: 'start'; id: string; requestId: string; model: string }
    | { type: 'delta'; delta: string }
    | { type: 'done'; usage: TokenUsage; deploymentId: string };
