import { createPlanFromTasks } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "TasksDefined",
  handle: (signal, _currentPlan, sessionId, originalTask) => ({
    plan: createPlanFromTasks(sessionId, originalTask, signal.tasks),
    operation: "create",
    eventTag: "PlanCreated",
  }),
});
