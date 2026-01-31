import type {
  LoopFailedEvent,
  LoopStartedEvent,
} from "../../../domain/index.js";
import { MAX_OUTPUT_LINES } from "../constants.js";
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
  reduce: (state) => {
    if (state.partialLine) {
      const combined = [...state.outputLines, state.partialLine];
      const outputLines =
        combined.length > MAX_OUTPUT_LINES
          ? combined.slice(-MAX_OUTPUT_LINES)
          : combined;
      return { ...state, outputLines, partialLine: "", status: "complete" };
    }
    return { ...state, status: "complete" };
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
