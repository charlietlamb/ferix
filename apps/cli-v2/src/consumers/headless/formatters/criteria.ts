import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "CriteriaDefined",
  format: (event) =>
    pc.magenta(
      `[CRITERIA] Task ${event.taskId}: ${event.criteria.length} criteria defined`
    ),
});

headlessFormatterRegistry.register({
  tag: "CriterionPassed",
  format: (event) => pc.green(`[CHECK] Passed: ${event.criterionId}`),
});

headlessFormatterRegistry.register({
  tag: "CriterionFailed",
  format: (event) =>
    pc.red(`[CHECK] Failed: ${event.criterionId} - ${event.reason}`),
});
