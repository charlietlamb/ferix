/**
 * Shared status utilities for TUI views.
 */
import type { RGBA } from "@opentui/core";
import type {
  TUICriterionStatus,
  TUIPhaseStatus,
  TUITaskStatus,
} from "../../../domain/schemas/tui.js";

/**
 * Theme colors type extracted from the theme context.
 */
export interface ThemeColors {
  readonly success: RGBA;
  readonly warning: RGBA;
  readonly error: RGBA;
  readonly textDim: RGBA;
  readonly textGhost: RGBA;
}

interface StatusIcon {
  readonly icon: string;
  readonly color: RGBA;
}

/**
 * Get the status icon for a task or phase status.
 */
export function getTaskStatusIcon(
  status: TUITaskStatus | TUIPhaseStatus,
  theme: ThemeColors
): StatusIcon {
  switch (status) {
    case "pending":
      return { icon: "○", color: theme.textDim };
    case "in_progress":
      return { icon: "◐", color: theme.warning };
    case "done":
      return { icon: "●", color: theme.success };
    case "failed":
      return { icon: "✗", color: theme.error };
    default:
      return { icon: "○", color: theme.textDim };
  }
}

/**
 * Get the status icon for a criterion status.
 */
export function getCriterionStatusIcon(
  status: TUICriterionStatus,
  theme: ThemeColors
): StatusIcon {
  switch (status) {
    case "pending":
      return { icon: "○", color: theme.textDim };
    case "passed":
      return { icon: "●", color: theme.success };
    case "failed":
      return { icon: "✗", color: theme.error };
    default:
      return { icon: "○", color: theme.textDim };
  }
}

/**
 * Get the color for a task or phase status.
 */
export function getStatusColor(
  status: TUITaskStatus | TUIPhaseStatus,
  theme: ThemeColors
): RGBA {
  switch (status) {
    case "done":
      return theme.success;
    case "in_progress":
      return theme.warning;
    case "failed":
      return theme.error;
    default:
      return theme.textDim;
  }
}

/**
 * Get status display info (text + color).
 */
export function getStatusInfo(
  status: string,
  theme: ThemeColors
): { text: string; color: RGBA } {
  switch (status) {
    case "done":
    case "passed":
      return { text: "Done", color: theme.success };
    case "in_progress":
      return { text: "In Progress", color: theme.warning };
    case "failed":
      return { text: "Failed", color: theme.error };
    default:
      return { text: "Pending", color: theme.textDim };
  }
}

/**
 * Human-readable status labels.
 */
export const STATUS_LABELS: Record<TUITaskStatus, string> = {
  pending: "PENDING",
  in_progress: "IN_PROGRESS",
  done: "DONE",
  failed: "FAILED",
};
