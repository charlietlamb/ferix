import { Schema as S } from "effect";

// Provider schema for TUI state (mirrors ProviderNameSchema from config.ts)
const TUIProviderSchema = S.Literal("claude", "cursor", "opencode");

// View/status literal schemas
const ViewModeSchema = S.Literal("logs", "tasks", "detail");
export type ViewMode = typeof ViewModeSchema.Type;

const LoopStatusSchema = S.Literal(
  "idle",
  "running",
  "complete",
  "paused",
  "error"
);

const ExecutionModeSchema = S.Literal(
  "idle",
  "discovery",
  "breakdown",
  "planning",
  "working",
  "checking",
  "verifying",
  "reviewing"
);
export type ExecutionMode = typeof ExecutionModeSchema.Type;

// TUI-specific status schemas (prefixed to avoid conflicts with plan.ts)
const TUIPhaseStatusSchema = S.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
);
export type TUIPhaseStatus = typeof TUIPhaseStatusSchema.Type;

const TUICriterionStatusSchema = S.Literal("pending", "passed", "failed");
export type TUICriterionStatus = typeof TUICriterionStatusSchema.Type;

const TUITaskStatusSchema = S.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
);
export type TUITaskStatus = typeof TUITaskStatusSchema.Type;

// TUI data schemas
const TUIPhaseSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: TUIPhaseStatusSchema,
  startedAt: S.optional(S.Number),
  completedAt: S.optional(S.Number),
});
export type TUIPhase = typeof TUIPhaseSchema.Type;

const TUICriterionSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: TUICriterionStatusSchema,
  failureReason: S.optional(S.String),
});
export type TUICriterion = typeof TUICriterionSchema.Type;

const TUITaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  status: TUITaskStatusSchema,
  phases: S.Array(TUIPhaseSchema),
  criteria: S.Array(TUICriterionSchema),
  startedAt: S.optional(S.Number),
  completedAt: S.optional(S.Number),
});
export type TUITask = typeof TUITaskSchema.Type;

const TUIStateSchema = S.Struct({
  // Loop info
  task: S.String,
  iteration: S.Number,
  maxIterations: S.Number,
  status: LoopStatusSchema,
  startTime: S.Number,

  // Discovery phase
  discoveryInProgress: S.Boolean,
  discoveryCompleted: S.Boolean,

  // Current activity
  executionMode: ExecutionModeSchema,
  currentTool: S.optional(S.String),
  currentTaskId: S.optional(S.String),

  // Output
  outputLines: S.Array(S.String),
  partialLine: S.String,

  // Tasks
  tasks: S.Array(TUITaskSchema),

  // Navigation
  viewMode: ViewModeSchema,
  selectedTaskIndex: S.Number,
  scrollOffset: S.Number,
  userScrolled: S.Boolean,

  // Git
  gitBranch: S.optional(S.String),
  gitPushed: S.Boolean,
  prUrl: S.optional(S.String),

  // YOLO mode (skip permission prompts)
  yolo: S.Boolean,

  // Debug mode (logging enabled)
  debug: S.Boolean,

  // Current provider/agent (claude, cursor, opencode)
  provider: TUIProviderSchema,
});
export type TUIState = typeof TUIStateSchema.Type;
