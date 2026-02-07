import { describe, expect, it } from "bun:test";
import {
  createStateReducerRegistry,
  stateReducerRegistry,
} from "../../src/commands/code/consumers/tui/reducers/registry.js";
import type { TUIState } from "../../src/commands/code/domain/schemas/tui.js";

// Import reducers to register them
import "../../src/commands/code/consumers/tui/reducers/loop.js";
import "../../src/commands/code/consumers/tui/reducers/iteration.js";
import "../../src/commands/code/consumers/tui/reducers/llm.js";
import "../../src/commands/code/consumers/tui/reducers/discovery.js";
import "../../src/commands/code/consumers/tui/reducers/progress.js";
import "../../src/commands/code/consumers/tui/reducers/tasks.js";

/**
 * Helper to create a minimal TUI state for testing.
 */
function createTestState(overrides: Partial<TUIState> = {}): TUIState {
  return {
    task: "Test task",
    iteration: 0,
    maxIterations: 5,
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
    ...overrides,
  };
}

describe("TUI Reducers", () => {
  describe("Loop Reducers", () => {
    describe("LoopStarted", () => {
      it("should set status to running", () => {
        const state = createTestState();
        const event = {
          _tag: "LoopStarted" as const,
          config: {
            task: "New task",
            maxIterations: 10,
            verbose: false,
            verifyCommands: [],
          },
          timestamp: 1_704_067_200_000,
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.status).toBe("running");
      });

      it("should set task from config", () => {
        const state = createTestState();
        const event = {
          _tag: "LoopStarted" as const,
          config: {
            task: "Implement feature X",
            maxIterations: 5,
            verbose: false,
            verifyCommands: [],
          },
          timestamp: 1_704_067_200_000,
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.task).toBe("Implement feature X");
      });

      it("should set maxIterations from config", () => {
        const state = createTestState();
        const event = {
          _tag: "LoopStarted" as const,
          config: {
            task: "Task",
            maxIterations: 15,
            verbose: false,
            verifyCommands: [],
          },
          timestamp: 1_704_067_200_000,
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.maxIterations).toBe(15);
      });

      it("should set startTime from event timestamp", () => {
        const state = createTestState();
        const timestamp = 1_704_067_200_000;
        const event = {
          _tag: "LoopStarted" as const,
          config: {
            task: "Task",
            maxIterations: 5,
            verbose: false,
            verifyCommands: [],
          },
          timestamp,
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.startTime).toBe(timestamp);
      });
    });

    describe("LoopCompleted", () => {
      it("should set status to complete", () => {
        const state = createTestState({ status: "running" });
        const event = {
          _tag: "LoopCompleted" as const,
          summary: {
            iterations: 3,
            success: true,
            sessionId: "test",
            completedTasks: [],
            durationMs: 5000,
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.status).toBe("complete");
      });

      it("should flush partial line to output", () => {
        const state = createTestState({
          status: "running",
          outputLines: ["Line 1"],
          partialLine: "Partial content",
        });
        const event = {
          _tag: "LoopCompleted" as const,
          summary: {
            iterations: 1,
            success: true,
            sessionId: "test",
            completedTasks: [],
            durationMs: 1000,
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toContain("Partial content");
        expect(result.partialLine).toBe("");
      });

      it("should handle empty partial line", () => {
        const state = createTestState({
          status: "running",
          outputLines: ["Line 1"],
          partialLine: "",
        });
        const event = {
          _tag: "LoopCompleted" as const,
          summary: {
            iterations: 1,
            success: true,
            sessionId: "test",
            completedTasks: [],
            durationMs: 1000,
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        // Should contain original line plus completion banner
        expect(result.outputLines[0]).toBe("Line 1");
        expect(result.outputLines[1]).toContain("ALL TASKS COMPLETE");
        expect(result.partialLine).toBe("");
      });
    });

    describe("LoopFailed", () => {
      it("should set status to error", () => {
        const state = createTestState({ status: "running" });
        const event = {
          _tag: "LoopFailed" as const,
          error: {
            phase: "execution",
            message: "Something went wrong",
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.status).toBe("error");
      });

      it("should add error message to output", () => {
        const state = createTestState({ status: "running" });
        const event = {
          _tag: "LoopFailed" as const,
          error: {
            phase: "execution",
            message: "Test error message",
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines.join("\n")).toContain("Test error message");
      });

      it("should include iteration number when available", () => {
        const state = createTestState({ status: "running" });
        const event = {
          _tag: "LoopFailed" as const,
          error: {
            phase: "execution",
            message: "Error in iteration",
            iteration: 3,
          },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines.join("\n")).toContain("Iteration 3");
      });
    });
  });

  describe("Iteration Reducers", () => {
    describe("IterationStarted", () => {
      it("should set iteration number", () => {
        const state = createTestState({ iteration: 0 });
        const event = {
          _tag: "IterationStarted" as const,
          iteration: 1,
          prompt: "Test prompt",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.iteration).toBe(1);
      });

      it("should increment iteration correctly", () => {
        const state = createTestState({ iteration: 2 });
        const event = {
          _tag: "IterationStarted" as const,
          iteration: 3,
          prompt: "Test prompt",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.iteration).toBe(3);
      });
    });

    describe("IterationCompleted", () => {
      it("should clear partial line (already displayed in outputLines)", () => {
        // With live streaming, partial lines are already in outputLines for display
        const state = createTestState({
          outputLines: ["Previous line", "Incomplete text"],
          partialLine: "Incomplete text",
        });
        const event = {
          _tag: "IterationCompleted" as const,
          iteration: 1,
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        // Partial line was already in outputLines, just clear partialLine
        expect(result.outputLines).toContain("Incomplete text");
        expect(result.partialLine).toBe("");
      });

      it("should keep outputLines unchanged if no partial line", () => {
        const state = createTestState({
          outputLines: ["Line 1"],
          partialLine: "",
        });
        const event = {
          _tag: "IterationCompleted" as const,
          iteration: 1,
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toEqual(["Line 1"]);
        expect(result.partialLine).toBe("");
      });
    });
  });

  describe("LLM Reducers", () => {
    describe("LLMText", () => {
      it("should append text to output", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LLMText" as const,
          text: "Hello world\n",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toContain("Hello world");
      });

      it("should handle partial lines correctly", () => {
        const state = createTestState({ partialLine: "Start " });
        const event = {
          _tag: "LLMText" as const,
          text: "end of line\n",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toContain("Start end of line");
        expect(result.partialLine).toBe("");
      });

      it("should display partial text immediately for live streaming", () => {
        const state = createTestState({ partialLine: "" });
        const event = {
          _tag: "LLMText" as const,
          text: "Partial",
        };

        const result = stateReducerRegistry.reduce(state, event);

        // Partial text is now displayed immediately in outputLines for live streaming
        expect(result.partialLine).toBe("Partial");
        expect(result.outputLines).toContain("Partial");
      });

      it("should handle multiple lines in single event", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LLMText" as const,
          text: "Line 1\nLine 2\nLine 3\n",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toContain("Line 1");
        expect(result.outputLines).toContain("Line 2");
        expect(result.outputLines).toContain("Line 3");
      });

      it("should handle empty text", () => {
        const state = createTestState();
        const event = {
          _tag: "LLMText" as const,
          text: "",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result).toEqual(state);
      });
    });

    describe("LLMToolStart", () => {
      it("should set currentTool", () => {
        const state = createTestState({ currentTool: undefined });
        const event = {
          _tag: "LLMToolStart" as const,
          tool: "Read",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.currentTool).toBe("Read");
      });

      it("should update currentTool when changing tools", () => {
        const state = createTestState({ currentTool: "Read" });
        const event = {
          _tag: "LLMToolStart" as const,
          tool: "Write",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.currentTool).toBe("Write");
      });
    });

    describe("LLMToolUse", () => {
      it("should add tool use line to output", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LLMToolUse" as const,
          tool: "Read",
          input: { file_path: "/test/file.ts" },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines.some((line) => line.includes("Read"))).toBe(
          true
        );
      });

      it("should format tool input appropriately", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LLMToolUse" as const,
          tool: "Bash",
          input: { command: "ls -la" },
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines.some((line) => line.includes("Bash"))).toBe(
          true
        );
      });
    });

    describe("LLMToolEnd", () => {
      it("should clear currentTool", () => {
        const state = createTestState({ currentTool: "Read" });
        const event = {
          _tag: "LLMToolEnd" as const,
          tool: "Read",
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.currentTool).toBeUndefined();
      });
    });
  });

  describe("Discovery Reducers", () => {
    describe("DiscoveryStarted", () => {
      it("should set discoveryInProgress to true", () => {
        const state = createTestState({ discoveryInProgress: false });
        const event = {
          _tag: "DiscoveryStarted" as const,
          task: "Test task",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.discoveryInProgress).toBe(true);
      });

      it("should set discoveryCompleted to false", () => {
        const state = createTestState({ discoveryCompleted: true });
        const event = {
          _tag: "DiscoveryStarted" as const,
          task: "Test task",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.discoveryCompleted).toBe(false);
      });

      it("should set executionMode to discovery", () => {
        const state = createTestState({ executionMode: "idle" });
        const event = {
          _tag: "DiscoveryStarted" as const,
          task: "Test task",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.executionMode).toBe("discovery");
      });
    });

    describe("DiscoveryCompleted", () => {
      it("should set discoveryInProgress to false", () => {
        const state = createTestState({ discoveryInProgress: true });
        const event = {
          _tag: "DiscoveryCompleted" as const,
          tasks: [],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.discoveryInProgress).toBe(false);
      });

      it("should set discoveryCompleted to true", () => {
        const state = createTestState({ discoveryCompleted: false });
        const event = {
          _tag: "DiscoveryCompleted" as const,
          tasks: [],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.discoveryCompleted).toBe(true);
      });

      it("should set executionMode to idle", () => {
        const state = createTestState({ executionMode: "discovery" });
        const event = {
          _tag: "DiscoveryCompleted" as const,
          tasks: [],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.executionMode).toBe("idle");
      });
    });
  });

  describe("Progress Reducers", () => {
    describe("LearningRecorded", () => {
      it("should add learning to output", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LearningRecorded" as const,
          iteration: 1,
          content: "Test learning content",
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(
          result.outputLines.some((line) => line.includes("ferix:learning"))
        ).toBe(true);
        expect(
          result.outputLines.some((line) =>
            line.includes("Test learning content")
          )
        ).toBe(true);
      });

      it("should include category when provided", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "LearningRecorded" as const,
          iteration: 1,
          content: "Success learning",
          category: "success" as const,
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(
          result.outputLines.some((line) => line.includes("success"))
        ).toBe(true);
      });
    });

    describe("GuardrailAdded", () => {
      it("should add guardrail to output", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "GuardrailAdded" as const,
          id: "gr-1",
          iteration: 1,
          pattern: "Error pattern",
          sign: "Signs",
          avoidance: "Avoidance",
          severity: "warning" as const,
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(
          result.outputLines.some((line) => line.includes("ferix:guardrail"))
        ).toBe(true);
        expect(
          result.outputLines.some((line) => line.includes("Error pattern"))
        ).toBe(true);
      });

      it("should show critical severity", () => {
        const state = createTestState({ outputLines: [] });
        const event = {
          _tag: "GuardrailAdded" as const,
          id: "gr-1",
          iteration: 1,
          pattern: "Critical issue",
          sign: "Signs",
          avoidance: "Avoidance",
          severity: "critical" as const,
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(
          result.outputLines.some((line) => line.includes("critical"))
        ).toBe(true);
      });
    });

    describe("ProgressUpdated", () => {
      it("should be a no-op (return same state)", () => {
        const state = createTestState();
        const event = {
          _tag: "ProgressUpdated" as const,
          entry: { type: "task_started", content: "Task started" },
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result).toEqual(state);
      });
    });
  });

  describe("Tasks Reducers", () => {
    describe("TasksDefined", () => {
      it("should set tasks from event", () => {
        const state = createTestState({ tasks: [] });
        const event = {
          _tag: "TasksDefined" as const,
          tasks: [
            { id: "1", title: "First task" },
            { id: "2", title: "Second task" },
          ],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.tasks.length).toBe(2);
        expect(result.tasks[0]?.id).toBe("1");
        expect(result.tasks[0]?.title).toBe("First task");
        expect(result.tasks[1]?.id).toBe("2");
        expect(result.tasks[1]?.title).toBe("Second task");
      });

      it("should set currentTaskId to first task", () => {
        const state = createTestState({ currentTaskId: undefined });
        const event = {
          _tag: "TasksDefined" as const,
          tasks: [
            { id: "1", title: "First task" },
            { id: "2", title: "Second task" },
          ],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.currentTaskId).toBe("1");
      });

      it("should emit task-block marker to outputLines", () => {
        const state = createTestState({ outputLines: ["Previous line"] });
        const event = {
          _tag: "TasksDefined" as const,
          tasks: [{ id: "1", title: "Task" }],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.outputLines).toContain("<ferix:task-block/>");
        expect(result.outputLines[0]).toBe("Previous line");
        expect(result.outputLines[1]).toBe("<ferix:task-block/>");
      });

      it("should initialize tasks with pending status", () => {
        const state = createTestState();
        const event = {
          _tag: "TasksDefined" as const,
          tasks: [{ id: "1", title: "Task" }],
          timestamp: Date.now(),
        };

        const result = stateReducerRegistry.reduce(state, event);

        expect(result.tasks[0]?.status).toBe("pending");
        expect(result.tasks[0]?.phases).toEqual([]);
        expect(result.tasks[0]?.criteria).toEqual([]);
      });
    });
  });

  describe("Registry", () => {
    it("should return unchanged state for unregistered events", () => {
      const registry = createStateReducerRegistry();
      const state = createTestState();
      const event = { _tag: "UnknownEvent" as const };

      const result = registry.reduce(state, event as never);

      expect(result).toEqual(state);
    });

    it("should allow registering custom reducers", () => {
      const registry = createStateReducerRegistry();
      registry.register({
        tag: "LoopStarted",
        reduce: (state) => ({ ...state, task: "Custom task" }),
      });

      const state = createTestState();
      const event = {
        _tag: "LoopStarted" as const,
        config: {
          task: "Original",
          maxIterations: 5,
          verbose: false,
          verifyCommands: [],
        },
        timestamp: Date.now(),
      };

      const result = registry.reduce(state, event);

      expect(result.task).toBe("Custom task");
    });
  });
});
