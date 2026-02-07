import {
  verifyFailedLine,
  verifyPassedLine,
  verifyStartedLine,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Verify started handler.
 * Renders verify attempt marker.
 */
tagRendererRegistry.register({
  pattern: /<ferix:verify-started attempt="([^"]+)"\/>/g,
  render: (m) => verifyStartedLine(m[1] ?? ""),
});

/**
 * Verify passed handler.
 * Renders verify success banner.
 */
tagRendererRegistry.register({
  pattern: /<ferix:verify-passed\/>/g,
  render: (_, w) => verifyPassedLine(w),
});

/**
 * Verify failed handler.
 * Renders verify failure marker with attempt.
 */
tagRendererRegistry.register({
  pattern: /<ferix:verify-failed attempt="([^"]+)"\/>/g,
  render: (m) => verifyFailedLine(m[1] ?? ""),
});
