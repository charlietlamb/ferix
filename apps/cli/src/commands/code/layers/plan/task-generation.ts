import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import { PlanStoreError } from "../../domain/errors.js";
import {
  formatTasksJson,
  type TasksFile,
} from "../../domain/schemas/task-generation.js";

/**
 * Base directory for plan storage.
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, PlanStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new PlanStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "create",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session's plans (local, in cwd).
 */
function getSessionDir(sessionId: string): string {
  return join(process.cwd(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for tasks.json (local, in cwd).
 */
function getTasksJsonPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "tasks.json");
}

/**
 * Write tasks to tasks.json file.
 * JSON format prevents inappropriate modifications compared to Markdown.
 */
export function writeTasksJson(
  sessionId: string,
  tasksFile: TasksFile
): Effect.Effect<void, PlanStoreError> {
  return Effect.gen(function* () {
    const sessionDir = getSessionDir(sessionId);
    yield* ensureDir(sessionDir);

    const tasksJsonPath = getTasksJsonPath(sessionId);
    const content = formatTasksJson(tasksFile);

    yield* Effect.tryPromise({
      try: () => writeFile(tasksJsonPath, content, "utf-8"),
      catch: (error) =>
        new PlanStoreError({
          message: `Failed to write tasks.json: ${tasksJsonPath}`,
          operation: "create",
          cause: error,
        }),
    });
  });
}
