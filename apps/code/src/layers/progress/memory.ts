import { DateTime, Effect, Layer, Ref } from "effect";
import type { ProgressStoreError } from "../../domain/errors.js";
import type { ProgressEntry, ProgressFile } from "../../domain/index.js";
import {
  ProgressStore,
  type ProgressStoreService,
} from "../../services/progress-store.js";

/**
 * In-memory store type.
 */
type ProgressStoreState = Map<string, ProgressFile>;

/**
 * Creates an in-memory progress store service.
 *
 * Useful for testing without file system access.
 *
 * @param stateRef - Reference to the progress store state
 */
function createMemoryProgressStore(
  stateRef: Ref.Ref<ProgressStoreState>
): ProgressStoreService {
  return {
    append: (
      sessionId: string,
      entry: ProgressEntry
    ): Effect.Effect<void, ProgressStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        let progress = state.get(sessionId);

        if (!progress) {
          const now = yield* DateTime.now;
          progress = {
            sessionId,
            createdAt: DateTime.formatIso(now),
            entries: [],
          };
        }

        // Create new progress with appended entry (immutable update)
        const updatedProgress: ProgressFile = {
          ...progress,
          entries: [...progress.entries, entry],
        };

        state.set(sessionId, updatedProgress);
        yield* Ref.set(stateRef, state);
      }),

    load: (
      sessionId: string
    ): Effect.Effect<ProgressFile, ProgressStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const progress = state.get(sessionId);

        if (!progress) {
          // Return empty progress file if none exists
          const now = yield* DateTime.now;
          return {
            sessionId,
            createdAt: DateTime.formatIso(now),
            entries: [],
          };
        }

        return progress;
      }),

    getRecent: (
      sessionId: string,
      count: number
    ): Effect.Effect<readonly ProgressEntry[], ProgressStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const progress = state.get(sessionId);

        if (!progress) {
          return [];
        }

        return progress.entries.slice(-count);
      }),
  };
}

/**
 * Creates a Layer for an in-memory progress store.
 *
 * Each call creates a new isolated store.
 *
 * @example
 * ```typescript
 * const testLayer = MemoryProgress.layer();
 *
 * const program = Effect.gen(function* () {
 *   const progressStore = yield* ProgressStore;
 *   yield* progressStore.append(sessionId, entry);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
export function layer(): Layer.Layer<ProgressStore> {
  return Layer.effect(
    ProgressStore,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make<ProgressStoreState>(new Map());
      return createMemoryProgressStore(stateRef);
    })
  );
}

/**
 * Default Live Layer for in-memory progress store.
 *
 * Note: State is shared across all uses of this layer.
 * For isolated testing, use `MemoryProgress.layer()` instead.
 */
export const Live = layer();

/**
 * MemoryProgress namespace containing the Live layer and factory.
 */
export const MemoryProgress = {
  Live,
  layer,
} as const;
