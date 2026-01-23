import { Effect, Ref } from "effect";
import type { DomainEvent } from "../domain/events.js";
import { type Plan, PlanId, type Task } from "../domain/plan.js";
import type { Signal } from "../domain/signals.js";
import type { PlanStoreService } from "../services/plan-store.js";

/**
 * Creates a Plan from tasks defined by the LLM.
 */
export function createPlanFromTasks(
  sessionId: string,
  originalTask: string,
  tasks: readonly { id: string; title: string; description: string }[]
): Plan {
  return {
    id: PlanId(`${sessionId}-plan`),
    sessionId,
    createdAt: new Date().toISOString(),
    originalTask,
    tasks: tasks.map(
      (t): Task => ({
        ...t,
        status: "pending",
        phases: [],
        criteria: [],
        filesToModify: [],
        attempts: 0,
      })
    ),
  };
}

/**
 * Updates a plan with new phase information for a task.
 * Uses O(1) task lookup via findIndex.
 */
export function updatePlanWithPhases(
  plan: Plan,
  taskId: string,
  phases: readonly { id: string; description: string }[]
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    phases: phases.map((p) => ({
      id: p.id,
      description: p.description,
      status: "pending" as const,
    })),
  };
  return { ...plan, tasks: updatedTasks };
}

/**
 * Updates a plan with new criteria information for a task.
 * Uses O(1) task lookup via findIndex.
 */
export function updatePlanWithCriteria(
  plan: Plan,
  taskId: string,
  criteria: readonly { id: string; description: string }[]
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    criteria: criteria.map((c) => ({
      id: c.id,
      description: c.description,
      status: "pending" as const,
    })),
  };
  return { ...plan, tasks: updatedTasks };
}

/**
 * Extracts the task ID from a phase ID.
 * Phase IDs follow the pattern "taskId.phaseNumber" (e.g., "1.1", "2.3").
 */
function getTaskIdFromPhaseId(phaseId: string): string {
  const dotIndex = phaseId.indexOf(".");
  return dotIndex !== -1 ? phaseId.substring(0, dotIndex) : phaseId;
}

/**
 * Extracts the task ID from a criterion ID.
 * Criterion IDs follow the pattern "taskId.cX" (e.g., "1.c1", "2.c2").
 */
function getTaskIdFromCriterionId(criterionId: string): string {
  const dotIndex = criterionId.indexOf(".");
  return dotIndex !== -1 ? criterionId.substring(0, dotIndex) : criterionId;
}

/**
 * Updates a phase status in the plan.
 * Uses O(1) task lookup via phase ID prefix.
 */
export function updatePhaseStatus(
  plan: Plan,
  phaseId: string,
  status: "pending" | "in_progress" | "done" | "failed"
): Plan {
  const taskId = getTaskIdFromPhaseId(phaseId);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const task = plan.tasks[taskIndex];
  if (!task) {
    return plan;
  }

  const phaseIndex = task.phases.findIndex((p) => p.id === phaseId);
  if (phaseIndex === -1) {
    return plan;
  }

  const existingPhase = task.phases[phaseIndex];
  if (!existingPhase) {
    return plan;
  }

  const updatedPhases = [...task.phases];
  updatedPhases[phaseIndex] = {
    id: existingPhase.id,
    description: existingPhase.description,
    status,
  };

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = { ...task, phases: updatedPhases };

  return { ...plan, tasks: updatedTasks };
}

/**
 * Updates a criterion status in the plan.
 * Uses O(1) task lookup via criterion ID prefix.
 */
export function updateCriterionStatus(
  plan: Plan,
  criterionId: string,
  status: "pending" | "passed" | "failed",
  failureReason?: string
): Plan {
  const taskId = getTaskIdFromCriterionId(criterionId);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const task = plan.tasks[taskIndex];
  if (!task) {
    return plan;
  }

  const criterionIndex = task.criteria.findIndex((c) => c.id === criterionId);
  if (criterionIndex === -1) {
    return plan;
  }

  const existingCriterion = task.criteria[criterionIndex];
  if (!existingCriterion) {
    return plan;
  }

  const updatedCriteria = [...task.criteria];
  updatedCriteria[criterionIndex] = {
    id: existingCriterion.id,
    description: existingCriterion.description,
    status,
    failureReason,
  };

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = { ...task, criteria: updatedCriteria };

  return { ...plan, tasks: updatedTasks };
}

/**
 * Marks a task as completed in the plan.
 * Uses O(1) task lookup via findIndex.
 */
export function markTaskCompleted(
  plan: Plan,
  taskId: string,
  summary: string
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    status: "done" as const,
    completionNotes: summary,
  };
  return { ...plan, tasks: updatedTasks };
}

/**
 * Result of computing a plan update from a signal.
 */
export interface PlanUpdateResult {
  readonly plan: Plan;
  readonly operation: "create" | "update";
  readonly eventTag: "PlanCreated" | "PlanUpdated";
}

/**
 * Computes a plan update for a given signal.
 * Returns undefined if the signal doesn't require a plan update or can't be processed.
 */
export function computePlanUpdate(
  signal: Signal,
  currentPlan: Plan | undefined,
  sessionId: string,
  originalTask: string
): PlanUpdateResult | undefined {
  switch (signal._tag) {
    case "TasksDefined":
      return {
        plan: createPlanFromTasks(sessionId, originalTask, signal.tasks),
        operation: "create",
        eventTag: "PlanCreated",
      };

    case "PhasesDefined":
      return currentPlan
        ? {
            plan: updatePlanWithPhases(
              currentPlan,
              signal.taskId,
              signal.phases
            ),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "CriteriaDefined":
      return currentPlan
        ? {
            plan: updatePlanWithCriteria(
              currentPlan,
              signal.taskId,
              signal.criteria
            ),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "PhaseStarted":
      return currentPlan
        ? {
            plan: updatePhaseStatus(currentPlan, signal.phaseId, "in_progress"),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "PhaseCompleted":
      return currentPlan
        ? {
            plan: updatePhaseStatus(currentPlan, signal.phaseId, "done"),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "PhaseFailed":
      return currentPlan
        ? {
            plan: updatePhaseStatus(currentPlan, signal.phaseId, "failed"),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "CriterionPassed":
      return currentPlan
        ? {
            plan: updateCriterionStatus(
              currentPlan,
              signal.criterionId,
              "passed"
            ),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "CriterionFailed":
      return currentPlan
        ? {
            plan: updateCriterionStatus(
              currentPlan,
              signal.criterionId,
              "failed",
              signal.reason
            ),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    case "TaskComplete":
      return currentPlan
        ? {
            plan: markTaskCompleted(currentPlan, signal.taskId, signal.summary),
            operation: "update",
            eventTag: "PlanUpdated",
          }
        : undefined;

    default:
      return undefined;
  }
}

/**
 * State for tracking pending plan persistence.
 */
export interface PlanPersistenceState {
  /**
   * Whether the plan was modified and needs persistence.
   */
  readonly dirty: boolean;
  /**
   * The operation type if a create is pending (takes precedence over update).
   */
  readonly pendingOperation: "create" | "update" | null;
}

/**
 * Helper to persist a plan update and emit appropriate events.
 * Returns a failure event if persistence fails instead of silently swallowing the error.
 */
export function persistPlanUpdate(
  planStore: PlanStoreService,
  plan: Plan,
  operation: "create" | "update"
): Effect.Effect<DomainEvent | null, never, never> {
  const storeOp =
    operation === "create"
      ? planStore.create(plan.sessionId, {
          sessionId: plan.sessionId,
          createdAt: plan.createdAt,
          originalTask: plan.originalTask,
          tasks: plan.tasks,
        })
      : planStore.update(plan.id, plan);

  return storeOp.pipe(
    Effect.map(() => null),
    Effect.catchAll((error) =>
      Effect.succeed({
        _tag: "PlanUpdateFailed" as const,
        operation,
        error: error.message,
        planId: plan.id,
      })
    )
  );
}

/**
 * Updates plan state based on a signal and returns any generated events.
 * Does NOT persist immediately - updates are batched until end of iteration.
 * Uses persistenceStateRef to track dirty state for batched persistence.
 */
export function updatePlanFromSignal(
  currentPlanRef: Ref.Ref<Plan | undefined>,
  persistenceStateRef: Ref.Ref<PlanPersistenceState>,
  signal: Signal,
  sessionId: string,
  originalTask: string
): Effect.Effect<DomainEvent[], never, never> {
  return Effect.gen(function* () {
    const currentPlan = yield* Ref.get(currentPlanRef);
    const updateResult = computePlanUpdate(
      signal,
      currentPlan,
      sessionId,
      originalTask
    );

    if (!updateResult) {
      return [];
    }

    const { plan, operation, eventTag } = updateResult;

    // Update in-memory state
    yield* Ref.set(currentPlanRef, plan);

    // Mark as dirty for batched persistence
    yield* Ref.update(persistenceStateRef, (state) => ({
      dirty: true,
      // "create" takes precedence - if we need to create, keep that
      pendingOperation:
        state.pendingOperation === "create" ? "create" : operation,
    }));

    return [{ _tag: eventTag, plan } as DomainEvent];
  });
}

/**
 * Persists the current plan if dirty and returns any failure events.
 * Called at the end of each iteration to batch all persistence operations.
 */
export function flushPlanPersistence(
  planStore: PlanStoreService,
  currentPlanRef: Ref.Ref<Plan | undefined>,
  persistenceStateRef: Ref.Ref<PlanPersistenceState>
): Effect.Effect<DomainEvent[], never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(persistenceStateRef);

    if (!(state.dirty && state.pendingOperation)) {
      return [];
    }

    const plan = yield* Ref.get(currentPlanRef);
    if (!plan) {
      return [];
    }

    const events: DomainEvent[] = [];

    const failureEvent = yield* persistPlanUpdate(
      planStore,
      plan,
      state.pendingOperation
    );
    if (failureEvent) {
      events.push(failureEvent);
    }

    // Reset persistence state
    yield* Ref.set(persistenceStateRef, {
      dirty: false,
      pendingOperation: null,
    });

    return events;
  });
}
