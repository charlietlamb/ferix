import { markTaskCompleted } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "TaskComplete",
  handle: (signal, currentPlan) =>
    currentPlan
      ? {
          plan: markTaskCompleted(currentPlan, signal.taskId, signal.summary),
          operation: "update",
          eventTag: "PlanUpdated",
        }
      : undefined,
});
