import { Context, type Effect } from "effect";
import type { GuardrailsStoreError } from "../domain/errors.js";
import type { Guardrail, GuardrailsFile } from "../domain/index.js";

/**
 * Service interface for guardrails persistence.
 *
 * Guardrails are stored at `.ferix/plans/:sessionId/guardrails.md`.
 * They represent failure patterns learned from previous iterations
 * that the LLM should avoid.
 *
 * Implementations include:
 * - FileSystem: Persists to `.ferix/plans/` directory
 * - Memory: In-memory storage for testing
 *
 * @example
 * ```typescript
 * const guardrailsStore = yield* GuardrailsStore;
 *
 * // Add a guardrail
 * yield* guardrailsStore.add(sessionId, {
 *   id: "gr-1",
 *   createdAt: new Date().toISOString(),
 *   iteration: 3,
 *   pattern: "Modifying package.json without running install",
 *   sign: "Build failures after dependency changes",
 *   avoidance: "Always run npm install after modifying package.json",
 *   severity: "critical",
 * });
 *
 * // Load all guardrails
 * const guardrails = yield* guardrailsStore.load(sessionId);
 *
 * // Get active guardrails for prompt
 * const active = yield* guardrailsStore.getActive(sessionId);
 * ```
 */
export interface GuardrailsStoreService {
  /**
   * Add a guardrail to the session's collection.
   *
   * @param sessionId - Session this guardrail belongs to
   * @param guardrail - Guardrail to add
   */
  readonly add: (
    sessionId: string,
    guardrail: Guardrail
  ) => Effect.Effect<void, GuardrailsStoreError>;

  /**
   * Load the complete guardrails file for a session.
   *
   * @param sessionId - Session to load guardrails for
   * @returns The guardrails file with all entries
   */
  readonly load: (
    sessionId: string
  ) => Effect.Effect<GuardrailsFile, GuardrailsStoreError>;

  /**
   * Get all active guardrails for a session.
   *
   * @param sessionId - Session to get guardrails for
   * @returns Array of active guardrails
   */
  readonly getActive: (
    sessionId: string
  ) => Effect.Effect<readonly Guardrail[], GuardrailsStoreError>;
}

/**
 * Effect Tag for the GuardrailsStore service.
 *
 * Use this tag to depend on guardrails storage without coupling to a specific backend.
 */
export class GuardrailsStore extends Context.Tag("@ferix/GuardrailsStore")<
  GuardrailsStore,
  GuardrailsStoreService
>() {}
