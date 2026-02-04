import { toolUseLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Tool use line handler.
 * Matches lines like "▸ Read file.ts" and styles them with tool-specific colors.
 */
tagRendererRegistry.register({
  pattern: /^▸ (\w+)(?: (.+))?$/g,
  render: (m, w) => toolUseLine(m[1] ?? "", m[2] ?? "", w),
});
