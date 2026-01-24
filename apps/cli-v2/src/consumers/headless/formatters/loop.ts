import pc from "picocolors";
import type {
  LoopCompletedEvent,
  LoopFailedEvent,
  LoopStartedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const loopStartedFormatter: EventFormatter<"LoopStarted"> = {
  tag: "LoopStarted",
  format: (event: LoopStartedEvent) =>
    pc.cyan(`[LOOP] Started - ${event.config.task.slice(0, 50)}...`),
};

const loopCompletedFormatter: EventFormatter<"LoopCompleted"> = {
  tag: "LoopCompleted",
  format: (event: LoopCompletedEvent) =>
    pc.green(
      `[LOOP] Completed in ${event.summary.durationMs}ms (${event.summary.iterations} iterations)`
    ),
};

const loopFailedFormatter: EventFormatter<"LoopFailed"> = {
  tag: "LoopFailed",
  format: (event: LoopFailedEvent) =>
    pc.red(`[LOOP] Failed: ${event.error.message}`),
};

headlessFormatterRegistry.register(loopStartedFormatter);
headlessFormatterRegistry.register(loopCompletedFormatter);
headlessFormatterRegistry.register(loopFailedFormatter);
