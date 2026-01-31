import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect, Layer } from "effect";
import { PromptStoreError } from "../../domain/errors.js";
import {
  PromptStore,
  type PromptStoreService,
} from "../../services/prompt-store.js";

/**
 * Base directory for plan storage (prompts live alongside plans).
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Get the directory containing this module (for finding bundled template).
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Path to the bundled PROMPT.md template.
 */
const BUNDLED_TEMPLATE_PATH = join(__dirname, "../../templates/PROMPT.md");

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, PromptStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new PromptStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "copy",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session's plans.
 */
function getSessionDir(sessionId: string): string {
  return join(process.cwd(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for a session's PROMPT.md.
 */
function getPromptPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "PROMPT.md");
}

/**
 * Cache for the bundled template content.
 */
let cachedTemplate: string | null = null;

/**
 * File system prompt store service implementation.
 *
 * Manages the static PROMPT.md template:
 * - Copies from bundled template to session directory
 * - Reads template (with caching for efficiency)
 */
const make: PromptStoreService = {
  copyTemplate: (sessionId: string): Effect.Effect<void, PromptStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      // Read bundled template
      const template = yield* make.getBundledTemplate();

      // Write to session directory
      const promptPath = getPromptPath(sessionId);
      yield* Effect.tryPromise({
        try: () => writeFile(promptPath, template, "utf-8"),
        catch: (error) =>
          new PromptStoreError({
            message: `Failed to write PROMPT.md: ${promptPath}`,
            operation: "copy",
            cause: error,
          }),
      });
    }),

  read: (sessionId: string): Effect.Effect<string, PromptStoreError> =>
    Effect.gen(function* () {
      const promptPath = getPromptPath(sessionId);

      // Try to read session-specific copy first
      const sessionTemplate = yield* Effect.tryPromise({
        try: async () => {
          try {
            return await readFile(promptPath, "utf-8");
          } catch {
            return null;
          }
        },
        catch: (error) =>
          new PromptStoreError({
            message: `Failed to read PROMPT.md: ${promptPath}`,
            operation: "read",
            cause: error,
          }),
      });

      if (sessionTemplate !== null) {
        return sessionTemplate;
      }

      // Fall back to bundled template
      return yield* make.getBundledTemplate();
    }),

  getBundledTemplate: (): Effect.Effect<string, PromptStoreError> =>
    Effect.gen(function* () {
      // Return cached template if available
      if (cachedTemplate !== null) {
        return cachedTemplate;
      }

      // Read and cache the bundled template
      const template = yield* Effect.tryPromise({
        try: () => readFile(BUNDLED_TEMPLATE_PATH, "utf-8"),
        catch: (error) =>
          new PromptStoreError({
            message: `Failed to read bundled PROMPT.md: ${BUNDLED_TEMPLATE_PATH}`,
            operation: "read",
            cause: error,
          }),
      });

      cachedTemplate = template;
      return template;
    }),
};

/**
 * Live Layer for the file system prompt store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const promptStore = yield* PromptStore;
 *   yield* promptStore.copyTemplate(sessionId);
 *   const template = yield* promptStore.read(sessionId);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemPrompt.Live)));
 * ```
 */
const Live = Layer.succeed(PromptStore, make);

/**
 * FileSystemPrompt namespace containing the Live layer.
 */
export const FileSystemPrompt = {
  Live,
} as const;
