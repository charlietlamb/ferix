/**
 * Signal parsing utilities for extracting ferix tags from output
 */

import { SIGNALS } from "../../constants.js";
import type { Task } from "../../types/config.js";

/**
 * Extract error message from output containing <ferix:error>...</ferix:error>
 * Only matches when the tag appears at the start of a line (not in code blocks)
 */
export function extractError(output: string): string | undefined {
  const match = output.match(
    new RegExp(`^\\s*${SIGNALS.ERROR_START}(.+?)${SIGNALS.ERROR_END}`, "ms")
  );
  return match?.[1]?.trim();
}

/**
 * Strip ferix signal tags from text for display
 */
export function stripSignalTags(text: string): string {
  return text
    .replace(
      new RegExp(`${SIGNALS.ERROR_START}[^]*?${SIGNALS.ERROR_END}`, "g"),
      ""
    )
    .replace(new RegExp(SIGNALS.COMPLETE, "g"), "")
    .replace(
      new RegExp(`${SIGNALS.TASKS_START}[^]*?${SIGNALS.TASKS_END}`, "g"),
      ""
    )
    .replace(/<ferix:task-done id="\d+"\/>/g, "");
}

/**
 * Extract tasks from <ferix:tasks>...</ferix:tasks> block
 */
export function extractTasks(output: string): Task[] | undefined {
  const match = output.match(
    new RegExp(`${SIGNALS.TASKS_START}([^]*?)${SIGNALS.TASKS_END}`)
  );
  if (!match?.[1]) {
    return undefined;
  }

  const tasks: Task[] = [];
  const content = match[1];
  const taskMatches = content.matchAll(/<task id="(\d+)">([^<]+)<\/task>/g);

  for (const taskMatch of taskMatches) {
    const id = taskMatch[1];
    const desc = taskMatch[2];
    if (id && desc) {
      tasks.push({
        id,
        description: desc.trim(),
        done: false,
      });
    }
  }

  return tasks.length > 0 ? tasks : undefined;
}
