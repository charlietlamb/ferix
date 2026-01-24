import { createPlanFromTasks } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "TasksDefined",
  handle: (signal, _currentPlan, context) => ({
    plan: createPlanFromTasks(
      context.sessionId,
      context.originalTask,
      signal.tasks,
      context.timestamp
    ),
    operation: "create",
    eventTag: "PlanCreated",
  }),
});
