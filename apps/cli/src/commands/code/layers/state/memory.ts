import { Effect, Layer, Ref } from "effect";
import { StateStoreError } from "../../domain/errors.js";
import type { SessionState } from "../../domain/schemas/state.js";
import {
  StateStore,
  type StateStoreService,
} from "../../services/state-store.js";

/**
 * In-memory state store for testing.
 *
 * Uses a Map to store states in memory, making it suitable for unit tests.
 */
function makeMemoryStateStore(
  stateRef: Ref.Ref<Map<string, SessionState>>
): StateStoreService {
  return {
    write: (
      sessionId: string,
      state: SessionState
    ): Effect.Effect<void, StateStoreError> =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, (map) => {
          const newMap = new Map(map);
          newMap.set(sessionId, state);
          return newMap;
        });
      }),

    read: (sessionId: string): Effect.Effect<SessionState, StateStoreError> =>
      Effect.gen(function* () {
        const stateMap = yield* Ref.get(stateRef);
        const state = stateMap.get(sessionId);
        if (!state) {
          return yield* Effect.fail(
            new StateStoreError({
              message: `State not found for session: ${sessionId}`,
              operation: "read",
            })
          );
        }
        return state;
      }),
  };
}

/**
 * Creates a Layer for in-memory state store.
 *
 * @example
 * ```typescript
 * const testLayers = Layer.mergeAll(
 *   MemoryState.layer(),
 *   // ... other test layers
 * );
 * ```
 */
function layer() {
  return Layer.effect(
    StateStore,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make(new Map<string, SessionState>());
      return makeMemoryStateStore(stateRef);
    })
  );
}

/**
 * MemoryState namespace containing the layer factory.
 */
export const MemoryState = {
  layer,
} as const;
