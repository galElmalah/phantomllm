export interface AdminStubMatcher {
  model?: string;
  content?: string;
  input?: string;
  endpoint?: 'chat' | 'embeddings';
}

export interface AdminChatResponseConfig {
  type: 'chat';
  body: string;
  finishReason?: string;
}

export interface AdminStreamingChatResponseConfig {
  type: 'streaming-chat';
  chunks: string[];
  finishReason?: string;
}

export interface AdminEmbeddingResponseConfig {
  type: 'embedding';
  vectors: number[][];
}

export interface AdminErrorResponseConfig {
  type: 'error';
  status: number;
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

export interface AdminModelsResponseConfig {
  type: 'models';
  models: Array<{ id: string; ownedBy?: string }>;
}

export type AdminStubResponseConfig =
  | AdminChatResponseConfig
  | AdminStreamingChatResponseConfig
  | AdminEmbeddingResponseConfig
  | AdminErrorResponseConfig
  | AdminModelsResponseConfig;

export interface AdminStubDefinition {
  matcher: AdminStubMatcher;
  response: AdminStubResponseConfig;
  delay?: number;
}

export interface AdminStubBatchPayload {
  stubs: AdminStubDefinition[];
}

export interface AdminHealthPayload {
  status: string;
  stubCount: number;
  uptime: number;
}

export interface AdminRecordedRequestPayload {
  requests: Array<{
    timestamp: number;
    method: string;
    path: string;
    body: unknown;
  }>;
}
