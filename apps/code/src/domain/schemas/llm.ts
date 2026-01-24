import { Schema as S } from "effect";

// Individual LLM event schemas
export const TextEventSchema = S.TaggedStruct("Text", {
  text: S.String,
});

export const ToolStartEventSchema = S.TaggedStruct("ToolStart", {
  tool: S.String,
});

export const ToolUseEventSchema = S.TaggedStruct("ToolUse", {
  tool: S.String,
  input: S.Unknown,
});

export const ToolEndEventSchema = S.TaggedStruct("ToolEnd", {
  tool: S.String,
});

export const DoneEventSchema = S.TaggedStruct("Done", {
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

export const decodeLLMEvent = S.decodeUnknown(LLMEventSchema);
