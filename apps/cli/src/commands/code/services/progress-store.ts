import { Context, type Effect } from "effect";
import type { ProgressStoreError } from "../domain/errors.js";
import type { ProgressEntry, ProgressFile } from "../domain/index.js";

/**
 * Service interface for progress persistence.
 *
 * Progress is stored as an append-only log at `.ferix/plans/:sessionId/progress.md`.
 * Each iteration appends entries recording what happened.
 *
 * Implementations include:
 * - FileSystem: Persists to `.ferix/plans/` directory
 * - Memory: In-memory storage for testing
 *
 * @example
 * ```typescript
 * const progressStore = yield* ProgressStore;
 *
 * // Append a progress entry
 * yield* progressStore.append(sessionId, {
 *   iteration: 1,
 *   timestamp: new Date().toISOString(),
 *   taskId: "task-1",
 *   action: "started",
 *   summary: "Started implementing feature X",
 * });
 *
 * // Load all progress
 * const progress = yield* progressStore.load(sessionId);
 *
 * // Get recent entries
 * const recent = yield* progressStore.getRecent(sessionId, 5);
 * ```
 */
export interface ProgressStoreService {
  /**
   * Append a progress entry to the session's log.
   *
   * @param sessionId - Session this entry belongs to
   * @param entry - Progress entry to append
   */
  readonly append: (
    sessionId: string,
    entry: ProgressEntry
  ) => Effect.Effect<void, ProgressStoreError>;

  /**
   * Load the complete progress file for a session.
   *
   * @param sessionId - Session to load progress for
   * @returns The progress file with all entries
   */
  readonly load: (
    sessionId: string
  ) => Effect.Effect<ProgressFile, ProgressStoreError>;

  /**
   * Get the most recent progress entries for a session.
   *
   * @param sessionId - Session to get progress for
   * @param count - Number of recent entries to return
   * @returns Array of recent progress entries
   */
  readonly getRecent: (
    sessionId: string,
    count: number
  ) => Effect.Effect<readonly ProgressEntry[], ProgressStoreError>;
}

/**
 * Effect Tag for the ProgressStore service.
 *
 * Use this tag to depend on progress storage without coupling to a specific backend.
 */
export class ProgressStore extends Context.Tag("@ferix/ProgressStore")<
  ProgressStore,
  ProgressStoreService
>() {}
