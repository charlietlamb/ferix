import pc from "picocolors";
import type {
  TaskCompletedEvent,
  TasksDefinedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const tasksDefinedFormatter: EventFormatter<"TasksDefined"> = {
  tag: "TasksDefined",
  format: (event: TasksDefinedEvent) =>
    pc.magenta(
      `[TASKS] Defined ${event.tasks.length} tasks: ${event.tasks.map((t: { title: string }) => t.title).join(", ")}`
    ),
};

const taskCompletedFormatter: EventFormatter<"TaskCompleted"> = {
  tag: "TaskCompleted",
  format: (event: TaskCompletedEvent) =>
    pc.green(`[TASK] Completed: ${event.taskId} - ${event.summary}`),
};

headlessFormatterRegistry.register(tasksDefinedFormatter);
headlessFormatterRegistry.register(taskCompletedFormatter);
