import type {
  GuardrailAddedEvent,
  LearningRecordedEvent,
} from "../../../domain/index.js";
import { appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

/**
 * LearningRecorded reducer - displays learning in output.
 */
const learningRecordedReducer: StateReducer<"LearningRecorded"> = {
  tag: "LearningRecorded",
  reduce: (state, event: LearningRecordedEvent) => {
    const category = event.category ? `[${event.category}] ` : "";
    const line = `Learning: ${category}${event.content}`;
    return appendOutput(state, `${line}\n`);
  },
};

/**
 * GuardrailAdded reducer - displays guardrail in output.
 */
const guardrailAddedReducer: StateReducer<"GuardrailAdded"> = {
  tag: "GuardrailAdded",
  reduce: (state, event: GuardrailAddedEvent) => {
    const severityIcon =
      event.severity === "critical" ? "[critical]" : "[warn]";
    const line = `${severityIcon} Guardrail: ${event.pattern}`;
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
