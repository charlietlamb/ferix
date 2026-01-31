import { Context, type Effect } from "effect";
import type { StateStoreError } from "../domain/errors.js";
import type { SessionState } from "../domain/schemas/state.js";

/**
 * Service interface for session state persistence.
 *
 * State is stored at `.ferix/plans/:sessionId/STATE.json`.
 * This file contains all session-specific state including:
 * - Original task description
 * - Iteration info
 * - Task progress summary
 * - Current task details
 * - Recent progress entries
 *
 * STATE.json is written before each iteration and read by fresh agents
 * to understand the current context when resuming work.
 *
 * @example
 * ```typescript
 * const stateStore = yield* StateStore;
 *
 * // Write state before iteration
 * yield* stateStore.write(sessionId, state);
 *
 * // Read state (for debugging or resumption)
 * const state = yield* stateStore.read(sessionId);
 * ```
 */
export interface StateStoreService {
  /**
   * Write session state to STATE.json.
   *
   * @param sessionId - Session this state belongs to
   * @param state - Session state to persist
   */
  readonly write: (
    sessionId: string,
    state: SessionState
  ) => Effect.Effect<void, StateStoreError>;

  /**
   * Read session state from STATE.json.
   *
   * @param sessionId - Session to read state for
   * @returns The session state
   */
  readonly read: (
    sessionId: string
  ) => Effect.Effect<SessionState, StateStoreError>;
}

/**
 * Effect Tag for the StateStore service.
 *
 * Use this tag to depend on state storage without coupling to a specific backend.
 */
export class StateStore extends Context.Tag("@ferix/StateStore")<
  StateStore,
  StateStoreService
>() {}
