import {
  criteriaHeader,
  criterionFailed,
  criterionLine,
  criterionPassed,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Criteria header
tagRendererRegistry.register({
  pattern: /<ferix:criteria task="(\d+)">/g,
  render: (m) => criteriaHeader(m[1] ?? ""),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:criteria>/g,
  render: () => "",
});

// Criterion line
tagRendererRegistry.register({
  pattern: /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
  render: (m) => criterionLine(m[1] ?? "", m[2] ?? ""),
});

// Criterion passed
tagRendererRegistry.register({
  pattern: /<ferix:criterion-passed id="([^"]+)"\/>/g,
  render: (m) => criterionPassed(m[1] ?? ""),
});

// Criterion failed
tagRendererRegistry.register({
  pattern: /<ferix:criterion-failed id="([^"]+)" reason="([^"]+)"\/>/g,
  render: (m) => criterionFailed(m[1] ?? "", m[2] ?? ""),
});
