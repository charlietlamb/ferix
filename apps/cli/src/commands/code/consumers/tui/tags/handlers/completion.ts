import { errorLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Error line
tagRendererRegistry.register({
  pattern: /<ferix:error>([^<]+)<\/ferix:error>/g,
  render: (m) => errorLine(m[1] ?? ""),
});

// Task completion (multi-line tag - hide all parts since signal is processed elsewhere)
tagRendererRegistry.register({
  pattern: /<ferix:task-complete id="(\d+)">/g,
  render: () => "",
});

tagRendererRegistry.register({
  pattern: /<summary>([^<]*)<\/summary>/g,
  render: () => "",
});

tagRendererRegistry.register({
  pattern: /<files-modified>([^<]*)<\/files-modified>/g,
  render: () => "",
});

tagRendererRegistry.register({
  pattern: /<files-created>([^<]*)<\/files-created>/g,
  render: () => "",
});

tagRendererRegistry.register({
  pattern: /<\/ferix:task-complete>/g,
  render: () => "",
});
