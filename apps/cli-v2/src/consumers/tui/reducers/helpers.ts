import { MAX_OUTPUT_LINES } from "../constants.js";
import type {
  CriterionStatus,
  PhaseStatus,
  TaskStatus,
  TUICriterion,
  TUIPhase,
  TUIState,
  TUITask,
} from "../state.js";
import { formatToolInput } from "../tools/index.js";

/**
 * Append output lines to state.
 */
export function appendOutput(state: TUIState, text: string): TUIState {
  if (!text) {
    return state;
  }

  const fullText = state.partialLine + text;
  const parts = fullText.split("\n");
  const partialLine = parts.pop() ?? "";
  const newLines = parts.filter((line) => line.length > 0);

  if (newLines.length === 0) {
    return { ...state, partialLine };
  }

  const combined = [...state.outputLines, ...newLines];
  const outputLines =
    combined.length > MAX_OUTPUT_LINES
      ? combined.slice(-MAX_OUTPUT_LINES)
      : combined;

  return { ...state, outputLines, partialLine };
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
  const toolLine = detail ? `>> ${tool} ${detail}` : `>> ${tool}`;
  const combined = [...state.outputLines, toolLine, ""];
  const outputLines =
    combined.length > MAX_OUTPUT_LINES
      ? combined.slice(-MAX_OUTPUT_LINES)
      : combined;
  return { ...state, outputLines };
}

/**
 * Append error lines to output.
 */
export function appendError(state: TUIState, error: string): TUIState {
  const errorLines = [
    "",
    "═══════════════════════════════════════════════════════════════",
    "                           ERROR",
    "═══════════════════════════════════════════════════════════════",
    "",
    ...error.split("\n"),
    "",
    "═══════════════════════════════════════════════════════════════",
    "",
  ];
  const combined = [...state.outputLines, ...errorLines];
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
  status: PhaseStatus,
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
  status: CriterionStatus,
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
  status: TaskStatus,
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
