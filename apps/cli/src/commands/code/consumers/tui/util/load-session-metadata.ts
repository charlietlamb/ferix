import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SetStoreFunction } from "solid-js/store";
import type { MutableTUIState } from "./stream-to-store.js";

/**
 * Load persisted session metadata from disk and populate the TUI store.
 *
 * Reads `~/.ferix/sessions/{sessionId}.json` to extract task, provider,
 * git branch, PR URL, and status for historical (read-only) sessions.
 *
 * Best-effort: if reading or parsing fails, the store defaults to "complete" status.
 */
export function loadPersistedSessionMetadata(
  sessionId: string,
  setStore: SetStoreFunction<MutableTUIState>
): void {
  try {
    const sessionPath = join(
      homedir(),
      ".ferix",
      "sessions",
      `${sessionId}.json`
    );
    if (!existsSync(sessionPath)) {
      return;
    }

    const content = readFileSync(sessionPath, "utf-8");
    const session = JSON.parse(content) as Record<string, unknown>;

    if (typeof session.originalTask === "string") {
      setStore("task", session.originalTask);
    }
    if (
      session.provider === "claude" ||
      session.provider === "cursor" ||
      session.provider === "opencode"
    ) {
      setStore("provider", session.provider);
    }
    if (typeof session.branchName === "string") {
      setStore("gitBranch", session.branchName);
    }
    if (typeof session.prUrl === "string") {
      setStore("prUrl", session.prUrl);
    }

    // Map persisted session status to TUI LoopStatus
    if (session.status === "completed") {
      setStore("status", "complete");
    } else if (session.status === "failed") {
      setStore("status", "error");
    } else if (session.status === "paused") {
      setStore("status", "paused");
    } else {
      setStore("status", "complete");
    }
  } catch {
    // Best-effort — if it fails, we still show the output logs
    setStore("status", "complete");
  }
}
