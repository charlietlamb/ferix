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
const OpenCodeTextEventSchema = S.Struct({
  type: S.Literal("text"),
  text: S.String,
});

/**
 * Tool state within a tool_use event.
 */
const OpenCodeToolStateSchema = S.Struct({
  status: S.String,
  input: S.Unknown,
  output: S.optional(S.String),
});

/**
 * Tool part within a tool_use event.
 */
const OpenCodeToolPartSchema = S.Struct({
  tool: S.String,
  callID: S.String,
  state: OpenCodeToolStateSchema,
});

/**
 * Tool use event from OpenCode - complete tool invocation with input/output.
 */
const OpenCodeToolUseEventSchema = S.Struct({
  type: S.Literal("tool_use"),
  part: OpenCodeToolPartSchema,
});

/**
 * Token information in step_finish events.
 */
const OpenCodeTokensSchema = S.Struct({}).pipe(
  S.extend(S.Record({ key: S.String, value: S.Unknown }))
);

/**
 * Cost information in step_finish events.
 */
const OpenCodeCostSchema = S.Struct({}).pipe(
  S.extend(S.Record({ key: S.String, value: S.Unknown }))
);

/**
 * Step finish event from OpenCode.
 */
const OpenCodeStepFinishSchema = S.Struct({
  type: S.Literal("step_finish"),
  tokens: S.optional(OpenCodeTokensSchema),
  cost: S.optional(OpenCodeCostSchema),
});
export type OpenCodeStepFinish = typeof OpenCodeStepFinishSchema.Type;

/**
 * Type guards using Effect Schema.
 */
export const isOpenCodeTextEvent = S.is(OpenCodeTextEventSchema);
export const isOpenCodeToolUseEvent = S.is(OpenCodeToolUseEventSchema);
export const isOpenCodeStepFinish = S.is(OpenCodeStepFinishSchema);
