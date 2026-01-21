/**
 * @fileoverview Serializes Plan objects to markdown format for `.ferix/PLAN.md`.
 *
 * This module converts the in-memory Plan data structure back to the markdown
 * format that persists between LLM calls. The output format is designed to be
 * both human-readable and LLM-parseable, enabling context retention across
 * the breakdown → planner → worker execution phases.
 *
 * @see parser.ts for the inverse operation (markdown → Plan)
 */

import type {
  Plan,
  PlanPhase,
  PlanTask,
  SuccessCriterion,
} from "../types/plan.js";

/**
 * Serializes a Plan object to markdown string.
 *
 * The output format follows a structured template:
 * - Header with creation timestamp and original task
 * - Optional context section with codebase analysis
 * - Task sections separated by horizontal rules
 *
 * @param plan - The Plan object to serialize
 * @returns Markdown string ready to write to `.ferix/PLAN.md`
 *
 * @example
 * ```ts
 * const markdown = writePlanFile(plan);
 * await Bun.write('.ferix/PLAN.md', markdown);
 * ```
 */
export function writePlanFile(plan: Plan): string {
  const lines: string[] = [];

  // Header
  lines.push("# Ferix Plan");
  lines.push("");
  lines.push(`> Created: ${plan.createdAt}`);
  lines.push(`> Task: ${plan.originalTask}`);
  lines.push("");

  // Context section
  if (plan.context) {
    lines.push("## Context");
    lines.push("");
    lines.push(plan.context);
    lines.push("");
  }

  // Tasks
  for (const task of plan.tasks) {
    lines.push("---");
    lines.push("");
    lines.push(...writeTask(task));
  }

  return lines.join("\n");
}

/**
 * Serializes a single task to markdown lines.
 *
 * Output includes:
 * - Task header with ID and title
 * - Status indicator (pending, in_progress, done, failed, skipped)
 * - Attempts counter (for reviewer retry tracking)
 * - Optional description
 * - Optional success criteria checklist
 * - Optional phases checklist
 * - Optional files list
 * - Optional completion notes or error message
 *
 * @param task - The task to serialize
 * @returns Array of markdown lines (without trailing newline)
 */
function writeTask(task: PlanTask): string[] {
  const lines: string[] = [];

  // Task header
  lines.push(`## Task ${task.id}: ${task.title}`);
  lines.push(`**Status**: ${task.status}`);

  // Attempts (only write if > 0 to keep output clean for new tasks)
  if (task.attempts !== undefined && task.attempts > 0) {
    lines.push(`**Attempts**: ${task.attempts}`);
  }
  lines.push("");

  // Description
  if (task.description) {
    lines.push(task.description);
    lines.push("");
  }

  // Success Criteria (before phases)
  if (task.criteria && task.criteria.length > 0) {
    lines.push("**Success Criteria:**");
    for (const criterion of task.criteria) {
      lines.push(...writeCriterion(criterion));
    }
    lines.push("");
  }

  // Phases
  if (task.phases && task.phases.length > 0) {
    lines.push("### Phases");
    for (const phase of task.phases) {
      lines.push(writePhase(phase));
    }
    lines.push("");
  }

  // Files
  if (task.filesToModify && task.filesToModify.length > 0) {
    lines.push("### Files");
    for (const file of task.filesToModify) {
      lines.push(`- ${file}`);
    }
    lines.push("");
  }

  // Completion notes
  if (task.completionNotes) {
    lines.push("### Completed");
    lines.push(task.completionNotes);
    lines.push("");
  }

  // Error message
  if (task.errorMessage) {
    lines.push("### Error");
    lines.push(task.errorMessage);
    lines.push("");
  }

  return lines;
}

/**
 * Formats a single phase as a markdown checkbox list item.
 *
 * @param phase - The phase to format
 * @returns Markdown checkbox line (e.g., "- [x] 1.1: Implement feature")
 */
function writePhase(phase: PlanPhase): string {
  const checkbox = phase.completed ? "[x]" : "[ ]";
  return `- ${checkbox} ${phase.id}: ${phase.description}`;
}

/**
 * Formats a success criterion as markdown checkbox with optional failure reason.
 *
 * Output formats:
 * - Passed: `- [x] Criterion description`
 * - Pending: `- [ ] Criterion description`
 * - Failed: `- [ ] Criterion description`
 *           `  > Reason: explanation`
 *
 * @param criterion - The criterion to format
 * @returns Array of markdown lines (1 line for passed/pending, 2 for failed with reason)
 */
function writeCriterion(criterion: SuccessCriterion): string[] {
  const lines: string[] = [];
  const checkbox = criterion.status === "passed" ? "[x]" : "[ ]";

  lines.push(`- ${checkbox} ${criterion.description}`);

  // Add failure reason on indented line
  if (criterion.status === "failed" && criterion.failureReason) {
    lines.push(`  > Reason: ${criterion.failureReason}`);
  }

  return lines;
}
