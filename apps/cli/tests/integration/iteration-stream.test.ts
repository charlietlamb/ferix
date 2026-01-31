import { describe, expect, it } from "bun:test";
import { Chunk, Effect, Ref, Stream } from "effect";
import type { Plan } from "../../src/commands/code/domain/schemas/plan.js";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import { createIterationStream } from "../../src/commands/code/orchestrator/iteration.js";
import { PlanStore } from "../../src/commands/code/services/plan-store.js";
import { SignalParser } from "../../src/commands/code/services/signal-parser.js";
import {
  combineSignals,
  createTestLayers,
  findEvent,
  findEvents,
  mockDoneEvent,
  mockLoopCompleteSignal,
  mockPhaseDoneSignal,
  mockPhaseStartSignal,
  mockPhasesSignal,
  mockTaskCompleteSignal,
  mockTextEvent,
  mockToolEndEvent,
  mockToolStartEvent,
  mockToolUseEvent,
} from "../utils/index.js";

// Mock state store that does nothing (for testing)
const mockStateStore = {
  write: (): Effect.Effect<void> => Effect.void,
};

// Mock progress store that returns empty recent entries (for testing)
const mockProgressStore = {
  getRecent: (): Effect.Effect<readonly []> => Effect.succeed([]),
};

// Mock git service for testing
const mockGitService = {
  commitChanges: (): Effect.Effect<string> => Effect.succeed("abc123"),
};

/**
 * Helper to create a test plan.
 */
function createTestPlan(tasks: Plan["tasks"] = []): Plan {
  return {
    id: PlanId("test-session-plan"),
    sessionId: "test-session",
    createdAt: "2024-01-01T00:00:00.000Z",
    originalTask: "Test task",
    tasks,
  };
}

describe("Iteration Stream", () => {
  describe("createIterationStream", () => {
    it("should emit IterationStarted at beginning", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent("Working..."), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      expect(events[0]?._tag).toBe("IterationStarted");
      const iterStarted = findEvent(events, "IterationStarted") as {
        _tag: "IterationStarted";
        iteration: number;
      };
      expect(iterStarted?.iteration).toBe(1);
    });

    it("should emit IterationCompleted at end", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () => Stream.fromIterable([mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      expect(events.at(-1)?._tag).toBe("IterationCompleted");
      const iterCompleted = findEvent(events, "IterationCompleted") as {
        _tag: "IterationCompleted";
        iteration: number;
      };
      expect(iterCompleted?.iteration).toBe(1);
    });

    it("should include correct iteration number", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () => Stream.fromIterable([mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 10,
          verbose: false,
          verifyCommands: [],
        };

        // Run iteration 5
        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          5,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const iterStarted = findEvent(events, "IterationStarted") as {
        _tag: "IterationStarted";
        iteration: number;
      };
      expect(iterStarted?.iteration).toBe(5);

      const iterCompleted = findEvent(events, "IterationCompleted") as {
        _tag: "IterationCompleted";
        iteration: number;
      };
      expect(iterCompleted?.iteration).toBe(5);
    });

    it("should emit LLM events from stream", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent("First message"),
              mockToolStartEvent("Read"),
              mockToolUseEvent("Read", { file_path: "/test.ts" }),
              mockToolEndEvent("Read"),
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

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const textEvents = findEvents(events, "LLMText");
      expect(textEvents.length).toBeGreaterThanOrEqual(2);

      const toolStartEvents = findEvents(events, "LLMToolStart");
      expect(toolStartEvents.length).toBe(1);

      const toolUseEvents = findEvents(events, "LLMToolUse");
      expect(toolUseEvents.length).toBe(1);

      const toolEndEvents = findEvents(events, "LLMToolEnd");
      expect(toolEndEvents.length).toBe(1);
    });

    it("should handle phase lifecycle signals", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const phaseSignals = combineSignals(
        mockPhasesSignal("1", [
          { id: "1.1", description: "Setup" },
          { id: "1.2", description: "Implement" },
        ]),
        mockPhaseStartSignal("1.1"),
        mockPhaseDoneSignal("1.1")
      );

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;

        // Start with a plan that has a task
        const initialPlan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);
        const currentPlanRef = yield* Ref.make<Plan | undefined>(initialPlan);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent(phaseSignals), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const phasesDefined = findEvent(events, "PhasesDefined");
      expect(phasesDefined).toBeDefined();

      const phaseStarted = findEvent(events, "PhaseStarted");
      expect(phaseStarted).toBeDefined();

      const phaseCompleted = findEvent(events, "PhaseCompleted");
      expect(phaseCompleted).toBeDefined();
    });

    it("should set loopCompletedRef when LoopComplete signal received", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent(mockLoopCompleteSignal()),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runDrain);

        return yield* Ref.get(loopCompletedRef);
      }).pipe(Effect.provide(testLayers));

      const completed = await Effect.runPromise(program);

      expect(completed).toBe(true);
    });

    it("should auto-complete when all tasks are done", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const taskCompleteSignal = mockTaskCompleteSignal({
        taskId: "1",
        summary: "Completed successfully",
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;

        // Start with a plan that has one pending task
        const initialPlan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);
        const currentPlanRef = yield* Ref.make<Plan | undefined>(initialPlan);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([
              mockTextEvent(taskCompleteSignal),
              mockDoneEvent(),
            ]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runDrain);

        const completed = yield* Ref.get(loopCompletedRef);
        const plan = yield* Ref.get(currentPlanRef);

        return { completed, plan };
      }).pipe(Effect.provide(testLayers));

      const { completed, plan } = await Effect.runPromise(program);

      // Loop should be completed
      expect(completed).toBe(true);

      // Task should be marked as done
      expect(plan?.tasks[0]?.status).toBe("done");
    });

    it("should update plan from signals", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const phasesSignal = mockPhasesSignal("1", [
        { id: "1.1", description: "Phase A" },
        { id: "1.2", description: "Phase B" },
      ]);

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;

        // Start with a plan
        const initialPlan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);
        const currentPlanRef = yield* Ref.make<Plan | undefined>(initialPlan);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent(phasesSignal), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runDrain);

        return yield* Ref.get(currentPlanRef);
      }).pipe(Effect.provide(testLayers));

      const plan = await Effect.runPromise(program);

      expect(plan?.tasks[0]?.phases).toHaveLength(2);
      expect(plan?.tasks[0]?.phases[0]?.description).toBe("Phase A");
      expect(plan?.tasks[0]?.phases[1]?.description).toBe("Phase B");
    });

    it("should emit PlanUpdated events when plan changes", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const phasesSignal = mockPhasesSignal("1", [
        { id: "1.1", description: "Setup" },
      ]);

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;

        const initialPlan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);
        const currentPlanRef = yield* Ref.make<Plan | undefined>(initialPlan);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent(phasesSignal), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      const planUpdated = findEvent(events, "PlanUpdated");
      expect(planUpdated).toBeDefined();
    });

    it("should use worktree path when provided", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      let capturedOptions: { cwd?: string } | undefined;

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: (_prompt: string, options?: { cwd?: string }) => {
            capturedOptions = options;
            return Stream.fromIterable([mockDoneEvent()]);
          },
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session",
          "/custom/worktree/path"
        ).pipe(Stream.runDrain);
      }).pipe(Effect.provide(testLayers));

      await Effect.runPromise(program);

      expect(capturedOptions?.cwd).toBe("/custom/worktree/path");
    });

    it("should emit events in correct order", async () => {
      const testLayers = createTestLayers({
        events: [],
      });

      const program = Effect.gen(function* () {
        const signalParser = yield* SignalParser;
        const planStore = yield* PlanStore;
        const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);
        const loopCompletedRef = yield* Ref.make(false);

        const mockLLM = {
          execute: () =>
            Stream.fromIterable([mockTextEvent("Hello"), mockDoneEvent()]),
        };

        const config = {
          task: "Test task",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        };

        const events = yield* createIterationStream(
          mockLLM,
          signalParser,
          planStore,
          mockStateStore,
          mockProgressStore,
          mockGitService,
          currentPlanRef,
          loopCompletedRef,
          config,
          1,
          "test-session"
        ).pipe(Stream.runCollect);

        return Chunk.toArray(events);
      }).pipe(Effect.provide(testLayers));

      const events = await Effect.runPromise(program);

      // First should be IterationStarted
      expect(events[0]?._tag).toBe("IterationStarted");

      // Last should be IterationCompleted
      expect(events.at(-1)?._tag).toBe("IterationCompleted");

      // LLM events should be in between
      const textEvents = findEvents(events, "LLMText");
      expect(textEvents.length).toBeGreaterThan(0);
    });
  });
});
