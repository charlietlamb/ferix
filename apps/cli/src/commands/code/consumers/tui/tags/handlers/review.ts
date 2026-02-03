import {
  checkFailed,
  checkPassed,
  reviewChangesMade,
  reviewComplete,
  reviewFailedBanner,
  reviewPassedBanner,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Check passed handler.
 * Renders a success marker for passed checks.
 */
tagRendererRegistry.register({
  pattern: /<ferix:check-passed\/>/g,
  render: () => checkPassed(),
});

/**
 * Check failed handler.
 * Renders a failure marker for failed checks.
 */
tagRendererRegistry.register({
  pattern: /<ferix:check-failed\/>/g,
  render: () => checkFailed(),
});

/**
 * Review passed handler.
 * Renders a celebratory banner when review passes.
 */
tagRendererRegistry.register({
  pattern: /<ferix:review-passed\/>/g,
  render: (_, w) => reviewPassedBanner(w),
});

/**
 * Review failed handler.
 * Renders a failure banner when review fails.
 */
tagRendererRegistry.register({
  pattern: /<ferix:review-failed\/>/g,
  render: (_, w) => reviewFailedBanner(w),
});

/**
 * Review complete handler.
 * Renders a completion marker for finished reviews.
 */
tagRendererRegistry.register({
  pattern: /<ferix:review-complete\/>/g,
  render: () => reviewComplete(),
});

/**
 * Review changes made handler.
 * Renders a marker indicating the review made changes.
 */
tagRendererRegistry.register({
  pattern: /<ferix:review-changes-made\/>/g,
  render: () => reviewChangesMade(),
});
