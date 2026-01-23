import { Context, type Effect } from "effect";
import type { SessionStoreError } from "../domain/errors.js";
import type { Session } from "../domain/session.js";

// Re-export Session types from domain for backwards compatibility
export type { Session, SessionStatus } from "../domain/session.js";

/**
 * Service interface for session persistence.
 *
 * Sessions track execution state across runs, enabling:
 * - Resumption of interrupted loops
 * - Progress tracking across tasks
 * - Context building from completed work
 *
 * @example
 * ```typescript
 * const sessionStore = yield* SessionStore;
 *
 * // Start a new session
 * const session = yield* sessionStore.create("Implement auth feature");
 *
 * // Update progress
 * yield* sessionStore.update(session.id, {
 *   ...session,
 *   currentTaskId: "1",
 * });
 *
 * // Mark task complete
 * yield* sessionStore.update(session.id, {
 *   ...session,
 *   completedTasks: [...session.completedTasks, "1"],
 * });
 * ```
 */
export interface SessionStoreService {
  /**
   * Create a new session.
   *
   * @param originalTask - The task that initiated this session
   * @returns The created session with a generated ID
   */
  readonly create: (
    originalTask: string
  ) => Effect.Effect<Session, SessionStoreError>;

  /**
   * Get an existing session by ID.
   *
   * @param sessionId - ID of the session to retrieve
   * @returns The session, or error if not found
   */
  readonly get: (
    sessionId: string
  ) => Effect.Effect<Session, SessionStoreError>;

  /**
   * Update an existing session.
   *
   * @param sessionId - ID of the session to update
   * @param session - Updated session data
   */
  readonly update: (
    sessionId: string,
    session: Session
  ) => Effect.Effect<void, SessionStoreError>;
}

/**
 * Effect Tag for the SessionStore service.
 *
 * Use this tag to depend on session storage without coupling to a specific backend.
 */
export class SessionStore extends Context.Tag("@ferix/SessionStore")<
  SessionStore,
  SessionStoreService
>() {}
