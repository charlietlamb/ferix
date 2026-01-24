import type {
  LLMTextEvent,
  LLMToolStartEvent,
  LLMToolUseEvent,
} from "../../../domain/index.js";
import { appendOutput, appendToolUse } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const llmTextReducer: StateReducer<"LLMText"> = {
  tag: "LLMText",
  reduce: (state, event: LLMTextEvent) => appendOutput(state, event.text),
};

const llmToolStartReducer: StateReducer<"LLMToolStart"> = {
  tag: "LLMToolStart",
  reduce: (state, event: LLMToolStartEvent) => ({
    ...state,
    currentTool: event.tool,
  }),
};

const llmToolUseReducer: StateReducer<"LLMToolUse"> = {
  tag: "LLMToolUse",
  reduce: (state, event: LLMToolUseEvent) =>
    appendToolUse(state, event.tool, event.input),
};

const llmToolEndReducer: StateReducer<"LLMToolEnd"> = {
  tag: "LLMToolEnd",
  reduce: (state) => ({ ...state, currentTool: undefined }),
};

stateReducerRegistry.register(llmTextReducer);
stateReducerRegistry.register(llmToolStartReducer);
stateReducerRegistry.register(llmToolUseReducer);
stateReducerRegistry.register(llmToolEndReducer);
