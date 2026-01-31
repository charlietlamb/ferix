import { Effect, Layer, Ref } from "effect";
import type { ParseError } from "../../domain/errors.js";
import type { Signal } from "../../domain/index.js";
import {
  type SignalAccumulator,
  SignalParser,
  type SignalParserService,
} from "../../services/signal-parser.js";
import { signalSpecRegistry } from "./specs/index.js";

/**
 * Maximum buffer size in characters (1MB assuming ~1 byte per char).
 * If exceeded, the buffer will be truncated from the beginning.
 */
const MAX_BUFFER_SIZE = 1024 * 1024;

/**
 * Creates a signal accumulator for streaming parsing.
 * Uses chunked buffer approach to avoid O(n) string concatenation per chunk.
 * Prunes processed content to prevent unbounded memory growth.
 */
function createAccumulatorImpl(): Effect.Effect<SignalAccumulator> {
  return Effect.gen(function* () {
    const chunksRef = yield* Ref.make<string[]>([]);
    const emittedRef = yield* Ref.make<Set<string>>(new Set());

    const feed = (text: string): Effect.Effect<readonly Signal[], ParseError> =>
      Effect.gen(function* () {
        const chunks = yield* Ref.get(chunksRef);
        chunks.push(text);
        const buffer = chunks.join("");
        if (buffer.length > MAX_BUFFER_SIZE) {
          yield* Ref.set(chunksRef, [
            buffer.slice(buffer.length - MAX_BUFFER_SIZE),
          ]);
        }
        const signals = signalSpecRegistry.parseAll(buffer);
        const emitted = yield* Ref.get(emittedRef);
        const newSignals = signals.filter((signal) => {
          const key = signalSpecRegistry.getSignalKey(signal);
          if (emitted.has(key)) {
            return false;
          }
          emitted.add(key);
          return true;
        });
        if (newSignals.length > 0) {
          const lastEndPos =
            signalSpecRegistry.findLastCompleteSignalEnd(buffer);
          if (lastEndPos > 0 && lastEndPos < buffer.length) {
            yield* Ref.set(chunksRef, [buffer.slice(lastEndPos)]);
          }
        }
        yield* Ref.set(emittedRef, emitted);
        return newSignals;
      });

    const flush = (): Effect.Effect<readonly Signal[], ParseError> =>
      Effect.gen(function* () {
        const chunks = yield* Ref.get(chunksRef);
        const buffer = chunks.join("");
        yield* Ref.set(chunksRef, []);
        const emitted = yield* Ref.get(emittedRef);
        const signals = signalSpecRegistry.parseAll(buffer);
        const result = signals.filter(
          (signal) => !emitted.has(signalSpecRegistry.getSignalKey(signal))
        );
        yield* Ref.set(emittedRef, new Set());
        return result;
      });

    return { feed, flush };
  });
}

/**
 * Ferix signal parser service implementation.
 */
const make: SignalParserService = {
  parse: (text: string): Effect.Effect<readonly Signal[], ParseError> =>
    Effect.succeed(signalSpecRegistry.parseAll(text)),
  createAccumulator: createAccumulatorImpl,
};

/**
 * Live Layer for the Ferix signal parser.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const parser = yield* SignalParser;
 *   const signals = yield* parser.parse(llmOutput);
 *   return signals;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FerixParser.Live)));
 * ```
 */
const Live = Layer.succeed(SignalParser, make);

/**
 * FerixParser namespace containing the Live layer.
 */
export const FerixParser = {
  Live,
} as const;
