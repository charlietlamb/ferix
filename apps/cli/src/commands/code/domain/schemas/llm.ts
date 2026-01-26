import { Either, Schema as S } from "effect";
import {
  type AnyToolInput,
  AnyToolInputSchema,
  validateToolInput,
} from "./tool-inputs.js";

// Re-export tool input validation helper
export { validateToolInput } from "./tool-inputs.js";

// Individual LLM event schemas
export const TextEventSchema = S.TaggedStruct("Text", {
  text: S.String,
});

export const ToolStartEventSchema = S.TaggedStruct("ToolStart", {
  tool: S.String,
});

/**
 * Tool use event schema.
 *
 * The input field uses AnyToolInputSchema for known tools,
 * but falls back to S.Unknown for forward compatibility with
 * unknown tools or new tool versions.
 */
export const ToolUseEventSchema = S.TaggedStruct("ToolUse", {
  tool: S.String,
  input: S.Unknown,
});

/**
 * Validated tool use event schema - validates input against known tool schemas.
 * Use this when you want strict validation of tool inputs.
 */
export const ValidatedToolUseEventSchema = S.TaggedStruct("ToolUse", {
  tool: S.String,
  input: AnyToolInputSchema,
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

/**
 * Validated tool use event type with typed input.
 */
export interface ValidatedToolUseEvent {
  readonly _tag: "ToolUse";
  readonly tool: string;
  readonly input: AnyToolInput;
}

export const decodeLLMEvent = S.decodeUnknown(LLMEventSchema);

/**
 * Create a validated ToolUseEvent by validating the input against the tool's schema.
 *
 * @param event - ToolUseEvent with unknown input
 * @returns Either with validated event or parse error
 */
export function validateToolUseEvent(
  event: ToolUseEvent
): Either.Either<ToolUseEvent, unknown> {
  const validatedInput = validateToolInput(event.tool, event.input);
  return Either.map(validatedInput, (input) => ({
    ...event,
    input,
  }));
}
