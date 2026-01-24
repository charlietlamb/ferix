import { updatePlanWithPhases } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "PhasesDefined",
  handle: (signal, currentPlan) =>
    currentPlan
      ? {
          plan: updatePlanWithPhases(currentPlan, signal.taskId, signal.phases),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});
