import type { IterationStartedEvent } from "../../../domain/index.js";
import { appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const iterationStartedReducer: StateReducer<"IterationStarted"> = {
  tag: "IterationStarted",
  reduce: (state, event: IterationStartedEvent) => {
    const withTag = appendOutput(
      state,
      `\n<ferix:iteration n="${event.iteration}" max="${state.maxIterations}"/>\n`
    );
    return {
      ...withTag,
      iteration: event.iteration,
    };
  },
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
