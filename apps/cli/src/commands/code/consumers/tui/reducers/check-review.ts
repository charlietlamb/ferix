import { stateReducerRegistry } from "./registry.js";

// Check passed
stateReducerRegistry.register({
  tag: "CheckPassed",
  reduce: (state) => ({ ...state, executionMode: "checking" }),
});

// Check failed
stateReducerRegistry.register({
  tag: "CheckFailed",
  reduce: (state) => ({ ...state, executionMode: "checking" }),
});

// Review complete
stateReducerRegistry.register({
  tag: "ReviewComplete",
  reduce: (state) => ({ ...state, executionMode: "reviewing" }),
});
