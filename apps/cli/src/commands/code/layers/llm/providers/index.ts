import { Effect, type Layer } from "effect";
import { LLMError } from "../../../domain/errors.js";
import type { LLM } from "../../../services/llm.js";
import {
  PROVIDER_CONFIGS,
  type Provider,
  type ProviderName,
} from "../types.js";
import { ClaudeCLI, ClaudeProvider } from "./claude.js";
import { CursorCLI, CursorProvider } from "./cursor.js";
import {
  OpenCodeCLI as _OpenCodeCLI,
  OpenCodeProvider as _OpenCodeProvider,
} from "./opencode.js";

export { ClaudeCLI, ClaudeProvider } from "./claude.js";
export { CursorCLI, CursorProvider } from "./cursor.js";
export { OpenCodeCLI, OpenCodeProvider } from "./opencode.js";

// Re-aliased for internal use to avoid lint rule "noExportedImports"
const OpenCodeCLI = _OpenCodeCLI;
const OpenCodeProvider = _OpenCodeProvider;

/**
 * Registry of all available providers.
 */
export const PROVIDERS: Readonly<Record<ProviderName, Provider>> = {
  claude: ClaudeProvider,
  cursor: CursorProvider,
  opencode: OpenCodeProvider,
};

/**
 * Checks if a CLI command is available in the system PATH.
 *
 * @param command - The command to check
 * @returns Effect that succeeds with true if available, false otherwise
 */
export function isCommandAvailable(
  command: string
): Effect.Effect<boolean, never> {
  return Effect.tryPromise({
    try: async () => {
      const { execSync } = await import("node:child_process");
      try {
        execSync(`which ${command}`, { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
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
 * Gets a provider by name.
 *
 * @param name - The provider name
 * @returns Effect that succeeds with the provider or fails with LLMError
 */
export function getProvider(
  name: ProviderName
): Effect.Effect<Provider, LLMError> {
  const provider = PROVIDERS[name];
  if (!provider) {
    return Effect.fail(new LLMError({ message: `Unknown provider: ${name}` }));
  }
  return Effect.succeed(provider);
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

/**
 * Detects available providers on the system.
 *
 * @returns Effect that succeeds with an array of available provider names
 */
export function detectAvailableProviders(): Effect.Effect<
  readonly ProviderName[],
  never
> {
  const providerNames = Object.keys(PROVIDER_CONFIGS) as ProviderName[];

  const checks = providerNames.map((name) => {
    const config = PROVIDER_CONFIGS[name];
    return isCommandAvailable(config.cliCommand).pipe(
      Effect.map((available): ProviderName | null => (available ? name : null))
    );
  });

  return Effect.all(checks).pipe(
    Effect.map((results) =>
      results.filter((name): name is ProviderName => name !== null)
    )
  );
}
