export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | null;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  stream_options?: { include_usage?: boolean };
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  logprobs: null;
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: ChatCompletionChoice[];
  usage: UsageInfo;
}

export interface ChatCompletionChunkDelta {
  role?: 'assistant';
  content?: string;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkDelta;
  finish_reason: 'stop' | null;
  logprobs: null;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: ChatCompletionChunkChoice[];
  usage?: UsageInfo | null;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
}

export interface EmbeddingData {
  object: 'embedding';
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingData[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface ModelObject {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

export interface ModelListResponse {
  object: 'list';
  data: ModelObject[];
}

export interface OpenAIErrorBody {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string | null;
  };
}

// ── Responses API ──────────────────────────────────────────────

export interface ResponseInputMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
  type?: 'message';
}

export interface ResponseRequest {
  model: string;
  input: string | ResponseInputMessage[];
  instructions?: string | null;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  metadata?: Record<string, string>;
  store?: boolean;
  previous_response_id?: string | null;
}

export interface ResponseOutputText {
  type: 'output_text';
  text: string;
  annotations: unknown[];
}

export interface ResponseOutputMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  status: 'completed';
  content: ResponseOutputText[];
}

export interface ResponseUsage {
  input_tokens: number;
  input_tokens_details: { cached_tokens: number };
  output_tokens: number;
  output_tokens_details: { reasoning_tokens: number };
  total_tokens: number;
}

export interface ResponseObject {
  id: string;
  object: 'response';
  created_at: number;
  status: 'completed' | 'in_progress' | 'failed' | 'incomplete';
  model: string;
  output: ResponseOutputMessage[];
  output_text: string;
  error: null;
  incomplete_details: null;
  instructions: string | null;
  metadata: Record<string, string>;
  parallel_tool_calls: boolean;
  temperature: number | null;
  top_p: number | null;
  max_output_tokens: number | null;
  previous_response_id: string | null;
  reasoning: null;
  text: null;
  truncation: null;
  tool_choice: string;
  tools: unknown[];
  usage: ResponseUsage | null;
  user: null;
  service_tier: null;
}
