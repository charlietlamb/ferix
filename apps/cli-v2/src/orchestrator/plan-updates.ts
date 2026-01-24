import { Effect, Ref } from "effect";
import type { DomainEvent } from "../domain/events.js";
import type { Plan } from "../domain/plan.js";
import type { Signal } from "../domain/signals.js";
import type { PlanStoreService } from "../services/plan-store.js";

export type {
  PlanUpdateHandler,
  PlanUpdateRegistry,
  PlanUpdateResult,
} from "./plan-updates/index.js";
// Re-export from the new registry-based implementation
export {
  computePlanUpdate,
  createPlanFromTasks,
  markTaskCompleted,
  planUpdateRegistry,
  updateCriterionStatus,
  updatePhaseStatus,
  updatePlanWithCriteria,
  updatePlanWithPhases,
} from "./plan-updates/index.js";

// Import for local use
import { computePlanUpdate } from "./plan-updates/index.js";

/**
 * State for tracking pending plan persistence.
 */
export interface PlanPersistenceState {
  readonly dirty: boolean;
  readonly pendingOperation: "create" | "update" | null;
}

/**
 * Helper to persist a plan update and emit appropriate events.
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

    yield* Ref.set(currentPlanRef, plan);

    yield* Ref.update(persistenceStateRef, (state) => ({
      dirty: true,
      pendingOperation:
        state.pendingOperation === "create" ? "create" : operation,
    }));

    return [{ _tag: eventTag, plan } as DomainEvent];
  });
}

/**
 * Persists the current plan if dirty and returns any failure events.
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

    yield* Ref.set(persistenceStateRef, {
      dirty: false,
      pendingOperation: null,
    });

    return events;
  });
}
