import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import { PlanStoreError } from "../../domain/errors.js";
import {
  formatTasksMd,
  type GeneratedTaskList,
  parseTasksMd,
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
 * Gets the directory path for a session's plans.
 */
function getSessionDir(sessionId: string): string {
  return join(process.cwd(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for tasks.md
 */
function getTasksMdPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "tasks.md");
}

/**
 * Write tasks to tasks.md file
 */
export function writeTasksMd(
  sessionId: string,
  tasks: GeneratedTaskList
): Effect.Effect<void, PlanStoreError> {
  return Effect.gen(function* () {
    const sessionDir = getSessionDir(sessionId);
    yield* ensureDir(sessionDir);

    const tasksMdPath = getTasksMdPath(sessionId);
    const content = formatTasksMd(tasks);

    yield* Effect.tryPromise({
      try: () => writeFile(tasksMdPath, content, "utf-8"),
      catch: (error) =>
        new PlanStoreError({
          message: `Failed to write tasks.md: ${tasksMdPath}`,
          operation: "create",
          cause: error,
        }),
    });
  });
}

/**
 * Read tasks from tasks.md file
 */
export function readTasksMd(
  sessionId: string
): Effect.Effect<GeneratedTaskList, PlanStoreError> {
  return Effect.gen(function* () {
    const tasksMdPath = getTasksMdPath(sessionId);

    const content = yield* Effect.tryPromise({
      try: () => readFile(tasksMdPath, "utf-8"),
      catch: (error) =>
        new PlanStoreError({
          message: `Failed to read tasks.md: ${tasksMdPath}`,
          operation: "load",
          cause: error,
        }),
    });

    return parseTasksMd(content);
  });
}

/**
 * Update a task status in tasks.md
 */
export function updateTaskInTasksMd(
  sessionId: string,
  taskId: string,
  status: GeneratedTaskList[number]["status"]
): Effect.Effect<void, PlanStoreError> {
  return Effect.gen(function* () {
    const tasks = yield* readTasksMd(sessionId);

    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task
    );

    yield* writeTasksMd(sessionId, updatedTasks);
  });
}
