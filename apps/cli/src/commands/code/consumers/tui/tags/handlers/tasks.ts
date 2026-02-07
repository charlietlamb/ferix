import { hidden, taskDone } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Task list header handler.
 * Hidden - tasks are rendered from state via task-block marker.
 */
tagRendererRegistry.register({
  pattern: /<ferix:tasks>/g,
  render: () => hidden(),
});

/**
 * Task list footer handler.
 * Hidden - tasks are rendered from state via task-block marker.
 */
tagRendererRegistry.register({
  pattern: /<\/ferix:tasks>/g,
  render: () => hidden(),
});

/**
 * Individual task handler.
 * Hidden - tasks are rendered from state via task-block marker.
 * Uses [\s\S]*? to match multiline content.
 */
tagRendererRegistry.register({
  pattern: /<task id="(\d+)">[\s\S]*?<\/task>/g,
  render: () => hidden(),
});

/**
 * Task-block marker handler.
 * Returns a special marker that LogsView detects to render tasks from state.
 * The marker text "__TASK_BLOCK__" is detected by LogsView.
 */
tagRendererRegistry.register({
  pattern: /<ferix:task-block\/>/g,
  render: () => [{ text: "__TASK_BLOCK__" }],
});

/**
 * Task done handler.
 * Renders a completion marker for a task.
 */
tagRendererRegistry.register({
  pattern: /<ferix:task-done id="(\d+)"\/>/g,
  render: (m) => taskDone(m[1] ?? ""),
});
