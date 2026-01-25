import { Schema as S } from "effect";
import {
  LoopConfigSchema,
  LoopErrorSchema,
  LoopSummarySchema,
} from "./config.js";
import { PlanSchema } from "./plan.js";
import {
  CriteriaDefinedDataSchema,
  CriterionFailedDataSchema,
  CriterionIdDataSchema,
  PhaseFailedDataSchema,
  PhaseIdDataSchema,
  PhasesDefinedDataSchema,
  ReviewCompleteDataSchema,
  TaskCompleteDataSchema,
  TasksDefinedDataSchema,
} from "./shared.js";

/**
 * Helper to extend data schema with tag and additional fields.
 */
const taggedEvent = <Tag extends string, Fields extends S.Struct.Fields>(
  tag: Tag,
  fields: Fields
) => S.TaggedStruct(tag, fields);

const taggedFromData = <Tag extends string, Fields extends S.Struct.Fields>(
  tag: Tag,
  dataSchema: S.Struct<Fields>,
  extraFields: S.Struct.Fields = {}
) => S.TaggedStruct(tag, { ...dataSchema.fields, ...extraFields });

/**
 * Loop lifecycle events.
 */
export const LoopStartedEventSchema = taggedEvent("LoopStarted", {
  config: LoopConfigSchema,
  timestamp: S.Number,
});
export type LoopStartedEvent = typeof LoopStartedEventSchema.Type;

export const LoopCompletedEventSchema = taggedEvent("LoopCompleted", {
  summary: LoopSummarySchema,
});
export type LoopCompletedEvent = typeof LoopCompletedEventSchema.Type;

export const LoopFailedEventSchema = taggedEvent("LoopFailed", {
  error: LoopErrorSchema,
});
export type LoopFailedEvent = typeof LoopFailedEventSchema.Type;

/**
 * Discovery phase events.
 */
export const DiscoveryStartedEventSchema = taggedEvent("DiscoveryStarted", {
  timestamp: S.Number,
});
export type DiscoveryStartedEvent = typeof DiscoveryStartedEventSchema.Type;

export const DiscoveryCompletedEventSchema = taggedEvent("DiscoveryCompleted", {
  taskCount: S.Number,
  timestamp: S.Number,
});
export type DiscoveryCompletedEvent = typeof DiscoveryCompletedEventSchema.Type;

/**
 * Iteration events.
 */
export const IterationStartedEventSchema = taggedEvent("IterationStarted", {
  iteration: S.Number,
});
export type IterationStartedEvent = typeof IterationStartedEventSchema.Type;

export const IterationCompletedEventSchema = taggedEvent("IterationCompleted", {
  iteration: S.Number,
});
export type IterationCompletedEvent = typeof IterationCompletedEventSchema.Type;

/**
 * LLM events.
 */
export const LLMTextEventSchema = taggedEvent("LLMText", {
  text: S.String,
});
export type LLMTextEvent = typeof LLMTextEventSchema.Type;

export const LLMToolStartEventSchema = taggedEvent("LLMToolStart", {
  tool: S.String,
});
export type LLMToolStartEvent = typeof LLMToolStartEventSchema.Type;

export const LLMToolUseEventSchema = taggedEvent("LLMToolUse", {
  tool: S.String,
  input: S.Unknown,
});
export type LLMToolUseEvent = typeof LLMToolUseEventSchema.Type;

export const LLMToolEndEventSchema = taggedEvent("LLMToolEnd", {
  tool: S.String,
});
export type LLMToolEndEvent = typeof LLMToolEndEventSchema.Type;

/**
 * Task/Phase/Criteria definition events.
 */
export const TasksDefinedEventSchema = taggedFromData(
  "TasksDefined",
  TasksDefinedDataSchema
);
export type TasksDefinedEvent = typeof TasksDefinedEventSchema.Type;

export const PhasesDefinedEventSchema = taggedFromData(
  "PhasesDefined",
  PhasesDefinedDataSchema
);
export type PhasesDefinedEvent = typeof PhasesDefinedEventSchema.Type;

export const CriteriaDefinedEventSchema = taggedFromData(
  "CriteriaDefined",
  CriteriaDefinedDataSchema
);
export type CriteriaDefinedEvent = typeof CriteriaDefinedEventSchema.Type;

/**
 * Phase lifecycle events.
 */
export const PhaseStartedEventSchema = taggedFromData(
  "PhaseStarted",
  PhaseIdDataSchema,
  { timestamp: S.Number }
);
export type PhaseStartedEvent = typeof PhaseStartedEventSchema.Type;

export const PhaseCompletedEventSchema = taggedFromData(
  "PhaseCompleted",
  PhaseIdDataSchema,
  { timestamp: S.Number }
);
export type PhaseCompletedEvent = typeof PhaseCompletedEventSchema.Type;

export const PhaseFailedEventSchema = taggedFromData(
  "PhaseFailed",
  PhaseFailedDataSchema,
  { timestamp: S.Number }
);
export type PhaseFailedEvent = typeof PhaseFailedEventSchema.Type;

/**
 * Criterion events.
 */
export const CriterionPassedEventSchema = taggedFromData(
  "CriterionPassed",
  CriterionIdDataSchema
);
export type CriterionPassedEvent = typeof CriterionPassedEventSchema.Type;

export const CriterionFailedEventSchema = taggedFromData(
  "CriterionFailed",
  CriterionFailedDataSchema
);
export type CriterionFailedEvent = typeof CriterionFailedEventSchema.Type;

/**
 * Check events.
 */
export const CheckPassedEventSchema = S.TaggedStruct("CheckPassed", {});
export type CheckPassedEvent = typeof CheckPassedEventSchema.Type;

export const CheckFailedEventSchema = taggedEvent("CheckFailed", {
  failedCriteria: S.Array(S.String),
});
export type CheckFailedEvent = typeof CheckFailedEventSchema.Type;

/**
 * Review event.
 */
export const ReviewCompleteEventSchema = taggedFromData(
  "ReviewComplete",
  ReviewCompleteDataSchema
);
export type ReviewCompleteEvent = typeof ReviewCompleteEventSchema.Type;

/**
 * Task completion event.
 */
export const TaskCompletedEventSchema = taggedFromData(
  "TaskCompleted",
  TaskCompleteDataSchema,
  { timestamp: S.Number }
);
export type TaskCompletedEvent = typeof TaskCompletedEventSchema.Type;

/**
 * Plan events.
 */
export const PlanCreatedEventSchema = taggedEvent("PlanCreated", {
  plan: PlanSchema,
});
export type PlanCreatedEvent = typeof PlanCreatedEventSchema.Type;

export const PlanUpdatedEventSchema = taggedEvent("PlanUpdated", {
  plan: PlanSchema,
});
export type PlanUpdatedEvent = typeof PlanUpdatedEventSchema.Type;

export const PlanUpdateFailedEventSchema = taggedEvent("PlanUpdateFailed", {
  operation: S.Literal("create", "update"),
  error: S.String,
  planId: S.optional(S.String),
});
export type PlanUpdateFailedEvent = typeof PlanUpdateFailedEventSchema.Type;

/**
 * Learning recorded event - captures insights discovered during iteration.
 */
export const LearningRecordedEventSchema = taggedEvent("LearningRecorded", {
  iteration: S.Number,
  content: S.String,
  category: S.optional(S.Literal("success", "failure", "optimization")),
  timestamp: S.Number,
});
export type LearningRecordedEvent = typeof LearningRecordedEventSchema.Type;

/**
 * Guardrail added event - captures failure patterns to avoid.
 */
export const GuardrailAddedEventSchema = taggedEvent("GuardrailAdded", {
  id: S.String,
  iteration: S.Number,
  pattern: S.String,
  sign: S.String,
  avoidance: S.String,
  severity: S.Literal("warning", "critical"),
  timestamp: S.Number,
});
export type GuardrailAddedEvent = typeof GuardrailAddedEventSchema.Type;

/**
 * Progress updated event - signals that progress file was updated.
 */
export const ProgressUpdatedEventSchema = taggedEvent("ProgressUpdated", {
  sessionId: S.String,
  iteration: S.Number,
  taskId: S.String,
  action: S.Literal("started", "completed", "failed", "learning"),
  timestamp: S.Number,
});
export type ProgressUpdatedEvent = typeof ProgressUpdatedEventSchema.Type;

/**
 * Worktree created event - signals that a git worktree was created for the session.
 */
export const WorktreeCreatedEventSchema = taggedEvent("WorktreeCreated", {
  sessionId: S.String,
  worktreePath: S.String,
  branchName: S.String,
  timestamp: S.Number,
});
export type WorktreeCreatedEvent = typeof WorktreeCreatedEventSchema.Type;

/**
 * Worktree removed event - signals that a git worktree was cleaned up.
 */
export const WorktreeRemovedEventSchema = taggedEvent("WorktreeRemoved", {
  sessionId: S.String,
  timestamp: S.Number,
});
export type WorktreeRemovedEvent = typeof WorktreeRemovedEventSchema.Type;

/**
 * Branch pushed event - signals that a branch was pushed to origin.
 */
export const BranchPushedEventSchema = taggedEvent("BranchPushed", {
  sessionId: S.String,
  branchName: S.String,
  timestamp: S.Number,
});
export type BranchPushedEvent = typeof BranchPushedEventSchema.Type;

/**
 * PR created event - signals that a pull request was created.
 */
export const PRCreatedEventSchema = taggedEvent("PRCreated", {
  sessionId: S.String,
  prUrl: S.String,
  title: S.String,
  timestamp: S.Number,
});
export type PRCreatedEvent = typeof PRCreatedEventSchema.Type;

/**
 * Session name generated event - signals that the LLM generated a descriptive name for the session.
 * Emitted during the discovery phase after the session name signal is parsed.
 */
export const SessionNameGeneratedEventSchema = taggedEvent(
  "SessionNameGenerated",
  {
    sessionId: S.String,
    /** Task-based descriptive name (kebab-case slug, e.g., "add-dark-mode-toggle") */
    displayName: S.String,
    timestamp: S.Number,
  }
);
export type SessionNameGeneratedEvent =
  typeof SessionNameGeneratedEventSchema.Type;

/**
 * Union of all domain events.
 */
export const DomainEventSchema = S.Union(
  LoopStartedEventSchema,
  LoopCompletedEventSchema,
  LoopFailedEventSchema,
  DiscoveryStartedEventSchema,
  DiscoveryCompletedEventSchema,
  IterationStartedEventSchema,
  IterationCompletedEventSchema,
  LLMTextEventSchema,
  LLMToolStartEventSchema,
  LLMToolUseEventSchema,
  LLMToolEndEventSchema,
  TasksDefinedEventSchema,
  PhasesDefinedEventSchema,
  CriteriaDefinedEventSchema,
  PhaseStartedEventSchema,
  PhaseCompletedEventSchema,
  PhaseFailedEventSchema,
  CriterionPassedEventSchema,
  CriterionFailedEventSchema,
  CheckPassedEventSchema,
  CheckFailedEventSchema,
  ReviewCompleteEventSchema,
  TaskCompletedEventSchema,
  PlanCreatedEventSchema,
  PlanUpdatedEventSchema,
  PlanUpdateFailedEventSchema,
  LearningRecordedEventSchema,
  GuardrailAddedEventSchema,
  ProgressUpdatedEventSchema,
  WorktreeCreatedEventSchema,
  WorktreeRemovedEventSchema,
  BranchPushedEventSchema,
  PRCreatedEventSchema,
  SessionNameGeneratedEventSchema
);

/**
 * Explicit discriminated union type for proper TypeScript narrowing.
 */
export type DomainEvent =
  | LoopStartedEvent
  | LoopCompletedEvent
  | LoopFailedEvent
  | DiscoveryStartedEvent
  | DiscoveryCompletedEvent
  | IterationStartedEvent
  | IterationCompletedEvent
  | LLMTextEvent
  | LLMToolStartEvent
  | LLMToolUseEvent
  | LLMToolEndEvent
  | TasksDefinedEvent
  | PhasesDefinedEvent
  | CriteriaDefinedEvent
  | PhaseStartedEvent
  | PhaseCompletedEvent
  | PhaseFailedEvent
  | CriterionPassedEvent
  | CriterionFailedEvent
  | CheckPassedEvent
  | CheckFailedEvent
  | ReviewCompleteEvent
  | TaskCompletedEvent
  | PlanCreatedEvent
  | PlanUpdatedEvent
  | PlanUpdateFailedEvent
  | LearningRecordedEvent
  | GuardrailAddedEvent
  | ProgressUpdatedEvent
  | WorktreeCreatedEvent
  | WorktreeRemovedEvent
  | BranchPushedEvent
  | PRCreatedEvent
  | SessionNameGeneratedEvent;

/**
 * Type guard utilities for domain events.
 */
export const DomainEventUtils = {
  isLLMEvent: (
    e: DomainEvent
  ): e is
    | LLMTextEvent
    | LLMToolStartEvent
    | LLMToolUseEvent
    | LLMToolEndEvent => e._tag.startsWith("LLM"),

  isPhaseEvent: (
    e: DomainEvent
  ): e is PhaseStartedEvent | PhaseCompletedEvent | PhaseFailedEvent =>
    e._tag.startsWith("Phase"),

  isCriterionEvent: (
    e: DomainEvent
  ): e is CriterionPassedEvent | CriterionFailedEvent =>
    e._tag.startsWith("Criterion"),

  isLoopEvent: (
    e: DomainEvent
  ): e is LoopStartedEvent | LoopCompletedEvent | LoopFailedEvent =>
    e._tag.startsWith("Loop"),

  isDiscoveryEvent: (
    e: DomainEvent
  ): e is DiscoveryStartedEvent | DiscoveryCompletedEvent =>
    e._tag.startsWith("Discovery"),
} as const;
