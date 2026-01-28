import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
  createPlanFromTasks,
  markTaskCompleted,
  updateCriterionStatus,
  updatePhaseStatus,
  updatePlanWithCriteria,
  updatePlanWithPhases,
} from "../../src/commands/code/orchestrator/plan-updates/helpers.js";

/**
 * Arbitrary for generating valid task IDs.
 */
const taskIdArb = fc.stringOf(
  fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"),
  { minLength: 1, maxLength: 3 }
);

/**
 * Arbitrary for generating task definitions.
 */
const taskDefArb = fc.record({
  id: taskIdArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
});

/**
 * Arbitrary for phase status.
 */
const phaseStatusArb = fc.constantFrom(
  "pending",
  "in_progress",
  "done",
  "failed"
);

/**
 * Arbitrary for criterion status.
 */
const criterionStatusArb = fc.constantFrom("pending", "passed", "failed");

describe("Plan State Machine Properties", () => {
  describe("createPlanFromTasks", () => {
    it("should always create a plan with the correct number of tasks", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 10 }),
          (tasks) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            expect(plan.tasks.length).toBe(tasks.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should set all tasks to pending initially", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 2, maxLength: 10 }),
          (tasks) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            for (const task of plan.tasks) {
              expect(task.status).toBe("pending");
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should preserve task order", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 10 }),
          (tasks) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            for (let i = 0; i < tasks.length; i++) {
              expect(plan.tasks[i]?.id).toBe(tasks[i]?.id);
              expect(plan.tasks[i]?.title).toBe(tasks[i]?.title);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should initialize all tasks with empty phases and criteria", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 10 }),
          (tasks) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            for (const task of plan.tasks) {
              expect(task.phases).toEqual([]);
              expect(task.criteria).toEqual([]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("updatePlanWithPhases", () => {
    it("should add phases to the correct task", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (tasks, taskIndex, phases) => {
            fc.pre(taskIndex < tasks.length);
            fc.pre(tasks.length > 0);

            const task = tasks[taskIndex];
            if (!task) {
              return;
            }

            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            const updatedPlan = updatePlanWithPhases(plan, task.id, phases);

            const updatedTask = updatedPlan.tasks.find((t) => t.id === task.id);
            expect(updatedTask?.phases.length).toBe(phases.length);

            // Other tasks should be unchanged
            for (const t of updatedPlan.tasks) {
              if (t.id !== task.id) {
                expect(t.phases).toEqual([]);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should initialize all phases as pending", () => {
      fc.assert(
        fc.property(
          taskDefArb,
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (task, phases) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              [task],
              "2024-01-01T00:00:00.000Z"
            );

            const updatedPlan = updatePlanWithPhases(plan, task.id, phases);
            const updatedTask = updatedPlan.tasks[0];

            for (const phase of updatedTask?.phases ?? []) {
              expect(phase.status).toBe("pending");
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("updatePlanWithCriteria", () => {
    it("should add criteria to the correct task", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (tasks, taskIndex, criteria) => {
            fc.pre(taskIndex < tasks.length);
            fc.pre(tasks.length > 0);

            const task = tasks[taskIndex];
            if (!task) {
              return;
            }

            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            const updatedPlan = updatePlanWithCriteria(plan, task.id, criteria);

            const updatedTask = updatedPlan.tasks.find((t) => t.id === task.id);
            expect(updatedTask?.criteria.length).toBe(criteria.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should initialize all criteria as pending", () => {
      fc.assert(
        fc.property(
          taskDefArb,
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (task, criteria) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              [task],
              "2024-01-01T00:00:00.000Z"
            );

            const updatedPlan = updatePlanWithCriteria(plan, task.id, criteria);
            const updatedTask = updatedPlan.tasks[0];

            for (const criterion of updatedTask?.criteria ?? []) {
              expect(criterion.status).toBe("pending");
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("updatePhaseStatus", () => {
    it("should only update the specified phase", () => {
      fc.assert(
        fc.property(phaseStatusArb, (newStatus) => {
          const plan = createPlanFromTasks(
            "test-session",
            "Test task",
            [{ id: "1", title: "Task 1", description: "Description 1" }],
            "2024-01-01T00:00:00.000Z"
          );

          const withPhases = updatePlanWithPhases(plan, "1", [
            { id: "1.1", description: "Phase 1" },
            { id: "1.2", description: "Phase 2" },
          ]);

          const updated = updatePhaseStatus(withPhases, "1.1", newStatus);

          expect(updated.tasks[0]?.phases[0]?.status).toBe(newStatus);
          expect(updated.tasks[0]?.phases[1]?.status).toBe("pending");
        }),
        { numRuns: 20 }
      );
    });

    it("should preserve plan immutability", () => {
      fc.assert(
        fc.property(phaseStatusArb, (newStatus) => {
          const plan = createPlanFromTasks(
            "test-session",
            "Test task",
            [{ id: "1", title: "Task 1", description: "Description 1" }],
            "2024-01-01T00:00:00.000Z"
          );

          const withPhases = updatePlanWithPhases(plan, "1", [
            { id: "1.1", description: "Phase 1" },
          ]);

          const updated = updatePhaseStatus(withPhases, "1.1", newStatus);

          // Original plan should be unchanged
          expect(withPhases.tasks[0]?.phases[0]?.status).toBe("pending");
          // New plan should have the update
          expect(updated.tasks[0]?.phases[0]?.status).toBe(newStatus);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe("updateCriterionStatus", () => {
    it("should only update the specified criterion", () => {
      fc.assert(
        fc.property(criterionStatusArb, (newStatus) => {
          const plan = createPlanFromTasks(
            "test-session",
            "Test task",
            [{ id: "1", title: "Task 1", description: "Description 1" }],
            "2024-01-01T00:00:00.000Z"
          );

          const withCriteria = updatePlanWithCriteria(plan, "1", [
            { id: "1.c1", description: "Criterion 1" },
            { id: "1.c2", description: "Criterion 2" },
          ]);

          const updated = updateCriterionStatus(
            withCriteria,
            "1.c1",
            newStatus
          );

          expect(updated.tasks[0]?.criteria[0]?.status).toBe(newStatus);
          expect(updated.tasks[0]?.criteria[1]?.status).toBe("pending");
        }),
        { numRuns: 20 }
      );
    });
  });

  describe("markTaskCompleted", () => {
    it("should mark task as done with completion notes", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (summary) => {
          const plan = createPlanFromTasks(
            "test-session",
            "Test task",
            [
              { id: "1", title: "Task 1", description: "Description 1" },
              { id: "2", title: "Task 2", description: "Description 2" },
              { id: "3", title: "Task 3", description: "Description 3" },
            ],
            "2024-01-01T00:00:00.000Z"
          );

          const updated = markTaskCompleted(plan, "1", summary);

          expect(updated.tasks[0]?.status).toBe("done");
          expect(updated.tasks[0]?.completionNotes).toBe(summary);
          // Other tasks remain unchanged
          expect(updated.tasks[1]?.status).toBe("pending");
          expect(updated.tasks[2]?.status).toBe("pending");
        }),
        { numRuns: 20 }
      );
    });

    it("should not change already completed tasks", () => {
      const plan = createPlanFromTasks(
        "test-session",
        "Test task",
        [
          { id: "1", title: "Task 1", description: "Description 1" },
          { id: "2", title: "Task 2", description: "Description 2" },
        ],
        "2024-01-01T00:00:00.000Z"
      );

      // Complete first task
      const afterFirst = markTaskCompleted(plan, "1", "First done");

      // Complete second task
      const afterSecond = markTaskCompleted(afterFirst, "2", "Second done");

      // First task should still be done
      expect(afterSecond.tasks[0]?.status).toBe("done");
      expect(afterSecond.tasks[0]?.completionNotes).toBe("First done");
    });
  });

  describe("State machine invariants", () => {
    it("task count should never change after plan creation", () => {
      fc.assert(
        fc.property(
          fc.array(taskDefArb, { minLength: 1, maxLength: 10 }),
          (tasks) => {
            const plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            const initialCount = plan.tasks.length;

            // Apply various operations
            let current = plan;
            if (tasks[0]) {
              current = updatePlanWithPhases(current, tasks[0].id, [
                { id: "x.1", description: "Phase" },
              ]);
              current = updatePlanWithCriteria(current, tasks[0].id, [
                { id: "x.c1", description: "Criterion" },
              ]);
              current = markTaskCompleted(current, tasks[0].id, "Done");
            }

            expect(current.tasks.length).toBe(initialCount);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("plan metadata should be preserved across updates", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (sessionId, originalTask) => {
            const plan = createPlanFromTasks(
              sessionId,
              originalTask,
              [{ id: "1", title: "Task 1", description: "Description 1" }],
              "2024-01-01T00:00:00.000Z"
            );

            const updated = updatePlanWithPhases(plan, "1", [
              { id: "1.1", description: "Phase" },
            ]);

            expect(updated.sessionId).toBe(sessionId);
            expect(updated.originalTask).toBe(originalTask);
            expect(updated.createdAt).toBe(plan.createdAt);
            expect(updated.id).toBe(plan.id);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("markTaskCompleted only changes the specified task status", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (taskCount, completionCount) => {
            fc.pre(completionCount < taskCount);

            // Generate tasks with guaranteed unique IDs
            const tasks = Array.from({ length: taskCount }, (_, i) => ({
              id: String(i + 1),
              title: `Task ${i + 1}`,
              description: `Description ${i + 1}`,
            }));

            let plan = createPlanFromTasks(
              "test-session",
              "Test task",
              tasks,
              "2024-01-01T00:00:00.000Z"
            );

            // Complete some tasks
            for (let i = 0; i < completionCount; i++) {
              const task = plan.tasks[i];
              if (task && task.status !== "done") {
                plan = markTaskCompleted(plan, task.id, "Done");
              }
            }

            // Count completed tasks
            const doneCount = plan.tasks.filter(
              (t) => t.status === "done"
            ).length;

            // Should have exactly as many done tasks as we completed
            expect(doneCount).toBe(completionCount);

            // Remaining tasks should still be pending
            const pendingCount = plan.tasks.filter(
              (t) => t.status === "pending"
            ).length;
            expect(pendingCount).toBe(taskCount - completionCount);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
