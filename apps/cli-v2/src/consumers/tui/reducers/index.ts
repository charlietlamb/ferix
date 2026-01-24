// Import reducers to register them
import "./check-review.js";
import "./iteration.js";
import "./llm.js";
import "./loop.js";
import "./tasks.js";

// Re-export formatToolInput from tools
export { formatToolInput } from "../tools/index.js";
// Re-export helpers
export {
  appendError,
  appendOutput,
  appendToolUse,
  setCriterionStatus,
  setPhaseStatus,
  setTaskStatus,
  toTUITask,
  updateTaskCriteria,
  updateTaskPhases,
} from "./helpers.js";
export type { StateReducer, StateReducerRegistry } from "./registry.js";
// Re-export registry
export { stateReducerRegistry } from "./registry.js";

// Re-export reduce function
import type { DomainEvent } from "../../../domain/index.js";
import type { TUIState } from "../../../domain/schemas/tui.js";
import { stateReducerRegistry } from "./registry.js";

/**
 * Pure reducer function for TUI state.
 */
export function reduce(state: TUIState, event: DomainEvent): TUIState {
  return stateReducerRegistry.reduce(state, event);
}
