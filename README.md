# mock-llm

Dockerized mock server for OpenAI-compatible APIs. Test your LLM integrations against a real HTTP server instead of patching `fetch`.

```typescript
import { MockLLM } from 'mock-llm';

const mock = new MockLLM();
await mock.start();
mock.given.chatCompletion.willReturn('Hello from the mock!');

// mock.apiBaseUrl => "http://localhost:55123/v1" — ready to plug into any client
await mock.stop();
```

## Table of Contents

- [Why mock-llm?](#why-mock-llm)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Getting the Server URL](#getting-the-server-url)
- [API Reference](#api-reference)
  - [MockLLM](#mockllm)
  - [Chat Completions](#chat-completions)
  - [Streaming](#streaming)
  - [Embeddings](#embeddings)
  - [Error Simulation](#error-simulation)
  - [Stub Matching](#stub-matching)
- [Integration Examples](#integration-examples)
  - [OpenAI Node.js SDK](#openai-nodejs-sdk)
  - [Vercel AI SDK](#vercel-ai-sdk)
  - [opencode](#opencode)
  - [LangChain](#langchain)
  - [Python openai package](#python-openai-package)
  - [Plain fetch](#plain-fetch)
  - [curl](#curl)
- [Test Framework Integration](#test-framework-integration)
  - [Vitest](#vitest)
  - [Jest](#jest)
  - [Shared Fixture for Multi-File Suites](#shared-fixture-for-multi-file-suites)
- [Performance](#performance)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Why mock-llm?

- **Real HTTP server** — no monkey-patching `fetch` or `http`. Your SDK makes actual network calls through a real TCP connection.
- **Works with any client** — OpenAI SDK, Vercel AI SDK, LangChain, opencode, Python, curl — anything that speaks the OpenAI API protocol.
- **Streaming support** — SSE chunked responses work exactly like the real OpenAI API.
- **Fast** — ~1s container cold start, sub-millisecond response latency, 4,000+ req/s throughput.
- **Simple API** — fluent `given/when` pattern: `mock.given.chatCompletion.forModel('gpt-4').willReturn('Hello')`.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | 18+     |
| Docker      | 20.10+  |

Docker must be running before you call `mock.start()`. Verify with:

```bash
docker info
```

## Setup

### 1. Install the package

```bash
npm install mock-llm --save-dev
```

### 2. Build the Docker image

The mock server runs inside Docker. You need to build the image once before running tests:

```bash
# Clone the repo (if using from source)
npm run docker:build
```

This builds a ~170MB Alpine-based image tagged `mock-llm-server:latest`. The image contains only the compiled Fastify server — no dev dependencies.

### 3. Verify it works

```typescript
import { MockLLM } from 'mock-llm';

const mock = new MockLLM();
await mock.start();
console.log('Mock server running at:', mock.apiBaseUrl);
// => "Mock server running at: http://localhost:55123/v1"
await mock.stop();
```

## Getting the Server URL

`MockLLM` provides two URL getters. Use whichever fits your client:

```typescript
const mock = new MockLLM();
await mock.start();

mock.baseUrl      // "http://localhost:55123"     — raw host:port
mock.apiBaseUrl   // "http://localhost:55123/v1"   — includes /v1 prefix
```

**Which one to use:**

| Client / Tool | Property | Example |
|---------------|----------|---------|
| OpenAI SDK (`baseURL`) | `mock.apiBaseUrl` | `new OpenAI({ baseURL: mock.apiBaseUrl })` |
| Vercel AI SDK (`baseURL`) | `mock.apiBaseUrl` | `createOpenAI({ baseURL: mock.apiBaseUrl })` |
| LangChain (`configuration.baseURL`) | `mock.apiBaseUrl` | `new ChatOpenAI({ configuration: { baseURL: mock.apiBaseUrl } })` |
| opencode config | `mock.apiBaseUrl` | `"baseURL": "http://localhost:55123/v1"` |
| Python openai (`base_url`) | `mock.apiBaseUrl` | `OpenAI(base_url=mock.apiBaseUrl)` |
| Plain fetch | `mock.baseUrl` | `fetch(\`${mock.baseUrl}/v1/chat/completions\`)` |
| Admin API | `mock.baseUrl` | `fetch(\`${mock.baseUrl}/_admin/health\`)` |

Most SDK clients expect the URL to end with `/v1`. Use `mock.apiBaseUrl` and you won't need to think about it.

## API Reference

### MockLLM

The main class. Creates and manages a Docker container running the mock OpenAI server.

```typescript
import { MockLLM } from 'mock-llm';

const mock = new MockLLM({
  image: 'mock-llm-server:latest', // Docker image name (default)
  containerPort: 8080,              // Port inside the container (default)
  reuse: true,                      // Reuse container across runs (default)
  startupTimeout: 30_000,           // Max ms to wait for startup (default)
});
```

| Method / Property | Returns | Description |
|---|---|---|
| `await mock.start()` | `void` | Start the Docker container. Idempotent — safe to call twice. |
| `await mock.stop()` | `void` | Stop and remove the container. Idempotent. |
| `mock.baseUrl` | `string` | Server URL without `/v1`, e.g. `http://localhost:55123`. |
| `mock.apiBaseUrl` | `string` | Server URL with `/v1`, e.g. `http://localhost:55123/v1`. Pass this to SDK clients. |
| `mock.given` | `GivenStubs` | Entry point for the fluent stubbing API. |
| `await mock.clear()` | `void` | Remove all registered stubs. Call between tests. |

`MockLLM` implements `Symbol.asyncDispose` for automatic cleanup:

```typescript
{
  await using mock = new MockLLM();
  await mock.start();
  // ... use mock ...
} // mock.stop() called automatically
```

### Chat Completions

Stub `POST /v1/chat/completions` responses.

```typescript
// Any request returns this content
mock.given.chatCompletion.willReturn('Hello!');

// Match by model
mock.given.chatCompletion
  .forModel('gpt-4o')
  .willReturn('I am GPT-4o.');

// Match by message content (case-insensitive substring)
mock.given.chatCompletion
  .withMessageContaining('weather')
  .willReturn('Sunny, 72F.');

// Combine matchers — both must match
mock.given.chatCompletion
  .forModel('gpt-4o')
  .withMessageContaining('translate')
  .willReturn('Bonjour!');
```

| Method | Description |
|---|---|
| `.forModel(model)` | Only match requests with this exact model name. |
| `.withMessageContaining(text)` | Only match when any user message contains this substring (case-insensitive). |
| `.willReturn(content)` | Return a `chat.completion` response with this content. |

### Streaming

Return SSE-streamed responses, matching the real OpenAI streaming format.

```typescript
mock.given.chatCompletion
  .forModel('gpt-4o')
  .willStream(['Hello', ', ', 'world', '!']);
```

Each string becomes a separate `chat.completion.chunk` SSE event with `delta.content`. The stream ends with a chunk containing `finish_reason: "stop"` followed by `data: [DONE]`.

| Method | Description |
|---|---|
| `.willStream(chunks)` | Return a stream of SSE events, one per string in the array. |

### Embeddings

Stub `POST /v1/embeddings` responses.

```typescript
// Single embedding
mock.given.embedding
  .forModel('text-embedding-3-small')
  .willReturn([0.1, 0.2, 0.3]);

// Batch — multiple vectors for multiple inputs
mock.given.embedding
  .willReturn([
    [0.1, 0.2, 0.3],
    [0.4, 0.5, 0.6],
  ]);
```

| Method | Description |
|---|---|
| `.forModel(model)` | Only match requests with this model. |
| `.willReturn(vector)` | Return a single vector (`number[]`) or batch of vectors (`number[][]`). |

### Error Simulation

Force error responses to test retry logic, error handling, and fallbacks.

```typescript
mock.given.chatCompletion.willError(429, 'Rate limit exceeded');
mock.given.chatCompletion.willError(500, 'Internal server error');
mock.given.embedding.willError(400, 'Invalid input');

// Scoped to a specific model
mock.given.chatCompletion
  .forModel('gpt-4o')
  .willError(403, 'Model access denied');
```

Error responses follow the OpenAI error format:

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "api_error",
    "param": null,
    "code": null
  }
}
```

### Stub Matching

When multiple stubs are registered, the most specific match wins:

1. **Specificity** — a stub matching both model and content (specificity 2) beats one matching only model (specificity 1), which beats a catch-all (specificity 0).
2. **Registration order** — among stubs with equal specificity, the first registered wins.

```typescript
// Catch-all (specificity 0)
mock.given.chatCompletion.willReturn('Default response');

// Model-specific (specificity 1) — wins over catch-all for gpt-4o
mock.given.chatCompletion
  .forModel('gpt-4o')
  .willReturn('GPT-4o response');

// Model + content (specificity 2) — wins over model-only for matching messages
mock.given.chatCompletion
  .forModel('gpt-4o')
  .withMessageContaining('weather')
  .willReturn('Weather-specific GPT-4o response');
```

When no stub matches a request, the server returns HTTP 418 with a descriptive error message showing what was requested.

## Integration Examples

### OpenAI Node.js SDK

```typescript
import OpenAI from 'openai';
import { MockLLM } from 'mock-llm';

const mock = new MockLLM();
await mock.start();

const openai = new OpenAI({
  baseURL: mock.apiBaseUrl,
  apiKey: 'test-key', // any string — the mock doesn't validate keys
});

// Non-streaming
mock.given.chatCompletion.willReturn('The capital of France is Paris.');

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the capital of France?' }],
});
console.log(response.choices[0].message.content);
// => "The capital of France is Paris."

// Streaming
mock.given.chatCompletion.willStream(['The capital', ' of France', ' is Paris.']);

const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Capital of France?' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}

// Embeddings
mock.given.embedding
  .forModel('text-embedding-3-small')
  .willReturn([0.1, 0.2, 0.3]);

const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Hello world',
});
console.log(embedding.data[0].embedding); // => [0.1, 0.2, 0.3]

await mock.stop();
```

### Vercel AI SDK

```typescript
import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MockLLM } from 'mock-llm';

const mock = new MockLLM();
await mock.start();

const provider = createOpenAI({
  baseURL: mock.apiBaseUrl,
  apiKey: 'test-key',
});

// generateText
mock.given.chatCompletion.willReturn('Paris');

const { text } = await generateText({
  model: provider.chat('gpt-4o'),
  prompt: 'Capital of France?',
});
console.log(text); // => "Paris"

// streamText
mock.given.chatCompletion.willStream(['Par', 'is']);

const result = streamText({
  model: provider.chat('gpt-4o'),
  prompt: 'Capital of France?',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

await mock.stop();
```

> **Note:** Use `provider.chat('model')` instead of `provider('model')` to ensure requests go through `/v1/chat/completions`. The default `provider('model')` in `@ai-sdk/openai` v3+ uses the Responses API.

### opencode

Add a provider entry to your `opencode.json` pointing at the mock:

```jsonc
{
  "provider": {
    "mock": {
      "api": "openai",
      "baseURL": "http://localhost:PORT/v1",
      "apiKey": "test-key",
      "models": {
        "gpt-4o": { "id": "gpt-4o" }
      }
    }
  }
}
```

Start the mock and print the URL to use:

```typescript
const mock = new MockLLM();
await mock.start();
console.log(`Set baseURL to: ${mock.apiBaseUrl}`);
// Update the port in opencode.json to match
```

### LangChain

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { MockLLM } from 'mock-llm';

const mock = new MockLLM();
await mock.start();

mock.given.chatCompletion.willReturn('Hello from LangChain!');

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  configuration: {
    baseURL: mock.apiBaseUrl,
    apiKey: 'test-key',
  },
});

const response = await model.invoke('Say hello');
console.log(response.content); // => "Hello from LangChain!"

await mock.stop();
```

### Python openai package

The mock server is a real HTTP server — any language can use it. Start the mock from Node.js, then connect from Python:

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:55123/v1",  # use mock.apiBaseUrl
    api_key="test-key",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
```

### Plain fetch

```typescript
const response = await fetch(`${mock.baseUrl}/v1/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### curl

```bash
curl http://localhost:55123/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Test Framework Integration

### Vitest

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MockLLM } from 'mock-llm';
import OpenAI from 'openai';

describe('my LLM feature', () => {
  const mock = new MockLLM();
  let openai: OpenAI;

  beforeAll(async () => {
    await mock.start();
    openai = new OpenAI({ baseURL: mock.apiBaseUrl, apiKey: 'test' });
  }, 30_000);

  afterAll(async () => {
    await mock.stop();
  });

  beforeEach(async () => {
    await mock.clear(); // reset stubs between tests
  });

  it('should summarize text', async () => {
    mock.given.chatCompletion
      .withMessageContaining('summarize')
      .willReturn('This is a summary.');

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Please summarize this article.' }],
    });

    expect(res.choices[0].message.content).toBe('This is a summary.');
  });

  it('should handle rate limits', async () => {
    mock.given.chatCompletion.willError(429, 'Rate limit exceeded');

    await expect(
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    ).rejects.toThrow();
  });

  it('should stream responses', async () => {
    mock.given.chatCompletion.willStream(['Hello', ' World']);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    });

    const chunks: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) chunks.push(content);
    }
    expect(chunks).toEqual(['Hello', ' World']);
  });
});
```

### Jest

```typescript
import { MockLLM } from 'mock-llm';
import OpenAI from 'openai';

describe('my LLM feature', () => {
  const mock = new MockLLM();
  let openai: OpenAI;

  beforeAll(async () => {
    await mock.start();
    openai = new OpenAI({ baseURL: mock.apiBaseUrl, apiKey: 'test' });
  }, 30_000); // container startup timeout

  afterAll(() => mock.stop());
  beforeEach(() => mock.clear());

  test('returns stubbed response', async () => {
    mock.given.chatCompletion.willReturn('Mocked!');

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(res.choices[0].message.content).toBe('Mocked!');
  });
});
```

### Shared Fixture for Multi-File Suites

Start one container for your entire test suite. Each test file imports the shared mock and clears stubs between tests.

**`tests/support/mock.ts`**

```typescript
import { MockLLM } from 'mock-llm';

export const mock = new MockLLM();

export async function setup() {
  await mock.start();
  // Make the URL available to other processes if needed
  process.env.MOCK_LLM_URL = mock.apiBaseUrl;
}

export async function teardown() {
  await mock.stop();
}
```

**`vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/support/mock.ts'],
  },
});
```

**Individual test files**

```typescript
import { mock } from '../support/mock.js';

beforeEach(() => mock.clear());

it('works', async () => {
  mock.given.chatCompletion.willReturn('Hello!');
  // ...
});
```

## Performance

Benchmarks on Apple Silicon (Docker via OrbStack):

### Container Lifecycle

| Metric | Time |
|--------|------|
| Cold start (`mock.start()`) | ~1.1s |
| Stop (`mock.stop()`) | ~130ms |
| Full lifecycle (start, stub, request, stop) | ~1.2s |

### Request Latency (through Docker network)

| Metric | Median | p95 |
|--------|--------|-----|
| Chat completion (non-streaming) | 0.6ms | 1.8ms |
| Streaming TTFB | 0.7ms | 0.9ms |
| Streaming total (8 chunks) | 0.7ms | 1.0ms |
| Embedding (1536-dim) | 0.7ms | 1.6ms |
| Embedding batch (10x1536) | 1.9ms | 2.7ms |
| Stub registration | 0.5ms | 0.8ms |
| Clear stubs | 0.2ms | 0.4ms |

### Throughput

| Metric | Requests/sec |
|--------|-------------|
| Sequential chat completions | ~4,300 |
| Concurrent (10 workers) | ~6,400 |
| Health endpoint | ~5,900 |

### Tips

- **Don't restart between tests.** Call `mock.clear()` (sub-millisecond) instead of `stop()`/`start()` (~1.2s).
- **Use global setup.** Start one container for your entire suite. See [Shared Fixture](#shared-fixture-for-multi-file-suites).
- **Cache the Docker image in CI.** Build it once and cache the layer:

```yaml
# GitHub Actions
- name: Build mock server image
  run: npm run docker:build

- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-docker-mock-llm-${{ hashFiles('Dockerfile') }}
```

## Configuration

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `image` | `string` | `'mock-llm-server:latest'` | Docker image to run. |
| `containerPort` | `number` | `8080` | Port the server listens on inside the container. |
| `reuse` | `boolean` | `true` | Reuse a running container across test runs. |
| `startupTimeout` | `number` | `30000` | Max milliseconds to wait for the container to become healthy. |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MOCK_LLM_IMAGE` | Override the Docker image name without changing code. Takes precedence over the default but not over the constructor `image` option. |

### OpenAI-Compatible Endpoints

The mock server implements:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | Chat completions (streaming and non-streaming) |
| `/v1/embeddings` | POST | Text embeddings |
| `/v1/models` | GET | List available models |
| `/_admin/stubs` | POST | Register a stub |
| `/_admin/stubs` | DELETE | Clear all stubs |
| `/_admin/health` | GET | Health check |

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `ContainerNotStartedError` | Using `baseUrl`, `given`, or `clear()` before `start()`. | Call `await mock.start()` first. |
| Container startup timeout | Docker not running or image not built. | Run `docker info` to verify Docker. Run `npm run docker:build` to build the image. |
| Connection refused | Wrong URL or container not ready. | Use `mock.apiBaseUrl` for SDK clients. Ensure `start()` has resolved. |
| Stubs leaking between tests | Stubs persist until cleared. | Call `await mock.clear()` in `beforeEach`. |
| 418 response | No stub matches the request. | Register a stub matching the model/content, or add a catch-all: `mock.given.chatCompletion.willReturn('...')`. |
| `MOCK_LLM_IMAGE` env var | Need a custom image. | Set `MOCK_LLM_IMAGE=my-registry/image:tag` in your environment. |
| Slow CI | Image rebuilt every run. | Cache Docker layers and enable container reuse. |
| AI SDK uses wrong endpoint | `provider('model')` defaults to Responses API in v3+. | Use `provider.chat('model')` to target `/v1/chat/completions`. |

## License

MIT
