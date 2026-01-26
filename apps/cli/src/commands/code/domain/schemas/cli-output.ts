/**
 * Effect schemas for Claude/Cursor CLI stream-json format.
 *
 * Both Claude and Cursor CLIs use the same stream-json format.
 * These schemas provide type-safe parsing of the streaming events.
 */
import { Schema as S } from "effect";

/**
 * Text delta event - streamed text content.
 */
export const TextDeltaSchema = S.Struct({
  type: S.Literal("text_delta"),
  text: S.String,
});
export type TextDelta = typeof TextDeltaSchema.Type;

/**
 * Input JSON delta - partial tool input being streamed.
 */
export const InputJsonDeltaSchema = S.Struct({
  type: S.Literal("input_json_delta"),
  partial_json: S.String,
});
export type InputJsonDelta = typeof InputJsonDeltaSchema.Type;

/**
 * Delta union - either text or input JSON delta.
 */
export const DeltaSchema = S.Union(TextDeltaSchema, InputJsonDeltaSchema);
export type Delta = typeof DeltaSchema.Type;

/**
 * Text content block in an assistant message.
 */
export const TextContentBlockSchema = S.Struct({
  type: S.Literal("text"),
  text: S.String,
});
export type TextContentBlock = typeof TextContentBlockSchema.Type;

/**
 * Tool use content block with name and input.
 */
export const ToolUseContentBlockSchema = S.Struct({
  type: S.Literal("tool_use"),
  id: S.optional(S.String),
  name: S.String,
  input: S.Unknown,
});
export type ToolUseContentBlock = typeof ToolUseContentBlockSchema.Type;

/**
 * Content block union for assistant messages.
 */
export const ContentBlockSchema = S.Union(
  TextContentBlockSchema,
  ToolUseContentBlockSchema
);
export type ContentBlock = typeof ContentBlockSchema.Type;

/**
 * Content block start event - beginning of a content block.
 */
export const ContentBlockStartSchema = S.Struct({
  type: S.Literal("content_block_start"),
  index: S.optional(S.Number),
  content_block: S.Union(
    S.Struct({
      type: S.Literal("text"),
      text: S.optional(S.String),
    }),
    S.Struct({
      type: S.Literal("tool_use"),
      id: S.optional(S.String),
      name: S.String,
      input: S.optional(S.Unknown),
    })
  ),
});
export type ContentBlockStart = typeof ContentBlockStartSchema.Type;

/**
 * Content block delta event - incremental update to a content block.
 */
export const ContentBlockDeltaSchema = S.Struct({
  type: S.Literal("content_block_delta"),
  index: S.optional(S.Number),
  delta: DeltaSchema,
});
export type ContentBlockDelta = typeof ContentBlockDeltaSchema.Type;

/**
 * Content block stop event - end of a content block.
 */
export const ContentBlockStopSchema = S.Struct({
  type: S.Literal("content_block_stop"),
  index: S.optional(S.Number),
});
export type ContentBlockStop = typeof ContentBlockStopSchema.Type;

/**
 * Assistant message event with full content.
 */
export const AssistantMessageSchema = S.Struct({
  type: S.Literal("assistant"),
  message: S.Struct({
    content: S.Array(ContentBlockSchema),
  }),
});
export type AssistantMessage = typeof AssistantMessageSchema.Type;

/**
 * Stream event envelope - CLI wraps streaming events in this format.
 */
export const StreamEventEnvelopeSchema = S.Struct({
  type: S.Literal("stream_event"),
  event: S.Unknown,
});
export type StreamEventEnvelope = typeof StreamEventEnvelopeSchema.Type;

/**
 * Union of all Claude/Cursor CLI streaming events.
 */
export const ClaudeCliEventSchema = S.Union(
  ContentBlockStartSchema,
  ContentBlockDeltaSchema,
  ContentBlockStopSchema,
  AssistantMessageSchema,
  StreamEventEnvelopeSchema
);
export type ClaudeCliEvent = typeof ClaudeCliEventSchema.Type;

/**
 * Type guards using Effect Schema.
 */
export const isContentBlockStart = S.is(ContentBlockStartSchema);
export const isContentBlockDelta = S.is(ContentBlockDeltaSchema);
export const isContentBlockStop = S.is(ContentBlockStopSchema);
export const isAssistantMessage = S.is(AssistantMessageSchema);
export const isStreamEventEnvelope = S.is(StreamEventEnvelopeSchema);
export const isTextDelta = S.is(TextDeltaSchema);
export const isInputJsonDelta = S.is(InputJsonDeltaSchema);
export const isToolUseContentBlock = S.is(ToolUseContentBlockSchema);
export const isTextContentBlock = S.is(TextContentBlockSchema);

/**
 * Decode helpers.
 */
export const decodeClaudeCliEvent = S.decodeUnknown(ClaudeCliEventSchema);
export const decodeClaudeCliEventSync =
  S.decodeUnknownSync(ClaudeCliEventSchema);
