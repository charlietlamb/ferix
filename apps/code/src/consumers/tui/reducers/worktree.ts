import type {
  WorktreeCreatedEvent,
  WorktreeRemovedEvent,
} from "../../../domain/index.js";
import { appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const worktreeCreatedReducer: StateReducer<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  reduce: (state, event: WorktreeCreatedEvent) =>
    appendOutput(
      state,
      `\nWorktree created\n   Branch: ${event.branchName}\n   Path: ${event.worktreePath}\n`
    ),
};

const worktreeRemovedReducer: StateReducer<"WorktreeRemoved"> = {
  tag: "WorktreeRemoved",
  reduce: (state, event: WorktreeRemovedEvent) =>
    appendOutput(
      state,
      `\nWorktree cleaned up (branch preserved)\n   Session: ${event.sessionId}\n`
    ),
};

stateReducerRegistry.register(worktreeCreatedReducer);
stateReducerRegistry.register(worktreeRemovedReducer);
