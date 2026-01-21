/**
 * @fileoverview Utilities for managing the `.ferix/PLAN.md` file.
 *
 * This module provides the core operations for the planner/worker architecture:
 * - File I/O: loading and saving plans
 * - Task navigation: finding next task, checking completion
 * - Immutable updates: modifying plan state without mutation
 *
 * All update functions return new Plan objects (immutable pattern) to support
 * predictable state management and easy testing.
 *
 * @example
 * ```ts
 * // Load existing plan or create new one
 * let plan = loadPlanIfExists() ?? createPlan("Build feature X");
 *
 * // Get next task and update status
 * const task = getNextTask(plan);
 * if (task) {
 *   plan = updateTaskStatus(plan, task.id, "in_progress");
 *   savePlan(plan);
 * }
 * ```
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import type { Plan, PlanPhase, PlanTask, TaskStatus } from "../types/plan.js";
import { logger } from "../utils/logger.js";
import { parsePlanFile } from "./parser.js";
import { writePlanFile } from "./writer.js";

/** Directory name for ferix configuration and state */
const PLAN_DIR = ".ferix";

/** Plan file name within the ferix directory */
const PLAN_FILE = "PLAN.md";

/** Archive directory within .ferix */
const ARCHIVE_DIR = "archive";

// ============================================================================
// ARCHIVE FUNCTIONS
// ============================================================================

/**
 * Converts text to a filename-safe slug.
 *
 * - Lowercase
 * - Replace spaces/special chars with dashes
 * - Remove consecutive dashes
 * - Truncate to maxLength
 * - Falls back to "task" if result is empty
 *
 * @param text - Text to slugify
 * @param maxLength - Maximum length of the slug (default 30)
 * @returns Filename-safe slug (never empty)
 */
function slugify(text: string, maxLength = 30): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to dashes
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-|-$/g, "") // Trim leading/trailing dashes
    .slice(0, maxLength);

  return slug || "task"; // Fallback if empty
}

/**
 * Generates a timestamp string for archive filenames.
 *
 * Format: YYYY-MM-DD_HHMMSS
 *
 * @returns Formatted timestamp
 */
function getArchiveTimestamp(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
  return `${date}_${time}`;
}

/**
 * Result of archiving a plan file.
 */
export interface ArchiveResult {
  /** Whether the archive was successful */
  success: boolean;
  /** The archive filename (only if successful) */
  filename?: string;
}

/**
 * Archives the existing plan file to `.ferix/archive/` with a verbose name.
 *
 * Naming format: `PLAN_{date}_{time}_{task-slug}.md`
 * Example: `PLAN_2026-01-21_173045_scan-prd-for-tasks.md`
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Result indicating success and archive filename
 */
export function archivePlan(cwd: string = process.cwd()): ArchiveResult {
  const planPath = getPlanPath(cwd);

  if (!existsSync(planPath)) {
    return { success: false };
  }

  try {
    // Load plan to get original task for slug
    const content = readFileSync(planPath, "utf-8");
    const plan = parsePlanFile(content);
    const taskSlug = slugify(plan.originalTask);

    // Create archive directory if needed
    const archiveDir = join(cwd, PLAN_DIR, ARCHIVE_DIR);
    if (!existsSync(archiveDir)) {
      mkdirSync(archiveDir, { recursive: true });
    }

    // Generate archive filename
    const timestamp = getArchiveTimestamp();
    const filename = `PLAN_${timestamp}_${taskSlug}.md`;
    const archivePath = join(archiveDir, filename);

    // Move the plan file to archive
    renameSync(planPath, archivePath);

    return { success: true, filename };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to archive plan: ${message}`);

    // Try to delete the plan file so we can start fresh
    try {
      unlinkSync(planPath);
    } catch {
      // Ignore deletion errors
    }

    return { success: false };
  }
}

// ============================================================================
// CORE FUNCTIONS (actively used by the planner/worker loop)
// ============================================================================

/**
 * Returns the absolute path to the plan file.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Full path to `.ferix/PLAN.md`
 */
export function getPlanPath(cwd: string = process.cwd()): string {
  return join(cwd, PLAN_DIR, PLAN_FILE);
}

/**
 * Checks if a plan file exists in the working directory.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns `true` if `.ferix/PLAN.md` exists
 */
export function planExists(cwd: string = process.cwd()): boolean {
  return existsSync(getPlanPath(cwd));
}

/**
 * Loads a plan from file if it exists, otherwise returns null.
 *
 * Use this for optional plan loading (e.g., checking for resumable work).
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Parsed Plan object, or `null` if file doesn't exist
 */
export function loadPlanIfExists(cwd: string = process.cwd()): Plan | null {
  const path = getPlanPath(cwd);
  if (!existsSync(path)) {
    return null;
  }
  const content = readFileSync(path, "utf-8");
  return parsePlanFile(content);
}

/**
 * Loads a plan from file, throwing if not found.
 *
 * Use this when a plan file is required (e.g., during resume).
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Parsed Plan object
 * @throws Error if plan file doesn't exist
 */
export function loadPlan(cwd: string = process.cwd()): Plan {
  const path = getPlanPath(cwd);
  if (!existsSync(path)) {
    throw new Error(`Plan file not found: ${path}`);
  }
  const content = readFileSync(path, "utf-8");
  return parsePlanFile(content);
}

/**
 * Saves a plan to the `.ferix/PLAN.md` file.
 *
 * Creates the `.ferix` directory if it doesn't exist.
 *
 * @param plan - The Plan object to save
 * @param cwd - Working directory (defaults to process.cwd())
 */
export function savePlan(plan: Plan, cwd: string = process.cwd()): void {
  const path = getPlanPath(cwd);
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const content = writePlanFile(plan);
  writeFileSync(path, content, "utf-8");
}

/**
 * Validation error details
 */
export interface PlanValidationError {
  /** Error code for programmatic handling */
  code:
    | "NO_TASKS"
    | "DUPLICATE_TASK_ID"
    | "INVALID_PHASE_ID"
    | "INVALID_STATUS";
  /** Human-readable error message */
  message: string;
}

/**
 * Validates a plan for structural integrity.
 *
 * Checks:
 * - Plan has at least one task
 * - Task IDs are unique
 * - Phase IDs match parent task (e.g., "1.2" belongs to task 1)
 * - Status values are valid
 *
 * @param plan - The plan to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validatePlan(plan: Plan): PlanValidationError[] {
  const errors: PlanValidationError[] = [];

  // Check for at least one task
  if (plan.tasks.length === 0) {
    errors.push({
      code: "NO_TASKS",
      message: "Plan must have at least one task",
    });
    return errors; // Can't validate further without tasks
  }

  // Check for duplicate task IDs
  const taskIds = plan.tasks.map((t) => t.id);
  const uniqueIds = new Set(taskIds);
  if (uniqueIds.size !== taskIds.length) {
    const duplicates = taskIds.filter(
      (id, index) => taskIds.indexOf(id) !== index
    );
    errors.push({
      code: "DUPLICATE_TASK_ID",
      message: `Duplicate task IDs found: ${[...new Set(duplicates)].join(", ")}`,
    });
  }

  // Validate status values and phase IDs
  const validStatuses = new Set([
    "pending",
    "planning",
    "in_progress",
    "done",
    "failed",
    "skipped",
  ]);

  for (const task of plan.tasks) {
    // Check status
    if (!validStatuses.has(task.status)) {
      errors.push({
        code: "INVALID_STATUS",
        message: `Task ${task.id} has invalid status: ${task.status}`,
      });
    }

    // Check phase IDs match parent task
    if (task.phases) {
      for (const phase of task.phases) {
        const expectedPrefix = `${task.id}.`;
        if (!phase.id.startsWith(expectedPrefix)) {
          errors.push({
            code: "INVALID_PHASE_ID",
            message: `Phase "${phase.id}" should start with "${expectedPrefix}" (belongs to task ${task.id})`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Checks if a plan is valid.
 *
 * @param plan - The plan to check
 * @returns `true` if plan passes all validation checks
 */
export function isPlanValid(plan: Plan): boolean {
  return validatePlan(plan).length === 0;
}

/**
 * Gets the next task that needs work.
 *
 * Priority order:
 * 1. Tasks with status "in_progress" or "planning" (resume interrupted work)
 * 2. Tasks with status "pending" (start new work)
 *
 * @param plan - The plan to search
 * @returns Next task to work on, or `null` if all tasks are complete/failed/skipped
 */
export function getNextTask(plan: Plan): PlanTask | null {
  // Resume interrupted tasks first
  for (const task of plan.tasks) {
    if (task.status === "in_progress" || task.status === "planning") {
      return task;
    }
  }

  // Start next pending task
  for (const task of plan.tasks) {
    if (task.status === "pending") {
      return task;
    }
  }

  return null;
}

// ============================================================================
// QUERY FUNCTIONS (available for programmatic use and testing)
// ============================================================================

/**
 * Checks if all tasks in the plan are complete.
 *
 * @param plan - The plan to check
 * @returns `true` if every task has status "done"
 */
export function isComplete(plan: Plan): boolean {
  return plan.tasks.every((task) => task.status === "done");
}

/**
 * Checks if any task in the plan has failed.
 *
 * @param plan - The plan to check
 * @returns `true` if any task has status "failed"
 */
export function hasFailed(plan: Plan): boolean {
  return plan.tasks.some((task) => task.status === "failed");
}

/**
 * Retrieves a task by its numeric ID.
 *
 * @param plan - The plan to search
 * @param taskId - The task ID to find
 * @returns The matching task, or `null` if not found
 */
export function getTaskById(plan: Plan, taskId: number): PlanTask | null {
  return plan.tasks.find((task) => task.id === taskId) ?? null;
}

// ============================================================================
// IMMUTABLE UPDATE FUNCTIONS (available for programmatic use and testing)
// Note: The LLM updates the plan file directly via file writes, so these
// functions are not used in the main loop but are useful for testing and
// potential future programmatic plan manipulation.
// ============================================================================

/**
 * Updates a task's status and optional notes (immutable).
 *
 * When status is "done", notes are stored as `completionNotes`.
 * When status is "failed", notes are stored as `errorMessage`.
 *
 * @param plan - The plan to update
 * @param taskId - ID of the task to update
 * @param status - New status value
 * @param notes - Optional completion notes or error message
 * @returns New Plan object with updated task
 */
export function updateTaskStatus(
  plan: Plan,
  taskId: number,
  status: TaskStatus,
  notes?: string
): Plan {
  const tasks = plan.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const updated = { ...task, status };
    if (notes) {
      if (status === "done") {
        updated.completionNotes = notes;
      } else if (status === "failed") {
        updated.errorMessage = notes;
      }
    }
    return updated;
  });

  return { ...plan, tasks };
}

/**
 * Adds execution phases to a task (immutable).
 *
 * Phases are typically added by the planner before the worker executes.
 *
 * @param plan - The plan to update
 * @param taskId - ID of the task to update
 * @param phases - Array of phases to add
 * @returns New Plan object with updated task
 */
export function addPhasesToTask(
  plan: Plan,
  taskId: number,
  phases: PlanPhase[]
): Plan {
  const tasks = plan.tasks.map((task) =>
    task.id === taskId ? { ...task, phases } : task
  );
  return { ...plan, tasks };
}

/**
 * Sets the files to modify for a task (immutable).
 *
 * @param plan - The plan to update
 * @param taskId - ID of the task to update
 * @param files - Array of file paths (may include "(new)" suffix for new files)
 * @returns New Plan object with updated task
 */
export function setTaskFiles(
  plan: Plan,
  taskId: number,
  files: string[]
): Plan {
  const tasks = plan.tasks.map((task) =>
    task.id === taskId ? { ...task, filesToModify: files } : task
  );
  return { ...plan, tasks };
}

/**
 * Marks a specific phase as complete (immutable).
 *
 * Searches all tasks for the matching phase ID and marks it complete.
 *
 * @param plan - The plan to update
 * @param phaseId - ID of the phase to mark complete (e.g., "1.2")
 * @returns New Plan object with updated phase
 */
export function markPhaseComplete(plan: Plan, phaseId: string): Plan {
  const tasks = plan.tasks.map((task) => {
    if (!task.phases) {
      return task;
    }

    const phases = task.phases.map((phase) =>
      phase.id === phaseId ? { ...phase, completed: true } : phase
    );

    return { ...task, phases };
  });

  return { ...plan, tasks };
}

/**
 * Creates a new empty plan.
 *
 * @param originalTask - The user's original task description
 * @param context - Optional codebase context from breakdown phase
 * @returns New Plan object with no tasks
 */
export function createPlan(originalTask: string, context?: string): Plan {
  return {
    createdAt: new Date().toISOString(),
    originalTask,
    context,
    tasks: [],
  };
}

/**
 * Adds a new task to the plan (immutable).
 *
 * Automatically assigns the next sequential ID.
 *
 * @param plan - The plan to update
 * @param title - Task title
 * @param description - Task description
 * @returns New Plan object with the task added
 */
export function addTask(plan: Plan, title: string, description: string): Plan {
  const nextId =
    plan.tasks.length > 0 ? Math.max(...plan.tasks.map((t) => t.id)) + 1 : 1;

  const newTask: PlanTask = {
    id: nextId,
    title,
    description,
    status: "pending",
  };

  return {
    ...plan,
    tasks: [...plan.tasks, newTask],
  };
}

/**
 * Creates an array of tasks from raw data.
 *
 * Useful for bulk task creation from breakdown phase output.
 *
 * @param taskData - Array of task title/description pairs
 * @returns Array of PlanTask objects with sequential IDs starting at 1
 */
export function createTasks(
  taskData: Array<{ title: string; description?: string }>
): PlanTask[] {
  return taskData.map((data, index) => ({
    id: index + 1,
    title: data.title,
    description: data.description ?? "",
    status: "pending" as TaskStatus,
  }));
}

/**
 * Counts the number of completed tasks.
 *
 * @param plan - The plan to count
 * @returns Number of tasks with status "done"
 */
export function countCompleted(plan: Plan): number {
  return plan.tasks.filter((task) => task.status === "done").length;
}

/**
 * Counts the total number of tasks.
 *
 * @param plan - The plan to count
 * @returns Total number of tasks
 */
export function countTotal(plan: Plan): number {
  return plan.tasks.length;
}

/**
 * Calculates progress as a fraction between 0 and 1.
 *
 * @param plan - The plan to measure
 * @returns Progress fraction (completed / total), or 0 if no tasks
 */
export function getProgress(plan: Plan): number {
  const total = countTotal(plan);
  if (total === 0) {
    return 0;
  }
  return countCompleted(plan) / total;
}
