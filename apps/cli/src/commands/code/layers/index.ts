import { Layer } from "effect";
import type { ProviderName } from "../domain/schemas/config.js";
import { FileSystemGit } from "./git/file-system.js";
import { FileSystemGuardrails } from "./guardrails/file-system.js";
import { ClaudeCLI, createProviderLayer } from "./llm/providers/index.js";
import { FileSystemPlan } from "./plan/file-system.js";
import { FileSystemProgress } from "./progress/file-system.js";
import { FileSystemSession } from "./session/file-system.js";
import { FerixParser } from "./signal/ferix-parser.js";
// Re-export types

/**
 * Production layer bundle.
 *
 * Uses real implementations:
 * - Claude CLI for LLM (default)
 * - Ferix parser for signals
 * - File system for plan, session, progress, guardrails, and git storage
 *
 * @example
 * ```typescript
 * const program = runLoop(config);
 *
 * Effect.runPromise(
 *   program.pipe(
 *     Stream.runForEach(console.log),
 *     Effect.provide(ProductionLayers)
 *   )
 * );
 * ```
 */
export const ProductionLayers = Layer.mergeAll(
  ClaudeCLI.Live,
  FerixParser.Live,
  FileSystemPlan.Live,
  FileSystemSession.Live,
  FileSystemProgress.Live,
  FileSystemGuardrails.Live,
  FileSystemGit.Live
);

/**
 * Creates production layers with a specific LLM provider.
 *
 * @param provider - The provider name to use (defaults to "claude")
 * @returns A layer bundle with the specified provider
 *
 * @example
 * ```typescript
 * // Use Cursor instead of Claude
 * const layers = createProductionLayers("cursor");
 *
 * Effect.runPromise(
 *   program.pipe(
 *     Stream.runForEach(console.log),
 *     Effect.provide(layers)
 *   )
 * );
 * ```
 */
export function createProductionLayers(provider: ProviderName = "claude") {
  const llmLayer = createProviderLayer(provider);

  return Layer.mergeAll(
    llmLayer,
    FerixParser.Live,
    FileSystemPlan.Live,
    FileSystemSession.Live,
    FileSystemProgress.Live,
    FileSystemGuardrails.Live,
    FileSystemGit.Live
  );
}
