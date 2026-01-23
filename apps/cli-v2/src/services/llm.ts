import { Context, type Stream } from "effect";
import type { LLMError } from "../domain/errors.js";

/**
 * Raw event emitted by an LLM provider during execution.
 * These are provider-level events, before signal parsing.
 */
export type LLMEvent =
  | { readonly _tag: "Text"; readonly text: string }
  | { readonly _tag: "ToolStart"; readonly tool: string }
  | { readonly _tag: "ToolUse"; readonly tool: string; readonly input: unknown }
  | { readonly _tag: "ToolEnd"; readonly tool: string }
  | { readonly _tag: "Done"; readonly output: string };

/**
 * Service interface for LLM execution.
 *
 * Implementations include:
 * - ClaudeCLI: Spawns `claude` CLI with stream-json output
 * - Mock: Returns predefined events for testing
 *
 * @example
 * ```typescript
 * const llm = yield* LLM;
 * const events = llm.execute("Fix the bug in main.ts");
 *
 * await events.pipe(
 *   Stream.runForEach((event) => console.log(event)),
 *   Effect.runPromise
 * );
 * ```
 */
export interface LLMService {
  /**
   * Execute a prompt and return a stream of events.
   *
   * The stream emits events in real-time as the LLM produces output.
   * The final event will be a "Done" event containing the full output.
   *
   * @param prompt - The prompt to send to the LLM
   * @returns Stream of LLM events that can be consumed by any subscriber
   */
  readonly execute: (prompt: string) => Stream.Stream<LLMEvent, LLMError>;
}

/**
 * Effect Tag for the LLM service.
 *
 * Use this tag to depend on an LLM implementation without coupling to a specific provider.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute(prompt).pipe(Stream.runCollect);
 * });
 *
 * // Provide different implementations
 * program.pipe(Effect.provide(ClaudeCLI.Live));  // Production
 * program.pipe(Effect.provide(Mock.Live));       // Testing
 * ```
 */
export class LLM extends Context.Tag("@ferix/LLM")<LLM, LLMService>() {}
