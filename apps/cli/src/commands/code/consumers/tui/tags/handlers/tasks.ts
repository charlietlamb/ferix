import {
  taskDone,
  taskLine,
  taskListFooter,
  taskListHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Task list header handler.
 * Renders the opening of a task list section.
 */
tagRendererRegistry.register({
  pattern: /<ferix:tasks>/g,
  render: (_, w) => taskListHeader(w),
});

/**
 * Task list footer handler.
 * Renders the closing of a task list section.
 */
tagRendererRegistry.register({
  pattern: /<\/ferix:tasks>/g,
  render: (_, w) => taskListFooter(w),
});

/**
 * Individual task handler.
 * Renders a task with its ID and description.
 */
tagRendererRegistry.register({
  pattern: /<task id="(\d+)">([^<]+)<\/task>/g,
  render: (m, w) => taskLine(m[1] ?? "", m[2] ?? "", w),
});

/**
 * Task done handler.
 * Renders a completion marker for a task.
 */
tagRendererRegistry.register({
  pattern: /<ferix:task-done id="(\d+)"\/>/g,
  render: (m) => taskDone(m[1] ?? ""),
});
