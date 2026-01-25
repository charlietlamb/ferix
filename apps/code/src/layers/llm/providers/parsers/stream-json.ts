/**
 * Shared stream-json parser for Claude/Cursor CLI formats.
 *
 * Both Claude and Cursor CLIs use the same stream-json format.
 * This module provides the common parsing utilities using Effect Schema.
 */
import { Either } from "effect";
import {
  type AssistantMessage,
  type ContentBlockDelta,
  type ContentBlockStart,
  isAssistantMessage,
  isContentBlockDelta,
  isContentBlockStart,
  isContentBlockStop,
  isInputJsonDelta,
  isStreamEventEnvelope,
  isTextContentBlock,
  isTextDelta,
  isToolUseContentBlock,
} from "../../../../domain/schemas/cli-output.js";

/**
 * Parses a JSON line from CLI stream-json output.
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
export function isTextContent(json: unknown): json is {
  type: string;
  message?: { content?: Array<{ type: string; text?: string }> };
} {
  // Check for assistant message with text content
  if (isAssistantMessage(json)) {
    return true;
  }
  // Check for content_block_delta with text_delta
  if (isContentBlockDelta(json) && isTextDelta(json.delta)) {
    return true;
  }
  // Check for content_block_start
  if (isContentBlockStart(json)) {
    return true;
  }
  return false;
}

/**
 * Checks if the parsed JSON represents a tool use event.
 * Uses Effect Schema type guard for validation.
 */
export function isToolUse(json: unknown): json is ContentBlockStart {
  if (!isContentBlockStart(json)) {
    return false;
  }
  return isToolUseContentBlock(json.content_block);
}

/**
 * Extracts text from various CLI stream-json message formats.
 * Uses Effect Schema for type-safe extraction.
 */
export function extractText(json: unknown): string | null {
  // Handle content_block_delta with text_delta
  if (isContentBlockDelta(json) && isTextDelta(json.delta)) {
    return json.delta.text;
  }

  // Handle assistant message with text content
  if (isAssistantMessage(json)) {
    for (const block of (json as AssistantMessage).message.content) {
      if (isTextContentBlock(block)) {
        return block.text;
      }
    }
  }

  return null;
}

/**
 * Checks if the parsed JSON represents a tool input delta event.
 * Uses Effect Schema type guard for validation.
 */
export function isToolInputDelta(json: unknown): json is ContentBlockDelta & {
  delta: { type: "input_json_delta"; partial_json: string };
} {
  if (!isContentBlockDelta(json)) {
    return false;
  }
  return isInputJsonDelta(json.delta);
}

/**
 * Extracts tool information from stream events.
 * Uses Effect Schema for type-safe extraction.
 */
export function extractToolInfo(json: unknown): {
  type: "start" | "input_delta" | "end";
  name: string;
  partialJson?: string;
} | null {
  // Check for content_block_stop first
  if (isContentBlockStop(json)) {
    return {
      type: "end",
      name: "unknown",
    };
  }

  // Check for content_block_start with tool_use
  if (isContentBlockStart(json) && isToolUseContentBlock(json.content_block)) {
    return {
      type: "start",
      name: json.content_block.name,
    };
  }

  // Check for content_block_delta with input_json_delta
  if (isContentBlockDelta(json) && isInputJsonDelta(json.delta)) {
    return {
      type: "input_delta",
      name: "",
      partialJson: json.delta.partial_json,
    };
  }

  return null;
}

/**
 * Safely parse accumulated JSON, returning null on failure.
 */
export function safeParseJson(jsonStr: string): unknown | null {
  return Either.getOrNull(
    Either.try({ try: () => JSON.parse(jsonStr) as unknown, catch: () => null })
  );
}

/**
 * Unwraps a stream_event envelope if present.
 * CLI wraps streaming events: { type: "stream_event", event: {...} }
 * Uses Effect Schema for type-safe detection.
 */
export function unwrapStreamEvent(json: unknown): unknown {
  if (isStreamEventEnvelope(json)) {
    return json.event;
  }
  return json;
}
