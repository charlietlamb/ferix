import { Layer } from "effect";
import type { LLMEvent } from "../../src/commands/code/domain/schemas/llm.js";
import type { Plan } from "../../src/commands/code/domain/schemas/plan.js";
import type { Session } from "../../src/commands/code/domain/schemas/session.js";
import { MemoryGit } from "../../src/commands/code/layers/git/memory.js";
import { MemoryGuardrails } from "../../src/commands/code/layers/guardrails/memory.js";
import { Mock } from "../../src/commands/code/layers/llm/mock.js";
import { MemoryPlan } from "../../src/commands/code/layers/plan/memory.js";
import { MemoryProgress } from "../../src/commands/code/layers/progress/memory.js";
import { MemorySession } from "../../src/commands/code/layers/session/memory.js";
import { FerixParser } from "../../src/commands/code/layers/signal/ferix-parser.js";

/**
 * Options for creating test layers.
 */
export interface TestLayerOptions {
  /** LLM events to emit during testing */
  events?: LLMEvent[];
  /** Initial plan state (for pre-seeded tests) */
  initialPlan?: Plan;
  /** Initial session state (for pre-seeded tests) */
  initialSession?: Session;
  /** Optional delay between LLM events in milliseconds */
  delayMs?: number;
}

/**
 * Creates a composed Layer with all services needed for testing.
 *
 * This provides:
 * - Mock LLM that emits specified events
 * - In-memory session store
 * - In-memory plan store
 * - In-memory progress store
 * - In-memory guardrails store
 * - In-memory git service
 * - Ferix signal parser
 *
 * @param options - Configuration options for the test layers
 * @returns A composed Layer with all test services
 *
 * @example
 * ```typescript
 * const testLayers = createTestLayers({
 *   events: [
 *     { _tag: "Text", text: "Hello" },
 *     { _tag: "Done", output: "Hello" },
 *   ],
 * });
 *
 * const program = myEffect.pipe(Effect.provide(testLayers));
 * await Effect.runPromise(program);
 * ```
 */
export function createTestLayers(options: TestLayerOptions = {}) {
  const { events = [], delayMs } = options;

  return Layer.mergeAll(
    Mock.layer({ events, delayMs }),
    MemorySession.layer(),
    MemoryPlan.layer(),
    MemoryProgress.layer(),
    MemoryGuardrails.layer(),
    MemoryGit.layer(),
    FerixParser.Live
  );
}

/**
 * Creates minimal test layers with only the LLM and signal parser.
 *
 * Use this for unit tests that don't need the full service stack.
 *
 * @param events - LLM events to emit
 * @returns A Layer with LLM and signal parser only
 */
export function createMinimalTestLayers(events: LLMEvent[] = []) {
  return Layer.mergeAll(Mock.layer({ events }), FerixParser.Live);
}

/**
 * Creates test layers without the LLM service.
 *
 * Use this for testing store operations in isolation.
 *
 * @returns A Layer with all stores and signal parser
 */
export function createStoreTestLayers() {
  return Layer.mergeAll(
    MemorySession.layer(),
    MemoryPlan.layer(),
    MemoryProgress.layer(),
    MemoryGuardrails.layer(),
    MemoryGit.layer(),
    FerixParser.Live
  );
}
