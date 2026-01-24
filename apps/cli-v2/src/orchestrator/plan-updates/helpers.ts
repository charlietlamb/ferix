import { type Plan, PlanId, type Task } from "../../domain/plan.js";

/**
 * Creates a Plan from tasks defined by the LLM.
 */
export function createPlanFromTasks(
  sessionId: string,
  originalTask: string,
  tasks: readonly { id: string; title: string; description: string }[]
): Plan {
  return {
    id: PlanId(`${sessionId}-plan`),
    sessionId,
    createdAt: new Date().toISOString(),
    originalTask,
    tasks: tasks.map(
      (t): Task => ({
        ...t,
        status: "pending",
        phases: [],
        criteria: [],
        filesToModify: [],
        attempts: 0,
      })
    ),
  };
}

/**
 * Updates a plan with new phase information for a task.
 */
export function updatePlanWithPhases(
  plan: Plan,
  taskId: string,
  phases: readonly { id: string; description: string }[]
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    phases: phases.map((p) => ({
      id: p.id,
      description: p.description,
      status: "pending" as const,
    })),
  };
  return { ...plan, tasks: updatedTasks };
}

/**
 * Updates a plan with new criteria information for a task.
 */
export function updatePlanWithCriteria(
  plan: Plan,
  taskId: string,
  criteria: readonly { id: string; description: string }[]
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    criteria: criteria.map((c) => ({
      id: c.id,
      description: c.description,
      status: "pending" as const,
    })),
  };
  return { ...plan, tasks: updatedTasks };
}

/**
 * Extracts the task ID from a phase ID.
 */
function getTaskIdFromPhaseId(phaseId: string): string {
  const dotIndex = phaseId.indexOf(".");
  return dotIndex !== -1 ? phaseId.substring(0, dotIndex) : phaseId;
}

/**
 * Extracts the task ID from a criterion ID.
 */
function getTaskIdFromCriterionId(criterionId: string): string {
  const dotIndex = criterionId.indexOf(".");
  return dotIndex !== -1 ? criterionId.substring(0, dotIndex) : criterionId;
}

/**
 * Updates a phase status in the plan.
 */
export function updatePhaseStatus(
  plan: Plan,
  phaseId: string,
  status: "pending" | "in_progress" | "done" | "failed"
): Plan {
  const taskId = getTaskIdFromPhaseId(phaseId);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const task = plan.tasks[taskIndex];
  if (!task) {
    return plan;
  }

  const phaseIndex = task.phases.findIndex((p) => p.id === phaseId);
  if (phaseIndex === -1) {
    return plan;
  }

  const existingPhase = task.phases[phaseIndex];
  if (!existingPhase) {
    return plan;
  }

  const updatedPhases = [...task.phases];
  updatedPhases[phaseIndex] = {
    id: existingPhase.id,
    description: existingPhase.description,
    status,
  };

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = { ...task, phases: updatedPhases };

  return { ...plan, tasks: updatedTasks };
}

/**
 * Updates a criterion status in the plan.
 */
export function updateCriterionStatus(
  plan: Plan,
  criterionId: string,
  status: "pending" | "passed" | "failed",
  failureReason?: string
): Plan {
  const taskId = getTaskIdFromCriterionId(criterionId);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const task = plan.tasks[taskIndex];
  if (!task) {
    return plan;
  }

  const criterionIndex = task.criteria.findIndex((c) => c.id === criterionId);
  if (criterionIndex === -1) {
    return plan;
  }

  const existingCriterion = task.criteria[criterionIndex];
  if (!existingCriterion) {
    return plan;
  }

  const updatedCriteria = [...task.criteria];
  updatedCriteria[criterionIndex] = {
    id: existingCriterion.id,
    description: existingCriterion.description,
    status,
    failureReason,
  };

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = { ...task, criteria: updatedCriteria };

  return { ...plan, tasks: updatedTasks };
}

/**
 * Marks a task as completed in the plan.
 */
export function markTaskCompleted(
  plan: Plan,
  taskId: string,
  summary: string
): Plan {
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return plan;
  }

  const existingTask = plan.tasks[taskIndex];
  if (!existingTask) {
    return plan;
  }

  const updatedTasks = [...plan.tasks];
  updatedTasks[taskIndex] = {
    ...existingTask,
    status: "done" as const,
    completionNotes: summary,
  };
  return { ...plan, tasks: updatedTasks };
}
