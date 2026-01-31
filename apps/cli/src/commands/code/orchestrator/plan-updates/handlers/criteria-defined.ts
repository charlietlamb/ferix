import { updatePlanWithCriteria } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "CriteriaDefined",
  handle: (signal, currentPlan, _context) =>
    currentPlan
      ? {
          plan: updatePlanWithCriteria(
            currentPlan,
            signal.taskId,
            signal.criteria
          ),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});
