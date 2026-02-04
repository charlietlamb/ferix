import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import { ConfigError } from "./errors.js";
import { type FerixConfig, FerixConfigSchema } from "./schema.js";

const CONFIG_FILE_NAME = "ferix.json";

/**
 * Load and validate ferix.json from the given directory.
 *
 * Returns an empty config if no ferix.json exists.
 * Returns a ConfigError if the file exists but cannot be parsed or validated.
 */
export function loadConfig(
  cwd: string = process.cwd()
): Effect.Effect<FerixConfig, ConfigError> {
  return Effect.gen(function* () {
    const configPath = join(cwd, CONFIG_FILE_NAME);

    if (!existsSync(configPath)) {
      return {} as FerixConfig;
    }

    const raw = yield* Effect.try({
      try: () => readFileSync(configPath, "utf-8"),
      catch: (cause) =>
        new ConfigError({
          message: `Failed to read ${CONFIG_FILE_NAME}: ${String(cause)}`,
          operation: "read",
          cause,
        }),
    });

    const parsed = yield* Effect.try({
      try: () => JSON.parse(raw) as unknown,
      catch: (cause) =>
        new ConfigError({
          message: `Failed to parse ${CONFIG_FILE_NAME}: ${String(cause)}`,
          operation: "parse",
          cause,
        }),
    });

    const config = yield* Schema.decodeUnknown(FerixConfigSchema)(parsed).pipe(
      Effect.mapError(
        (cause) =>
          new ConfigError({
            message: `Invalid ${CONFIG_FILE_NAME}: ${String(cause)}`,
            operation: "validate",
            cause,
          })
      )
    );

    return config;
  });
}
