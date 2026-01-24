import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "IterationStarted",
  format: (event) => pc.blue(`[ITER ${event.iteration}] Started`),
});

headlessFormatterRegistry.register({
  tag: "IterationCompleted",
  format: (event) => pc.blue(`[ITER ${event.iteration}] Completed`),
});
