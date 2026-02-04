import { errorLine, hidden } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Error line handler.
 * Renders error messages with styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:error>([^<]+)<\/ferix:error>/g,
  render: (m, w) => errorLine(m[1] ?? "", w),
});

/**
 * Task completion opening tag handler.
 * Hidden - the signal is processed elsewhere.
 */
tagRendererRegistry.register({
  pattern: /<ferix:task-complete id="(\d+)">/g,
  render: () => hidden(),
});

/**
 * Summary tag handler.
 * Hidden - the summary content is not displayed inline.
 */
tagRendererRegistry.register({
  pattern: /<summary>([^<]*)<\/summary>/g,
  render: () => hidden(),
});

/**
 * Files modified tag handler.
 * Hidden - the file list is not displayed inline.
 */
tagRendererRegistry.register({
  pattern: /<files-modified>([^<]*)<\/files-modified>/g,
  render: () => hidden(),
});

/**
 * Files created tag handler.
 * Hidden - the file list is not displayed inline.
 */
tagRendererRegistry.register({
  pattern: /<files-created>([^<]*)<\/files-created>/g,
  render: () => hidden(),
});

/**
 * Task completion closing tag handler.
 * Hidden - the signal is processed elsewhere.
 */
tagRendererRegistry.register({
  pattern: /<\/ferix:task-complete>/g,
  render: () => hidden(),
});
