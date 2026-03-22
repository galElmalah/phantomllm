import type { StubMatcher, StubResponseConfig, StubEntry } from '../stubs/stub.types.js';

export interface RegisterStubRequest {
  matcher: StubMatcher;
  response: StubResponseConfig;
  delay?: number;
}

export interface RegisterStubBatchRequest {
  stubs: RegisterStubRequest[];
}

export interface RegisterStubResponse {
  id: string;
  stub: StubEntry;
}

export interface ClearStubsResponse {
  cleared: number;
}

export interface HealthResponse {
  status: 'ok';
  stubCount: number;
  uptime: number;
}

export interface RecordedRequest {
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
}
