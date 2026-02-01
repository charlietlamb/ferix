import { describe, expect, it } from "bun:test";
import type {
  CriteriaDefinedSignal,
  CriterionFailedSignal,
  CriterionPassedSignal,
  GuardrailSignal,
  LearningSignal,
  PhaseCompletedSignal,
  PhaseFailedSignal,
  PhaseStartedSignal,
  PhasesDefinedSignal,
  Plan,
  TaskCompleteSignal,
  TasksDefinedSignal,
} from "../../src/commands/code/domain/index.js";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import {
  createPlanUpdateRegistry,
  type PlanUpdateContext,
} from "../../src/commands/code/orchestrator/plan-updates/registry.js";

// Import handlers to register them
import "../../src/commands/code/orchestrator/plan-updates/handlers/tasks-defined.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/phases-defined.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/criteria-defined.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/phase-lifecycle.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/criterion-lifecycle.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/task-complete.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/guardrail.js";
import "../../src/commands/code/orchestrator/plan-updates/handlers/learning.js";

// Import the singleton registry that handlers registered to
import { planUpdateRegistry } from "../../src/commands/code/orchestrator/plan-updates/registry.js";

/**
 * Helper to create a test plan update context.
 */
function createTestContext(
  overrides: Partial<PlanUpdateContext> = {}
): PlanUpdateContext {
  return {
    sessionId: "test-session",
    originalTask: "Test original task",
    timestamp: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Helper to create a minimal test plan.
 */
function createTestPlan(tasks: Plan["tasks"] = []): Plan {
  return {
    id: PlanId("test-plan"),
    sessionId: "test-session",
    createdAt: "2024-01-01T00:00:00.000Z",
    originalTask: "Test task",
    tasks,
  };
}

describe("Plan Update Handlers", () => {
  describe("TasksDefined handler", () => {
    it("should create a new plan from tasks", () => {
      const signal: TasksDefinedSignal = {
        _tag: "TasksDefined",
        tasks: [
          { id: "1", title: "Task 1", description: "Description 1" },
          { id: "2", title: "Task 2", description: "Description 2" },
        ],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeDefined();
      expect(result?.operation).toBe("create");
      expect(result?.eventTag).toBe("PlanCreated");
      expect(result?.plan.tasks).toHaveLength(2);
      expect(result?.plan.tasks[0]?.title).toBe("Task 1");
      expect(result?.plan.tasks[1]?.title).toBe("Task 2");
    });

    it("should handle pre-filtered tasks from event mapping layer", () => {
      // Note: Verification task filtering now happens at event mapping layer (signal-to-domain.ts)
      // This test verifies the handler works with already-filtered tasks
      const signal: TasksDefinedSignal = {
        _tag: "TasksDefined",
        tasks: [{ id: "1", title: "Implement feature", description: "Desc" }],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result?.plan.tasks).toHaveLength(1);
      expect(result?.plan.tasks[0]?.title).toBe("Implement feature");
    });

    it("should return undefined if no tasks remain after filtering", () => {
      // Note: Verification task filtering happens at event mapping layer
      // This simulates receiving an empty task list after filtering
      const signal: TasksDefinedSignal = {
        _tag: "TasksDefined",
        tasks: [],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });

    it("should set all tasks to pending initially", () => {
      const signal: TasksDefinedSignal = {
        _tag: "TasksDefined",
        tasks: [
          { id: "1", title: "Task 1", description: "Description 1" },
          { id: "2", title: "Task 2", description: "Description 2" },
        ],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result?.plan.tasks[0]?.status).toBe("pending");
      expect(result?.plan.tasks[1]?.status).toBe("pending");
    });
  });

  describe("PhasesDefined handler", () => {
    it("should add phases to a task", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: PhasesDefinedSignal = {
        _tag: "PhasesDefined",
        taskId: "1",
        phases: [
          { id: "1.1", description: "Setup" },
          { id: "1.2", description: "Implement" },
        ],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.operation).toBe("update");
      expect(result?.eventTag).toBe("PlanUpdated");
      expect(result?.plan.tasks[0]?.phases).toHaveLength(2);
      expect(result?.plan.tasks[0]?.phases[0]?.description).toBe("Setup");
    });

    it("should return undefined if no plan exists", () => {
      const signal: PhasesDefinedSignal = {
        _tag: "PhasesDefined",
        taskId: "1",
        phases: [{ id: "1.1", description: "Setup" }],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("CriteriaDefined handler", () => {
    it("should add criteria to a task", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: CriteriaDefinedSignal = {
        _tag: "CriteriaDefined",
        taskId: "1",
        criteria: [
          { id: "1.c1", description: "Tests pass" },
          { id: "1.c2", description: "Lint passes" },
        ],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.operation).toBe("update");
      expect(result?.plan.tasks[0]?.criteria).toHaveLength(2);
      expect(result?.plan.tasks[0]?.criteria[0]?.description).toBe(
        "Tests pass"
      );
    });

    it("should return undefined if no plan exists", () => {
      const signal: CriteriaDefinedSignal = {
        _tag: "CriteriaDefined",
        taskId: "1",
        criteria: [{ id: "1.c1", description: "Tests pass" }],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("PhaseStarted handler", () => {
    it("should set phase status to in_progress", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [{ id: "1.1", description: "Setup", status: "pending" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: PhaseStartedSignal = {
        _tag: "PhaseStarted",
        phaseId: "1.1",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.plan.tasks[0]?.phases[0]?.status).toBe("in_progress");
    });

    it("should return undefined if no plan exists", () => {
      const signal: PhaseStartedSignal = {
        _tag: "PhaseStarted",
        phaseId: "1.1",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("PhaseCompleted handler", () => {
    it("should set phase status to done", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [{ id: "1.1", description: "Setup", status: "in_progress" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: PhaseCompletedSignal = {
        _tag: "PhaseCompleted",
        phaseId: "1.1",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.plan.tasks[0]?.phases[0]?.status).toBe("done");
    });
  });

  describe("PhaseFailed handler", () => {
    it("should set phase status to failed", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [{ id: "1.1", description: "Setup", status: "in_progress" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: PhaseFailedSignal = {
        _tag: "PhaseFailed",
        phaseId: "1.1",
        reason: "Network error",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.plan.tasks[0]?.phases[0]?.status).toBe("failed");
    });
  });

  describe("CriterionPassed handler", () => {
    it("should set criterion status to passed", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [
            { id: "1.c1", description: "Tests pass", status: "pending" },
          ],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: CriterionPassedSignal = {
        _tag: "CriterionPassed",
        criterionId: "1.c1",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.plan.tasks[0]?.criteria[0]?.status).toBe("passed");
    });

    it("should return undefined if no plan exists", () => {
      const signal: CriterionPassedSignal = {
        _tag: "CriterionPassed",
        criterionId: "1.c1",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("CriterionFailed handler", () => {
    it("should set criterion status to failed with reason", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [
            { id: "1.c1", description: "Tests pass", status: "pending" },
          ],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: CriterionFailedSignal = {
        _tag: "CriterionFailed",
        criterionId: "1.c1",
        reason: "3 tests failing",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.plan.tasks[0]?.criteria[0]?.status).toBe("failed");
    });
  });

  describe("TaskComplete handler", () => {
    it("should mark task as done with summary", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc 2",
          status: "pending",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: TaskCompleteSignal = {
        _tag: "TaskComplete",
        taskId: "1",
        summary: "Successfully implemented feature",
        filesModified: ["src/index.ts"],
        filesCreated: [],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.operation).toBe("update");
      expect(result?.plan.tasks[0]?.status).toBe("done");
      expect(result?.plan.tasks[0]?.completionNotes).toBe(
        "Successfully implemented feature"
      );
    });

    it("should return undefined if no plan exists", () => {
      const signal: TaskCompleteSignal = {
        _tag: "TaskComplete",
        taskId: "1",
        summary: "Done",
        filesModified: [],
        filesCreated: [],
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Guardrail handler", () => {
    it("should return undefined (guardrails do not modify plan)", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: GuardrailSignal = {
        _tag: "Guardrail",
        pattern: "Missing null check",
        sign: "TypeError at runtime",
        avoidance: "Always check for null before accessing properties",
        severity: "warning",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeUndefined();
    });

    it("should return undefined even without a plan", () => {
      const signal: GuardrailSignal = {
        _tag: "Guardrail",
        pattern: "Test pattern",
        sign: "Test sign",
        avoidance: "Test avoidance",
        severity: "critical",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Learning handler", () => {
    it("should return undefined (learnings do not modify plan)", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const signal: LearningSignal = {
        _tag: "Learning",
        content: "Effect.gen is the preferred pattern for composing effects",
        category: "success",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(signal, plan, context);

      expect(result).toBeUndefined();
    });

    it("should return undefined even without a plan", () => {
      const signal: LearningSignal = {
        _tag: "Learning",
        content: "Test learning",
      };
      const context = createTestContext();

      const result = planUpdateRegistry.computeUpdate(
        signal,
        undefined,
        context
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Registry behavior", () => {
    it("should return undefined for unregistered signal types", () => {
      const registry = createPlanUpdateRegistry();
      const signal = { _tag: "UnknownSignal" } as never;
      const context = createTestContext();

      const result = registry.computeUpdate(signal, undefined, context);

      expect(result).toBeUndefined();
    });

    it("should allow registering custom handlers", () => {
      const registry = createPlanUpdateRegistry();
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      registry.register({
        tag: "CheckPassed",
        handle: (_signal, currentPlan, _context) =>
          currentPlan
            ? {
                plan: currentPlan,
                operation: "update",
                eventTag: "PlanUpdated",
              }
            : undefined,
      });

      const signal = { _tag: "CheckPassed" } as const;
      const context = createTestContext();

      const result = registry.computeUpdate(signal, plan, context);

      expect(result).toBeDefined();
      expect(result?.operation).toBe("update");
    });
  });
});
