import { Effect, Layer, Ref } from "effect";
import type { LogLevel } from "../../domain/schemas/logger.js";
import { Logger, type LoggerService } from "../../services/logger.js";

/**
 * Creates a no-op logger service that discards all logs.
 * Useful for testing where you don't want log output.
 */
function createNoopLogger(levelRef: Ref.Ref<LogLevel>): LoggerService {
  return {
    debug: () => Effect.void,
    info: () => Effect.void,
    warn: () => Effect.void,
    error: () => Effect.void,
    getLevel: () => Ref.get(levelRef),
    setLevel: (level) => Ref.set(levelRef, level),
  };
}

/**
 * Creates a Layer for the no-op logger.
 *
 * @example
 * ```typescript
 * const testLayer = NoopLogger.layer();
 *
 * const program = Effect.gen(function* () {
 *   const logger = yield* Logger;
 *   yield* logger.info("This will be discarded");
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
export function layer(): Layer.Layer<Logger> {
  return Layer.effect(
    Logger,
    Effect.gen(function* () {
      const levelRef = yield* Ref.make<LogLevel>("info");
      return createNoopLogger(levelRef);
    })
  );
}

/**
 * Default Live Layer for no-op logger.
 */
export const Live = layer();

/**
 * NoopLogger namespace containing the Live layer and factory.
 */
export const NoopLogger = {
  Live,
  layer,
} as const;
