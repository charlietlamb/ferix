import { Effect, Layer, Ref } from "effect";
import { PlanStoreError } from "../../domain/errors.js";
import { type Plan, PlanId } from "../../domain/index.js";
import { PlanStore, type PlanStoreService } from "../../services/plan-store.js";

/**
 * In-memory store type.
 */
type PlanStoreState = Map<string, Map<PlanId, Plan>>;

/**
 * Creates an in-memory plan store service.
 *
 * Useful for testing without file system access.
 */
function createMemoryPlanStore(
  stateRef: Ref.Ref<PlanStoreState>
): PlanStoreService {
  return {
    create: (
      sessionId: string,
      plan: Omit<Plan, "id">
    ): Effect.Effect<PlanId, PlanStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);

        if (!state.has(sessionId)) {
          state.set(sessionId, new Map());
        }

        const sessionPlans = state.get(sessionId);
        if (!sessionPlans) {
          throw new Error("Session plans map should exist after set");
        }
        const planId = PlanId(`task-${sessionPlans.size + 1}`);
        const fullPlan: Plan = { ...plan, id: planId };

        sessionPlans.set(planId, fullPlan);
        yield* Ref.set(stateRef, state);

        return planId;
      }),

    load: (
      planId: PlanId,
      sessionId?: string
    ): Effect.Effect<Plan, PlanStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);

        // O(1) lookup if sessionId is provided
        if (sessionId) {
          const sessionPlans = state.get(sessionId);
          const plan = sessionPlans?.get(planId);
          if (plan) {
            return plan;
          }
          return yield* Effect.fail(
            new PlanStoreError({
              message: `Plan not found: ${planId}`,
              operation: "load",
            })
          );
        }

        // Fallback to O(n) scan
        for (const sessionPlans of state.values()) {
          const plan = sessionPlans.get(planId);
          if (plan) {
            return plan;
          }
        }

        return yield* Effect.fail(
          new PlanStoreError({
            message: `Plan not found: ${planId}`,
            operation: "load",
          })
        );
      }),

    update: (planId: PlanId, plan: Plan): Effect.Effect<void, PlanStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const sessionPlans = state.get(plan.sessionId);

        if (!sessionPlans) {
          return yield* Effect.fail(
            new PlanStoreError({
              message: `Session not found: ${plan.sessionId}`,
              operation: "update",
            })
          );
        }

        sessionPlans.set(planId, plan);
        yield* Ref.set(stateRef, state);
      }),

    list: (
      sessionId: string
    ): Effect.Effect<readonly PlanId[], PlanStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const sessionPlans = state.get(sessionId);

        if (!sessionPlans) {
          return [];
        }

        return Array.from(sessionPlans.keys());
      }),
  };
}

/**
 * Creates a Layer for an in-memory plan store.
 *
 * Each call creates a new isolated store.
 *
 * @example
 * ```typescript
 * const testLayer = MemoryPlan.layer();
 *
 * const program = Effect.gen(function* () {
 *   const planStore = yield* PlanStore;
 *   const planId = yield* planStore.create(sessionId, plan);
 *   return planId;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
export function layer(): Layer.Layer<PlanStore> {
  return Layer.effect(
    PlanStore,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make<PlanStoreState>(new Map());
      return createMemoryPlanStore(stateRef);
    })
  );
}

/**
 * Default Live Layer for in-memory plan store.
 *
 * Note: State is shared across all uses of this layer.
 * For isolated testing, use `MemoryPlan.layer()` instead.
 */
export const Live = layer();

/**
 * MemoryPlan namespace containing the Live layer and factory.
 */
export const MemoryPlan = {
  Live,
  layer,
} as const;
