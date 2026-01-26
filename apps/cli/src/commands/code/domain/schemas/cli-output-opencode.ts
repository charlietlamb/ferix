/**
 * Effect schemas for OpenCode CLI JSON format.
 *
 * OpenCode uses a different format than Claude/Cursor:
 * - `type: "text"` - Text content with `text` field
 * - `type: "step_start"` - Start of a step (may include tool info)
 * - `type: "step_finish"` - End of a step with tokens/cost info
 * - `type: "tool_use"` - Complete tool use event with input/output
 */
import { Schema as S } from "effect";

/**
 * Text content event from OpenCode.
 */
export const OpenCodeTextEventSchema = S.Struct({
  type: S.Literal("text"),
  text: S.String,
});
export type OpenCodeTextEvent = typeof OpenCodeTextEventSchema.Type;

/**
 * Tool state within a tool_use event.
 */
export const OpenCodeToolStateSchema = S.Struct({
  status: S.String,
  input: S.Unknown,
  output: S.optional(S.String),
});
export type OpenCodeToolState = typeof OpenCodeToolStateSchema.Type;

/**
 * Tool part within a tool_use event.
 */
export const OpenCodeToolPartSchema = S.Struct({
  tool: S.String,
  callID: S.String,
  state: OpenCodeToolStateSchema,
});
export type OpenCodeToolPart = typeof OpenCodeToolPartSchema.Type;

/**
 * Tool use event from OpenCode - complete tool invocation with input/output.
 */
export const OpenCodeToolUseEventSchema = S.Struct({
  type: S.Literal("tool_use"),
  part: OpenCodeToolPartSchema,
});
export type OpenCodeToolUseEvent = typeof OpenCodeToolUseEventSchema.Type;

/**
 * Part information in step_start events.
 */
export const OpenCodeStepPartSchema = S.Struct({}).pipe(
  S.extend(S.Record({ key: S.String, value: S.Unknown }))
);
export type OpenCodeStepPart = typeof OpenCodeStepPartSchema.Type;

/**
 * Step start event from OpenCode.
 */
export const OpenCodeStepStartSchema = S.Struct({
  type: S.Literal("step_start"),
  timestamp: S.Number,
  sessionID: S.String,
  part: S.optional(OpenCodeStepPartSchema),
});
export type OpenCodeStepStart = typeof OpenCodeStepStartSchema.Type;

/**
 * Token information in step_finish events.
 */
export const OpenCodeTokensSchema = S.Struct({}).pipe(
  S.extend(S.Record({ key: S.String, value: S.Unknown }))
);
export type OpenCodeTokens = typeof OpenCodeTokensSchema.Type;

/**
 * Cost information in step_finish events.
 */
export const OpenCodeCostSchema = S.Struct({}).pipe(
  S.extend(S.Record({ key: S.String, value: S.Unknown }))
);
export type OpenCodeCost = typeof OpenCodeCostSchema.Type;

/**
 * Step finish event from OpenCode.
 */
export const OpenCodeStepFinishSchema = S.Struct({
  type: S.Literal("step_finish"),
  tokens: S.optional(OpenCodeTokensSchema),
  cost: S.optional(OpenCodeCostSchema),
});
export type OpenCodeStepFinish = typeof OpenCodeStepFinishSchema.Type;

/**
 * Union of all OpenCode CLI streaming events.
 */
export const OpenCodeCliEventSchema = S.Union(
  OpenCodeTextEventSchema,
  OpenCodeToolUseEventSchema,
  OpenCodeStepStartSchema,
  OpenCodeStepFinishSchema
);
export type OpenCodeCliEvent = typeof OpenCodeCliEventSchema.Type;

/**
 * Type guards using Effect Schema.
 */
export const isOpenCodeTextEvent = S.is(OpenCodeTextEventSchema);
export const isOpenCodeToolUseEvent = S.is(OpenCodeToolUseEventSchema);
export const isOpenCodeStepStart = S.is(OpenCodeStepStartSchema);
export const isOpenCodeStepFinish = S.is(OpenCodeStepFinishSchema);

/**
 * Decode helpers.
 */
export const decodeOpenCodeCliEvent = S.decodeUnknown(OpenCodeCliEventSchema);
export const decodeOpenCodeCliEventSync = S.decodeUnknownSync(
  OpenCodeCliEventSchema
);
