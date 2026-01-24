import type { Plan, Signal } from "../../domain/index.js";

/**
 * Context passed to plan update handlers.
 */
export interface PlanUpdateContext {
  readonly sessionId: string;
  readonly originalTask: string;
  readonly timestamp: string;
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
 * Handler for plan updates from signals.
 */
export interface PlanUpdateHandler<T extends Signal["_tag"]> {
  readonly tag: T;
  readonly handle: (
    signal: Extract<Signal, { _tag: T }>,
    currentPlan: Plan | undefined,
    context: PlanUpdateContext
  ) => PlanUpdateResult | undefined;
}

/**
 * Registry for plan update handlers.
 */
export interface PlanUpdateRegistry {
  register<T extends Signal["_tag"]>(handler: PlanUpdateHandler<T>): void;
  computeUpdate(
    signal: Signal,
    currentPlan: Plan | undefined,
    context: PlanUpdateContext
  ): PlanUpdateResult | undefined;
}

/**
 * Creates the plan update registry.
 */
export function createPlanUpdateRegistry(): PlanUpdateRegistry {
  const handlers = new Map<
    string,
    (
      signal: Signal,
      currentPlan: Plan | undefined,
      context: PlanUpdateContext
    ) => PlanUpdateResult | undefined
  >();

  return {
    register<T extends Signal["_tag"]>(handler: PlanUpdateHandler<T>) {
      handlers.set(
        handler.tag,
        handler.handle as (
          signal: Signal,
          currentPlan: Plan | undefined,
          context: PlanUpdateContext
        ) => PlanUpdateResult | undefined
      );
    },

    computeUpdate(
      signal: Signal,
      currentPlan: Plan | undefined,
      context: PlanUpdateContext
    ): PlanUpdateResult | undefined {
      const handler = handlers.get(signal._tag);
      return handler?.(signal, currentPlan, context);
    },
  };
}

// Singleton registry instance
export const planUpdateRegistry = createPlanUpdateRegistry();
