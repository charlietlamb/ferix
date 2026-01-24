import type { DomainEvent } from "../../domain/events.js";

// View modes
export type ViewMode = "logs" | "tasks" | "detail";

// Loop status
export type LoopStatus = "idle" | "running" | "complete" | "error";

// Execution mode displayed in status bar
export type ExecutionMode =
  | "idle"
  | "breakdown"
  | "planning"
  | "working"
  | "checking"
  | "verifying"
  | "reviewing";

// Phase status
export type PhaseStatus = "pending" | "in_progress" | "done" | "failed";

// Criterion status
export type CriterionStatus = "pending" | "passed" | "failed";

// Task status
export type TaskStatus = "pending" | "in_progress" | "done" | "failed";

export interface TUIPhase {
  readonly id: string;
  readonly description: string;
  readonly status: PhaseStatus;
  readonly startedAt?: number;
  readonly completedAt?: number;
}

export interface TUICriterion {
  readonly id: string;
  readonly description: string;
  readonly status: CriterionStatus;
  readonly failureReason?: string;
}

export interface TUITask {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly phases: readonly TUIPhase[];
  readonly criteria: readonly TUICriterion[];
  readonly startedAt?: number;
  readonly completedAt?: number;
}

export interface TUIState {
  // Loop info
  readonly task: string;
  readonly iteration: number;
  readonly maxIterations: number;
  readonly status: LoopStatus;
  readonly startTime: number;

  // Current activity
  readonly executionMode: ExecutionMode;
  readonly currentTool?: string;
  readonly currentTaskId?: string;

  // Output
  readonly outputLines: readonly string[];
  readonly partialLine: string; // Accumulates text until newline

  // Tasks
  readonly tasks: readonly TUITask[];

  // Navigation
  readonly viewMode: ViewMode;
  readonly selectedTaskIndex: number;
  readonly scrollOffset: number;
  readonly userScrolled: boolean;

  // Git
  readonly gitBranch?: string;
  readonly gitPushed: boolean;
  readonly prUrl?: string;
}

export function createInitialState(): TUIState {
  return {
    task: "",
    iteration: 0,
    maxIterations: 0,
    status: "idle",
    startTime: Date.now(),
    executionMode: "idle",
    outputLines: [],
    partialLine: "",
    tasks: [],
    viewMode: "logs",
    selectedTaskIndex: 0,
    scrollOffset: 0,
    userScrolled: false,
    gitPushed: false,
  };
}

// Helper to append error lines to output (exported for use in consumer)
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
  const outputLines = combined.length > 1000 ? combined.slice(-1000) : combined;
  return { ...state, outputLines, status: "error" };
}

// Helper to append output lines
function appendOutput(state: TUIState, text: string): TUIState {
  if (!text) {
    return state;
  }

  // Prepend any partial line from previous chunks
  const fullText = state.partialLine + text;

  // Split on newlines
  const parts = fullText.split("\n");

  // Last part is incomplete (no trailing newline) - save for next chunk
  const partialLine = parts.pop() ?? "";

  // All other parts are complete lines
  const newLines = parts.filter((line) => line.length > 0);

  if (newLines.length === 0) {
    // No complete lines yet, just update partial
    return { ...state, partialLine };
  }

  const combined = [...state.outputLines, ...newLines];
  // Keep max 1000 lines
  const outputLines = combined.length > 1000 ? combined.slice(-1000) : combined;

  return { ...state, outputLines, partialLine };
}

// Map tool names to the key they use for display
const TOOL_INPUT_KEYS: Record<string, string> = {
  Read: "file_path",
  Edit: "file_path",
  Write: "file_path",
  Bash: "command",
  Glob: "pattern",
  Grep: "pattern",
  Task: "description",
  WebFetch: "url",
  WebSearch: "query",
};

// Helper to format tool input for display
function formatToolInput(tool: string, input: unknown): string {
  if (!input || typeof input !== "object") {
    return "";
  }

  const obj = input as Record<string, unknown>;
  const key = TOOL_INPUT_KEYS[tool];

  if (!key) {
    return "";
  }

  const value = obj[key];
  if (!value) {
    return "";
  }

  const str = String(value);
  // Truncate long values (like bash commands)
  return str.length > 60 ? `${str.slice(0, 60)}...` : str;
}

// Helper to add tool use line to output
function appendToolUse(
  state: TUIState,
  tool: string,
  input: unknown
): TUIState {
  const detail = formatToolInput(tool, input);
  // Format: >> ToolName detail (detail is dimmed)
  const toolLine = detail ? `>> ${tool} ${detail}` : `>> ${tool}`;
  const combined = [...state.outputLines, toolLine, ""];
  const outputLines = combined.length > 1000 ? combined.slice(-1000) : combined;
  return { ...state, outputLines };
}

// Helper to convert domain task to TUI task
function toTUITask(task: { id: string; title: string }): TUITask {
  return {
    id: task.id,
    title: task.title,
    status: "pending",
    phases: [],
    criteria: [],
  };
}

// Helper to update phases for a task
function updateTaskPhases(
  state: TUIState,
  taskId: string,
  phases: readonly { id: string; description: string }[]
): TUIState {
  const tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          phases: phases.map((p) => ({
            id: p.id,
            description: p.description,
            status: "pending" as const,
          })),
        }
      : task
  );
  return { ...state, tasks };
}

// Helper to update criteria for a task
function updateTaskCriteria(
  state: TUIState,
  taskId: string,
  criteria: readonly { id: string; description: string }[]
): TUIState {
  const tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          criteria: criteria.map((c) => ({
            id: c.id,
            description: c.description,
            status: "pending" as const,
          })),
        }
      : task
  );
  return { ...state, tasks };
}

// Helper to set phase status
function setPhaseStatus(
  state: TUIState,
  phaseId: string,
  status: PhaseStatus
): TUIState {
  const now = Date.now();
  const tasks = state.tasks.map((task) => {
    const phases = task.phases.map((phase) =>
      phase.id === phaseId
        ? {
            ...phase,
            status,
            startedAt: status === "in_progress" ? now : phase.startedAt,
            completedAt:
              status === "done" || status === "failed"
                ? now
                : phase.completedAt,
          }
        : phase
    );
    return { ...task, phases };
  });
  return { ...state, tasks };
}

// Helper to set criterion status
function setCriterionStatus(
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

// Helper to set task status
function setTaskStatus(
  state: TUIState,
  taskId: string,
  status: TaskStatus
): TUIState {
  const now = Date.now();
  const tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
          startedAt: status === "in_progress" ? now : task.startedAt,
          completedAt:
            status === "done" || status === "failed" ? now : task.completedAt,
        }
      : task
  );
  return { ...state, tasks };
}

// Pure reducer function
export function reduce(state: TUIState, event: DomainEvent): TUIState {
  switch (event._tag) {
    case "LoopStarted":
      return {
        ...state,
        task: event.config.task,
        maxIterations: event.config.maxIterations,
        status: "running",
        startTime: Date.now(),
      };

    case "IterationStarted":
      return { ...state, iteration: event.iteration };

    case "IterationCompleted": {
      // Flush any remaining partial line
      if (state.partialLine) {
        const combined = [...state.outputLines, state.partialLine];
        const outputLines =
          combined.length > 1000 ? combined.slice(-1000) : combined;
        return { ...state, outputLines, partialLine: "" };
      }
      return state;
    }

    case "LLMText":
      return appendOutput(state, event.text);

    case "LLMToolStart":
      return { ...state, currentTool: event.tool };

    case "LLMToolUse":
      return appendToolUse(state, event.tool, event.input);

    case "LLMToolEnd":
      return { ...state, currentTool: undefined };

    case "TasksDefined":
      return {
        ...state,
        tasks: event.tasks.map(toTUITask),
        currentTaskId: event.tasks[0]?.id,
      };

    case "PhasesDefined":
      return updateTaskPhases(state, event.taskId, event.phases);

    case "CriteriaDefined":
      return updateTaskCriteria(state, event.taskId, event.criteria);

    case "PhaseStarted": {
      const updated = setPhaseStatus(state, event.phaseId, "in_progress");
      // Determine execution mode from phase ID pattern
      const phaseNum = event.phaseId.split(".")[1];
      let executionMode: ExecutionMode = "working";
      if (phaseNum === "1") {
        executionMode = "planning";
      }
      return { ...updated, executionMode };
    }

    case "PhaseCompleted":
      return setPhaseStatus(state, event.phaseId, "done");

    case "PhaseFailed":
      return setPhaseStatus(state, event.phaseId, "failed");

    case "CriterionPassed":
      return setCriterionStatus(state, event.criterionId, "passed");

    case "CriterionFailed":
      return setCriterionStatus(
        state,
        event.criterionId,
        "failed",
        event.reason
      );

    case "TaskCompleted": {
      const updated = setTaskStatus(state, event.taskId, "done");
      // Move to next task if available
      const currentIdx = updated.tasks.findIndex((t) => t.id === event.taskId);
      const nextTask = updated.tasks[currentIdx + 1];
      return {
        ...updated,
        currentTaskId: nextTask?.id,
      };
    }

    case "LoopCompleted": {
      // Flush any remaining partial line
      if (state.partialLine) {
        const combined = [...state.outputLines, state.partialLine];
        const outputLines =
          combined.length > 1000 ? combined.slice(-1000) : combined;
        return { ...state, outputLines, partialLine: "", status: "complete" };
      }
      return { ...state, status: "complete" };
    }

    case "LoopFailed": {
      const errorMsg = event.error.iteration
        ? `[${event.error.phase}] Iteration ${event.error.iteration}: ${event.error.message}`
        : `[${event.error.phase}] ${event.error.message}`;
      return appendError(state, errorMsg);
    }

    case "CheckPassed":
      return { ...state, executionMode: "checking" };

    case "CheckFailed":
      return { ...state, executionMode: "checking" };

    case "ReviewComplete":
      return { ...state, executionMode: "reviewing" };

    default:
      return state;
  }
}

// Scroll helpers
export function scroll(
  state: TUIState,
  direction: "up" | "down",
  lines: number,
  maxOffset: number
): TUIState {
  const delta = direction === "up" ? -lines : lines;
  const newOffset = Math.max(
    0,
    Math.min(maxOffset, state.scrollOffset + delta)
  );
  let userScrolled: boolean;
  if (direction === "up") {
    userScrolled = true;
  } else if (newOffset < maxOffset) {
    userScrolled = state.userScrolled;
  } else {
    userScrolled = false;
  }
  return { ...state, scrollOffset: newOffset, userScrolled };
}

export function scrollTo(
  state: TUIState,
  position: "top" | "bottom",
  maxOffset: number
): TUIState {
  const scrollOffset = position === "top" ? 0 : maxOffset;
  const userScrolled = position === "top";
  return { ...state, scrollOffset, userScrolled };
}

export function navigate(
  state: TUIState,
  direction: "next" | "prev" | "first" | "last"
): TUIState {
  const maxIndex = Math.max(0, state.tasks.length - 1);
  let selectedTaskIndex: number;

  switch (direction) {
    case "next":
      selectedTaskIndex = Math.min(maxIndex, state.selectedTaskIndex + 1);
      break;
    case "prev":
      selectedTaskIndex = Math.max(0, state.selectedTaskIndex - 1);
      break;
    case "first":
      selectedTaskIndex = 0;
      break;
    case "last":
      selectedTaskIndex = maxIndex;
      break;
    default:
      selectedTaskIndex = state.selectedTaskIndex;
  }

  return { ...state, selectedTaskIndex };
}
