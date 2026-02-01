import { describe, expect, it } from "bun:test";
import {
  createEventMappingRegistry,
  eventMappingRegistry,
  type MappingContext,
} from "../../src/commands/code/orchestrator/mapping/registry.js";

// Import mappers to register them
import "../../src/commands/code/orchestrator/mapping/llm-to-domain.js";
import "../../src/commands/code/orchestrator/mapping/signal-to-domain.js";

/**
 * Helper to create a mapping context.
 */
function createTestContext(timestamp = Date.now()): MappingContext {
  return { timestamp };
}

describe("Event Mapping", () => {
  describe("LLM Event Mappers", () => {
    describe("Text event", () => {
      it("should map Text event to LLMText domain event", () => {
        const context = createTestContext();
        const event = { _tag: "Text" as const, text: "Hello, world!" };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMText");
        if (result._tag === "LLMText") {
          expect(result.text).toBe("Hello, world!");
        }
      });

      it("should handle empty text", () => {
        const context = createTestContext();
        const event = { _tag: "Text" as const, text: "" };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMText");
        if (result._tag === "LLMText") {
          expect(result.text).toBe("");
        }
      });

      it("should handle text with special characters", () => {
        const context = createTestContext();
        const event = {
          _tag: "Text" as const,
          text: "<ferix:tasks>test</ferix:tasks>",
        };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMText");
        if (result._tag === "LLMText") {
          expect(result.text).toBe("<ferix:tasks>test</ferix:tasks>");
        }
      });
    });

    describe("ToolStart event", () => {
      it("should map ToolStart event to LLMToolStart domain event", () => {
        const context = createTestContext();
        const event = { _tag: "ToolStart" as const, tool: "Read" };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMToolStart");
        if (result._tag === "LLMToolStart") {
          expect(result.tool).toBe("Read");
        }
      });

      it("should handle various tool names", () => {
        const tools = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"];

        for (const tool of tools) {
          const context = createTestContext();
          const event = { _tag: "ToolStart" as const, tool };

          const result = eventMappingRegistry.mapLLMEvent(event, context);

          expect(result._tag).toBe("LLMToolStart");
          if (result._tag === "LLMToolStart") {
            expect(result.tool).toBe(tool);
          }
        }
      });
    });

    describe("ToolUse event", () => {
      it("should map ToolUse event to LLMToolUse domain event", () => {
        const context = createTestContext();
        const event = {
          _tag: "ToolUse" as const,
          tool: "Read",
          input: { file_path: "/test/file.ts" },
        };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMToolUse");
        if (result._tag === "LLMToolUse") {
          expect(result.tool).toBe("Read");
          expect(result.input).toEqual({ file_path: "/test/file.ts" });
        }
      });

      it("should handle undefined input", () => {
        const context = createTestContext();
        const event = {
          _tag: "ToolUse" as const,
          tool: "Read",
          input: undefined,
        };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMToolUse");
        if (result._tag === "LLMToolUse") {
          expect(result.input).toBeUndefined();
        }
      });

      it("should handle complex input objects", () => {
        const context = createTestContext();
        const event = {
          _tag: "ToolUse" as const,
          tool: "Write",
          input: {
            file_path: "/test/file.ts",
            content: "export const x = 1;",
            nested: { key: "value" },
          },
        };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMToolUse");
        if (result._tag === "LLMToolUse") {
          expect(result.input).toEqual({
            file_path: "/test/file.ts",
            content: "export const x = 1;",
            nested: { key: "value" },
          });
        }
      });
    });

    describe("ToolEnd event", () => {
      it("should map ToolEnd event to LLMToolEnd domain event", () => {
        const context = createTestContext();
        const event = { _tag: "ToolEnd" as const, tool: "Read" };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMToolEnd");
        if (result._tag === "LLMToolEnd") {
          expect(result.tool).toBe("Read");
        }
      });
    });

    describe("Done event", () => {
      it("should map Done event to empty LLMText domain event", () => {
        const context = createTestContext();
        const event = { _tag: "Done" as const, output: "Complete output" };

        const result = eventMappingRegistry.mapLLMEvent(event, context);

        expect(result._tag).toBe("LLMText");
        if (result._tag === "LLMText") {
          expect(result.text).toBe("");
        }
      });
    });
  });

  describe("Signal Mappers", () => {
    describe("TasksDefined signal", () => {
      it("should map TasksDefined signal and filter verification tasks", () => {
        const context = createTestContext();
        const signal = {
          _tag: "TasksDefined" as const,
          tasks: [
            { id: "1", title: "Implement feature", description: "Desc 1" },
            { id: "2", title: "Verify tests pass", description: "Desc 2" },
            { id: "3", title: "Run verification", description: "Desc 3" },
          ],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("TasksDefined");
        if (result._tag === "TasksDefined") {
          // Should filter out verification tasks
          expect(result.tasks).toHaveLength(1);
          expect(result.tasks[0]?.id).toBe("1");
          expect(result.tasks[0]?.title).toBe("Implement feature");
        }
      });

      it("should return empty tasks array if all tasks are verification tasks", () => {
        const context = createTestContext();
        const signal = {
          _tag: "TasksDefined" as const,
          tasks: [
            { id: "1", title: "Verify tests pass", description: "Desc 1" },
            { id: "2", title: "Run lint and format", description: "Desc 2" },
          ],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("TasksDefined");
        if (result._tag === "TasksDefined") {
          expect(result.tasks).toHaveLength(0);
        }
      });

      it("should pass through non-verification tasks", () => {
        const context = createTestContext();
        const signal = {
          _tag: "TasksDefined" as const,
          tasks: [{ id: "1", title: "Task 1", description: "Desc 1" }],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("TasksDefined");
        if (result._tag === "TasksDefined") {
          expect(result.tasks).toHaveLength(1);
          expect(result.tasks[0]?.id).toBe("1");
        }
      });
    });

    describe("PhasesDefined signal", () => {
      it("should map PhasesDefined signal directly", () => {
        const context = createTestContext();
        const signal = {
          _tag: "PhasesDefined" as const,
          taskId: "1",
          phases: [{ id: "1.1", description: "Phase 1" }],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("PhasesDefined");
        if (result._tag === "PhasesDefined") {
          expect(result.taskId).toBe("1");
          expect(result.phases).toHaveLength(1);
        }
      });
    });

    describe("CriteriaDefined signal", () => {
      it("should map CriteriaDefined signal directly", () => {
        const context = createTestContext();
        const signal = {
          _tag: "CriteriaDefined" as const,
          taskId: "1",
          criteria: [{ id: "1.c1", description: "Criterion 1" }],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("CriteriaDefined");
        if (result._tag === "CriteriaDefined") {
          expect(result.taskId).toBe("1");
          expect(result.criteria).toHaveLength(1);
        }
      });
    });

    describe("Phase lifecycle signals", () => {
      it("should map PhaseStarted with timestamp", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = { _tag: "PhaseStarted" as const, phaseId: "1.1" };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("PhaseStarted");
        if (result._tag === "PhaseStarted") {
          expect(result.timestamp).toBe(timestamp);
        }
      });

      it("should map PhaseCompleted with timestamp", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = { _tag: "PhaseCompleted" as const, phaseId: "1.1" };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("PhaseCompleted");
        if (result._tag === "PhaseCompleted") {
          expect(result.timestamp).toBe(timestamp);
        }
      });

      it("should map PhaseFailed with timestamp and reason", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = {
          _tag: "PhaseFailed" as const,
          phaseId: "1.1",
          reason: "Error occurred",
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("PhaseFailed");
        if (result._tag === "PhaseFailed") {
          expect(result.timestamp).toBe(timestamp);
          expect(result.reason).toBe("Error occurred");
        }
      });
    });

    describe("Criterion signals", () => {
      it("should map CriterionPassed directly", () => {
        const context = createTestContext();
        const signal = {
          _tag: "CriterionPassed" as const,
          criterionId: "1.c1",
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("CriterionPassed");
      });

      it("should map CriterionFailed with reason", () => {
        const context = createTestContext();
        const signal = {
          _tag: "CriterionFailed" as const,
          criterionId: "1.c1",
          reason: "Assertion failed",
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("CriterionFailed");
        if (result._tag === "CriterionFailed") {
          expect(result.reason).toBe("Assertion failed");
        }
      });
    });

    describe("Check signals", () => {
      it("should map CheckPassed to domain event", () => {
        const context = createTestContext();
        const signal = { _tag: "CheckPassed" as const };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("CheckPassed");
      });

      it("should map CheckFailed with empty failedCriteria", () => {
        const context = createTestContext();
        const signal = { _tag: "CheckFailed" as const };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("CheckFailed");
        if (result._tag === "CheckFailed") {
          expect(result.failedCriteria).toEqual([]);
        }
      });
    });

    describe("ReviewComplete signal", () => {
      it("should map ReviewComplete directly", () => {
        const context = createTestContext();
        const signal = { _tag: "ReviewComplete" as const, changesMade: true };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("ReviewComplete");
        if (result._tag === "ReviewComplete") {
          expect(result.changesMade).toBe(true);
        }
      });
    });

    describe("TaskComplete signal", () => {
      it("should map TaskComplete to TaskCompleted with timestamp", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = {
          _tag: "TaskComplete" as const,
          taskId: "1",
          summary: "Completed task",
          filesModified: ["file1.ts"],
          filesCreated: ["file2.ts"],
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("TaskCompleted");
        if (result._tag === "TaskCompleted") {
          expect(result.taskId).toBe("1");
          expect(result.summary).toBe("Completed task");
          expect(result.timestamp).toBe(timestamp);
        }
      });
    });

    describe("Learning signal", () => {
      it("should map Learning to LearningRecorded", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = {
          _tag: "Learning" as const,
          content: "Learned something",
          category: "success" as const,
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("LearningRecorded");
        if (result._tag === "LearningRecorded") {
          expect(result.content).toBe("Learned something");
          expect(result.category).toBe("success");
          expect(result.timestamp).toBe(timestamp);
        }
      });
    });

    describe("Guardrail signal", () => {
      it("should map Guardrail to GuardrailAdded", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = {
          _tag: "Guardrail" as const,
          pattern: "Error pattern",
          sign: "Signs of issue",
          avoidance: "How to avoid",
          severity: "warning" as const,
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("GuardrailAdded");
        if (result._tag === "GuardrailAdded") {
          expect(result.pattern).toBe("Error pattern");
          expect(result.sign).toBe("Signs of issue");
          expect(result.avoidance).toBe("How to avoid");
          expect(result.severity).toBe("warning");
          expect(result.timestamp).toBe(timestamp);
        }
      });
    });

    describe("SessionNameDefined signal", () => {
      it("should map SessionNameDefined to SessionNameGenerated", () => {
        const timestamp = 1_704_067_200_000;
        const context = createTestContext(timestamp);
        const signal = {
          _tag: "SessionNameDefined" as const,
          name: "add-dark-mode",
        };

        const result = eventMappingRegistry.mapSignal(signal, context);

        expect(result._tag).toBe("SessionNameGenerated");
        if (result._tag === "SessionNameGenerated") {
          expect(result.displayName).toBe("add-dark-mode");
          expect(result.timestamp).toBe(timestamp);
        }
      });
    });
  });

  describe("Registry Creation", () => {
    it("should create new independent registry", () => {
      const registry = createEventMappingRegistry();

      // Registry starts empty
      const result = registry.mapLLMEvent(
        { _tag: "Text", text: "test" },
        createTestContext()
      );

      // Should return default fallback
      expect(result._tag).toBe("LLMText");
      if (result._tag === "LLMText") {
        expect(result.text).toBe("");
      }
    });

    it("should allow registering custom LLM mapper", () => {
      const registry = createEventMappingRegistry();

      registry.registerLLMMapper({
        tag: "Text",
        map: (event) => ({ _tag: "LLMText", text: `Custom: ${event.text}` }),
      });

      const result = registry.mapLLMEvent(
        { _tag: "Text", text: "test" },
        createTestContext()
      );

      expect(result._tag).toBe("LLMText");
      if (result._tag === "LLMText") {
        expect(result.text).toBe("Custom: test");
      }
    });

    it("should allow registering custom signal mapper", () => {
      const registry = createEventMappingRegistry();

      registry.registerSignalMapper({
        tag: "CheckPassed",
        map: () => ({ _tag: "LLMText", text: "Custom check passed" }),
      });

      const result = registry.mapSignal(
        { _tag: "CheckPassed" },
        createTestContext()
      );

      expect(result._tag).toBe("LLMText");
      if (result._tag === "LLMText") {
        expect(result.text).toBe("Custom check passed");
      }
    });
  });
});
