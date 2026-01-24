import type { Stream } from "effect";
import type { LLMError } from "../../domain/errors.js";
import type { ProviderName } from "../../domain/schemas/config.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import type { LLMExecuteOptions } from "../../services/llm.js";

// Re-export ProviderName for convenience
export type { ProviderName } from "../../domain/schemas/config.js";

/**
 * Configuration for a provider.
 */
export interface ProviderConfig {
  /** Provider name */
  readonly name: ProviderName;
  /** CLI command to execute */
  readonly cliCommand: string;
  /** Default arguments for the CLI */
  readonly args: readonly string[];
  /** Environment variables to pass */
  readonly env?: Readonly<Record<string, string>>;
  /** Permission mode for the CLI */
  readonly permissions?: "acceptEdits" | "yolo" | "prompt";
  /** URL for installation instructions */
  readonly installUrl: string;
}

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
 * Default provider configurations.
 */
export const PROVIDER_CONFIGS: Readonly<Record<ProviderName, ProviderConfig>> =
  {
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
  } as const;
