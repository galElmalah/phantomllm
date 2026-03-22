# AGENTS.md

This file provides general guidance for agents working with code in this repository.

## Project Overview

phantomllm is a testkit for mocking the OpenAI API in integration tests. It provides an in-process Fastify mock server controlled via a `MockLLM` class with fluent stub builders. Ships as an npm package — `npm install phantomllm` and go.

## Common Commands

```bash
# Development
npm run build                    # Compile (tsup)

# Testing
npm test                         # Run all Vitest tests
npm run test:unit                # Unit tests only
npm run test:integration         # Integration tests
npm run test:sdk                 # SDK compatibility tests

# Quality
npm run typecheck                # Type validation (tsc --noEmit)
```

## Verification After Changes

Always verify before committing:

```bash
# After ANY code change
npm run typecheck

# After changing server code
npm run test:unit && npm run test:integration

# After changing driver or builder code
npm run test:sdk

# Full verification
npm run typecheck && npm test
```

## Do NOT

- **Do NOT use `require()`** — this is an ESM project (`"type": "module"`)
- **Do NOT use `any`** — use `unknown`, generics, or proper types
- **Do NOT omit explicit return types** on exported functions and public methods
- **Do NOT create barrel exports** that re-export everything from a directory
- **Do NOT create god objects** — one responsibility per class, one concept per file
- **Do NOT use inheritance for code reuse** — prefer composition and dependency injection
- **Do NOT put test files next to source files** — tests live in `tests/` organized by domain
- **Do NOT use default exports** — named exports only
- **Do NOT add comments or docstrings to code you didn't change**
- **Do NOT import internal modules in tests** — tests must only use the public API exported from `src/index.ts` (see [Testing Rules](#testing-rules))

## Architecture

### Package Boundary

The public API surface is intentionally small:

- `MockLLM` — main class (start, stop, given, expect, clear)
- Fluent stub builders (`ChatCompletionStubBuilder`, `EmbeddingStubBuilder`, `ModelsStubBuilder`)
- Type definitions and error classes

### Directory Structure

```
src/
├── server/           # In-process Fastify mock server
│   ├── admin/        # /_admin control plane routes
│   ├── chat/         # /v1/chat/completions domain
│   ├── embeddings/   # /v1/embeddings domain
│   ├── models/       # /v1/models domain
│   ├── stubs/        # Stub registry and matching engine
│   ├── streaming/    # SSE streaming logic
│   ├── responses/    # OpenAI response shape builders
│   ├── plugins/      # Fastify plugins
│   └── utils/        # ID generation, token counting
├── driver/           # MockLLM class
├── stubs/            # Fluent stub builders
├── errors/           # Custom error classes
└── types/            # Shared type definitions
tests/
├── unit/             # Pure logic tests (server internals)
├── integration/      # Server HTTP contract tests
└── sdk/              # End-to-end tests via MockLLM + real SDKs
```

### Domain-Based Organization

Code is organized by **domain** (chat, embeddings, models), not by file type. Each domain folder contains its own routes, handlers, and types.

## Code Conventions

### General Principles

- **Small files** — aim for under 100 lines per file
- **Single Responsibility** — each file owns one concept
- **Composition over inheritance** — inject dependencies, delegate to collaborators
- **Pure functions for logic** — extract business logic into pure, testable functions
- **No god objects** — avoid classes that accumulate unrelated responsibilities

### TypeScript

- **Strict mode** — `strict: true`, no escape hatches
- **No `any`** — use `unknown` for truly unknown types, generics for flexible types
- **Explicit return types** on all exported functions and public methods
- **`import type`** — use `import type` for type-only imports
- **Interfaces for object shapes** — prefer `interface` for public contracts, `type` for unions

### Classes and Patterns

- **Class-based exports** for main API surfaces (driver, builder)
- **Builder pattern** for configuration with fluent method chaining
- **Private constructor + static factory** when construction is async
- Plain functions are fine for internal utilities and pure logic

### Exports and Imports

- **Named exports only** — no default exports
- **No barrel re-exports** — import directly from the source file
- **Package entry point** (`src/index.ts`) is the sole exception for re-exports

### Naming

- **Files**: kebab-case with dots for domain separation (`chat.routes.ts`, `stub.matcher.ts`)
- **Classes**: PascalCase (`MockLLM`, `ChatCompletionStubBuilder`)
- **Functions and methods**: camelCase (`buildChatCompletion`, `forModel`)
- **Types and interfaces**: PascalCase (`ChatCompletionRequest`, `StubMatcher`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`DEFAULT_PORT`)
- **Test files**: `<name>.test.ts` in the corresponding `tests/` subdomain folder

### Testing Rules

**Integration and SDK tests must only use the public API.** This is a hard rule — it exists because we shipped a bug where the internal stub registration path was never tested, since all tests bypassed `MockLLM` and called server internals directly.

- **`tests/unit/`** — may import from `src/server/` internals (testing pure functions and server logic directly)
- **`tests/integration/`** — must interact with the server via HTTP only (using `app.inject()` or `fetch()`)
- **`tests/sdk/`** — must use `MockLLM` from `src/index.ts` as the sole entry point. Must NOT import from `src/server/`, `src/driver/`, or `src/stubs/` directly. This tier validates the exact path end users take: `new MockLLM()` → `mock.given.*` → SDK call → assert.

**Why:** If SDK tests bypass MockLLM and register stubs via raw HTTP, bugs in the driver (like the flush bug) go undetected. The SDK tier must prove the public API works end-to-end.

Enforced by ESLint rule: `no-restricted-imports` blocks `src/server/`, `src/driver/`, and `src/stubs/` imports in `tests/sdk/`.

### Dependencies

- **Latest stable versions** of all dependencies
- **Minimal dependency surface** — only add when necessary
