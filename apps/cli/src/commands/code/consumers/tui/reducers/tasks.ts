import type {
  CriteriaDefinedEvent,
  CriterionFailedEvent,
  CriterionPassedEvent,
  PhaseCompletedEvent,
  PhaseFailedEvent,
  PhaseStartedEvent,
  PhasesDefinedEvent,
  TaskCompletedEvent,
  TasksDefinedEvent,
} from "../../../domain/index.js";
import type { ExecutionMode } from "../../../domain/schemas/tui.js";
import {
  setCriterionStatus,
  setPhaseStatus,
  setTaskStatus,
  toTUITask,
  updateTaskCriteria,
  updateTaskPhases,
} from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const tasksDefinedReducer: StateReducer<"TasksDefined"> = {
  tag: "TasksDefined",
  reduce: (state, event: TasksDefinedEvent) => ({
    ...state,
    tasks: event.tasks.map(toTUITask),
    currentTaskId: event.tasks[0]?.id,
    // Emit task-block marker so LogsView can render tasks compactly from state
    outputLines: [...state.outputLines, "<ferix:task-block/>"],
  }),
};

const phasesDefinedReducer: StateReducer<"PhasesDefined"> = {
  tag: "PhasesDefined",
  reduce: (state, event: PhasesDefinedEvent) =>
    updateTaskPhases(state, event.taskId, event.phases),
};

const criteriaDefinedReducer: StateReducer<"CriteriaDefined"> = {
  tag: "CriteriaDefined",
  reduce: (state, event: CriteriaDefinedEvent) =>
    updateTaskCriteria(state, event.taskId, event.criteria),
};

const phaseStartedReducer: StateReducer<"PhaseStarted"> = {
  tag: "PhaseStarted",
  reduce: (state, event: PhaseStartedEvent) => {
    const updated = setPhaseStatus(state, "in_progress", {
      phaseId: event.phaseId,
      timestamp: event.timestamp,
    });
    const phaseNum = event.phaseId.split(".")[1];
    let executionMode: ExecutionMode = "working";
    if (phaseNum === "1") {
      executionMode = "planning";
    }
    return { ...updated, executionMode };
  },
};

const phaseCompletedReducer: StateReducer<"PhaseCompleted"> = {
  tag: "PhaseCompleted",
  reduce: (state, event: PhaseCompletedEvent) =>
    setPhaseStatus(state, "done", {
      phaseId: event.phaseId,
      timestamp: event.timestamp,
    }),
};

const phaseFailedReducer: StateReducer<"PhaseFailed"> = {
  tag: "PhaseFailed",
  reduce: (state, event: PhaseFailedEvent) =>
    setPhaseStatus(state, "failed", {
      phaseId: event.phaseId,
      timestamp: event.timestamp,
    }),
};

const criterionPassedReducer: StateReducer<"CriterionPassed"> = {
  tag: "CriterionPassed",
  reduce: (state, event: CriterionPassedEvent) =>
    setCriterionStatus(state, event.criterionId, "passed"),
};

const criterionFailedReducer: StateReducer<"CriterionFailed"> = {
  tag: "CriterionFailed",
  reduce: (state, event: CriterionFailedEvent) =>
    setCriterionStatus(state, event.criterionId, "failed", event.reason),
};

const taskCompletedReducer: StateReducer<"TaskCompleted"> = {
  tag: "TaskCompleted",
  reduce: (state, event: TaskCompletedEvent) => {
    const updated = setTaskStatus(state, "done", {
      taskId: event.taskId,
      timestamp: event.timestamp,
    });
    const currentIdx = updated.tasks.findIndex((t) => t.id === event.taskId);
    const nextTask = updated.tasks[currentIdx + 1];
    return {
      ...updated,
      currentTaskId: nextTask?.id,
    };
  },
};

stateReducerRegistry.register(tasksDefinedReducer);
stateReducerRegistry.register(phasesDefinedReducer);
stateReducerRegistry.register(criteriaDefinedReducer);
stateReducerRegistry.register(phaseStartedReducer);
stateReducerRegistry.register(phaseCompletedReducer);
stateReducerRegistry.register(phaseFailedReducer);
stateReducerRegistry.register(criterionPassedReducer);
stateReducerRegistry.register(criterionFailedReducer);
stateReducerRegistry.register(taskCompletedReducer);
