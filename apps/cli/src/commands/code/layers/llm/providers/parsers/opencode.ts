/**
 * OpenCode CLI JSON parser.
 *
 * Parses the JSON events emitted by the OpenCode CLI when using --format json.
 * Uses Effect Schema for type-safe parsing.
 *
 * OpenCode uses a different format than Claude/Cursor:
 * - `type: "text"` - Text content with `text` field
 * - `type: "step_start"` - Start of a step (may include tool info)
 * - `type: "step_finish"` - End of a step with tokens/cost info
 * - `type: "tool_use"` - Complete tool use event with input/output
 */
import { Either } from "effect";
import {
  isOpenCodeStepFinish,
  isOpenCodeStepStart,
  isOpenCodeTextEvent,
  isOpenCodeToolUseEvent,
  type OpenCodeStepFinish,
  type OpenCodeStepStart,
  type OpenCodeTextEvent,
  type OpenCodeToolUseEvent,
} from "../../../../domain/schemas/cli-output-opencode.js";

/**
 * Parses a JSON line from OpenCode CLI output.
 *
 * @param line - Raw JSON line from stdout
 * @returns Parsed JSON object or null if invalid
 */
export function parseJsonLine(line: string): unknown | null {
  if (!line.startsWith("{")) {
    return null;
  }
  return Either.getOrNull(
    Either.try({ try: () => JSON.parse(line) as unknown, catch: () => null })
  );
}

/**
 * Checks if the parsed JSON represents a text content event.
 * Uses Effect Schema type guard for validation.
 */
export function isTextContent(json: unknown): json is OpenCodeTextEvent {
  return isOpenCodeTextEvent(json);
}

/**
 * Checks if the parsed JSON represents a step start event.
 * Uses Effect Schema type guard for validation.
 */
export function isStepStart(json: unknown): json is OpenCodeStepStart {
  return isOpenCodeStepStart(json);
}

/**
 * Checks if the parsed JSON represents a step finish event.
 * Uses Effect Schema type guard for validation.
 */
export function isStepFinish(json: unknown): json is OpenCodeStepFinish {
  return isOpenCodeStepFinish(json);
}

/**
 * Checks if the parsed JSON represents a tool_use event.
 * Uses Effect Schema type guard for validation.
 *
 * OpenCode tool_use events arrive as complete events (not streamed like Claude/Cursor).
 * They contain the full tool input and output in a single event.
 */
export function isToolUse(json: unknown): json is OpenCodeToolUseEvent {
  return isOpenCodeToolUseEvent(json);
}

/**
 * Extracts text from OpenCode CLI text events.
 * Uses Effect Schema for type-safe extraction.
 */
export function extractText(json: unknown): string | null {
  if (isOpenCodeTextEvent(json)) {
    return json.text;
  }
  return null;
}

/**
 * Extracts tool information from stream events.
 * Uses Effect Schema for type-safe extraction.
 *
 * OpenCode sends complete tool events (not streamed like Claude/Cursor),
 * so we return a "complete" type that signals all tool info is available at once.
 */
export function extractToolInfo(json: unknown): {
  type: "start" | "input_delta" | "end" | "complete";
  name: string;
  partialJson?: string;
} | null {
  // Handle complete tool_use events from OpenCode
  if (isOpenCodeToolUseEvent(json)) {
    return {
      type: "complete",
      name: json.part.tool,
      partialJson: JSON.stringify(json.part.state.input),
    };
  }

  return null;
}

/**
 * OpenCode doesn't use a stream_event envelope, so this is a pass-through.
 */
export function unwrapStreamEvent(json: unknown): unknown {
  return json;
}

/**
 * Safely parse accumulated JSON, returning null on failure.
 */
export function safeParseJson(jsonStr: string): unknown | null {
  return Either.getOrNull(
    Either.try({ try: () => JSON.parse(jsonStr) as unknown, catch: () => null })
  );
}
