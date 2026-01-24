import type { IterationStartedEvent } from "../../../domain/index.js";
import { MAX_OUTPUT_LINES } from "../constants.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const iterationStartedReducer: StateReducer<"IterationStarted"> = {
  tag: "IterationStarted",
  reduce: (state, event: IterationStartedEvent) => ({
    ...state,
    iteration: event.iteration,
  }),
};

const iterationCompletedReducer: StateReducer<"IterationCompleted"> = {
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
};

stateReducerRegistry.register(iterationStartedReducer);
stateReducerRegistry.register(iterationCompletedReducer);
