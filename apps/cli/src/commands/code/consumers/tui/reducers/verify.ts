import { appendOutput } from "./helpers.js";
import { stateReducerRegistry } from "./registry.js";

// VerifyStarted - set verify mode with attempt counter and append tag
stateReducerRegistry.register({
  tag: "VerifyStarted",
  reduce: (state, event) => {
    const withTag = appendOutput(
      state,
      `\n<ferix:verify-started attempt="${event.attempt}"/>\n`
    );
    return {
      ...withTag,
      executionMode: "verifying",
      verifyAttempt: event.attempt,
      verifyCommand: undefined,
    };
  },
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

// VerifyPassed - clear verify state and append tag
stateReducerRegistry.register({
  tag: "VerifyPassed",
  reduce: (state) => {
    const withTag = appendOutput(state, "\n<ferix:verify-passed/>\n");
    return {
      ...withTag,
      executionMode: "idle",
      verifyAttempt: undefined,
      verifyCommand: undefined,
    };
  },
});

// VerifyFailed - keep verify state for display and append tag
stateReducerRegistry.register({
  tag: "VerifyFailed",
  reduce: (state, event) => {
    const withTag = appendOutput(
      state,
      `\n<ferix:verify-failed attempt="${event.attempt}"/>\n`
    );
    return {
      ...withTag,
      verifyAttempt: event.attempt,
    };
  },
});
