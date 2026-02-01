import { execSync } from "node:child_process";
import { Effect, type Layer } from "effect";
import { LLMError } from "../../../domain/errors.js";
import type { LLM } from "../../../services/llm.js";
import { PROVIDER_CONFIGS, type ProviderName } from "../types.js";
import { ClaudeCLI } from "./claude.js";
import { CursorCLI } from "./cursor.js";
import { OpenCodeCLI as _OpenCodeCLI } from "./opencode.js";

export { ClaudeCLI } from "./claude.js";

// Re-aliased for internal use to avoid lint rule "noExportedImports"
const OpenCodeCLI = _OpenCodeCLI;

/**
 * Checks if a CLI command is available in the system PATH.
 *
 * @param command - The command to check
 * @returns Effect that succeeds with true if available, false otherwise
 */
function isCommandAvailable(command: string): Effect.Effect<boolean, never> {
  return Effect.try({
    try: () => {
      execSync(`which ${command}`, { stdio: "ignore" });
      return true;
    },
    catch: () => false,
  }).pipe(Effect.orElseSucceed(() => false));
}

/**
 * Checks if a provider's CLI is available and returns a user-friendly error if not.
 *
 * @param name - The provider name to check
 * @returns Effect that succeeds if CLI is available, fails with helpful error if not
 */
export function checkProviderAvailable(
  name: ProviderName
): Effect.Effect<void, LLMError> {
  const config = PROVIDER_CONFIGS[name];
  return isCommandAvailable(config.cliCommand).pipe(
    Effect.flatMap((available) =>
      available
        ? Effect.void
        : Effect.fail(
            new LLMError({
              message: `Provider "${name}" is not available. The CLI command "${config.cliCommand}" was not found.

To use this provider, install it first:
  ${config.installUrl}`,
            })
          )
    )
  );
}

/**
 * Creates a Layer for the specified provider.
 *
 * @param name - The provider name
 * @returns Layer providing the LLM service
 */
export function createProviderLayer(name: ProviderName): Layer.Layer<LLM> {
  switch (name) {
    case "claude":
      return ClaudeCLI.Live;
    case "cursor":
      return CursorCLI.Live;
    case "opencode":
      return OpenCodeCLI.Live;
    default: {
      // Exhaustive check
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
