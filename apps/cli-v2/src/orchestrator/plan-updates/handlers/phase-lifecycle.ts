import { updatePhaseStatus } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

// Phase started
planUpdateRegistry.register({
  tag: "PhaseStarted",
  handle: (signal, currentPlan) =>
    currentPlan
      ? {
          plan: updatePhaseStatus(currentPlan, signal.phaseId, "in_progress"),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});

// Phase completed
planUpdateRegistry.register({
  tag: "PhaseCompleted",
  handle: (signal, currentPlan) =>
    currentPlan
      ? {
          plan: updatePhaseStatus(currentPlan, signal.phaseId, "done"),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});

// Phase failed
planUpdateRegistry.register({
  tag: "PhaseFailed",
  handle: (signal, currentPlan) =>
    currentPlan
      ? {
          plan: updatePhaseStatus(currentPlan, signal.phaseId, "failed"),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});
