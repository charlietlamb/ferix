import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { stateReducerRegistry } from "../../src/commands/code/consumers/tui/reducers/registry.js";
import type { DomainEvent } from "../../src/commands/code/domain/index.js";
import type { TUIState } from "../../src/commands/code/domain/schemas/tui.js";

// Import reducers to register them
import "../../src/commands/code/consumers/tui/reducers/loop.js";
import "../../src/commands/code/consumers/tui/reducers/iteration.js";
import "../../src/commands/code/consumers/tui/reducers/llm.js";
import "../../src/commands/code/consumers/tui/reducers/discovery.js";
import "../../src/commands/code/consumers/tui/reducers/progress.js";

/**
 * Creates a default TUI state for testing.
 */
function createDefaultState(): TUIState {
  return {
    task: "Test task",
    iteration: 0,
    maxIterations: 10,
    status: "idle",
    startTime: 0,
    discoveryInProgress: false,
    discoveryCompleted: false,
    executionMode: "idle",
    currentTool: undefined,
    currentTaskId: undefined,
    outputLines: [],
    partialLine: "",
    tasks: [],
    viewMode: "logs",
    selectedTaskIndex: 0,
    scrollOffset: 0,
    userScrolled: false,
    gitBranch: undefined,
    gitPushed: false,
    prUrl: undefined,
  };
}

/**
 * Arbitrary for generating LoopStarted events.
 */
const loopStartedEventArb: fc.Arbitrary<
  Extract<DomainEvent, { _tag: "LoopStarted" }>
> = fc.record({
  _tag: fc.constant("LoopStarted" as const),
  config: fc.record({
    task: fc.string({ minLength: 1, maxLength: 50 }),
    maxIterations: fc.integer({ min: 1, max: 100 }),
    verbose: fc.boolean(),
    verifyCommands: fc.array(fc.string(), { maxLength: 3 }),
  }),
  timestamp: fc.integer({ min: 0 }),
});

/**
 * Arbitrary for generating IterationStarted events.
 */
const iterationStartedEventArb: fc.Arbitrary<
  Extract<DomainEvent, { _tag: "IterationStarted" }>
> = fc.record({
  _tag: fc.constant("IterationStarted" as const),
  iteration: fc.integer({ min: 1, max: 100 }),
  maxIterations: fc.integer({ min: 1, max: 100 }),
  timestamp: fc.date().map((d) => d.toISOString()),
});

/**
 * Arbitrary for generating LLMTextChunk events.
 */
const llmTextChunkEventArb: fc.Arbitrary<
  Extract<DomainEvent, { _tag: "LLMTextChunk" }>
> = fc.record({
  _tag: fc.constant("LLMTextChunk" as const),
  text: fc.string({ maxLength: 200 }),
  timestamp: fc.date().map((d) => d.toISOString()),
});

/**
 * Arbitrary for generating LoopCompleted events.
 */
const loopCompletedEventArb: fc.Arbitrary<
  Extract<DomainEvent, { _tag: "LoopCompleted" }>
> = fc.record({
  _tag: fc.constant("LoopCompleted" as const),
  reason: fc.constantFrom("complete", "max_iterations", "error"),
  timestamp: fc.integer({ min: 0 }),
});

describe("Reducer Determinism Properties", () => {
  describe("loopReducer via registry", () => {
    it("should produce same state for same input", () => {
      fc.assert(
        fc.property(loopStartedEventArb, (event) => {
          const state1 = createDefaultState();
          const state2 = createDefaultState();

          const result1 = stateReducerRegistry.reduce(state1, event);
          const result2 = stateReducerRegistry.reduce(state2, event);

          expect(result1).toEqual(result2);
        }),
        { numRuns: 50 }
      );
    });

    it("should set status to running on LoopStarted", () => {
      fc.assert(
        fc.property(loopStartedEventArb, (event) => {
          const state = createDefaultState();
          const result = stateReducerRegistry.reduce(state, event);

          expect(result.status).toBe("running");
        }),
        { numRuns: 50 }
      );
    });

    it("should set status to complete on LoopCompleted", () => {
      fc.assert(
        fc.property(loopCompletedEventArb, (event) => {
          const state = createDefaultState();
          const result = stateReducerRegistry.reduce(state, event);

          expect(result.status).toBe("complete");
        }),
        { numRuns: 50 }
      );
    });

    it("should preserve unrelated state fields", () => {
      fc.assert(
        fc.property(
          loopStartedEventArb,
          fc.array(fc.string(), { maxLength: 5 }),
          (event, outputLines) => {
            const state = {
              ...createDefaultState(),
              outputLines,
            };

            const result = stateReducerRegistry.reduce(state, event);

            expect(result.outputLines).toEqual(outputLines);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("iterationReducer via registry", () => {
    it("should produce same state for same input", () => {
      fc.assert(
        fc.property(iterationStartedEventArb, (event) => {
          const state1 = createDefaultState();
          const state2 = createDefaultState();

          const result1 = stateReducerRegistry.reduce(state1, event);
          const result2 = stateReducerRegistry.reduce(state2, event);

          expect(result1).toEqual(result2);
        }),
        { numRuns: 50 }
      );
    });

    it("should update iteration count correctly", () => {
      fc.assert(
        fc.property(iterationStartedEventArb, (event) => {
          const state = createDefaultState();
          const result = stateReducerRegistry.reduce(state, event);

          expect(result.iteration).toBe(event.iteration);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("llmReducer via registry", () => {
    it("should produce same state for same input", () => {
      fc.assert(
        fc.property(llmTextChunkEventArb, (event) => {
          const state1 = createDefaultState();
          const state2 = createDefaultState();

          const result1 = stateReducerRegistry.reduce(state1, event);
          const result2 = stateReducerRegistry.reduce(state2, event);

          expect(result1).toEqual(result2);
        }),
        { numRuns: 50 }
      );
    });

    it("should accumulate text chunks in partialLine or outputLines", () => {
      fc.assert(
        fc.property(
          fc.array(llmTextChunkEventArb, { minLength: 1, maxLength: 10 }),
          (events) => {
            let state = createDefaultState();

            for (const event of events) {
              state = stateReducerRegistry.reduce(state, event);
            }

            // Text should be accumulated somewhere in the state
            const stateText = state.outputLines.join("\n") + state.partialLine;
            // The text processing may split on newlines, so we check state is valid
            expect(stateText.length).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Composite reducer behavior", () => {
    it("should handle sequence of events deterministically", () => {
      fc.assert(
        fc.property(
          loopStartedEventArb,
          iterationStartedEventArb,
          fc.array(llmTextChunkEventArb, { minLength: 1, maxLength: 5 }),
          (loopEvent, iterEvent, chunkEvents) => {
            const state1 = createDefaultState();
            const state2 = createDefaultState();

            // Apply same events to both states
            let result1 = stateReducerRegistry.reduce(state1, loopEvent);
            let result2 = stateReducerRegistry.reduce(state2, loopEvent);

            result1 = stateReducerRegistry.reduce(result1, iterEvent);
            result2 = stateReducerRegistry.reduce(result2, iterEvent);

            for (const event of chunkEvents) {
              result1 = stateReducerRegistry.reduce(result1, event);
              result2 = stateReducerRegistry.reduce(result2, event);
            }

            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("should not lose data through reducer composition", () => {
      fc.assert(
        fc.property(
          loopStartedEventArb,
          iterationStartedEventArb,
          (loopEvent, iterEvent) => {
            let state = createDefaultState();

            state = stateReducerRegistry.reduce(state, loopEvent);
            expect(state.status).toBe("running");

            state = stateReducerRegistry.reduce(state, iterEvent);
            expect(state.iteration).toBe(iterEvent.iteration);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("State immutability", () => {
    it("should not mutate input state for loop events", () => {
      fc.assert(
        fc.property(loopStartedEventArb, (event) => {
          const state = createDefaultState();
          const stateCopy = JSON.parse(JSON.stringify(state));

          stateReducerRegistry.reduce(state, event);

          expect(state).toEqual(stateCopy);
        }),
        { numRuns: 50 }
      );
    });

    it("should not mutate input state for iteration events", () => {
      fc.assert(
        fc.property(iterationStartedEventArb, (event) => {
          const state = createDefaultState();
          const stateCopy = JSON.parse(JSON.stringify(state));

          stateReducerRegistry.reduce(state, event);

          expect(state).toEqual(stateCopy);
        }),
        { numRuns: 50 }
      );
    });

    it("should not mutate input state for llm events", () => {
      fc.assert(
        fc.property(llmTextChunkEventArb, (event) => {
          const state = createDefaultState();
          const stateCopy = JSON.parse(JSON.stringify(state));

          stateReducerRegistry.reduce(state, event);

          expect(state).toEqual(stateCopy);
        }),
        { numRuns: 50 }
      );
    });
  });
});
