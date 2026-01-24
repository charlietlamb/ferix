import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "PhasesDefined",
  format: (event) =>
    pc.magenta(
      `[PHASES] Task ${event.taskId}: ${event.phases.length} phases defined`
    ),
});

headlessFormatterRegistry.register({
  tag: "PhaseStarted",
  format: (event) => pc.cyan(`[PHASE] Started: ${event.phaseId}`),
});

headlessFormatterRegistry.register({
  tag: "PhaseCompleted",
  format: (event) => pc.green(`[PHASE] Completed: ${event.phaseId}`),
});

headlessFormatterRegistry.register({
  tag: "PhaseFailed",
  format: (event) =>
    pc.red(`[PHASE] Failed: ${event.phaseId} - ${event.reason}`),
});
