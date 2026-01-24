import { appendOutput, appendToolUse } from "./helpers.js";
import { stateReducerRegistry } from "./registry.js";

// LLM text
stateReducerRegistry.register({
  tag: "LLMText",
  reduce: (state, event) => appendOutput(state, event.text),
});

// LLM tool start
stateReducerRegistry.register({
  tag: "LLMToolStart",
  reduce: (state, event) => ({ ...state, currentTool: event.tool }),
});

// LLM tool use
stateReducerRegistry.register({
  tag: "LLMToolUse",
  reduce: (state, event) => appendToolUse(state, event.tool, event.input),
});

// LLM tool end
stateReducerRegistry.register({
  tag: "LLMToolEnd",
  reduce: (state) => ({ ...state, currentTool: undefined }),
});
