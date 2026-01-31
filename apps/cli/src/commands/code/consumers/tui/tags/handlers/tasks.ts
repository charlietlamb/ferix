import {
  taskDone,
  taskLine,
  taskListFooter,
  taskListHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Task list boundaries
tagRendererRegistry.register({
  pattern: /<ferix:tasks>/g,
  render: (_, w) => taskListHeader(w),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:tasks>/g,
  render: () => taskListFooter(),
});

// Individual task
tagRendererRegistry.register({
  pattern: /<task id="(\d+)">([^<]+)<\/task>/g,
  render: (m) => taskLine(m[1] ?? "", m[2] ?? ""),
});

tagRendererRegistry.register({
  pattern: /<ferix:task-done id="(\d+)"\/>/g,
  render: (m) => taskDone(m[1] ?? ""),
});
