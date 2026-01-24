import { describe, expect, it } from "bun:test";
import { Chunk, Effect, Layer, Stream } from "effect";
import type { LLMEvent } from "../domain/schemas/llm.js";
import { MemoryGuardrails } from "../layers/guardrails/memory.js";
import { Mock } from "../layers/llm/mock.js";
import { MemoryPlan } from "../layers/plan/memory.js";
import { MemoryProgress } from "../layers/progress/memory.js";
import { MemorySession } from "../layers/session/memory.js";
import { FerixParser } from "../layers/signal/ferix-parser.js";
import { runLoop } from "../orchestrator/loop.js";

/**
 * Creates a test layer with the specified LLM events.
 */
function createTestLayers(events: LLMEvent[]) {
  return Layer.mergeAll(
    Mock.layer({ events }),
    MemorySession.layer(),
    MemoryPlan.layer(),
    MemoryProgress.layer(),
    MemoryGuardrails.layer(),
    FerixParser.Live
  );
}

/**
 * Default config for tests.
 */
const defaultConfig = {
  task: "Test task",
  maxIterations: 1,
  verbose: false,
  verifyCommands: [],
} as const;

describe("Orchestrator", () => {
  describe("runLoop", () => {
    it("should emit LoopStarted event at the beginning", async () => {
      const testLayers = createTestLayers([
        { _tag: "Text", text: "Processing..." },
        { _tag: "Done", output: "Processing..." },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const firstEvent = eventArray[0];
      expect(firstEvent).toBeDefined();
      expect(firstEvent?._tag).toBe("LoopStarted");
    });

    it("should emit LoopCompleted event at the end", async () => {
      const testLayers = createTestLayers([
        { _tag: "Text", text: "Done" },
        { _tag: "Done", output: "Done" },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const lastEvent = eventArray.at(-1);
      expect(lastEvent).toBeDefined();
      expect(lastEvent?._tag).toBe("LoopCompleted");
    });

    it("should emit IterationStarted and IterationCompleted events", async () => {
      const testLayers = createTestLayers([
        { _tag: "Text", text: "Processing..." },
        { _tag: "Done", output: "Processing..." },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const iterStarted = eventArray.find((e) => e._tag === "IterationStarted");
      const iterCompleted = eventArray.find(
        (e) => e._tag === "IterationCompleted"
      );

      expect(iterStarted).toBeDefined();
      expect(iterCompleted).toBeDefined();
      if (iterStarted?._tag === "IterationStarted") {
        expect(iterStarted.iteration).toBe(1);
      }
    });

    it("should create a plan when TasksDefined signal is received", async () => {
      const testLayers = createTestLayers([
        {
          _tag: "Text",
          text: `<ferix:tasks>
            <task id="1">Implement feature</task>
            <task id="2">Write tests</task>
          </ferix:tasks>`,
        },
        { _tag: "Done", output: "" },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const planCreated = eventArray.find((e) => e._tag === "PlanCreated");

      expect(planCreated).toBeDefined();
      if (planCreated?._tag === "PlanCreated") {
        expect(planCreated.plan.tasks).toHaveLength(2);
      }
    });

    it("should update plan when PhasesDefined signal is received", async () => {
      const testLayers = createTestLayers([
        {
          _tag: "Text",
          text: `<ferix:tasks>
            <task id="1">Implement feature</task>
          </ferix:tasks>
          <ferix:phases task="1">
            <phase id="1.1">Setup</phase>
            <phase id="1.2">Implement</phase>
          </ferix:phases>`,
        },
        { _tag: "Done", output: "" },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const planUpdated = eventArray.filter((e) => e._tag === "PlanUpdated");

      expect(planUpdated.length).toBeGreaterThan(0);
      const lastUpdate = planUpdated.at(-1);
      if (lastUpdate?._tag === "PlanUpdated") {
        const firstTask = lastUpdate.plan.tasks[0];
        expect(firstTask?.phases).toHaveLength(2);
      }
    });

    it("should complete loop when LoopComplete signal is received", async () => {
      const testLayers = createTestLayers([
        {
          _tag: "Text",
          text: `<ferix:tasks>
            <task id="1">Test</task>
          </ferix:tasks>
          <ferix:complete>`,
        },
        { _tag: "Done", output: "" },
      ]);

      const program = runLoop({
        ...defaultConfig,
        maxIterations: 10, // Should stop before this
      }).pipe(Stream.runCollect, Effect.provide(testLayers));

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      // Should only have 1 iteration since loop completed
      const iterationsStarted = eventArray.filter(
        (e) => e._tag === "IterationStarted"
      );
      expect(iterationsStarted).toHaveLength(1);

      const loopCompleted = eventArray.find((e) => e._tag === "LoopCompleted");
      expect(loopCompleted).toBeDefined();
      if (loopCompleted?._tag === "LoopCompleted") {
        expect(loopCompleted.summary.success).toBe(true);
      }
    });

    it("should handle phase status updates", async () => {
      const testLayers = createTestLayers([
        {
          _tag: "Text",
          text: `<ferix:tasks>
            <task id="1">Test</task>
          </ferix:tasks>
          <ferix:phases task="1">
            <phase id="1.1">Setup</phase>
          </ferix:phases>
          <ferix:phase-start id="1.1"/>
          <ferix:phase-done id="1.1"/>`,
        },
        { _tag: "Done", output: "" },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      // Check for PhaseStarted and PhaseCompleted events
      const phaseStarted = eventArray.find((e) => e._tag === "PhaseStarted");
      const phaseCompleted = eventArray.find(
        (e) => e._tag === "PhaseCompleted"
      );

      expect(phaseStarted).toBeDefined();
      expect(phaseCompleted).toBeDefined();
    });

    it("should emit LLM events", async () => {
      const testLayers = createTestLayers([
        { _tag: "Text", text: "Hello" },
        { _tag: "ToolStart", tool: "Read" },
        { _tag: "ToolUse", tool: "Read", input: { path: "/test" } },
        { _tag: "ToolEnd", tool: "Read" },
        { _tag: "Done", output: "Hello" },
      ]);

      const program = runLoop(defaultConfig).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      );

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const llmText = eventArray.find((e) => e._tag === "LLMText");
      const toolStart = eventArray.find((e) => e._tag === "LLMToolStart");
      const toolUse = eventArray.find((e) => e._tag === "LLMToolUse");
      const toolEnd = eventArray.find((e) => e._tag === "LLMToolEnd");

      expect(llmText).toBeDefined();
      expect(toolStart).toBeDefined();
      expect(toolUse).toBeDefined();
      expect(toolEnd).toBeDefined();
    });

    it("should run multiple iterations if not completed", async () => {
      const testLayers = createTestLayers([
        { _tag: "Text", text: "Iteration 1" },
        { _tag: "Done", output: "Iteration 1" },
      ]);

      const program = runLoop({
        ...defaultConfig,
        maxIterations: 3,
      }).pipe(Stream.runCollect, Effect.provide(testLayers));

      const events = await Effect.runPromise(program);
      const eventArray = Chunk.toArray(events);

      const iterationsStarted = eventArray.filter(
        (e) => e._tag === "IterationStarted"
      );
      // Should run all 3 iterations since no LoopComplete signal
      expect(iterationsStarted).toHaveLength(3);
    });
  });
});
