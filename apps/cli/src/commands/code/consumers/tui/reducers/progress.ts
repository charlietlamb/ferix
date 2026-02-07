import type {
  GuardrailAddedEvent,
  LearningRecordedEvent,
} from "../../../domain/index.js";
import { appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

/**
 * LearningRecorded reducer - displays learning in output using ferix tags.
 */
const learningRecordedReducer: StateReducer<"LearningRecorded"> = {
  tag: "LearningRecorded",
  reduce: (state, event: LearningRecordedEvent) => {
    const category = event.category ?? "";
    const line = `<ferix:learning category="${category}">${event.content}</ferix:learning>`;
    return appendOutput(state, `${line}\n`);
  },
};

/**
 * GuardrailAdded reducer - displays guardrail in output using ferix tags.
 */
const guardrailAddedReducer: StateReducer<"GuardrailAdded"> = {
  tag: "GuardrailAdded",
  reduce: (state, event: GuardrailAddedEvent) => {
    const severity = event.severity === "critical" ? "critical" : "warn";
    const line = `<ferix:guardrail severity="${severity}">${event.pattern}</ferix:guardrail>`;
    return appendOutput(state, `${line}\n`);
  },
};

/**
 * ProgressUpdated reducer - no-op for now, progress is tracked in files.
 */
const progressUpdatedReducer: StateReducer<"ProgressUpdated"> = {
  tag: "ProgressUpdated",
  reduce: (state) => state,
};

stateReducerRegistry.register(learningRecordedReducer);
stateReducerRegistry.register(guardrailAddedReducer);
stateReducerRegistry.register(progressUpdatedReducer);
