import { DateTime, Effect, Layer, Ref } from "effect";
import type { GuardrailsStoreError } from "../../domain/errors.js";
import type { Guardrail, GuardrailsFile } from "../../domain/index.js";
import {
  GuardrailsStore,
  type GuardrailsStoreService,
} from "../../services/guardrails-store.js";

/**
 * In-memory store type.
 */
type GuardrailsStoreState = Map<string, GuardrailsFile>;

/**
 * Creates an in-memory guardrails store service.
 *
 * Useful for testing without file system access.
 *
 * @param stateRef - Reference to the guardrails store state
 */
function createMemoryGuardrailsStore(
  stateRef: Ref.Ref<GuardrailsStoreState>
): GuardrailsStoreService {
  return {
    add: (
      sessionId: string,
      guardrail: Guardrail
    ): Effect.Effect<void, GuardrailsStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        let guardrails = state.get(sessionId);

        if (!guardrails) {
          const now = yield* DateTime.now;
          guardrails = {
            sessionId,
            createdAt: DateTime.formatIso(now),
            guardrails: [],
          };
        }

        // Create new guardrails with added entry (immutable update)
        const updatedGuardrails: GuardrailsFile = {
          ...guardrails,
          guardrails: [...guardrails.guardrails, guardrail],
        };

        state.set(sessionId, updatedGuardrails);
        yield* Ref.set(stateRef, state);
      }),

    load: (
      sessionId: string
    ): Effect.Effect<GuardrailsFile, GuardrailsStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const guardrails = state.get(sessionId);

        if (!guardrails) {
          // Return empty guardrails file if none exists
          const now = yield* DateTime.now;
          return {
            sessionId,
            createdAt: DateTime.formatIso(now),
            guardrails: [],
          };
        }

        return guardrails;
      }),

    getActive: (
      sessionId: string
    ): Effect.Effect<readonly Guardrail[], GuardrailsStoreError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const guardrails = state.get(sessionId);

        if (!guardrails) {
          return [];
        }

        return guardrails.guardrails;
      }),
  };
}

/**
 * Creates a Layer for an in-memory guardrails store.
 *
 * Each call creates a new isolated store.
 *
 * @example
 * ```typescript
 * const testLayer = MemoryGuardrails.layer();
 *
 * const program = Effect.gen(function* () {
 *   const guardrailsStore = yield* GuardrailsStore;
 *   yield* guardrailsStore.add(sessionId, guardrail);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
export function layer(): Layer.Layer<GuardrailsStore> {
  return Layer.effect(
    GuardrailsStore,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make<GuardrailsStoreState>(new Map());
      return createMemoryGuardrailsStore(stateRef);
    })
  );
}

/**
 * Default Live Layer for in-memory guardrails store.
 *
 * Note: State is shared across all uses of this layer.
 * For isolated testing, use `MemoryGuardrails.layer()` instead.
 */
export const Live = layer();

/**
 * MemoryGuardrails namespace containing the Live layer and factory.
 */
export const MemoryGuardrails = {
  Live,
  layer,
} as const;
