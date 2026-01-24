import { colors, symbols } from "../../render/primitives.js";
import { reviewFailedBanner, reviewPassedBanner } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Check signals
tagRendererRegistry.register({
  pattern: /<ferix:check-passed\/>/g,
  render: () =>
    `${colors.success(symbols.checkmark)} ${colors.muted("Check passed")}`,
});

tagRendererRegistry.register({
  pattern: /<ferix:check-failed\/>/g,
  render: () =>
    `${colors.error(symbols.cross)} ${colors.muted("Check failed")}`,
});

// Review signals
tagRendererRegistry.register({
  pattern: /<ferix:review-passed\/>/g,
  render: (_, w) => reviewPassedBanner(w),
});

tagRendererRegistry.register({
  pattern: /<ferix:review-failed\/>/g,
  render: (_, w) => reviewFailedBanner(w),
});

tagRendererRegistry.register({
  pattern: /<ferix:review-complete\/>/g,
  render: () =>
    `${colors.success(symbols.checkmark)} ${colors.muted("Review complete")}`,
});

tagRendererRegistry.register({
  pattern: /<ferix:review-changes-made\/>/g,
  render: () =>
    `${colors.info(symbols.bulletFilled)} ${colors.muted("Review made changes")}`,
});
