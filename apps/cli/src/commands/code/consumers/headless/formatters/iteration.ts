import pc from "picocolors";
import type {
  IterationCompletedEvent,
  IterationStartedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const iterationStartedFormatter: EventFormatter<"IterationStarted"> = {
  tag: "IterationStarted",
  format: (event: IterationStartedEvent) =>
    pc.blue(`[ITER ${event.iteration}] Started`),
};

const iterationCompletedFormatter: EventFormatter<"IterationCompleted"> = {
  tag: "IterationCompleted",
  format: (event: IterationCompletedEvent) =>
    pc.blue(`[ITER ${event.iteration}] Completed`),
};

headlessFormatterRegistry.register(iterationStartedFormatter);
headlessFormatterRegistry.register(iterationCompletedFormatter);
