import { Effect, Layer, Schema as S, Stream } from "effect";
import { type LLMEvent, LLMEventSchema } from "../../domain/schemas/llm.js";
import { LLM, type LLMService } from "../../services/llm.js";

/**
 * Schema for MockLLMConfig for runtime validation.
 */
export const MockLLMConfigSchema = S.Struct({
  events: S.Array(LLMEventSchema),
  delayMs: S.optional(S.Number),
});
export type MockLLMConfig = typeof MockLLMConfigSchema.Type;

/**
 * Creates a mock LLM service that emits predefined events.
 *
 * Useful for testing without making real LLM calls.
 *
 * @param config - Configuration specifying events to emit
 * @returns An LLMService that emits the configured events
 *
 * @example
 * ```typescript
 * const mockLLM = createMockLLM({
 *   events: [
 *     { _tag: "Text", text: "Hello " },
 *     { _tag: "Text", text: "World!" },
 *     { _tag: "Done", output: "Hello World!" },
 *   ],
 * });
 * ```
 */
export function createMockLLM(config: MockLLMConfig): LLMService {
  return {
    execute: (_prompt: string, _options?): Stream.Stream<LLMEvent, never> => {
      const baseStream = Stream.fromIterable(config.events);

      if (config.delayMs !== undefined && config.delayMs > 0) {
        const delay = config.delayMs;
        return baseStream.pipe(Stream.tap(() => Effect.sleep(delay)));
      }

      return baseStream;
    },
  };
}

/**
 * Default mock events for testing.
 */
const defaultMockEvents: readonly LLMEvent[] = [
  { _tag: "Text", text: "Processing task...\n" },
  { _tag: "ToolStart", tool: "Read" },
  { _tag: "ToolEnd", tool: "Read" },
  { _tag: "Text", text: "Task completed successfully.\n" },
  {
    _tag: "Done",
    output: "Processing task...\nTask completed successfully.\n",
  },
];

/**
 * Default mock LLM service for simple testing.
 */
const defaultMock: LLMService = createMockLLM({ events: defaultMockEvents });

/**
 * Live Layer for the mock LLM service with default events.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute("test").pipe(Stream.runCollect);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(Mock.Live)));
 * ```
 */
export const Live = Layer.succeed(LLM, defaultMock);

/**
 * Creates a Layer with custom mock events.
 *
 * @param config - Configuration specifying events to emit
 * @returns A Layer providing the configured mock LLM
 *
 * @example
 * ```typescript
 * const customMockLayer = Mock.layer({
 *   events: [
 *     { _tag: "Text", text: "<ferix:tasks><task id=\"1\">Test</task></ferix:tasks>" },
 *     { _tag: "Done", output: "..." },
 *   ],
 * });
 * ```
 */
export function layer(config: MockLLMConfig): Layer.Layer<LLM> {
  return Layer.succeed(LLM, createMockLLM(config));
}

/**
 * Mock namespace containing the Live layer and factory functions.
 */
export const Mock = {
  Live,
  layer,
  createMockLLM,
} as const;
