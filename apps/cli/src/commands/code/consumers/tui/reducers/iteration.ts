import type { IterationStartedEvent } from "../../../domain/index.js";
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
    // partialLine is already displayed in outputLines, just clear it
    return { ...state, partialLine: "" };
  },
};

stateReducerRegistry.register(iterationStartedReducer);
stateReducerRegistry.register(iterationCompletedReducer);
