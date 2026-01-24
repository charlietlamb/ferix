import { MAX_OUTPUT_LINES } from "../constants.js";
import { stateReducerRegistry } from "./registry.js";

// Iteration started
stateReducerRegistry.register({
  tag: "IterationStarted",
  reduce: (state, event) => ({ ...state, iteration: event.iteration }),
});

// Iteration completed
stateReducerRegistry.register({
  tag: "IterationCompleted",
  reduce: (state) => {
    if (state.partialLine) {
      const combined = [...state.outputLines, state.partialLine];
      const outputLines =
        combined.length > MAX_OUTPUT_LINES
          ? combined.slice(-MAX_OUTPUT_LINES)
          : combined;
      return { ...state, outputLines, partialLine: "" };
    }
    return state;
  },
});
