import { Schema as S } from "effect";

/**
 * Status for generated tasks in tasks.json
 */
const GeneratedTaskStatusSchema = S.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
);

/**
 * Single generated task entry schema with steps for verification
 */
const GeneratedTaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  description: S.String,
  status: GeneratedTaskStatusSchema,
  steps: S.Array(S.String),
});
export type GeneratedTask = typeof GeneratedTaskSchema.Type;

/**
 * Tasks file schema for tasks.json
 */
const TasksFileSchema = S.Struct({
  sessionId: S.String,
  originalTask: S.String,
  tasks: S.Array(GeneratedTaskSchema),
});
export type TasksFile = typeof TasksFileSchema.Type;

/**
 * Format tasks file to JSON string for persistence.
 * JSON format prevents inappropriate modifications compared to Markdown.
 */
export function formatTasksJson(tasksFile: TasksFile): string {
  return JSON.stringify(tasksFile, null, 2);
}

/**
 * Decode and validate a tasks file from unknown input.
 * Returns an Effect that succeeds with TasksFile or fails with ParseError.
 */
export function decodeTasksFile(
  input: unknown
): S.decodeUnknown.Result<TasksFile> {
  return S.decodeUnknown(TasksFileSchema)(input);
}
