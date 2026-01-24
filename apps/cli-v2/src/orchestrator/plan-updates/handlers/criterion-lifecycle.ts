import { updateCriterionStatus } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

// Criterion passed
planUpdateRegistry.register({
  tag: "CriterionPassed",
  handle: (signal, currentPlan, _context) =>
    currentPlan
      ? {
          plan: updateCriterionStatus(
            currentPlan,
            signal.criterionId,
            "passed"
          ),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});

// Criterion failed
planUpdateRegistry.register({
  tag: "CriterionFailed",
  handle: (signal, currentPlan, _context) =>
    currentPlan
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
      : undefined,
});
