import type {
  TUICriterion,
  TUICriterionStatus,
  TUIPhase,
  TUIPhaseStatus,
  TUIState,
  TUITask,
  TUITaskStatus,
} from "../../../domain/schemas/tui.js";
import { MAX_OUTPUT_LINES } from "../constants.js";
import { formatToolInput } from "../tools/index.js";

/**
 * Patterns to match ferix signal tags that should be hidden from TUI output.
 * These signals are parsed by the signal parser and displayed via proper UI elements.
 *
 * Signals come in several forms:
 * 1. Self-closing: <ferix:check-passed/>
 * 2. With content: <ferix:session-name>value</ferix:session-name>
 * 3. Block with nested elements: <ferix:tasks>...<task>...</task>...</ferix:tasks>
 * 4. With attributes: <ferix:phase-start id="1.1"/>
 */

// Block tags with content (can be multi-line)
const FERIX_BLOCK_PATTERNS = [
  /<ferix:session-name>[\s\S]*?<\/ferix:session-name>/g,
  /<ferix:tasks>[\s\S]*?<\/ferix:tasks>/g,
  /<ferix:phases[^>]*>[\s\S]*?<\/ferix:phases>/g,
  /<ferix:criteria[^>]*>[\s\S]*?<\/ferix:criteria>/g,
  /<ferix:task-complete[^>]*>[\s\S]*?<\/ferix:task-complete>/g,
  /<ferix:phase-failed[^>]*>[\s\S]*?<\/ferix:phase-failed>/g,
  /<ferix:learning[^>]*>[\s\S]*?<\/ferix:learning>/g,
  /<ferix:guardrail[^>]*>[\s\S]*?<\/ferix:guardrail>/g,
  // Nested tags inside ferix:task-complete (strip separately for streaming)
  /<commit-message>[\s\S]*?<\/commit-message>/g,
  /<summary>[\s\S]*?<\/summary>/g,
  /<files-modified>[\s\S]*?<\/files-modified>/g,
  /<files-created>[\s\S]*?<\/files-created>/g,
  // Nested tags inside ferix:tasks
  /<task[^>]*>[\s\S]*?<\/task>/g,
  // Nested tags inside ferix:phases
  /<phase[^>]*>[\s\S]*?<\/phase>/g,
  // Nested tags inside ferix:criteria
  /<criterion[^>]*>[\s\S]*?<\/criterion>/g,
];

// Self-closing tags (single line)
const FERIX_SELF_CLOSING_PATTERNS = [
  /<ferix:phase-start[^>]*\/>/g,
  /<ferix:phase-done[^>]*\/>/g,
  /<ferix:criterion-passed[^>]*\/>/g,
  /<ferix:criterion-failed[^>]*\/>/g,
  /<ferix:check-passed\s*\/>/g,
  /<ferix:check-failed\s*\/>/g,
  /<ferix:review-complete\s*\/>/g,
  /<ferix:review-changes-made\s*\/>/g,
];

/**
 * Strip ferix signal tags from text for display.
 * These signals are parsed separately and should not appear in the UI output.
 */
function stripFerixSignals(text: string): string {
  let result = text;

  // Remove block patterns first (they can be multi-line)
  for (const pattern of FERIX_BLOCK_PATTERNS) {
    result = result.replace(pattern, "");
  }

  // Remove self-closing patterns
  for (const pattern of FERIX_SELF_CLOSING_PATTERNS) {
    result = result.replace(pattern, "");
  }

  return result;
}

/**
 * Append output lines to state.
 */
export function appendOutput(state: TUIState, text: string): TUIState {
  if (!text) {
    return state;
  }

  // Strip ferix signals from the text before displaying
  const cleanedText = stripFerixSignals(text);
  if (!cleanedText) {
    return state;
  }

  const fullText = state.partialLine + cleanedText;
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
