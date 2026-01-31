import { Schema as S } from "effect";
import {
  type TaskCompleteSignal,
  TaskCompleteSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const TASK_COMPLETE =
  /<ferix:task-complete id="(\d+)">([\s\S]*?)<\/ferix:task-complete>/;
const SUMMARY = /<summary>([\s\S]*?)<\/summary>/;
const FILES_MODIFIED = /<files-modified>([\s\S]*?)<\/files-modified>/;
const FILES_CREATED = /<files-created>([\s\S]*?)<\/files-created>/;
const COMMIT_MESSAGE = /<commit-message>([\s\S]*?)<\/commit-message>/;

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
  schema: TaskCompleteSignalSchema,
  parse: (text) => {
    const match = text.match(TASK_COMPLETE);
    if (!match?.[1]) {
      return [];
    }
    const content = match[2] || "";
    const summaryMatch = content.match(SUMMARY);
    const filesModifiedMatch = content.match(FILES_MODIFIED);
    const filesCreatedMatch = content.match(FILES_CREATED);
    const commitMessageMatch = content.match(COMMIT_MESSAGE);
    const raw = {
      _tag: "TaskComplete" as const,
      taskId: match[1],
      summary: summaryMatch?.[1]?.trim() || "",
      filesModified: parseFileList(filesModifiedMatch?.[1]),
      filesCreated: parseFileList(filesCreatedMatch?.[1]),
      commitMessage:
        commitMessageMatch?.[1]?.trim() || `chore: complete task ${match[1]}`,
    };
    const result = S.decodeUnknownEither(TaskCompleteSignalSchema)(raw);
    if (result._tag === "Right") {
      return [result.right];
    }
    return [];
  },
  keyFields: (s) => s.taskId,
};

signalSpecRegistry.register(taskCompleteSpec);
