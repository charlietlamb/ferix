// Import handlers to register them
import "./handlers/criteria-defined.js";
import "./handlers/criterion-lifecycle.js";
import "./handlers/phase-lifecycle.js";
import "./handlers/phases-defined.js";
import "./handlers/task-complete.js";
import "./handlers/tasks-defined.js";

// Re-export helpers
export {
  createPlanFromTasks,
  markTaskCompleted,
  updateCriterionStatus,
  updatePhaseStatus,
  updatePlanWithCriteria,
  updatePlanWithPhases,
} from "./helpers.js";
export type {
  PlanUpdateContext,
  PlanUpdateHandler,
  PlanUpdateRegistry,
  PlanUpdateResult,
} from "./registry.js";
// Re-export registry and types
export { planUpdateRegistry } from "./registry.js";

// Re-export convenience function
import type { Plan, Signal } from "../../domain/index.js";
import type { PlanUpdateContext } from "./registry.js";
import { planUpdateRegistry } from "./registry.js";

/**
 * Computes a plan update for a given signal.
 * Returns undefined if the signal doesn't require a plan update or can't be processed.
 */
export function computePlanUpdate(
  signal: Signal,
  currentPlan: Plan | undefined,
  context: PlanUpdateContext
) {
  return planUpdateRegistry.computeUpdate(signal, currentPlan, context);
}
