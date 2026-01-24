import pc from "picocolors";
import type { WorktreeCreatedEvent } from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const worktreeCreatedFormatter: EventFormatter<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  format: (event: WorktreeCreatedEvent) =>
    pc.cyan(
      `[WORKTREE] Branch: ${event.branchName} | Path: ${event.worktreePath}`
    ),
};

headlessFormatterRegistry.register(worktreeCreatedFormatter);
