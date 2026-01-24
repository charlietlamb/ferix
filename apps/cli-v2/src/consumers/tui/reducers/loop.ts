import { MAX_OUTPUT_LINES } from "../constants.js";
import { appendError } from "./helpers.js";
import { stateReducerRegistry } from "./registry.js";

// Loop started
stateReducerRegistry.register({
  tag: "LoopStarted",
  reduce: (state, event) => ({
    ...state,
    task: event.config.task,
    maxIterations: event.config.maxIterations,
    status: "running",
    startTime: Date.now(),
  }),
});

// Loop completed
stateReducerRegistry.register({
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
});

// Loop failed
stateReducerRegistry.register({
  tag: "LoopFailed",
  reduce: (state, event) => {
    const errorMsg = event.error.iteration
      ? `[${event.error.phase}] Iteration ${event.error.iteration}: ${event.error.message}`
      : `[${event.error.phase}] ${event.error.message}`;
    return appendError(state, errorMsg);
  },
});
