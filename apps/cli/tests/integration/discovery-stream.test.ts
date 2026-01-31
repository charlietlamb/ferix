import { describe, expect, it } from "bun:test";
import { Chunk, Effect, Ref, Stream } from "effect";
import type { DomainEvent } from "../../src/commands/code/domain/schemas/events.js";
import type { Plan } from "../../src/commands/code/domain/schemas/plan.js";
import { createDiscoveryStream } from "../../src/commands/code/orchestrator/discovery.js";
import { PlanStore } from "../../src/commands/code/services/plan-store.js";
import { SignalParser } from "../../src/commands/code/services/signal-parser.js";
import {
  createTestLayers,
  findEvent,
  findEvents,
  mockDoneEvent,
  mockTasksSignal,
  mockTextEvent,
} from "../utils/index.js";

// Mock state store that does nothing (for testing)
const mockStateStore = {
  write: (): Effect.Effect<void> => Effect.void,
};

// Mock prompt store that does nothing (for testing)
const mockPromptStore = {
  copyTemplate: (): Effect.Effect<void> => Effect.void,
};

// Mock progress store that returns empty recent entries (for testing)
const mockProgressStore = {
  getRecent: (): Effect.Effect<readonly []> => Effect.succeed([]),
};

describe("Discovery Stream", () => {
  describe("createDiscoveryStream", () => {
    it("should emit DiscoveryStarted at beginning", async () => {
      const testLayers = createTestLayers({
        events: [mockTextEvent("Analyzing..."), mockDoneEvent()],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent("Analyzing..."),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const discoveryStarted = findEvent(events, "DiscoveryStarted");
      expect(discoveryStarted).toBeDefined();
      expect(events[0]?._tag).toBe("DiscoveryStarted");
    });

    it("should emit DiscoveryCompleted at the end", async () => {
      const testLayers = createTestLayers({
        events: [mockDoneEvent()],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () => Stream.fromIterable([mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const discoveryCompleted = findEvent(events, "DiscoveryCompleted");
      expect(discoveryCompleted).toBeDefined();
      expect(events.at(-1)?._tag).toBe("DiscoveryCompleted");
    });

    it("should parse TasksDefined signal and create plan", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const tasksSignal = mockTasksSignal([
        { id: "1", description: "Implement feature X" },
        { id: "2", description: "Write tests" },
      ]);

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent(tasksSignal),
              mockDoneEvent(""),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        const plan = yield* Ref.get(currentPlanRef);
        return { events: Chunk.toArray(events), plan };
      }).pipe(Effect.provide(testLayers));

      const { events, plan } = await Effect.runPromise(program);

      expect(plan).toBeDefined();
      expect(plan?.tasks).toHaveLength(2);

      const planCreated = findEvent(events, "PlanCreated");
      expect(planCreated).toBeDefined();
    });

    it("should emit LLMText events from LLM stream", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent("First message"),
              mockTextEvent("Second message"),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const textEvents = findEvents(events, "LLMText");
      expect(textEvents.length).toBeGreaterThanOrEqual(2);
    });

    it("should include task count in DiscoveryCompleted", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const tasksSignal = mockTasksSignal([
        { id: "1", description: "Task 1" },
        { id: "2", description: "Task 2" },
        { id: "3", description: "Task 3" },
      ]);

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent(tasksSignal), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const discoveryCompleted = findEvent(
        events,
        "DiscoveryCompleted"
      ) as DomainEvent & { _tag: "DiscoveryCompleted"; taskCount: number };
      expect(discoveryCompleted).toBeDefined();
      expect(discoveryCompleted.taskCount).toBe(3);
    });

    it("should emit LLMToolUse for Analysing tasks", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () => Stream.fromIterable([mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const toolUseEvents = findEvents(events, "LLMToolUse");
      const analysingEvent = toolUseEvents.find(
        (e) =>
          e._tag === "LLMToolUse" &&
          (e as { tool: string }).tool === "Analysing tasks"
      );
      expect(analysingEvent).toBeDefined();
    });

    it("should handle empty task list gracefully", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent("No tasks defined here"),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        const plan = yield* Ref.get(currentPlanRef);
        return { events: Chunk.toArray(events), plan };
      }).pipe(Effect.provide(testLayers));

      const { events, plan } = await Effect.runPromise(program);

      const discoveryCompleted = findEvent(events, "DiscoveryCompleted");
      expect(discoveryCompleted).toBeDefined();

      // Plan should be undefined when no tasks are defined
      expect(plan).toBeUndefined();
    });

    it("should handle session name callback when provided", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      let capturedSessionName: string | undefined;

      const sessionNameSignal =
        "<ferix:session-name>my-test-session</ferix:session-name>";

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent(sessionNameSignal),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const onSessionName = (name: string) =>
          Effect.sync(() => {
            capturedSessionName = name;
          });

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session",
          undefined,
          onSessionName
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      expect(capturedSessionName).toBe("my-test-session");

      const sessionNameEvent = findEvent(events, "SessionNameGenerated");
      expect(sessionNameEvent).toBeDefined();
    });

    it("should emit events in correct order", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent("Processing..."),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createDiscoveryStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockPromptStore,
          mockProgressStore,
          currentPlanRef,
          config,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      // First event should be DiscoveryStarted
      expect(events[0]?._tag).toBe("DiscoveryStarted");

      // Second event should be LLMToolUse for Analysing tasks
      expect(events[1]?._tag).toBe("LLMToolUse");

      // Last event should be DiscoveryCompleted
      expect(events.at(-1)?._tag).toBe("DiscoveryCompleted");

      // There should be LLM events in between
      const llmTextEvents = findEvents(events, "LLMText");
      expect(llmTextEvents.length).toBeGreaterThan(0);
    });
  });
});
