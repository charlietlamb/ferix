import { Schema as S } from "effect";

// Individual LLM event schemas
const TextEventSchema = S.TaggedStruct("Text", {
  text: S.String,
});

const ToolStartEventSchema = S.TaggedStruct("ToolStart", {
  tool: S.String,
});

/**
 * Tool use event schema.
 *
 * The input field uses AnyToolInputSchema for known tools,
 * but falls back to S.Unknown for forward compatibility with
 * unknown tools or new tool versions.
 */
const ToolUseEventSchema = S.TaggedStruct("ToolUse", {
  tool: S.String,
  input: S.Unknown,
});

const ToolEndEventSchema = S.TaggedStruct("ToolEnd", {
  tool: S.String,
});

const DoneEventSchema = S.TaggedStruct("Done", {
  output: S.String,
});

// Union of all LLM events
export const LLMEventSchema = S.Union(
  TextEventSchema,
  ToolStartEventSchema,
  ToolUseEventSchema,
  ToolEndEventSchema,
  DoneEventSchema
);

// Explicit union type for proper discrimination
export type TextEvent = typeof TextEventSchema.Type;
export type ToolStartEvent = typeof ToolStartEventSchema.Type;
export type ToolUseEvent = typeof ToolUseEventSchema.Type;
export type ToolEndEvent = typeof ToolEndEventSchema.Type;
export type DoneEvent = typeof DoneEventSchema.Type;

export type LLMEvent =
  | TextEvent
  | ToolStartEvent
  | ToolUseEvent
  | ToolEndEvent
  | DoneEvent;
