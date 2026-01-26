import { Layer } from "effect";
import type { ProviderName } from "../domain/schemas/config.js";
import { FileSystemGit } from "./git/file-system.js";
import { MemoryGit } from "./git/memory.js";
import { FileSystemGuardrails } from "./guardrails/file-system.js";
import { MemoryGuardrails } from "./guardrails/memory.js";
import { Mock } from "./llm/mock.js";
import { ClaudeCLI, createProviderLayer } from "./llm/providers/index.js";
import { FileSystemPlan } from "./plan/file-system.js";
import { MemoryPlan } from "./plan/memory.js";
import { FileSystemProgress } from "./progress/file-system.js";
import { MemoryProgress } from "./progress/memory.js";
import { FileSystemSession } from "./session/file-system.js";
import { MemorySession } from "./session/memory.js";
import { FerixParser } from "./signal/ferix-parser.js";

export { FileSystemGit } from "./git/file-system.js";
export { MemoryGit } from "./git/memory.js";
export { FileSystemGuardrails } from "./guardrails/file-system.js";
export { MemoryGuardrails } from "./guardrails/memory.js";
export { Mock, Mock as MockLLM } from "./llm/mock.js";
export {
  ClaudeCLI,
  CursorCLI,
  createProviderLayer,
} from "./llm/providers/index.js";
// Re-export types
export type { Provider, ProviderConfig } from "./llm/types.js";
export { PROVIDER_CONFIGS } from "./llm/types.js";
export { FileSystemPlan } from "./plan/file-system.js";
export { MemoryPlan } from "./plan/memory.js";
export { FileSystemProgress } from "./progress/file-system.js";
export { MemoryProgress } from "./progress/memory.js";
export { FileSystemSession } from "./session/file-system.js";
export { MemorySession } from "./session/memory.js";
export { FerixParser } from "./signal/ferix-parser.js";

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

/**
 * Test layer bundle.
 *
 * Uses mock/in-memory implementations:
 * - Mock LLM (configurable events)
 * - Ferix parser (real implementation - pure)
 * - In-memory plan, session, progress, guardrails, and git storage
 *
 * @example
 * ```typescript
 * const testProgram = runLoop(config);
 *
 * const result = await Effect.runPromise(
 *   testProgram.pipe(
 *     Stream.runCollect,
 *     Effect.provide(TestLayers)
 *   )
 * );
 *
 * expect(result).toContainEqual({ _tag: "LoopCompleted", ... });
 * ```
 */
export const TestLayers = Layer.mergeAll(
  Mock.Live,
  FerixParser.Live,
  MemoryPlan.Live,
  MemorySession.Live,
  MemoryProgress.Live,
  MemoryGuardrails.Live,
  MemoryGit.Live
);

/**
 * Creates a test layer bundle with custom mock LLM events.
 *
 * @param events - Events to emit from the mock LLM
 * @returns A layer bundle for testing with the specified events
 *
 * @example
 * ```typescript
 * const customTestLayers = createTestLayers([
 *   { _tag: "Text", text: "<ferix:tasks>...</ferix:tasks>" },
 *   { _tag: "Done", output: "..." },
 * ]);
 *
 * Effect.runPromise(program.pipe(Effect.provide(customTestLayers)));
 * ```
 */
export function createTestLayers(
  events: Parameters<typeof Mock.layer>[0]["events"]
) {
  return Layer.mergeAll(
    Mock.layer({ events }),
    FerixParser.Live,
    MemoryPlan.layer(),
    MemorySession.layer(),
    MemoryProgress.layer(),
    MemoryGuardrails.layer(),
    MemoryGit.layer()
  );
}
