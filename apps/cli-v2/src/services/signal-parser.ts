import { Context, type Effect } from "effect";
import type { ParseError } from "../domain/errors.js";
import type { Signal } from "../domain/signals.js";

/**
 * Accumulator for parsing signals across multiple text chunks.
 *
 * LLM output arrives in chunks, and signals may span multiple chunks.
 * The accumulator buffers text and extracts complete signals.
 */
export interface SignalAccumulator {
  /**
   * Feed a text chunk to the accumulator.
   *
   * @param text - Text chunk from LLM output
   * @returns Array of complete signals found in the accumulated text
   */
  readonly feed: (text: string) => Effect.Effect<readonly Signal[], ParseError>;

  /**
   * Flush any remaining buffered text and extract final signals.
   *
   * Call this when the LLM stream ends to ensure no signals are lost.
   *
   * @returns Array of signals found in remaining buffer
   */
  readonly flush: () => Effect.Effect<readonly Signal[], ParseError>;
}

/**
 * Service interface for parsing signals from LLM output.
 *
 * Signals are structured XML-like tags embedded in LLM output:
 * - `<ferix:tasks>...</ferix:tasks>` - Task definitions
 * - `<ferix:phase-start id="1.1"/>` - Phase lifecycle
 * - `<ferix:criterion-passed id="1.c1"/>` - Criterion verification
 *
 * @example
 * ```typescript
 * const parser = yield* SignalParser;
 * const accumulator = yield* parser.createAccumulator();
 *
 * for (const chunk of textChunks) {
 *   const signals = yield* accumulator.feed(chunk);
 *   for (const signal of signals) {
 *     // Handle signal
 *   }
 * }
 *
 * const finalSignals = yield* accumulator.flush();
 * ```
 */
export interface SignalParserService {
  /**
   * Parse a complete text and extract all signals.
   *
   * Use this for parsing complete output. For streaming, use createAccumulator.
   *
   * @param text - Complete text to parse
   * @returns Array of signals found in the text
   */
  readonly parse: (
    text: string
  ) => Effect.Effect<readonly Signal[], ParseError>;

  /**
   * Create a stateful accumulator for streaming signal parsing.
   *
   * The accumulator handles partial signals that span multiple chunks.
   *
   * @returns An accumulator instance for incremental parsing
   */
  readonly createAccumulator: () => Effect.Effect<SignalAccumulator>;
}

/**
 * Effect Tag for the SignalParser service.
 *
 * Use this tag to depend on signal parsing without coupling to a specific implementation.
 */
export class SignalParser extends Context.Tag("@ferix/SignalParser")<
  SignalParser,
  SignalParserService
>() {}
