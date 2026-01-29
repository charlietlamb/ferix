import { Schema as S, type Stream } from "effect";
import type { LLMError } from "../../domain/errors.js";
import type { ProviderName } from "../../domain/schemas/config.js";
import { ProviderNameSchema } from "../../domain/schemas/config.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import type { LLMExecuteOptions } from "../../services/llm.js";

// Re-export ProviderName for convenience
export type { ProviderName } from "../../domain/schemas/config.js";

/**
 * Permission mode schema for CLI permission levels.
 */
const PermissionModeSchema = S.Literal("acceptEdits", "yolo", "prompt");

/**
 * Provider configuration schema with runtime validation.
 */
const ProviderConfigSchema = S.Struct({
  /** Provider name */
  name: ProviderNameSchema,
  /** CLI command to execute */
  cliCommand: S.String,
  /** Default arguments for the CLI */
  args: S.Array(S.String),
  /** Environment variables to pass */
  env: S.optional(S.Record({ key: S.String, value: S.String })),
  /** Permission mode for the CLI */
  permissions: S.optional(PermissionModeSchema),
  /** URL for installation instructions */
  installUrl: S.String,
});

/**
 * Configuration for a provider.
 */
type ProviderConfig = typeof ProviderConfigSchema.Type;

/**
 * Provider interface that all LLM implementations must satisfy.
 *
 * This interface abstracts the execution of prompts across different
 * AI CLI tools (Claude, Cursor, etc.).
 */
export interface Provider {
  /** Provider name for identification */
  readonly name: ProviderName;

  /**
   * Execute a prompt and return a stream of events.
   *
   * @param prompt - The prompt to send to the LLM
   * @param options - Optional execution options
   * @returns Stream of LLM events
   */
  readonly execute: (
    prompt: string,
    options?: LLMExecuteOptions
  ) => Stream.Stream<LLMEvent, LLMError>;
}

/**
 * Raw provider configurations (validated at module load time).
 */
const RAW_PROVIDER_CONFIGS = {
  claude: {
    name: "claude",
    cliCommand: "claude",
    args: [
      "--permission-mode",
      "acceptEdits",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
    ],
    permissions: "acceptEdits",
    installUrl: "https://docs.anthropic.com/claude-code",
  },
  cursor: {
    name: "cursor",
    cliCommand: "cursor-agent",
    args: ["--print", "--force", "--output-format", "stream-json"],
    permissions: "acceptEdits",
    installUrl: "https://cursor.sh/agent",
  },
  opencode: {
    name: "opencode",
    cliCommand: "opencode",
    args: ["run", "--format", "json"],
    installUrl: "https://opencode.ai/docs/",
  },
} as const;

/**
 * Provider configs record schema for validating the entire config object.
 */
const ProviderConfigsSchema = S.Record({
  key: ProviderNameSchema,
  value: ProviderConfigSchema,
});

/**
 * Validate provider configs at module load time.
 * This ensures all configs are valid and catches configuration errors early.
 */
const validateProviderConfigs = (): Record<ProviderName, ProviderConfig> => {
  const decoded = S.decodeUnknownSync(ProviderConfigsSchema)(
    RAW_PROVIDER_CONFIGS
  );
  return decoded as Record<ProviderName, ProviderConfig>;
};

/**
 * Default provider configurations.
 * Validated at module load time using Effect Schema.
 */
export const PROVIDER_CONFIGS: Readonly<Record<ProviderName, ProviderConfig>> =
  validateProviderConfigs();
