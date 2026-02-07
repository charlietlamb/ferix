import { branchPushedLine, prCreatedLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Branch pushed handler.
 * Renders branch push event with git styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:branch-pushed>([^<]+)<\/ferix:branch-pushed>/g,
  render: (m, w) => branchPushedLine(m[1] ?? "", w),
});

/**
 * PR created handler.
 * Renders PR creation event with link styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:pr-created>([^<]+)<\/ferix:pr-created>/g,
  render: (m, w) => prCreatedLine(m[1] ?? "", w),
});
