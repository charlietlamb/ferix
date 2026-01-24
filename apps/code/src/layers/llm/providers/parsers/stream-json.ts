/**
 * Shared stream-json parser for Claude/Cursor CLI formats.
 *
 * Both Claude and Cursor CLIs use the same stream-json format.
 * This module provides the common parsing utilities.
 */

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
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/**
 * Checks if the parsed JSON represents a text content event.
 */
export function isTextContent(json: unknown): json is {
  type: string;
  message?: { content?: Array<{ type: string; text?: string }> };
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    typeof (json as Record<string, unknown>).type === "string"
  );
}

/**
 * Checks if the parsed JSON represents a tool use event.
 */
export function isToolUse(json: unknown): json is {
  type: string;
  content_block?: { type: string; name?: string; input?: unknown };
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    "content_block" in json
  );
}

/**
 * Extracts text from various CLI stream-json message formats.
 */
export function extractText(json: unknown): string | null {
  if (!isTextContent(json)) {
    return null;
  }

  if (json.type === "content_block_delta") {
    const delta = json as {
      delta?: { type?: string; text?: string };
    };
    if (delta.delta?.type === "text_delta" && delta.delta.text) {
      return delta.delta.text;
    }
  }

  if (json.type === "assistant" && json.message?.content) {
    for (const block of json.message.content) {
      if (block.type === "text" && block.text) {
        return block.text;
      }
    }
  }

  return null;
}

/**
 * Checks if the parsed JSON represents a tool input delta event.
 */
export function isToolInputDelta(json: unknown): json is {
  type: string;
  delta?: { type: string; partial_json?: string };
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "content_block_delta" &&
    "delta" in json
  );
}

/**
 * Extracts tool information from stream events.
 */
export function extractToolInfo(json: unknown): {
  type: "start" | "input_delta" | "end";
  name: string;
  partialJson?: string;
} | null {
  // Check for content_block_stop first (doesn't have content_block field)
  if (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "content_block_stop"
  ) {
    return {
      type: "end",
      name: "unknown",
    };
  }

  if (!isToolUse(json)) {
    // Check for input delta separately
    if (
      isToolInputDelta(json) &&
      json.delta?.type === "input_json_delta" &&
      json.delta.partial_json
    ) {
      return {
        type: "input_delta",
        name: "",
        partialJson: json.delta.partial_json,
      };
    }
    return null;
  }

  if (
    json.type === "content_block_start" &&
    json.content_block?.type === "tool_use"
  ) {
    return {
      type: "start",
      name: json.content_block.name || "unknown",
    };
  }

  return null;
}

/**
 * Safely parse accumulated JSON, returning null on failure.
 */
export function safeParseJson(jsonStr: string): unknown | null {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Unwraps a stream_event envelope if present.
 * CLI wraps streaming events: { type: "stream_event", event: {...} }
 */
export function unwrapStreamEvent(json: unknown): unknown {
  if (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "stream_event" &&
    "event" in json
  ) {
    return (json as Record<string, unknown>).event;
  }
  return json;
}
