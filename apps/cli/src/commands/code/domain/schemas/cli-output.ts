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
const TextDeltaSchema = S.Struct({
  type: S.Literal("text_delta"),
  text: S.String,
});

/**
 * Input JSON delta - partial tool input being streamed.
 */
const InputJsonDeltaSchema = S.Struct({
  type: S.Literal("input_json_delta"),
  partial_json: S.String,
});

/**
 * Delta union - either text or input JSON delta.
 */
const DeltaSchema = S.Union(TextDeltaSchema, InputJsonDeltaSchema);

/**
 * Text content block in an assistant message.
 */
const TextContentBlockSchema = S.Struct({
  type: S.Literal("text"),
  text: S.String,
});

/**
 * Tool use content block with name and input.
 */
const ToolUseContentBlockSchema = S.Struct({
  type: S.Literal("tool_use"),
  id: S.optional(S.String),
  name: S.String,
  input: S.Unknown,
});

/**
 * Content block union for assistant messages.
 */
const ContentBlockSchema = S.Union(
  TextContentBlockSchema,
  ToolUseContentBlockSchema
);

/**
 * Content block start event - beginning of a content block.
 */
const ContentBlockStartSchema = S.Struct({
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

/**
 * Content block delta event - incremental update to a content block.
 */
const ContentBlockDeltaSchema = S.Struct({
  type: S.Literal("content_block_delta"),
  index: S.optional(S.Number),
  delta: DeltaSchema,
});

/**
 * Content block stop event - end of a content block.
 */
const ContentBlockStopSchema = S.Struct({
  type: S.Literal("content_block_stop"),
  index: S.optional(S.Number),
});

/**
 * Assistant message event with full content.
 */
const AssistantMessageSchema = S.Struct({
  type: S.Literal("assistant"),
  message: S.Struct({
    content: S.Array(ContentBlockSchema),
  }),
});
export type AssistantMessage = typeof AssistantMessageSchema.Type;

/**
 * Stream event envelope - CLI wraps streaming events in this format.
 */
const StreamEventEnvelopeSchema = S.Struct({
  type: S.Literal("stream_event"),
  event: S.Unknown,
});

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
