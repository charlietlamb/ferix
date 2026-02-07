import { iterationSeparator } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Iteration separator handler.
 * Renders a visual separator between iterations.
 */
tagRendererRegistry.register({
  pattern: /<ferix:iteration n="([^"]+)" max="([^"]+)"\/>/g,
  render: (m, w) => iterationSeparator(m[1] ?? "", m[2] ?? "", w),
});
