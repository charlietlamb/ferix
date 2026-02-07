import { hidden, toolUseLine } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Tool use line handler.
 * Matches lines like "▸ Read file.ts" and styles them with tool-specific colors.
 */
tagRendererRegistry.register({
  pattern: /^▸ (\w+)(?: (.+))?$/g,
  render: (m, w) => toolUseLine(m[1] ?? "", m[2] ?? "", w),
});

/**
 * Hide standalone arrow lines (partial tool output).
 * These are fragments from the LLM's text that should be hidden.
 */
tagRendererRegistry.register({
  pattern: /^▸\s*$/g,
  render: () => hidden(),
});

/**
 * Hide standalone tool name lines (partial tool output).
 * Matches known tool names on their own line.
 */
tagRendererRegistry.register({
  pattern:
    /^\s*(Read|Write|Edit|Glob|Grep|Bash|Task|WebFetch|WebSearch|NotebookEdit|AskUserQuestion|Skill|mcp__\w+)\s*$/g,
  render: () => hidden(),
});

/**
 * Hide continuation markers (partial output from LLM thinking).
 */
tagRendererRegistry.register({
  pattern: /^\s*\.\.\.\s*$/g,
  render: () => hidden(),
});

/**
 * Hide standalone path fragments following tool names.
 * Matches lines that are just indented paths starting with / or ./
 */
tagRendererRegistry.register({
  pattern: /^\s+[./][\w/.-]+\s*$/g,
  render: () => hidden(),
});

/**
 * Hide lines that are only tree/box drawing characters (no text).
 * These are fragments from failed pattern matching.
 * Matches: "  ├ ", "├ ○", "  └", etc.
 * Requires at least one tree character to avoid matching whitespace-only.
 */
tagRendererRegistry.register({
  pattern: /^\s*[├└│─┬┴┼○●◆◇][├└│─┬┴┼○●◆◇\s]*$/g,
  render: () => hidden(),
});

/**
 * Hide standalone ID fragments like [1.c1] or [1.1] on their own line.
 * These appear when multiline tag content is split across lines.
 */
tagRendererRegistry.register({
  pattern: /^\s*\[\d+\.[a-z]?\d*\]\s*$/gi,
  render: () => hidden(),
});
