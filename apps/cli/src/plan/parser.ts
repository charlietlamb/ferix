/**
 * Parse .ferix/PLAN.md markdown into a Plan object
 *
 * The plan file format:
 * ```markdown
 * # Ferix Plan
 * > Created: 2024-01-21T14:30:00.000Z
 * > Task: Original user task
 *
 * ## Context
 * Codebase context summary...
 *
 * ---
 *
 * ## Task 1: Task title
 * **Status**: pending
 * Task description...
 *
 * ### Phases
 * - [ ] 1.1: Phase description
 * - [x] 1.2: Completed phase
 *
 * ### Files
 * - src/file.ts
 * - src/new-file.ts (new)
 *
 * ### Completed
 * Completion notes...
 * ```
 */

import type { Plan, PlanPhase, PlanTask, TaskStatus } from "../types/plan.js";

// Regex patterns defined at module level for performance
const TASK_HEADER_REGEX = /^## Task (\d+): (.+)$/;
const STATUS_REGEX = /^\*\*Status\*\*:\s*(.+)$/;
const PHASE_REGEX = /^- \[([ x])\] ([\d.]+): (.+)$/;
const FILE_REGEX = /^- (.+?)(?:\s+\(new\))?$/;

/**
 * Parse the plan file content into a Plan object
 *
 * @param content - Raw markdown content of the plan file
 * @returns Parsed Plan object
 */
export function parsePlanFile(content: string): Plan {
  const lines = content.split("\n");

  const createdAt = extractMetadata(lines, "Created:");
  const originalTask = extractMetadata(lines, "Task:");
  const context = extractContext(lines);
  const tasks = extractTasks(lines);

  return {
    createdAt: createdAt || new Date().toISOString(),
    originalTask: originalTask || "",
    context: context || undefined,
    tasks,
  };
}

/**
 * Extract metadata value from header blockquote lines
 * Format: > Key: value
 */
function extractMetadata(lines: string[], key: string): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">") && trimmed.includes(key)) {
      const keyIndex = trimmed.indexOf(key);
      if (keyIndex !== -1) {
        return trimmed.slice(keyIndex + key.length).trim();
      }
    }
  }
  return null;
}

/**
 * Extract the ## Context section content
 */
function extractContext(lines: string[]): string | null {
  let inContext = false;
  const contextLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "## Context") {
      inContext = true;
      continue;
    }

    // Stop at next section (task or separator)
    if (inContext && (trimmed.startsWith("## Task") || trimmed === "---")) {
      break;
    }

    if (inContext && trimmed !== "") {
      contextLines.push(line);
    }
  }

  const result = contextLines.join("\n").trim();
  return result || null;
}

/**
 * Internal state for the task parser state machine
 */
interface TaskParseState {
  currentTask: Partial<PlanTask> | null;
  currentSection: "description" | "phases" | "files" | "completed" | null;
  descriptionLines: string[];
  completedLines: string[];
}

/**
 * Create initial parse state
 */
function createParseState(): TaskParseState {
  return {
    currentTask: null,
    currentSection: null,
    descriptionLines: [],
    completedLines: [],
  };
}

/**
 * Finalize and save current task to the tasks array
 */
function saveCurrentTask(state: TaskParseState, tasks: PlanTask[]): void {
  if (!state.currentTask || state.currentTask.id === undefined) {
    return;
  }

  state.currentTask.description = state.descriptionLines.join("\n").trim();

  if (state.completedLines.length > 0) {
    state.currentTask.completionNotes = state.completedLines.join("\n").trim();
  }

  tasks.push(state.currentTask as PlanTask);
}

/**
 * Initialize a new task from a header line
 * Returns true if a task header was found and processed
 */
function handleTaskHeader(
  line: string,
  state: TaskParseState,
  tasks: PlanTask[]
): boolean {
  const match = line.match(TASK_HEADER_REGEX);
  if (!match) {
    return false;
  }

  const [, idStr, title] = match;
  if (!(idStr && title)) {
    return false;
  }

  // Finalize previous task before starting new one
  saveCurrentTask(state, tasks);

  // Initialize new task
  state.currentTask = {
    id: Number.parseInt(idStr, 10),
    title,
    status: "pending",
    description: "",
    phases: [],
    filesToModify: [],
  };
  state.descriptionLines = [];
  state.completedLines = [];
  state.currentSection = "description";

  return true;
}

/**
 * Handle **Status**: value line
 */
function handleStatusLine(line: string, state: TaskParseState): boolean {
  if (!state.currentTask) {
    return false;
  }

  const match = line.match(STATUS_REGEX);
  if (!match?.[1]) {
    return false;
  }

  state.currentTask.status = parseStatus(match[1]);
  state.currentSection = "description";
  return true;
}

/**
 * Handle ### section headers (Phases, Files, Completed, Error)
 */
function handleSectionHeader(line: string, state: TaskParseState): boolean {
  const sectionMap: Record<string, TaskParseState["currentSection"]> = {
    "### Phases": "phases",
    "### Files": "files",
    "### Completed": "completed",
  };

  const section = sectionMap[line];
  if (section) {
    state.currentSection = section;
    return true;
  }

  return false;
}

/**
 * Parse a phase line: - [x] 1.1: Description
 */
function handlePhaseLine(line: string, state: TaskParseState): void {
  if (state.currentSection !== "phases" || !state.currentTask) {
    return;
  }

  const match = line.match(PHASE_REGEX);
  if (!match) {
    return;
  }

  const [, checkMark, phaseId, description] = match;
  if (!(checkMark && phaseId && description)) {
    return;
  }

  const phase: PlanPhase = {
    id: phaseId,
    description,
    completed: checkMark === "x",
  };

  state.currentTask.phases ??= [];
  state.currentTask.phases.push(phase);
}

/**
 * Parse a file line: - path/to/file.ts (new)
 */
function handleFileLine(line: string, state: TaskParseState): void {
  if (state.currentSection !== "files" || !state.currentTask) {
    return;
  }

  const match = line.match(FILE_REGEX);
  if (!match?.[1]) {
    return;
  }

  state.currentTask.filesToModify ??= [];
  state.currentTask.filesToModify.push(match[1]);
}

/**
 * Handle content lines based on current section
 */
function handleContentLine(line: string, state: TaskParseState): void {
  const trimmed = line.trim();

  // Description lines (skip headers and metadata)
  if (state.currentSection === "description" && trimmed !== "") {
    const isHeader =
      trimmed.startsWith("**") ||
      trimmed.startsWith("###") ||
      trimmed.startsWith("## ");

    if (!isHeader) {
      state.descriptionLines.push(trimmed);
    }
  }

  // Completion notes
  if (state.currentSection === "completed" && trimmed !== "") {
    state.completedLines.push(trimmed);
  }

  // Delegate to specialized handlers
  handlePhaseLine(trimmed, state);
  handleFileLine(trimmed, state);
}

/**
 * Find error message after ### Error header
 */
function findErrorMessage(
  lines: string[],
  startIndex: number,
  state: TaskParseState
): void {
  if (!state.currentTask) {
    return;
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed !== "---") {
      state.currentTask.errorMessage = trimmed;
      break;
    }
  }
}

/**
 * Extract all tasks from the markdown content
 */
function extractTasks(lines: string[]): PlanTask[] {
  const tasks: PlanTask[] = [];
  const state = createParseState();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }

    const trimmed = line.trim();

    // Task header: ## Task N: title
    if (handleTaskHeader(trimmed, state, tasks)) {
      continue;
    }

    // Skip lines until we're inside a task
    if (!state.currentTask) {
      continue;
    }

    // Status line: **Status**: value
    if (handleStatusLine(trimmed, state)) {
      continue;
    }

    // Section headers: ### Phases, ### Files, ### Completed
    if (handleSectionHeader(trimmed, state)) {
      continue;
    }

    // Error section (special case)
    if (trimmed === "### Error") {
      state.currentSection = null;
      findErrorMessage(lines, i, state);
      continue;
    }

    // Task separator
    if (trimmed === "---") {
      state.currentSection = null;
      continue;
    }

    // Content within a section
    handleContentLine(line, state);
  }

  // Don't forget the last task
  saveCurrentTask(state, tasks);

  return tasks;
}

/**
 * Parse status string to TaskStatus enum value
 */
function parseStatus(status: string): TaskStatus {
  const normalized = status.toLowerCase().trim();

  const statusMap: Record<string, TaskStatus> = {
    pending: "pending",
    planning: "planning",
    in_progress: "in_progress",
    "in progress": "in_progress",
    done: "done",
    failed: "failed",
    skipped: "skipped",
  };

  return statusMap[normalized] ?? "pending";
}
