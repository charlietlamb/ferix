/**
 * Signal parsing utilities for extracting ferix tags from output
 */

import { SIGNALS } from "../../constants.js";
import type { Phase, Task } from "../../types/config.js";

// Top-level regex patterns for performance
const TASK_DONE_REGEX = /<ferix:task-done id="\d+"\/>/g;
const PHASES_BLOCK_REGEX = /<ferix:phases task="\d+">[\s\S]*?<\/ferix:phases>/g;
const PHASE_START_REGEX = /<ferix:phase-start id="[\d.]+"\/>/g;
const PHASE_DONE_REGEX = /<ferix:phase-done id="[\d.]+"\/>/g;
const PHASE_FAILED_REGEX =
  /<ferix:phase-failed id="[\d.]+">.*?<\/ferix:phase-failed>/g;
const EXTRACT_PHASES_REGEX =
  /<ferix:phases task="(\d+)">([\s\S]*?)<\/ferix:phases>/;

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
      new RegExp(`${SIGNALS.ERROR_START}[\\s\\S]*?${SIGNALS.ERROR_END}`, "g"),
      ""
    )
    .replace(new RegExp(SIGNALS.COMPLETE, "g"), "")
    .replace(
      new RegExp(`${SIGNALS.TASKS_START}[\\s\\S]*?${SIGNALS.TASKS_END}`, "g"),
      ""
    )
    .replace(TASK_DONE_REGEX, "")
    .replace(PHASES_BLOCK_REGEX, "")
    .replace(PHASE_START_REGEX, "")
    .replace(PHASE_DONE_REGEX, "")
    .replace(PHASE_FAILED_REGEX, "");
}

/**
 * Extract tasks from <ferix:tasks>...</ferix:tasks> block
 */
export function extractTasks(output: string): Task[] | undefined {
  const match = output.match(
    new RegExp(`${SIGNALS.TASKS_START}([\\s\\S]*?)${SIGNALS.TASKS_END}`)
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
        phases: [],
      });
    }
  }

  return tasks.length > 0 ? tasks : undefined;
}

/**
 * Extract phases from <ferix:phases task="N">...</ferix:phases> block
 * Returns the task ID and array of phases
 */
export function extractPhases(
  output: string
): { taskId: string; phases: Phase[] } | undefined {
  const match = output.match(EXTRACT_PHASES_REGEX);
  if (!(match?.[1] && match?.[2])) {
    return undefined;
  }

  const taskId = match[1];
  const phases: Phase[] = [];
  const content = match[2];
  const phaseMatches = content.matchAll(
    /<phase id="([\d.]+)">([^<]+)<\/phase>/g
  );

  for (const phaseMatch of phaseMatches) {
    const id = phaseMatch[1];
    const desc = phaseMatch[2];
    if (id && desc) {
      phases.push({
        id,
        description: desc.trim(),
        status: "pending",
      });
    }
  }

  return phases.length > 0 ? { taskId, phases } : undefined;
}
