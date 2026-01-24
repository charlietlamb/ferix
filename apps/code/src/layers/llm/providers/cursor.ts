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
 * Cursor Agent CLI provider implementation.
 *
 * Uses the Cursor Agent CLI to execute prompts.
 * The output format is stream-json, similar to Claude CLI.
 */
export const CursorProvider: Provider = {
  name: "cursor" as ProviderName,

  execute: (
    prompt: string,
    options?: LLMExecuteOptions
  ): Stream.Stream<LLMEvent, LLMError> => {
    return Stream.unwrap(
      checkProviderAvailable("cursor").pipe(
        Effect.map(() => {
          const child = spawn(
            "cursor-agent",
            [
              "--print",
              "--force",
              "--output-format",
              "stream-json",
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

          return createEventStream(child, "Cursor");
        })
      )
    );
  },
};

/**
 * Cursor Agent CLI LLM service implementation.
 *
 * Spawns the `cursor-agent` CLI with stream-json output format and converts
 * the JSON stream into typed LLM events.
 */
const make: LLMService = CursorProvider;

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
export const Live = Layer.succeed(LLM, make);

/**
 * CursorCLI namespace containing the Live layer.
 */
export const CursorCLI = {
  Live,
  Provider: CursorProvider,
} as const;
