export interface StubMatcher {
  model?: string;
  content?: string;
  input?: string;
  endpoint?: 'chat' | 'embeddings';
}

export interface ChatResponseConfig {
  type: 'chat';
  body: string;
  finishReason?: string;
}

export interface StreamingChatResponseConfig {
  type: 'streaming-chat';
  chunks: string[];
  finishReason?: string;
}

export interface EmbeddingResponseConfig {
  type: 'embedding';
  vectors: number[][];
}

export interface ErrorResponseConfig {
  type: 'error';
  status: number;
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

export interface ModelsResponseConfig {
  type: 'models';
  models: Array<{ id: string; ownedBy?: string }>;
}

export type StubResponseConfig =
  | ChatResponseConfig
  | StreamingChatResponseConfig
  | EmbeddingResponseConfig
  | ErrorResponseConfig
  | ModelsResponseConfig;

export interface StubEntry {
  id: string;
  createdAt: number;
  matcher: StubMatcher;
  response: StubResponseConfig;
  delay: number;
  callCount: number;
}
