import { createProvider, createProviderLayer } from "../provider-factory.js";
import { createEventStream } from "../stream.js";
import type { Provider } from "../types.js";
import { checkProviderAvailable } from "./index.js";

/**
 * Cursor Agent CLI provider implementation.
 *
 * Uses the Cursor Agent CLI to execute prompts.
 * The output format is stream-json, similar to Claude CLI.
 */
const CursorProvider: Provider = createProvider(
  "cursor",
  (child) => createEventStream(child, "Cursor"),
  checkProviderAvailable
);

/**
 * Live Layer for the Cursor Agent CLI LLM service.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute(prompt).pipe(Stream.runCollect);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(CursorCLI.Live)));
 * ```
 */
const Live = createProviderLayer(CursorProvider);

/**
 * CursorCLI namespace containing the Live layer.
 */
export const CursorCLI = {
  Live,
  Provider: CursorProvider,
} as const;
