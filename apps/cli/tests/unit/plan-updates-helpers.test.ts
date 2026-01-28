import { describe, expect, it } from "bun:test";
import type { Plan } from "../../src/commands/code/domain/schemas/plan.js";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import {
  createPlanFromTasks,
  isVerificationTask,
  markTaskCompleted,
  updateCriterionStatus,
  updatePhaseStatus,
  updatePlanWithCriteria,
  updatePlanWithPhases,
} from "../../src/commands/code/orchestrator/plan-updates/helpers.js";

/**
 * Helper to create a test plan with minimal required fields.
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

describe("Plan Updates Helpers", () => {
  describe("isVerificationTask", () => {
    it("should identify lint tasks as verification", () => {
      expect(isVerificationTask("Run lint")).toBe(true);
      expect(isVerificationTask("Run linting checks")).toBe(true);
    });

    it("should identify test tasks as verification", () => {
      expect(isVerificationTask("Run tests")).toBe(true);
      expect(isVerificationTask("Run unit testing")).toBe(true);
    });

    it("should identify format tasks as verification", () => {
      expect(isVerificationTask("Format code")).toBe(true);
      expect(isVerificationTask("Run formatting")).toBe(true);
    });

    it("should identify validation tasks as verification", () => {
      expect(isVerificationTask("Verify changes")).toBe(true);
      expect(isVerificationTask("Validate implementation")).toBe(true);
    });

    it("should identify package manager verification commands", () => {
      expect(isVerificationTask("run bun lint")).toBe(true);
      expect(isVerificationTask("run npm test")).toBe(true);
      expect(isVerificationTask("run yarn format")).toBe(true);
      expect(isVerificationTask("run pnpm build")).toBe(true);
    });

    it("should not identify regular tasks as verification", () => {
      expect(isVerificationTask("Implement feature")).toBe(false);
      expect(isVerificationTask("Add new component")).toBe(false);
      expect(isVerificationTask("Fix authentication bug")).toBe(false);
    });
  });

  describe("createPlanFromTasks", () => {
    it("should create plan with correct structure", () => {
      const tasks = [
        { id: "1", title: "Task 1", description: "Description 1" },
        { id: "2", title: "Task 2", description: "Description 2" },
      ];

      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        tasks,
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.id).toBe("test-session-plan");
      expect(plan.sessionId).toBe("test-session");
      expect(plan.originalTask).toBe("Original task");
      expect(plan.tasks).toHaveLength(2);
    });

    it("should set all tasks to pending status", () => {
      const tasks = [
        { id: "1", title: "Task 1", description: "Description 1" },
      ];

      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        tasks,
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.tasks[0]?.status).toBe("pending");
    });

    it("should initialize empty phases and criteria arrays", () => {
      const tasks = [
        { id: "1", title: "Task 1", description: "Description 1" },
      ];

      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        tasks,
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.tasks[0]?.phases).toEqual([]);
      expect(plan.tasks[0]?.criteria).toEqual([]);
    });

    it("should initialize attempts to 0", () => {
      const tasks = [
        { id: "1", title: "Task 1", description: "Description 1" },
      ];

      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        tasks,
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.tasks[0]?.attempts).toBe(0);
    });

    it("should handle empty tasks array", () => {
      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        [],
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.tasks).toHaveLength(0);
    });

    it("should preserve task id, title, and description", () => {
      const tasks = [
        { id: "custom-id", title: "Custom Title", description: "Custom Desc" },
      ];

      const plan = createPlanFromTasks(
        "test-session",
        "Original task",
        tasks,
        "2024-01-01T00:00:00.000Z"
      );

      expect(plan.tasks[0]?.id).toBe("custom-id");
      expect(plan.tasks[0]?.title).toBe("Custom Title");
      expect(plan.tasks[0]?.description).toBe("Custom Desc");
    });
  });

  describe("updatePlanWithPhases", () => {
    it("should add phases to the specified task", () => {
      const plan = createTestPlan([
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

      const phases = [
        { id: "1.1", description: "Setup" },
        { id: "1.2", description: "Implement" },
      ];

      const updated = updatePlanWithPhases(plan, "1", phases);

      expect(updated.tasks[0]?.phases).toHaveLength(2);
      expect(updated.tasks[0]?.phases[0]?.id).toBe("1.1");
      expect(updated.tasks[0]?.phases[0]?.description).toBe("Setup");
      expect(updated.tasks[0]?.phases[0]?.status).toBe("pending");
    });

    it("should replace existing phases", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [
            { id: "1.old", description: "Old phase", status: "pending" },
          ],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const newPhases = [{ id: "1.new", description: "New phase" }];
      const updated = updatePlanWithPhases(plan, "1", newPhases);

      expect(updated.tasks[0]?.phases).toHaveLength(1);
      expect(updated.tasks[0]?.phases[0]?.id).toBe("1.new");
    });

    it("should return unchanged plan if task not found", () => {
      const plan = createTestPlan([
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

      const updated = updatePlanWithPhases(plan, "nonexistent", []);

      expect(updated).toEqual(plan);
    });

    it("should handle empty phases array", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [{ id: "1.1", description: "Existing", status: "pending" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updatePlanWithPhases(plan, "1", []);

      expect(updated.tasks[0]?.phases).toHaveLength(0);
    });

    it("should not mutate original plan", () => {
      const plan = createTestPlan([
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

      const originalPhases = plan.tasks[0]?.phases;
      updatePlanWithPhases(plan, "1", [{ id: "1.1", description: "New" }]);

      expect(plan.tasks[0]?.phases).toBe(originalPhases);
      expect(plan.tasks[0]?.phases).toHaveLength(0);
    });
  });

  describe("updatePlanWithCriteria", () => {
    it("should add criteria to the specified task", () => {
      const plan = createTestPlan([
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

      const criteria = [
        { id: "1.c1", description: "Code compiles" },
        { id: "1.c2", description: "Tests pass" },
      ];

      const updated = updatePlanWithCriteria(plan, "1", criteria);

      expect(updated.tasks[0]?.criteria).toHaveLength(2);
      expect(updated.tasks[0]?.criteria[0]?.id).toBe("1.c1");
      expect(updated.tasks[0]?.criteria[0]?.status).toBe("pending");
    });

    it("should return unchanged plan if task not found", () => {
      const plan = createTestPlan([]);

      const updated = updatePlanWithCriteria(plan, "nonexistent", []);

      expect(updated).toEqual(plan);
    });
  });

  describe("updatePhaseStatus", () => {
    it("should update phase to in_progress", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [{ id: "1.1", description: "Setup", status: "pending" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updatePhaseStatus(plan, "1.1", "in_progress");

      expect(updated.tasks[0]?.phases[0]?.status).toBe("in_progress");
    });

    it("should update phase to done", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [{ id: "1.1", description: "Setup", status: "in_progress" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updatePhaseStatus(plan, "1.1", "done");

      expect(updated.tasks[0]?.phases[0]?.status).toBe("done");
    });

    it("should update phase to failed", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [{ id: "1.1", description: "Setup", status: "in_progress" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updatePhaseStatus(plan, "1.1", "failed");

      expect(updated.tasks[0]?.phases[0]?.status).toBe("failed");
    });

    it("should return unchanged plan if task not found", () => {
      const plan = createTestPlan([]);

      const updated = updatePhaseStatus(plan, "1.1", "in_progress");

      expect(updated).toEqual(plan);
    });

    it("should return unchanged plan if phase not found", () => {
      const plan = createTestPlan([
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

      const updated = updatePhaseStatus(plan, "1.nonexistent", "in_progress");

      expect(updated).toEqual(plan);
    });

    it("should extract task ID from phase ID correctly", () => {
      const plan = createTestPlan([
        {
          id: "task-1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [
            { id: "task-1.phase-1", description: "Setup", status: "pending" },
          ],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updatePhaseStatus(plan, "task-1.phase-1", "in_progress");

      expect(updated.tasks[0]?.phases[0]?.status).toBe("in_progress");
    });

    it("should not mutate original plan", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [{ id: "1.1", description: "Setup", status: "pending" }],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      updatePhaseStatus(plan, "1.1", "done");

      expect(plan.tasks[0]?.phases[0]?.status).toBe("pending");
    });
  });

  describe("updateCriterionStatus", () => {
    it("should update criterion to passed", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [],
          criteria: [
            { id: "1.c1", description: "Code compiles", status: "pending" },
          ],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updateCriterionStatus(plan, "1.c1", "passed");

      expect(updated.tasks[0]?.criteria[0]?.status).toBe("passed");
    });

    it("should update criterion to failed with reason", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "pending",
          phases: [],
          criteria: [
            { id: "1.c1", description: "Code compiles", status: "pending" },
          ],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      const updated = updateCriterionStatus(
        plan,
        "1.c1",
        "failed",
        "Compilation error"
      );

      expect(updated.tasks[0]?.criteria[0]?.status).toBe("failed");
      expect(updated.tasks[0]?.criteria[0]?.failureReason).toBe(
        "Compilation error"
      );
    });

    it("should return unchanged plan if task not found", () => {
      const plan = createTestPlan([]);

      const updated = updateCriterionStatus(plan, "1.c1", "passed");

      expect(updated).toEqual(plan);
    });

    it("should return unchanged plan if criterion not found", () => {
      const plan = createTestPlan([
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

      const updated = updateCriterionStatus(plan, "1.c1", "passed");

      expect(updated).toEqual(plan);
    });
  });

  describe("markTaskCompleted", () => {
    it("should mark task as done", () => {
      const plan = createTestPlan([
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

      const updated = markTaskCompleted(
        plan,
        "1",
        "Task completed successfully"
      );

      expect(updated.tasks[0]?.status).toBe("done");
    });

    it("should set completion notes", () => {
      const plan = createTestPlan([
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

      const updated = markTaskCompleted(plan, "1", "Implemented feature X");

      expect(updated.tasks[0]?.completionNotes).toBe("Implemented feature X");
    });

    it("should return unchanged plan if task not found", () => {
      const plan = createTestPlan([]);

      const updated = markTaskCompleted(plan, "nonexistent", "Summary");

      expect(updated).toEqual(plan);
    });

    it("should not mutate original plan", () => {
      const plan = createTestPlan([
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

      markTaskCompleted(plan, "1", "Summary");

      expect(plan.tasks[0]?.status).toBe("pending");
      expect(plan.tasks[0]?.completionNotes).toBeUndefined();
    });

    it("should handle already completed tasks", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
          completionNotes: "Original notes",
        },
      ]);

      const updated = markTaskCompleted(plan, "1", "New notes");

      expect(updated.tasks[0]?.status).toBe("done");
      expect(updated.tasks[0]?.completionNotes).toBe("New notes");
    });
  });
});
