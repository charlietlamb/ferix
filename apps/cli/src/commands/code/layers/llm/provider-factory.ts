import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { Effect, Layer, Stream } from "effect";
import type { LLMError } from "../../domain/errors.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import { LLM, type LLMExecuteOptions } from "../../services/llm.js";
import type { Provider, ProviderName } from "./types.js";
import { PROVIDER_CONFIGS } from "./types.js";

/**
 * Creates a provider using the configuration from PROVIDER_CONFIGS.
 *
 * @param name - The provider name
 * @param createStream - Function to create the event stream from a child process
 * @param checkAvailable - Function to check if the provider is available
 */
export function createProvider(
  name: ProviderName,
  createStream: (child: ChildProcess) => Stream.Stream<LLMEvent, LLMError>,
  checkAvailable: (name: ProviderName) => Effect.Effect<void, LLMError>
): Provider {
  const config = PROVIDER_CONFIGS[name];

  return {
    name,

    execute: (
      prompt: string,
      options?: LLMExecuteOptions
    ): Stream.Stream<LLMEvent, LLMError> => {
      return Stream.unwrap(
        checkAvailable(name).pipe(
          Effect.map(() => {
            // Build args array: config args + prompt
            // OpenCode uses positional argument, Claude/Cursor use -p flag
            const args =
              name === "opencode"
                ? [...config.args, prompt]
                : [...config.args, "-p", prompt];

            const child = spawn(config.cliCommand, args, {
              stdio: ["inherit", "pipe", "pipe"],
              cwd: options?.cwd,
              env: {
                ...process.env,
                FORCE_COLOR: "1",
                ...config.env,
              },
            });

            return createStream(child);
          })
        )
      );
    },
  };
}

/**
 * Creates a Live Layer for a provider.
 */
export function createProviderLayer(provider: Provider): Layer.Layer<LLM> {
  return Layer.succeed(LLM, provider);
}
