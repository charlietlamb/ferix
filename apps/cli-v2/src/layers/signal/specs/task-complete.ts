import type { Signal, TaskCompleteSignal } from "../../../domain/signals.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const TASK_COMPLETE =
  /<ferix:task-complete id="(\d+)">([\s\S]*?)<\/ferix:task-complete>/;
const SUMMARY = /<summary>([\s\S]*?)<\/summary>/;
const FILES_MODIFIED = /<files-modified>([\s\S]*?)<\/files-modified>/;
const FILES_CREATED = /<files-created>([\s\S]*?)<\/files-created>/;

/**
 * Helper to parse comma-separated file lists.
 */
function parseFileList(content: string | undefined): string[] {
  if (!content) {
    return [];
  }
  return content
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

const taskCompleteSpec: SignalSpec<TaskCompleteSignal> = {
  tag: "TaskComplete",
  closingTag: "</ferix:task-complete>",
  parse: (text) => {
    const match = text.match(TASK_COMPLETE);
    if (!match?.[1]) {
      return [];
    }
    const content = match[2] || "";
    const summaryMatch = content.match(SUMMARY);
    const filesModifiedMatch = content.match(FILES_MODIFIED);
    const filesCreatedMatch = content.match(FILES_CREATED);
    return [
      {
        _tag: "TaskComplete" as const,
        taskId: match[1],
        summary: summaryMatch?.[1]?.trim() || "",
        filesModified: parseFileList(filesModifiedMatch?.[1]),
        filesCreated: parseFileList(filesCreatedMatch?.[1]),
      },
    ];
  },
  keyFields: (s) => (s as Signal & { taskId: string }).taskId,
};

signalSpecRegistry.register(taskCompleteSpec);
