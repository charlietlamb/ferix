import { eventMappingRegistry } from "./registry.js";

// Direct mappings - signals that map directly to events with same structure
eventMappingRegistry.registerSignalMapper({
  tag: "TasksDefined",
  map: (signal, _context) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhasesDefined",
  map: (signal, _context) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriteriaDefined",
  map: (signal, _context) => signal,
});

// Phase events with timestamps
eventMappingRegistry.registerSignalMapper({
  tag: "PhaseStarted",
  map: (signal, context) => ({ ...signal, timestamp: context.timestamp }),
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhaseCompleted",
  map: (signal, context) => ({ ...signal, timestamp: context.timestamp }),
});

eventMappingRegistry.registerSignalMapper({
  tag: "PhaseFailed",
  map: (signal, context) => ({ ...signal, timestamp: context.timestamp }),
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriterionPassed",
  map: (signal, _context) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "CriterionFailed",
  map: (signal, _context) => signal,
});

eventMappingRegistry.registerSignalMapper({
  tag: "ReviewComplete",
  map: (signal, _context) => signal,
});

// Check passed
eventMappingRegistry.registerSignalMapper({
  tag: "CheckPassed",
  map: (_signal, _context) => ({ _tag: "CheckPassed" }),
});

// Check failed
eventMappingRegistry.registerSignalMapper({
  tag: "CheckFailed",
  map: (_signal, _context) => ({ _tag: "CheckFailed", failedCriteria: [] }),
});

// Task complete - signal has extra fields (filesModified, filesCreated) that event doesn't need
eventMappingRegistry.registerSignalMapper({
  tag: "TaskComplete",
  map: (signal, context) => ({
    _tag: "TaskCompleted",
    taskId: signal.taskId,
    summary: signal.summary,
    timestamp: context.timestamp,
  }),
});

// Loop complete - triggers LoopCompleted event with placeholder summary
eventMappingRegistry.registerSignalMapper({
  tag: "LoopComplete",
  map: (_signal, _context) => ({
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
