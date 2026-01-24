import type { ChildProcess } from "node:child_process";
import type { Stream } from "effect";
import type { LLMError } from "../../domain/errors.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import {
  extractText,
  isStepFinish,
  parseJsonLine,
} from "./providers/parsers/opencode.js";
import {
  createLLMEventStream,
  type StreamEmit,
  type StreamParser,
  type ToolState,
} from "./stream-factory.js";

/**
 * Process a single JSON event from OpenCode CLI.
 */
function processOpenCodeEvent(
  json: unknown,
  outputChunks: string[],
  _toolState: ToolState,
  emit: StreamEmit
): void {
  // Handle text events
  const text = extractText(json);
  if (text) {
    outputChunks.push(text);
    emit.single({ _tag: "Text", text });
    return;
  }

  // step_finish is informational - we don't need to act on it
  // The process close event will handle completion
  if (isStepFinish(json)) {
    // Could log token usage or cost info here if needed
    return;
  }
}

/**
 * OpenCode stream parser.
 */
const openCodeParser: StreamParser = {
  parseJsonLine,
  processEvent: processOpenCodeEvent,
};

/**
 * Creates an LLM event stream from an OpenCode CLI child process.
 *
 * OpenCode uses a different JSON format than Claude/Cursor:
 * - `type: "text"` events contain text directly in `text` field
 * - `type: "step_finish"` events signal completion
 *
 * @param child - The spawned child process
 * @param providerName - Name of the provider for error messages (defaults to "OpenCode")
 */
export function createOpenCodeEventStream(
  child: ChildProcess,
  providerName = "OpenCode"
): Stream.Stream<LLMEvent, LLMError> {
  return createLLMEventStream(child, openCodeParser, providerName);
}
