import { Context, type Effect } from "effect";
import type { PromptStoreError } from "../domain/errors.js";

/**
 * Service interface for prompt template management.
 *
 * The prompt template is a static file (PROMPT.md) that contains:
 * - Session startup checklist
 * - Signal format documentation
 * - Phase instructions
 * - Verification commands
 *
 * It does NOT contain session-specific content (task, progress, etc.)
 * which lives in STATE.json.
 *
 * @example
 * ```typescript
 * const promptStore = yield* PromptStore;
 *
 * // Copy template to session directory during discovery
 * yield* promptStore.copyTemplate(sessionId);
 *
 * // Read the template (cached after first read)
 * const template = yield* promptStore.read(sessionId);
 * ```
 */
export interface PromptStoreService {
  /**
   * Copy the static PROMPT.md template to a session's directory.
   * Called during discovery phase to make the template available for debugging.
   *
   * @param sessionId - Session to copy template for
   */
  readonly copyTemplate: (
    sessionId: string
  ) => Effect.Effect<void, PromptStoreError>;

  /**
   * Read the PROMPT.md template for a session.
   * Falls back to bundled template if session-specific copy doesn't exist.
   *
   * @param sessionId - Session to read template for
   * @returns The prompt template content
   */
  readonly read: (sessionId: string) => Effect.Effect<string, PromptStoreError>;

  /**
   * Get the bundled template content directly.
   * Useful for building prompts without requiring a session directory.
   *
   * @returns The bundled prompt template content
   */
  readonly getBundledTemplate: () => Effect.Effect<string, PromptStoreError>;
}

/**
 * Effect Tag for the PromptStore service.
 *
 * Use this tag to depend on prompt template management without coupling to a specific backend.
 */
export class PromptStore extends Context.Tag("@ferix/PromptStore")<
  PromptStore,
  PromptStoreService
>() {}
