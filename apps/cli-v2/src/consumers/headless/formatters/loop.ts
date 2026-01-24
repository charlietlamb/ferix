import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "LoopStarted",
  format: (event) =>
    pc.cyan(`[LOOP] Started - ${event.config.task.slice(0, 50)}...`),
});

headlessFormatterRegistry.register({
  tag: "LoopCompleted",
  format: (event) =>
    pc.green(
      `[LOOP] Completed in ${event.summary.durationMs}ms (${event.summary.iterations} iterations)`
    ),
});

headlessFormatterRegistry.register({
  tag: "LoopFailed",
  format: (event) => pc.red(`[LOOP] Failed: ${event.error.message}`),
});
