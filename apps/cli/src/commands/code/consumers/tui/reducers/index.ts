// Import reducers to register them
import "./check-review.js";
import "./discovery.js";
import "./iteration.js";
import "./llm.js";
import "./loop.js";
import "./progress.js";
import "./tasks.js";
import "./verify.js";
import "./worktree.js";

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
