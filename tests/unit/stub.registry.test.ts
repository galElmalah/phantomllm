import { describe, it, expect } from "vitest";
import { StubRegistry } from "../../src/server/stubs/stub.registry.js";
import type { StubMatcher, StubResponseConfig } from "../../src/server/stubs/stub.types.js";
import type { RecordedRequest } from "../../src/server/admin/admin.types.js";

const chatResponse: StubResponseConfig = { type: "chat", body: "hello" };

function makeMatcher(m: StubMatcher = {}): StubMatcher {
  return m;
}

describe("StubRegistry", () => {
  describe("register", () => {
    it("creates stub with id and callCount 0", () => {
      const registry = new StubRegistry();
      const entry = registry.register(makeMatcher(), chatResponse);
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe("string");
      expect(entry.callCount).toBe(0);
    });
  });

  describe("findMatch", () => {
    it("returns undefined when no stubs", () => {
      const registry = new StubRegistry();
      expect(registry.findMatch("chat", "gpt-4")).toBeUndefined();
    });

    it("returns matching stub", () => {
      const registry = new StubRegistry();
      registry.register(makeMatcher({ model: "gpt-4" }), chatResponse);
      const match = registry.findMatch("chat", "gpt-4");
      expect(match).toBeDefined();
      expect(match!.response).toEqual(chatResponse);
    });

    it("increments callCount", () => {
      const registry = new StubRegistry();
      registry.register(makeMatcher(), chatResponse);
      const first = registry.findMatch("chat", "gpt-4");
      expect(first!.callCount).toBe(1);
      registry.findMatch("chat", "gpt-4");
      expect(first!.callCount).toBe(2);
    });

    it("higher specificity wins", () => {
      const registry = new StubRegistry();
      const specific: StubResponseConfig = { type: "chat", body: "specific" };
      registry.register(makeMatcher(), chatResponse);
      registry.register(makeMatcher({ model: "gpt-4" }), specific);
      const match = registry.findMatch("chat", "gpt-4");
      expect(match!.response).toEqual(specific);
    });

    it("first registered wins among equal specificity", () => {
      const registry = new StubRegistry();
      const first: StubResponseConfig = { type: "chat", body: "first" };
      const second: StubResponseConfig = { type: "chat", body: "second" };
      registry.register(makeMatcher({ model: "gpt-4" }), first);
      registry.register(makeMatcher({ model: "gpt-4" }), second);
      const match = registry.findMatch("chat", "gpt-4");
      expect(match!.response).toEqual(first);
    });
  });

  describe("clear", () => {
    it("removes all stubs and returns count", () => {
      const registry = new StubRegistry();
      registry.register(makeMatcher(), chatResponse);
      registry.register(makeMatcher(), chatResponse);
      const count = registry.clear();
      expect(count).toBe(2);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe("getAll", () => {
    it("returns registered stubs", () => {
      const registry = new StubRegistry();
      registry.register(makeMatcher(), chatResponse);
      registry.register(makeMatcher({ model: "gpt-4" }), chatResponse);
      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe("recordRequest / getRequests / clearRequests", () => {
    it("records and retrieves requests", () => {
      const registry = new StubRegistry();
      const req: RecordedRequest = {
        timestamp: Date.now(),
        method: "POST",
        path: "/v1/chat/completions",
        headers: { "content-type": "application/json" },
        body: { model: "gpt-4" },
      };
      registry.recordRequest(req);
      expect(registry.getRequests()).toHaveLength(1);
      expect(registry.getRequests()[0]).toEqual(req);

      registry.clearRequests();
      expect(registry.getRequests()).toHaveLength(0);
    });
  });
});
