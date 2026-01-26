import { toolUseLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Tool use line (>> ToolName detail)
tagRendererRegistry.register({
  pattern: /^>> (\w+)(?: (.+))?$/g,
  render: (m) => toolUseLine(m[1] ?? "", m[2] ?? ""),
});
