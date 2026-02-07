import type {
  TUICriterion,
  TUICriterionStatus,
  TUIPhase,
  TUIPhaseStatus,
  TUIState,
  TUITask,
  TUITaskStatus,
} from "../../../domain/schemas/tui.js";

/** Maximum number of output lines to keep in the buffer */
const MAX_OUTPUT_LINES = 10_000;

/**
 * Format tool input for display.
 * Extracts the most relevant detail from tool input for one-line display.
 *
 * @param tool - Tool name
 * @param input - Tool input object
 * @returns Formatted detail string, or empty string if no relevant detail
 */
function formatToolInput(_tool: string, input: unknown): string {
  if (!input || typeof input !== "object") {
    return "";
  }

  const record = input as Record<string, unknown>;

  // Common patterns for different tools
  if ("filePath" in record && typeof record.filePath === "string") {
    return record.filePath;
  }
  if ("path" in record && typeof record.path === "string") {
    return record.path;
  }
  if ("pattern" in record && typeof record.pattern === "string") {
    return record.pattern;
  }
  if ("command" in record && typeof record.command === "string") {
    // For Bash, show first part of command
    const cmd = record.command;
    return cmd.length > 60 ? `${cmd.slice(0, 57)}...` : cmd;
  }
  if ("url" in record && typeof record.url === "string") {
    return record.url;
  }
  if ("query" in record && typeof record.query === "string") {
    return record.query;
  }
  if ("description" in record && typeof record.description === "string") {
    return record.description;
  }

  return "";
}

/**
 * Append output lines to state.
 *
 * NOTE: We no longer strip ferix tags here because the TUI now uses
 * styleFerixTags() to render them as styled UI elements. The tags
 * need to be present in the output for proper rendering.
 *
 * IMPORTANT: For live streaming display, we always include the partial line
 * in outputLines. This ensures users see text immediately as it streams,
 * rather than waiting for a newline character.
 */
export function appendOutput(state: TUIState, text: string): TUIState {
  if (!text) {
    return state;
  }

  const fullText = state.partialLine + text;
  const parts = fullText.split("\n");
  const newPartialLine = parts.pop() ?? "";
  const completeLines = parts.filter((line) => line.length > 0);

  // Remove the old partial line from outputLines (it was the last line if partialLine was set)
  const baseOutputLines =
    state.partialLine && state.outputLines.length > 0
      ? state.outputLines.slice(0, -1)
      : state.outputLines;

  // Add complete lines
  const withCompleteLines = [...baseOutputLines, ...completeLines];

  // Add the new partial line for live display (if any)
  const finalLines = newPartialLine
    ? [...withCompleteLines, newPartialLine]
    : withCompleteLines;

  const outputLines =
    finalLines.length > MAX_OUTPUT_LINES
      ? finalLines.slice(-MAX_OUTPUT_LINES)
      : finalLines;

  return { ...state, outputLines, partialLine: newPartialLine };
}

/**
 * Append tool use line to output.
 */
export function appendToolUse(
  state: TUIState,
  tool: string,
  input: unknown
): TUIState {
  const detail = formatToolInput(tool, input);
  const toolLine = detail ? `▸ ${tool} ${detail}` : `▸ ${tool}`;
  const combined = [...state.outputLines, toolLine, ""];
  const outputLines =
    combined.length > MAX_OUTPUT_LINES
      ? combined.slice(-MAX_OUTPUT_LINES)
      : combined;
  return { ...state, outputLines };
}

/**
 * Append error lines to output.
 * Uses ferix:error tags so errors render through the tag styling system.
 */
export function appendError(state: TUIState, error: string): TUIState {
  const errorLines = error
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `<ferix:error>${line}</ferix:error>`);
  const combined = [...state.outputLines, "", ...errorLines, ""];
  const outputLines =
    combined.length > MAX_OUTPUT_LINES
      ? combined.slice(-MAX_OUTPUT_LINES)
      : combined;
  return { ...state, outputLines, status: "error" };
}

/**
 * Convert domain task to TUI task.
 */
export function toTUITask(task: { id: string; title: string }): TUITask {
  return {
    id: task.id,
    title: task.title,
    status: "pending",
    phases: [],
    criteria: [],
  };
}

/**
 * Update phases for a task.
 */
export function updateTaskPhases(
  state: TUIState,
  taskId: string,
  phases: readonly { id: string; description: string }[]
): TUIState {
  const tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          phases: phases.map(
            (p): TUIPhase => ({
              id: p.id,
              description: p.description,
              status: "pending" as const,
            })
          ),
        }
      : task
  );
  return { ...state, tasks };
}

/**
 * Update criteria for a task.
 */
export function updateTaskCriteria(
  state: TUIState,
  taskId: string,
  criteria: readonly { id: string; description: string }[]
): TUIState {
  const tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          criteria: criteria.map(
            (c): TUICriterion => ({
              id: c.id,
              description: c.description,
              status: "pending" as const,
            })
          ),
        }
      : task
  );
  return { ...state, tasks };
}

/**
 * Event shape for phase status updates.
 */
interface PhaseStatusEvent {
  readonly phaseId: string;
  readonly timestamp?: number;
}

/**
 * Set phase status from event.
 */
export function setPhaseStatus(
  state: TUIState,
  status: TUIPhaseStatus,
  event: PhaseStatusEvent
): TUIState {
  const tasks = state.tasks.map((task) => {
    const phases = task.phases.map((phase) =>
      phase.id === event.phaseId
        ? {
            ...phase,
            status,
            startedAt:
              status === "in_progress" ? event.timestamp : phase.startedAt,
            completedAt:
              status === "done" || status === "failed"
                ? event.timestamp
                : phase.completedAt,
          }
        : phase
    );
    return { ...task, phases };
  });
  return { ...state, tasks };
}

/**
 * Set criterion status.
 */
export function setCriterionStatus(
  state: TUIState,
  criterionId: string,
  status: TUICriterionStatus,
  failureReason?: string
): TUIState {
  const tasks = state.tasks.map((task) => {
    const criteria = task.criteria.map((criterion) =>
      criterion.id === criterionId
        ? { ...criterion, status, failureReason }
        : criterion
    );
    return { ...task, criteria };
  });
  return { ...state, tasks };
}

/**
 * Event shape for task status updates.
 */
interface TaskStatusEvent {
  readonly taskId: string;
  readonly timestamp?: number;
}

/**
 * Set task status from event.
 */
export function setTaskStatus(
  state: TUIState,
  status: TUITaskStatus,
  event: TaskStatusEvent
): TUIState {
  const tasks = state.tasks.map((task) =>
    task.id === event.taskId
      ? {
          ...task,
          status,
          startedAt:
            status === "in_progress" ? event.timestamp : task.startedAt,
          completedAt:
            status === "done" || status === "failed"
              ? event.timestamp
              : task.completedAt,
        }
      : task
  );
  return { ...state, tasks };
}
