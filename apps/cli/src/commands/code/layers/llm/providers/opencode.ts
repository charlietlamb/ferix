import { createProvider, createProviderLayer } from "../provider-factory.js";
import { createOpenCodeEventStream } from "../stream-opencode.js";
import type { Provider } from "../types.js";
import { checkProviderAvailable } from "./index.js";

/**
 * OpenCode CLI provider implementation.
 *
 * Uses the OpenCode CLI to execute prompts.
 * OpenCode uses a different output format than Claude/Cursor:
 * - Format flag: `--format json` instead of `--output-format stream-json`
 * - Prompt is passed as a positional argument, not with `-p`
 * - Event types: `text`, `step_start`, `step_finish`
 */
export const OpenCodeProvider: Provider = createProvider(
  "opencode",
  (child) => createOpenCodeEventStream(child, "OpenCode"),
  checkProviderAvailable
);

/**
 * Live Layer for the OpenCode CLI LLM service.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute(prompt).pipe(Stream.runCollect);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(OpenCodeCLI.Live)));
 * ```
 */
export const Live = createProviderLayer(OpenCodeProvider);

/**
 * OpenCodeCLI namespace containing the Live layer.
 */
export const OpenCodeCLI = {
  Live,
  Provider: OpenCodeProvider,
} as const;
