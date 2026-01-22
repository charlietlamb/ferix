/**
 * Signal parsing utilities for extracting ferix tags from output
 */

import { SIGNALS } from "../../constants.js";
import type { Criterion, Phase, Task } from "../../types/config.js";

// Top-level regex patterns for performance
const TASK_DONE_REGEX = /<ferix:task-done id="\d+"\/>/g;
const PHASES_BLOCK_REGEX = /<ferix:phases task="\d+">[\s\S]*?<\/ferix:phases>/g;
const PHASE_START_REGEX = /<ferix:phase-start id="[\d.]+"\/>/g;
const PHASE_DONE_REGEX = /<ferix:phase-done id="[\d.]+"\/>/g;
const PHASE_FAILED_REGEX =
  /<ferix:phase-failed id="[\d.]+">.*?<\/ferix:phase-failed>/g;
const EXTRACT_PHASES_REGEX =
  /<ferix:phases task="(\d+)">([\s\S]*?)<\/ferix:phases>/;

// Criteria block patterns (for breakdown phase)
const CRITERIA_BLOCK_REGEX =
  /<ferix:criteria task="\d+">[\s\S]*?<\/ferix:criteria>/g;
const EXTRACT_CRITERIA_REGEX =
  /<ferix:criteria task="(\d+)">([\s\S]*?)<\/ferix:criteria>/g;

// Criterion signal patterns
const CRITERION_PASSED_REGEX = /<ferix:criterion-passed id="[\d.c]+"\/>/g;
const CRITERION_FAILED_REGEX =
  /<ferix:criterion-failed id="[\d.c]+" reason="[^"]*"\/>/g;
const REVIEW_PASSED_REGEX = /<ferix:review-passed\/>/g;
const REVIEW_FAILED_REGEX = /<ferix:review-failed\/>/g;

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
    .replace(PHASE_FAILED_REGEX, "")
    .replace(CRITERION_PASSED_REGEX, "")
    .replace(CRITERION_FAILED_REGEX, "")
    .replace(REVIEW_PASSED_REGEX, "")
    .replace(REVIEW_FAILED_REGEX, "")
    .replace(CRITERIA_BLOCK_REGEX, "");
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

/**
 * Result of a criterion signal extraction
 */
export interface CriterionResult {
  /** Criterion ID (e.g., "1.c1") */
  id: string;
  /** Whether the criterion passed */
  passed: boolean;
  /** Reason for failure (only if passed is false) */
  reason?: string;
}

/**
 * Extract all criterion signals from output.
 * Returns an array of criterion results (passed or failed).
 */
export function extractCriterionSignals(output: string): CriterionResult[] {
  const results: CriterionResult[] = [];

  // Extract passed criteria
  const passedMatches = output.matchAll(
    /<ferix:criterion-passed id="([\d.c]+)"\/>/g
  );
  for (const match of passedMatches) {
    if (match[1]) {
      results.push({ id: match[1], passed: true });
    }
  }

  // Extract failed criteria
  const failedMatches = output.matchAll(
    /<ferix:criterion-failed id="([\d.c]+)" reason="([^"]*)"\/>/g
  );
  for (const match of failedMatches) {
    if (match[1]) {
      results.push({
        id: match[1],
        passed: false,
        reason: match[2] || "Unknown reason",
      });
    }
  }

  return results;
}

/**
 * Check if the review passed (all criteria met).
 */
export function extractReviewPassed(output: string): boolean {
  return output.includes("<ferix:review-passed/>");
}

/**
 * Check if the review failed (one or more criteria not met).
 */
export function extractReviewFailed(output: string): boolean {
  return output.includes("<ferix:review-failed/>");
}

/**
 * Extract criteria from <ferix:criteria task="N">...</ferix:criteria> block
 * Returns the task ID and array of criteria (used during breakdown phase)
 */
export function extractCriteriaBlock(
  output: string
): { taskId: string; criteria: Criterion[] }[] {
  const results: { taskId: string; criteria: Criterion[] }[] = [];

  for (const match of output.matchAll(EXTRACT_CRITERIA_REGEX)) {
    const taskId = match[1];
    const content = match[2];
    if (!(taskId && content)) {
      continue;
    }

    const criteria: Criterion[] = [];
    const criterionMatches = content.matchAll(
      /<criterion id="([^"]+)">([^<]+)<\/criterion>/g
    );

    for (const criterionMatch of criterionMatches) {
      const id = criterionMatch[1];
      const desc = criterionMatch[2];
      if (id && desc) {
        criteria.push({
          id,
          description: desc.trim(),
          status: "pending",
        });
      }
    }

    if (criteria.length > 0) {
      results.push({ taskId, criteria });
    }
  }

  return results;
}
