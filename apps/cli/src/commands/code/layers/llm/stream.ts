import type { ChildProcess } from "node:child_process";
import type { Stream } from "effect";
import type { LLMError } from "../../domain/errors.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import {
  extractText,
  extractToolInfo,
  parseJsonLine,
  unwrapStreamEvent,
} from "./providers/parsers/claude.js";
import {
  createLLMEventStream,
  handleToolEvent,
  type StreamEmit,
  type StreamParser,
  type ToolState,
} from "./stream-factory.js";

// Re-export for backward compatibility

/**
 * Process a single JSON line and emit appropriate events.
 */
function processJsonLine(
  json: unknown,
  outputChunks: string[],
  toolState: ToolState,
  emit: Pick<StreamEmit, "single">
): void {
  // Unwrap stream_event envelope if present
  const event = unwrapStreamEvent(json);

  const text = extractText(event);
  if (text) {
    outputChunks.push(text);
    emit.single({ _tag: "Text", text });
    return;
  }

  const toolInfo = extractToolInfo(event);
  if (toolInfo) {
    handleToolEvent(toolInfo, toolState, emit);
  }
}

/**
 * Claude/Cursor stream-json parser.
 */
const streamJsonParser: StreamParser = {
  parseJsonLine,
  processEvent: processJsonLine,
};

/**
 * Creates an LLM event stream from an LLM CLI child process.
 *
 * @param child - The spawned child process
 * @param providerName - Name of the provider for error messages (defaults to "LLM")
 */
export function createEventStream(
  child: ChildProcess,
  providerName = "LLM"
): Stream.Stream<LLMEvent, LLMError> {
  return createLLMEventStream(child, streamJsonParser, providerName);
}
