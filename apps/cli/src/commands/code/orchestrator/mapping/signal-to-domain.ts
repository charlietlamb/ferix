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

// Learning signal - maps to LearningRecorded event
// Note: The actual persistence happens in iteration.ts, this is just for event emission
eventMappingRegistry.registerSignalMapper({
  tag: "Learning",
  map: (signal, context) => ({
    _tag: "LearningRecorded",
    iteration: 0, // Will be overwritten by iteration stream
    content: signal.content,
    category: signal.category,
    timestamp: context.timestamp,
  }),
});

// Guardrail signal - maps to GuardrailAdded event
// Note: The actual persistence happens in iteration.ts, this is just for event emission
eventMappingRegistry.registerSignalMapper({
  tag: "Guardrail",
  map: (signal, context) => ({
    _tag: "GuardrailAdded",
    id: `gr-pending-${context.timestamp}`, // Temp ID, real one assigned in iteration
    iteration: 0, // Will be overwritten by iteration stream
    pattern: signal.pattern,
    sign: signal.sign,
    avoidance: signal.avoidance,
    severity: signal.severity,
    timestamp: context.timestamp,
  }),
});

// SessionNameDefined signal - maps to SessionNameGenerated event
// Note: sessionId will be filled in by the discovery stream
eventMappingRegistry.registerSignalMapper({
  tag: "SessionNameDefined",
  map: (signal, context) => ({
    _tag: "SessionNameGenerated",
    sessionId: "", // Will be overwritten by discovery stream
    displayName: signal.name,
    timestamp: context.timestamp,
  }),
});
