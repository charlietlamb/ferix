import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "TasksDefined",
  format: (event) =>
    pc.magenta(
      `[TASKS] Defined ${event.tasks.length} tasks: ${event.tasks.map((t) => t.title).join(", ")}`
    ),
});

headlessFormatterRegistry.register({
  tag: "TaskCompleted",
  format: (event) =>
    pc.green(`[TASK] Completed: ${event.taskId} - ${event.summary}`),
});
