import type { WorktreeCreatedEvent } from "../../../domain/index.js";
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

stateReducerRegistry.register(worktreeCreatedReducer);
