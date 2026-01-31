import { Effect, Layer, Ref } from "effect";
import type { PromptStoreError } from "../../domain/errors.js";
import {
  PromptStore,
  type PromptStoreService,
} from "../../services/prompt-store.js";

/**
 * Default mock prompt template content for testing.
 */
const MOCK_PROMPT_TEMPLATE = `# Test Prompt Template

This is a mock prompt template for testing.

## Instructions
Follow the test instructions.

## Signal Format
Use test signals.
`;

/**
 * In-memory prompt store for testing.
 *
 * Returns a fixed mock template for all read operations.
 */
function makeMemoryPromptStore(
  templateRef: Ref.Ref<Map<string, string>>
): PromptStoreService {
  return {
    copyTemplate: (sessionId: string): Effect.Effect<void, PromptStoreError> =>
      Effect.gen(function* () {
        yield* Ref.update(templateRef, (map) => {
          const newMap = new Map(map);
          newMap.set(sessionId, MOCK_PROMPT_TEMPLATE);
          return newMap;
        });
      }),

    read: (sessionId: string): Effect.Effect<string, PromptStoreError> =>
      Effect.gen(function* () {
        const templateMap = yield* Ref.get(templateRef);
        const template = templateMap.get(sessionId);
        // Fall back to bundled template if not found
        return template ?? MOCK_PROMPT_TEMPLATE;
      }),

    getBundledTemplate: (): Effect.Effect<string, PromptStoreError> =>
      Effect.succeed(MOCK_PROMPT_TEMPLATE),
  };
}

/**
 * Creates a Layer for in-memory prompt store.
 *
 * @example
 * ```typescript
 * const testLayers = Layer.mergeAll(
 *   MemoryPrompt.layer(),
 *   // ... other test layers
 * );
 * ```
 */
function layer() {
  return Layer.effect(
    PromptStore,
    Effect.gen(function* () {
      const templateRef = yield* Ref.make(new Map<string, string>());
      return makeMemoryPromptStore(templateRef);
    })
  );
}

/**
 * MemoryPrompt namespace containing the layer factory.
 */
export const MemoryPrompt = {
  layer,
} as const;
