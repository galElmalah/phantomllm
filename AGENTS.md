# AGENTS.md

This file provides general guidance for agents working with code in this repository.

## Project Overview

phantomllm is a testkit for mocking the OpenAI API in integration tests. It provides a Fastify-based mock server that runs inside Docker, a Testcontainers-based driver class for programmatic control, and ships as an npm package. Built with TypeScript (ESM-first) and tested with Vitest.

## Common Commands

```bash
# Development
npm run build                    # Compile driver (tsup)
npm run build:server             # Compile server (tsc)

# Testing
npm test                         # Run all Vitest tests
npm run test:unit                # Unit tests only (no Docker)
npm run test:integration         # Integration tests (requires Docker)
npm run test:sdk                 # SDK compatibility tests (requires Docker)

# Quality
npm run typecheck                # Type validation (tsc --noEmit)

# Docker
npm run docker:build             # Build the mock server image
```

## Verification After Changes

Always verify before committing:

```bash
# After ANY code change
npm run typecheck

# After changing server code
npm run test:unit && npm run test:integration

# After changing driver or builder code
npm run test:integration

# After changing SDK compatibility
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

## Architecture

### Package Boundary

The public API surface is intentionally small:

- `MockLLM` — Testcontainers driver class (main entry point)
- Fluent stub builders (`ChatCompletionStubBuilder`, `EmbeddingStubBuilder`, `ModelsStubBuilder`)
- Type definitions and error classes

### Directory Structure

```
src/
├── server/           # Fastify mock server (runs inside Docker, NOT published to npm)
│   ├── admin/        # /_admin control plane routes
│   ├── chat/         # /v1/chat/completions domain
│   ├── embeddings/   # /v1/embeddings domain
│   ├── models/       # /v1/models domain
│   ├── stubs/        # Stub registry and matching engine
│   ├── streaming/    # SSE streaming logic
│   ├── responses/    # OpenAI response shape builders
│   ├── plugins/      # Fastify plugins
│   └── utils/        # ID generation, token counting
├── driver/           # Testcontainers driver (published to npm)
├── stubs/            # Fluent stub builders (published to npm)
├── errors/           # Custom error classes (published to npm)
└── types/            # Shared type definitions (published to npm)
tests/
├── unit/             # Pure logic tests (no Docker)
├── integration/      # Tests that spin up the container
└── sdk/              # Tests using real OpenAI/AI SDK clients
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

### Testing

- **Vitest** for all tests
- **Three tiers**: `unit/` (no Docker), `integration/` (Docker), `sdk/` (real SDK clients)
- **Descriptive test names** — `it('returns a streamed chat completion with two chunks')`
- **One assertion concept per test**
- **Factory helpers** for test data variation

### Dependencies

- **Latest stable versions** of all dependencies
- **Minimal dependency surface** — only add when necessary
