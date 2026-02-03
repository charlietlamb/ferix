import {
  criteriaHeader,
  criterionFailed,
  criterionLine,
  criterionPassed,
  hidden,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Criteria header handler.
 * Renders the opening of a criteria section.
 */
tagRendererRegistry.register({
  pattern: /<ferix:criteria task="(\d+)">/g,
  render: (m) => criteriaHeader(m[1] ?? ""),
});

/**
 * Criteria closing tag handler.
 * Hidden - the closing tag is not displayed.
 */
tagRendererRegistry.register({
  pattern: /<\/ferix:criteria>/g,
  render: () => hidden(),
});

/**
 * Individual criterion handler.
 * Renders a criterion with its ID and description.
 */
tagRendererRegistry.register({
  pattern: /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
  render: (m) => criterionLine(m[1] ?? "", m[2] ?? ""),
});

/**
 * Criterion passed handler.
 * Renders a success marker when a criterion passes.
 */
tagRendererRegistry.register({
  pattern: /<ferix:criterion-passed id="([^"]+)"\/>/g,
  render: (m) => criterionPassed(m[1] ?? ""),
});

/**
 * Criterion failed handler.
 * Renders a failure marker with reason when a criterion fails.
 */
tagRendererRegistry.register({
  pattern: /<ferix:criterion-failed id="([^"]+)" reason="([^"]+)"\/>/g,
  render: (m) => criterionFailed(m[1] ?? "", m[2] ?? ""),
});
