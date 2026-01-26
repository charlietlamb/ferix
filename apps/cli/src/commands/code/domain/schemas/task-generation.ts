import { Schema as S } from "effect";

/**
 * Status for generated tasks in tasks.md
 */
export const GeneratedTaskStatusSchema = S.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
);
export type GeneratedTaskStatus = typeof GeneratedTaskStatusSchema.Type;

/**
 * Single generated task entry schema
 */
export const GeneratedTaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  status: GeneratedTaskStatusSchema,
});
export type GeneratedTask = typeof GeneratedTaskSchema.Type;

/**
 * Array of generated tasks schema
 */
export const GeneratedTaskListSchema = S.Array(GeneratedTaskSchema);
export type GeneratedTaskList = typeof GeneratedTaskListSchema.Type;

/**
 * Status icon mapping for markdown formatting
 */
const STATUS_ICONS: Record<GeneratedTaskStatus, string> = {
  done: "[x]",
  in_progress: "[~]",
  pending: "[ ]",
  failed: "[!]",
};

/**
 * Format tasks to a human-readable markdown string
 */
export function formatTasksMd(tasks: GeneratedTaskList): string {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;

  const lines: string[] = [
    "# Tasks",
    "",
    `## Status: ${completedCount}/${totalCount} complete`,
    "",
  ];

  const currentTaskId = tasks.find(
    (t) => t.status === "in_progress" || t.status === "pending"
  )?.id;

  for (const task of tasks) {
    const icon = STATUS_ICONS[task.status];
    const currentMarker = task.id === currentTaskId ? " ← current" : "";
    lines.push(`- ${icon} **Task ${task.id}**: ${task.title}${currentMarker}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`*Last updated: ${new Date().toISOString()}*`);

  return lines.join("\n");
}

/**
 * Parse markdown back to validated tasks
 */
export function parseTasksMd(content: string): GeneratedTaskList {
  const tasks: GeneratedTask[] = [];

  // Match lines like: - [x] **Task 1**: Setup authentication
  const taskPattern =
    /^- \[([x~!]|\s)\] \*\*Task (\d+)\*\*: (.+?)(?:\s*←.*)?$/gm;

  const statusMap: Record<string, GeneratedTaskStatus> = {
    x: "done",
    "~": "in_progress",
    " ": "pending",
    "!": "failed",
  };

  let match: RegExpExecArray | null = taskPattern.exec(content);
  while (match !== null) {
    const statusChar = match[1];
    const id = match[2];
    const title = match[3];
    if (id !== undefined && title !== undefined) {
      const status = statusChar
        ? (statusMap[statusChar] ?? "pending")
        : "pending";
      tasks.push({
        id,
        title: title.trim(),
        status,
      });
    }
    match = taskPattern.exec(content);
  }

  return tasks;
}
