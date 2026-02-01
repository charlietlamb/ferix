import { Context, type Effect } from "effect";
import type { OutputStoreError } from "../domain/errors.js";

/**
 * Service interface for session output persistence.
 *
 * Output is stored at `.ferix/sessions/:sessionId/output.log`.
 * This file contains all TUI output lines including:
 * - LLM streaming text
 * - Tool execution results
 * - Error messages
 * - Progress updates
 *
 * Output is appended as events come in and read when viewing a session.
 *
 * @example
 * ```typescript
 * const outputStore = yield* OutputStore;
 *
 * // Append output lines
 * yield* outputStore.append(sessionId, ["Line 1", "Line 2"]);
 *
 * // Read all output
 * const lines = yield* outputStore.read(sessionId);
 * ```
 */
export interface OutputStoreService {
  /**
   * Append output lines to the session's output log.
   *
   * @param sessionId - Session this output belongs to
   * @param lines - Lines to append
   */
  readonly append: (
    sessionId: string,
    lines: readonly string[]
  ) => Effect.Effect<void, OutputStoreError>;

  /**
   * Read all output lines from the session's output log.
   *
   * @param sessionId - Session to read output for
   * @returns All output lines
   */
  readonly read: (
    sessionId: string
  ) => Effect.Effect<readonly string[], OutputStoreError>;
}

/**
 * Effect Tag for the OutputStore service.
 *
 * Use this tag to depend on output storage without coupling to a specific backend.
 */
export class OutputStore extends Context.Tag("@ferix/OutputStore")<
  OutputStore,
  OutputStoreService
>() {}
