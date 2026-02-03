/**
 * Integration tests for Stream-to-Store Consumer
 *
 * Tests the createStreamConsumer that bridges Effect Stream events
 * to a SolidJS store with 16ms batching.
 */

import { afterEach, describe, expect, it } from "bun:test";
import { Stream } from "effect";
import { createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { createInitialState } from "../../src/commands/code/consumers/tui/state.js";
import {
  createStreamConsumer,
  type MutableTUIState,
} from "../../src/commands/code/consumers/tui/util/stream-to-store.js";
import type { DomainEvent } from "../../src/commands/code/domain/index.js";

describe("Stream-to-Store Consumer", () => {
  afterEach(() => {
    // Cleanup any lingering resources
  });

  it("should create stream consumer without errors", () => {
    const stream = Stream.empty;
    let consumerCreated = false;

    createRoot((dispose) => {
      const [, setStore] = createStore<MutableTUIState>(
        createInitialState() as MutableTUIState
      );
      const { cleanup } = createStreamConsumer(stream, setStore);
      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe("function");
      consumerCreated = true;
      cleanup();
      dispose();
    });

    expect(consumerCreated).toBe(true);
  });

  it("should accept domain event stream", () => {
    const events: DomainEvent[] = [
      {
        type: "LLMText",
        text: "test",
        timestamp: new Date(),
      },
    ];
    const stream = Stream.fromIterable(events);

    createRoot((dispose) => {
      const [state, setStore] = createStore<MutableTUIState>(
        createInitialState() as MutableTUIState
      );
      const { cleanup } = createStreamConsumer(stream, setStore);
      expect(state).toBeDefined();
      cleanup();
      dispose();
    });
  });

  it("should handle cleanup without errors", () => {
    const stream = Stream.empty;

    createRoot((dispose) => {
      const [, setStore] = createStore<MutableTUIState>(
        createInitialState() as MutableTUIState
      );
      const { cleanup } = createStreamConsumer(stream, setStore);
      // Immediate cleanup should not throw
      cleanup();
      dispose();
    });

    // Test passes if no errors thrown
    expect(true).toBe(true);
  });

  it("should return cleanup function", () => {
    const stream = Stream.empty;

    createRoot((dispose) => {
      const [, setStore] = createStore<MutableTUIState>(
        createInitialState() as MutableTUIState
      );
      const result = createStreamConsumer(stream, setStore);

      // Should have cleanup function
      expect(result).toHaveProperty("cleanup");
      expect(typeof result.cleanup).toBe("function");

      result.cleanup();
      dispose();
    });
  });

  it("should start with initial state values", () => {
    const stream = Stream.empty;

    createRoot((dispose) => {
      const initial = createInitialState();
      const [state, setStore] = createStore<MutableTUIState>(
        initial as MutableTUIState
      );
      createStreamConsumer(stream, setStore);

      expect(state.iteration).toBe(0);
      expect(state.status).toBe("idle");
      expect(state.outputLines.length).toBe(0);
      expect(state.tasks.length).toBe(0);

      dispose();
    });
  });
});
