import { stateReducerRegistry } from "./registry.js";

// VerifyStarted - set verify mode with attempt counter
stateReducerRegistry.register({
  tag: "VerifyStarted",
  reduce: (state, event) => ({
    ...state,
    executionMode: "verifying",
    verifyAttempt: event.attempt,
    verifyCommand: undefined,
  }),
});

// VerifyCommandPassed - update current command
stateReducerRegistry.register({
  tag: "VerifyCommandPassed",
  reduce: (state, event) => ({
    ...state,
    verifyCommand: event.command,
  }),
});

// VerifyCommandFailed - update current command
stateReducerRegistry.register({
  tag: "VerifyCommandFailed",
  reduce: (state, event) => ({
    ...state,
    verifyCommand: event.command,
  }),
});

// VerifyPassed - clear verify state
stateReducerRegistry.register({
  tag: "VerifyPassed",
  reduce: (state) => ({
    ...state,
    executionMode: "idle",
    verifyAttempt: undefined,
    verifyCommand: undefined,
  }),
});

// VerifyFailed - keep verify state for display
stateReducerRegistry.register({
  tag: "VerifyFailed",
  reduce: (state, event) => ({
    ...state,
    verifyAttempt: event.attempt,
  }),
});
