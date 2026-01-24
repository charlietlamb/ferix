// Import all handlers to register them
import "./handlers/completion.js";
import "./handlers/criteria.js";
import "./handlers/phases.js";
import "./handlers/review.js";
import "./handlers/tasks.js";
import "./handlers/tools.js";

export type { TagHandler, TagRendererRegistry } from "./registry.js";
// Re-export registry
export { tagRendererRegistry } from "./registry.js";

// Re-export the main function for styling tags
export function styleFerixTags(line: string, width: number): string {
  // Import lazily to ensure handlers are registered first
  const { tagRendererRegistry: registry } = require("./registry.js") as {
    tagRendererRegistry: { style: (line: string, width: number) => string };
  };
  return registry.style(line, width);
}
