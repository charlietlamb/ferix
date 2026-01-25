import pc from "picocolors";
import type {
  WorktreeCreatedEvent,
  WorktreeRemovedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const worktreeCreatedFormatter: EventFormatter<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  format: (event: WorktreeCreatedEvent) =>
    pc.cyan(
      `[WORKTREE] Branch: ${event.branchName} | Path: ${event.worktreePath}`
    ),
};

const worktreeRemovedFormatter: EventFormatter<"WorktreeRemoved"> = {
  tag: "WorktreeRemoved",
  format: (event: WorktreeRemovedEvent) =>
    pc.cyan(
      `[WORKTREE] Cleaned up worktree for session: ${event.sessionId} (branch preserved)`
    ),
};

headlessFormatterRegistry.register(worktreeCreatedFormatter);
headlessFormatterRegistry.register(worktreeRemovedFormatter);
