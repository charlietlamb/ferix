import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "CheckPassed",
  format: () => pc.green("[CHECK] All criteria passed"),
});

headlessFormatterRegistry.register({
  tag: "CheckFailed",
  format: (event) =>
    pc.red(`[CHECK] Failed criteria: ${event.failedCriteria.join(", ")}`),
});

headlessFormatterRegistry.register({
  tag: "ReviewComplete",
  format: (event) =>
    pc.green(`[REVIEW] Complete${event.changesMade ? " (changes made)" : ""}`),
});
