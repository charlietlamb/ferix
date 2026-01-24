import { eventMappingRegistry } from "./registry.js";

// Direct mappings - signals that map directly to events with same structure
eventMappingRegistry.registerSignalMapper({
  tag: "TasksDefined",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhasesDefined",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriteriaDefined",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhaseStarted",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhaseCompleted",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhaseFailed",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriterionPassed",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriterionFailed",
  map: (signal) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "ReviewComplete",
  map: (signal) => signal,
});

// Check passed
eventMappingRegistry.registerSignalMapper({
  tag: "CheckPassed",
  map: () => ({ _tag: "CheckPassed" }),
});

// Check failed
eventMappingRegistry.registerSignalMapper({
  tag: "CheckFailed",
  map: () => ({ _tag: "CheckFailed", failedCriteria: [] }),
});

// Task complete - signal has extra fields (filesModified, filesCreated) that event doesn't need
eventMappingRegistry.registerSignalMapper({
  tag: "TaskComplete",
  map: (signal) => ({
    _tag: "TaskCompleted",
    taskId: signal.taskId,
    summary: signal.summary,
  }),
});

// Loop complete - triggers LoopCompleted event with placeholder summary
eventMappingRegistry.registerSignalMapper({
  tag: "LoopComplete",
  map: () => ({
    _tag: "LoopCompleted",
    summary: {
      iterations: 0,
      success: true,
      sessionId: "",
      completedTasks: [],
      durationMs: 0,
    },
  }),
});
