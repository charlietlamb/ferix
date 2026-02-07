import type {
  BranchPushedEvent,
  PRCreatedEvent,
  PRCreationFailedEvent,
  PushFailedEvent,
  WorktreeCreatedEvent,
  WorktreeRemovedEvent,
} from "../../../domain/index.js";
import { appendError, appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const worktreeCreatedReducer: StateReducer<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  reduce: (state, event: WorktreeCreatedEvent) => ({
    ...appendOutput(
      state,
      `\nWorktree created\n   Branch: ${event.branchName}\n   Path: ${event.worktreePath}\n`
    ),
    gitBranch: event.branchName,
  }),
};

const worktreeRemovedReducer: StateReducer<"WorktreeRemoved"> = {
  tag: "WorktreeRemoved",
  reduce: (state, event: WorktreeRemovedEvent) =>
    appendOutput(
      state,
      `\nWorktree cleaned up (branch preserved)\n   Session: ${event.sessionId}\n`
    ),
};

const branchPushedReducer: StateReducer<"BranchPushed"> = {
  tag: "BranchPushed",
  reduce: (state, event: BranchPushedEvent) => ({
    ...appendOutput(
      state,
      `\n<ferix:branch-pushed>${event.branchName}</ferix:branch-pushed>\n`
    ),
    gitPushed: true,
  }),
};

const prCreatedReducer: StateReducer<"PRCreated"> = {
  tag: "PRCreated",
  reduce: (state, event: PRCreatedEvent) => ({
    ...appendOutput(
      state,
      `\n<ferix:pr-created>${event.prUrl}</ferix:pr-created>\n`
    ),
    prUrl: event.prUrl,
  }),
};

const pushFailedReducer: StateReducer<"PushFailed"> = {
  tag: "PushFailed",
  reduce: (state, event: PushFailedEvent) =>
    appendError(state, `Push failed: ${event.error}`),
};

const prCreationFailedReducer: StateReducer<"PRCreationFailed"> = {
  tag: "PRCreationFailed",
  reduce: (state, event: PRCreationFailedEvent) =>
    appendError(state, `PR creation failed: ${event.error}`),
};

stateReducerRegistry.register(worktreeCreatedReducer);
stateReducerRegistry.register(worktreeRemovedReducer);
stateReducerRegistry.register(branchPushedReducer);
stateReducerRegistry.register(prCreatedReducer);
stateReducerRegistry.register(pushFailedReducer);
stateReducerRegistry.register(prCreationFailedReducer);
