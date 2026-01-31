import { Context, type Effect } from "effect";
import type { PlanStoreError } from "../domain/errors.js";
import type { Plan, PlanId } from "../domain/index.js";

/**
 * Service interface for plan persistence.
 *
 * Plans are stored per session at `.ferix/plans/:sessionId/task-N.md`.
 * Each task gets its own file that is updated across iterations.
 *
 * Implementations include:
 * - FileSystem: Persists to `.ferix/plans/` directory
 * - Memory: In-memory storage for testing
 *
 * @example
 * ```typescript
 * const planStore = yield* PlanStore;
 *
 * // Create a new plan
 * const planId = yield* planStore.create(sessionId, plan);
 *
 * // Update after iteration
 * yield* planStore.update(planId, updatedPlan);
 *
 * // Load existing plan
 * const plan = yield* planStore.load(planId);
 * ```
 */
export interface PlanStoreService {
  /**
   * Create a new plan for a session.
   *
   * @param sessionId - Session this plan belongs to
   * @param plan - Plan to persist
   * @returns The generated plan ID
   */
  readonly create: (
    sessionId: string,
    plan: Omit<Plan, "id">
  ) => Effect.Effect<PlanId, PlanStoreError>;

  /**
   * Load a plan by ID.
   *
   * @param planId - ID of the plan to load
   * @param sessionId - Optional session ID for O(1) lookup. If not provided, searches all sessions.
   * @returns The loaded plan
   */
  readonly load: (
    planId: PlanId,
    sessionId?: string
  ) => Effect.Effect<Plan, PlanStoreError>;

  /**
   * Update an existing plan.
   *
   * @param planId - ID of the plan to update
   * @param plan - Updated plan data
   */
  readonly update: (
    planId: PlanId,
    plan: Plan
  ) => Effect.Effect<void, PlanStoreError>;

  /**
   * List all plans for a session.
   *
   * @param sessionId - Session to list plans for
   * @returns Array of plan IDs
   */
  readonly list: (
    sessionId: string
  ) => Effect.Effect<readonly PlanId[], PlanStoreError>;
}

/**
 * Effect Tag for the PlanStore service.
 *
 * Use this tag to depend on plan storage without coupling to a specific backend.
 */
export class PlanStore extends Context.Tag("@ferix/PlanStore")<
  PlanStore,
  PlanStoreService
>() {}
