import type {
  LoopCompletedEvent,
  LoopFailedEvent,
  LoopStartedEvent,
} from "../../../domain/index.js";
import { MAX_OUTPUT_LINES } from "../constants.js";
import { completeBanner } from "../tags/primitives.js";
import { appendError } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const loopStartedReducer: StateReducer<"LoopStarted"> = {
  tag: "LoopStarted",
  reduce: (state, event: LoopStartedEvent) => ({
    ...state,
    task: event.config.task,
    maxIterations: event.config.maxIterations,
    status: "running",
    startTime: event.timestamp,
    yolo: event.config.yolo ?? false,
    debug: event.config.debug ?? false,
    provider: event.config.provider ?? "claude",
  }),
};

const loopCompletedReducer: StateReducer<"LoopCompleted"> = {
  tag: "LoopCompleted",
  reduce: (state, event: LoopCompletedEvent) => {
    const newStatus = event.summary.success ? "complete" : "paused";

    let newOutputLines = state.outputLines;
    if (state.partialLine) {
      newOutputLines = [...newOutputLines, state.partialLine];
    }

    // Add verified completion banner only when all tasks done
    if (event.summary.success) {
      const width = process.stdout.columns || 80;
      newOutputLines = [...newOutputLines, completeBanner(width)];
    }

    const outputLines =
      newOutputLines.length > MAX_OUTPUT_LINES
        ? newOutputLines.slice(-MAX_OUTPUT_LINES)
        : newOutputLines;

    return { ...state, outputLines, partialLine: "", status: newStatus };
  },
};

const loopFailedReducer: StateReducer<"LoopFailed"> = {
  tag: "LoopFailed",
  reduce: (state, event: LoopFailedEvent) => {
    const errorMsg = event.error.iteration
      ? `[${event.error.phase}] Iteration ${event.error.iteration}: ${event.error.message}`
      : `[${event.error.phase}] ${event.error.message}`;
    return appendError(state, errorMsg);
  },
};

stateReducerRegistry.register(loopStartedReducer);
stateReducerRegistry.register(loopCompletedReducer);
stateReducerRegistry.register(loopFailedReducer);
