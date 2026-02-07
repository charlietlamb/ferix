import { guardrailLine, learningLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Learning line handler.
 * Renders learning events with info styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:learning category="([^"]*)">([\s\S]*?)<\/ferix:learning>/g,
  render: (m, w) => learningLine(m[1] ?? "", m[2] ?? "", w),
});

/**
 * Guardrail line handler.
 * Renders guardrail events with severity-based styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:guardrail severity="([^"]*)">([\s\S]*?)<\/ferix:guardrail>/g,
  render: (m, w) => guardrailLine(m[1] ?? "", m[2] ?? "", w),
});
