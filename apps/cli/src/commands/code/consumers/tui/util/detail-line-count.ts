import type { TUITask } from "../../../domain/schemas/tui.js";

/**
 * Compute the number of rendered lines for the detail view of a task.
 * Used by both session-content (maxScrollOffset) and footer (scroll %).
 */
export function computeDetailLineCount(
  task: TUITask,
  gitBranch?: string,
  prUrl?: string
): number {
  // TaskHeader: header(1) + title(1) + blank(1) + divider(1) + blank(1) + status(1) = 6
  let lines = 6;
  // + duration row if startedAt
  if (task.startedAt) {
    lines += 1;
  }
  // + progress summary row if has phases or criteria
  if (task.phases.length > 0 || task.criteria.length > 0) {
    lines += 1;
  }
  // + trailing blank after header
  lines += 1;

  // PhasesSection: header(1) + per-phase rows + trailing spacer(1)
  if (task.phases.length > 0) {
    lines += 2; // header + trailing spacer
    for (const phase of task.phases) {
      lines += phase.startedAt ? 2 : 1;
    }
  }

  // CriteriaSection: header(1) + per-criterion rows + trailing spacer(1)
  if (task.criteria.length > 0) {
    lines += 2; // header + trailing spacer
    for (const criterion of task.criteria) {
      lines += criterion.status === "failed" && criterion.failureReason ? 2 : 1;
    }
  }

  // GitSection: divider(1) + branch row(1)
  if (gitBranch) {
    lines += 2;
    if (prUrl) {
      lines += 1;
    }
  }

  return lines;
}
