import { spawn } from "node:child_process";
import { Effect, Layer, Stream } from "effect";
import type { LLMError } from "../../../domain/errors.js";
import type { LLMEvent } from "../../../domain/schemas/llm.js";
import {
  LLM,
  type LLMExecuteOptions,
  type LLMService,
} from "../../../services/llm.js";
import { createEventStream } from "../stream.js";
import type { Provider, ProviderName } from "../types.js";
import { checkProviderAvailable } from "./index.js";

/**
 * Claude CLI provider implementation.
 */
export const ClaudeProvider: Provider = {
  name: "claude" as ProviderName,

  execute: (
    prompt: string,
    options?: LLMExecuteOptions
  ): Stream.Stream<LLMEvent, LLMError> => {
    return Stream.unwrap(
      checkProviderAvailable("claude").pipe(
        Effect.map(() => {
          const child = spawn(
            "claude",
            [
              "--permission-mode",
              "acceptEdits",
              "--output-format",
              "stream-json",
              "--verbose",
              "--include-partial-messages",
              "-p",
              prompt,
            ],
            {
              stdio: ["inherit", "pipe", "pipe"],
              cwd: options?.cwd,
              env: {
                ...process.env,
                FORCE_COLOR: "1",
              },
            }
          );

          return createEventStream(child, "Claude");
        })
      )
    );
  },
};

/**
 * Claude CLI LLM service implementation.
 *
 * Spawns the `claude` CLI with stream-json output format and converts
 * the JSON stream into typed LLM events.
 */
const make: LLMService = ClaudeProvider;

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
export const Live = Layer.succeed(LLM, make);

/**
 * ClaudeCLI namespace containing the Live layer.
 */
export const ClaudeCLI = {
  Live,
  Provider: ClaudeProvider,
} as const;
