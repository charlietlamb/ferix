import { createPlanFromTasks } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "TasksDefined",
  handle: (signal, _currentPlan, context) => {
    // Tasks are already filtered at the event mapping layer (signal-to-domain.ts)
    // If no tasks remain, don't create a plan
    if (signal.tasks.length === 0) {
      return undefined;
    }

    return {
      plan: createPlanFromTasks(
        context.sessionId,
        context.originalTask,
        signal.tasks,
        context.timestamp
      ),
      operation: "create",
      eventTag: "PlanCreated",
    };
  },
});
