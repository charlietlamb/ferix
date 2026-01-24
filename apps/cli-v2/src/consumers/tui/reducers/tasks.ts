import type { ExecutionMode } from "../state.js";
import {
  setCriterionStatus,
  setPhaseStatus,
  setTaskStatus,
  toTUITask,
  updateTaskCriteria,
  updateTaskPhases,
} from "./helpers.js";
import { stateReducerRegistry } from "./registry.js";

// Tasks defined
stateReducerRegistry.register({
  tag: "TasksDefined",
  reduce: (state, event) => ({
    ...state,
    tasks: event.tasks.map(toTUITask),
    currentTaskId: event.tasks[0]?.id,
  }),
});

// Phases defined
stateReducerRegistry.register({
  tag: "PhasesDefined",
  reduce: (state, event) => updateTaskPhases(state, event.taskId, event.phases),
});

// Criteria defined
stateReducerRegistry.register({
  tag: "CriteriaDefined",
  reduce: (state, event) =>
    updateTaskCriteria(state, event.taskId, event.criteria),
});

// Phase started
stateReducerRegistry.register({
  tag: "PhaseStarted",
  reduce: (state, event) => {
    const updated = setPhaseStatus(state, event.phaseId, "in_progress");
    const phaseNum = event.phaseId.split(".")[1];
    let executionMode: ExecutionMode = "working";
    if (phaseNum === "1") {
      executionMode = "planning";
    }
    return { ...updated, executionMode };
  },
});

// Phase completed
stateReducerRegistry.register({
  tag: "PhaseCompleted",
  reduce: (state, event) => setPhaseStatus(state, event.phaseId, "done"),
});

// Phase failed
stateReducerRegistry.register({
  tag: "PhaseFailed",
  reduce: (state, event) => setPhaseStatus(state, event.phaseId, "failed"),
});

// Criterion passed
stateReducerRegistry.register({
  tag: "CriterionPassed",
  reduce: (state, event) =>
    setCriterionStatus(state, event.criterionId, "passed"),
});

// Criterion failed
stateReducerRegistry.register({
  tag: "CriterionFailed",
  reduce: (state, event) =>
    setCriterionStatus(state, event.criterionId, "failed", event.reason),
});

// Task completed
stateReducerRegistry.register({
  tag: "TaskCompleted",
  reduce: (state, event) => {
    const updated = setTaskStatus(state, event.taskId, "done");
    const currentIdx = updated.tasks.findIndex((t) => t.id === event.taskId);
    const nextTask = updated.tasks[currentIdx + 1];
    return {
      ...updated,
      currentTaskId: nextTask?.id,
    };
  },
});
