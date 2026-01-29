import { DateTime, Effect, Layer, Ref } from "effect";
import { SessionStoreError } from "../../domain/errors.js";
import type { Session } from "../../domain/index.js";
import {
  SessionStore,
  type SessionStoreService,
} from "../../services/session-store.js";

/**
 * In-memory store type.
 */
type SessionStoreState = Map<string, Session>;

/**
 * Creates an in-memory session store service.
 *
 * Useful for testing without file system access.
 *
 * @param stateRef - Reference to the session store state
 * @param counterRef - Reference to the session counter (per-layer, not global)
 */
function createMemorySessionStore(
  stateRef: Ref.Ref<SessionStoreState>,
  counterRef: Ref.Ref<number>
): SessionStoreService {
  return {
    create: (originalTask: string): Effect.Effect<Session, SessionStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);
        const sessionId = `test-session-${counter}`;
        const now = yield* DateTime.now;

        const session: Session = {
          id: sessionId,
          createdAt: DateTime.formatIso(now),
          status: "active",
          originalTask,
          completedTasks: [],
        };

        state.set(sessionId, session);
        yield* Ref.set(stateRef, state);

        return session;
      }),

    get: (sessionId: string): Effect.Effect<Session, SessionStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const session = state.get(sessionId);

        if (!session) {
          return yield* Effect.fail(
            new SessionStoreError({
              message: `Session not found: ${sessionId}`,
              operation: "get",
            })
          );
        }

        return session;
      }),

    update: (
      sessionId: string,
      session: Session
    ): Effect.Effect<void, SessionStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);

        if (!state.has(sessionId)) {
          return yield* Effect.fail(
            new SessionStoreError({
              message: `Session not found: ${sessionId}`,
              operation: "update",
            })
          );
        }

        state.set(sessionId, session);
        yield* Ref.set(stateRef, state);
      }),
  };
}

/**
 * Creates a Layer for an in-memory session store.
 *
 * Each call creates a new isolated store.
 *
 * @example
 * ```typescript
 * const testLayer = MemorySession.layer();
 *
 * const program = Effect.gen(function* () {
 *   const sessionStore = yield* SessionStore;
 *   const session = yield* sessionStore.create("Test task");
 *   return session;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
function layer(): Layer.Layer<SessionStore> {
  return Layer.effect(
    SessionStore,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make<SessionStoreState>(new Map());
      const counterRef = yield* Ref.make(0);
      return createMemorySessionStore(stateRef, counterRef);
    })
  );
}

/**
 * Default Live Layer for in-memory session store.
 *
 * Note: State is shared across all uses of this layer.
 * For isolated testing, use `MemorySession.layer()` instead.
 */
const Live = layer();

/**
 * MemorySession namespace containing the Live layer and factory.
 */
export const MemorySession = {
  Live,
  layer,
} as const;
