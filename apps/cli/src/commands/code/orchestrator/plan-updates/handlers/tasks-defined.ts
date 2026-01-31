import { createPlanFromTasks, isVerificationTask } from "../helpers.js";
import { planUpdateRegistry } from "../registry.js";

planUpdateRegistry.register({
  tag: "TasksDefined",
  handle: (signal, _currentPlan, context) => {
    // Filter out verification tasks - these are handled automatically by the orchestrator
    const filteredTasks = signal.tasks.filter(
      (task) => !isVerificationTask(task.title)
    );

    // If all tasks were filtered out, don't create a plan
    if (filteredTasks.length === 0) {
      return undefined;
    }

    return {
      plan: createPlanFromTasks(
        context.sessionId,
        context.originalTask,
        filteredTasks,
        context.timestamp
      ),
      operation: "create",
      eventTag: "PlanCreated",
    };
  },
});
