import { Schema as S } from "effect";
import {
  type TasksDefinedSignal,
  TasksDefinedSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const TASKS_BLOCK = /<ferix:tasks>([\s\S]*?)<\/ferix:tasks>/;
const TASK = /<task id="(\d+)">([^<]+)<\/task>/g;

function resetRegex(pattern: RegExp): RegExp {
  pattern.lastIndex = 0;
  return pattern;
}

const tasksDefinedSpec: SignalSpec<TasksDefinedSignal> = {
  tag: "TasksDefined",
  closingTag: "</ferix:tasks>",
  schema: TasksDefinedSignalSchema,
  parse: (text) => {
    const match = text.match(TASKS_BLOCK);
    if (!match?.[1]) {
      return [];
    }
    const tasks: Array<{ id: string; title: string; description: string }> = [];
    for (const m of match[1].matchAll(resetRegex(TASK))) {
      if (m[1] && m[2]) {
        tasks.push({
          id: m[1],
          title: m[2].trim(),
          description: m[2].trim(),
        });
      }
    }
    if (tasks.length === 0) {
      return [];
    }
    const raw = { _tag: "TasksDefined" as const, tasks };
    const result = S.decodeUnknownEither(TasksDefinedSignalSchema)(raw);
    if (result._tag === "Left") {
      return [];
    }
    return [result.right];
  },
  keyFields: (s) => s.tasks.map((t) => t.id).join(","),
};

signalSpecRegistry.register(tasksDefinedSpec);
