/**
 * OpenCode CLI JSON parser.
 *
 * Parses the JSON events emitted by the OpenCode CLI when using --format json.
 *
 * OpenCode uses a different format than Claude/Cursor:
 * - `type: "text"` - Text content with `text` field
 * - `type: "step_start"` - Start of a step (may include tool info)
 * - `type: "step_finish"` - End of a step with tokens/cost info
 */

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
  type: "text";
  text: string;
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "text" &&
    "text" in json &&
    typeof (json as Record<string, unknown>).text === "string"
  );
}

/**
 * Checks if the parsed JSON represents a step start event.
 */
export function isStepStart(json: unknown): json is {
  type: "step_start";
  timestamp: number;
  sessionID: string;
  part?: Record<string, unknown>;
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "step_start"
  );
}

/**
 * Checks if the parsed JSON represents a step finish event.
 */
export function isStepFinish(json: unknown): json is {
  type: "step_finish";
  tokens?: Record<string, unknown>;
  cost?: Record<string, unknown>;
} {
  return (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "step_finish"
  );
}

/**
 * Checks if the parsed JSON represents a tool_use event.
 *
 * OpenCode tool_use events arrive as complete events (not streamed like Claude/Cursor).
 * They contain the full tool input and output in a single event.
 */
export function isToolUse(json: unknown): json is {
  type: "tool_use";
  part: {
    tool: string;
    callID: string;
    state: {
      status: string;
      input: unknown;
      output?: string;
    };
  };
} {
  if (typeof json !== "object" || json === null) {
    return false;
  }
  const obj = json as Record<string, unknown>;
  if (obj.type !== "tool_use") {
    return false;
  }
  if (typeof obj.part !== "object" || obj.part === null) {
    return false;
  }
  const part = obj.part as Record<string, unknown>;
  if (typeof part.tool !== "string") {
    return false;
  }
  if (typeof part.state !== "object" || part.state === null) {
    return false;
  }
  return true;
}

/**
 * Extracts text from OpenCode CLI text events.
 */
export function extractText(json: unknown): string | null {
  if (isTextContent(json)) {
    return json.text;
  }
  return null;
}

/**
 * Extracts tool information from stream events.
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
  if (isToolUse(json)) {
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
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
