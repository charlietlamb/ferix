import { createProvider, createProviderLayer } from "../provider-factory.js";
import { createEventStream } from "../stream.js";
import type { Provider } from "../types.js";
import { checkProviderAvailable } from "./index.js";

/**
 * Claude CLI provider implementation.
 */
const ClaudeProvider: Provider = createProvider(
  "claude",
  (child) => createEventStream(child, "Claude"),
  checkProviderAvailable
);

/**
 * Live Layer for the Claude CLI LLM service.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute(prompt).pipe(Stream.runCollect);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(ClaudeCLI.Live)));
 * ```
 */
const Live = createProviderLayer(ClaudeProvider);

/**
 * ClaudeCLI namespace containing the Live layer.
 */
export const ClaudeCLI = {
  Live,
  Provider: ClaudeProvider,
} as const;
