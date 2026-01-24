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
 * Tool support is minimal for initial implementation.
 */
export function extractToolInfo(json: unknown): {
  type: "start" | "input_delta" | "end";
  name: string;
  partialJson?: string;
} | null {
  // Tool support will be added when we can test against actual OpenCode output
  // For now, return null to ignore tool events
  if (isStepStart(json) && json.part) {
    // Future: parse tool info from part field
    return null;
  }

  if (isStepFinish(json)) {
    // Future: could signal tool end
    return null;
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
