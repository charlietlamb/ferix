import { type ChildProcess, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { Effect, Layer, Stream } from "effect";
import { LLMError } from "../../domain/errors.js";
import { LLM, type LLMEvent, type LLMService } from "../../services/llm.js";

/**
 * Parses a JSON line from Claude CLI stream-json output.
 *
 * @param line - Raw JSON line from stdout
 * @returns Parsed JSON object or null if invalid
 */
function parseJsonLine(line: string): unknown | null {
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
function isTextContent(json: unknown): json is {
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
function isToolUse(json: unknown): json is {
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
 * Extracts text from various Claude CLI stream-json message formats.
 */
function extractText(json: unknown): string | null {
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
function isToolInputDelta(json: unknown): json is {
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
function extractToolInfo(json: unknown): {
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
function safeParseJson(jsonStr: string): unknown | null {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Unwraps a stream_event envelope if present.
 * Claude CLI wraps streaming events: { type: "stream_event", event: {...} }
 */
function unwrapStreamEvent(json: unknown): unknown {
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

/**
 * State for tracking tool usage during streaming.
 */
interface ToolState {
  currentTool: string;
  inputChunks: string[];
}

/**
 * Handle tool-related events and emit appropriate LLM events.
 */
function handleToolEvent(
  toolInfo: {
    type: "start" | "input_delta" | "end";
    name: string;
    partialJson?: string;
  },
  toolState: ToolState,
  emit: { single: (event: LLMEvent) => void }
): void {
  if (toolInfo.type === "start") {
    toolState.currentTool = toolInfo.name;
    toolState.inputChunks.length = 0;
    emit.single({ _tag: "ToolStart", tool: toolInfo.name });
    return;
  }

  if (toolInfo.type === "input_delta" && toolInfo.partialJson) {
    toolState.inputChunks.push(toolInfo.partialJson);
    return;
  }

  if (toolInfo.type === "end" && toolState.currentTool) {
    const inputJson = toolState.inputChunks.join("");
    const input = safeParseJson(inputJson);
    if (input !== null) {
      emit.single({ _tag: "ToolUse", tool: toolState.currentTool, input });
    }
    emit.single({ _tag: "ToolEnd", tool: toolState.currentTool });
    toolState.currentTool = "";
    toolState.inputChunks.length = 0;
  }
}

/**
 * Process a single JSON line and emit appropriate events.
 */
function processJsonLine(
  json: unknown,
  outputChunks: string[],
  toolState: ToolState,
  emit: { single: (event: LLMEvent) => void }
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
 * Creates an LLM event stream from a Claude CLI child process.
 */
function createEventStream(
  child: ChildProcess
): Stream.Stream<LLMEvent, LLMError> {
  return Stream.async<LLMEvent, LLMError>((emit) => {
    const outputChunks: string[] = [];
    const toolState: ToolState = { currentTool: "", inputChunks: [] };

    const stdout = child.stdout;
    if (!stdout) {
      emit.fail(
        new LLMError({ message: "Failed to get stdout from child process" })
      );
      return Effect.void;
    }

    const rl = createInterface({
      input: stdout,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    rl.on("line", (line) => {
      const json = parseJsonLine(line);
      if (json) {
        processJsonLine(json, outputChunks, toolState, emit);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        emit.single({ _tag: "Text", text: `[stderr] ${text}` });
      }
    });

    child.on("close", (exitCode) => {
      if (exitCode !== 0) {
        emit.fail(
          new LLMError({
            message: `Claude CLI exited with code ${exitCode}`,
          })
        );
      } else {
        const fullOutput = outputChunks.join("");
        emit.single({ _tag: "Done", output: fullOutput });
        emit.end();
      }
    });

    child.on("error", (error) => {
      emit.fail(
        new LLMError({
          message: error.message,
          cause: error,
        })
      );
    });

    return Effect.sync(() => {
      child.kill("SIGTERM");
    });
  });
}

/**
 * Claude CLI LLM service implementation.
 *
 * Spawns the `claude` CLI with stream-json output format and converts
 * the JSON stream into typed LLM events.
 */
const make: LLMService = {
  execute: (prompt: string): Stream.Stream<LLMEvent, LLMError> => {
    return Stream.unwrap(
      Effect.sync(() => {
        const child = spawn(
          "claude",
          [
            "--permission-mode",
            "acceptEdits",
            "--output-format",
            "stream-json",
            "--verbose",
            "--include-partial-messages",
            "-p",
            prompt,
          ],
          {
            stdio: ["inherit", "pipe", "pipe"],
            env: {
              ...process.env,
              FORCE_COLOR: "1",
            },
          }
        );

        return createEventStream(child);
      })
    );
  },
};

/**
 * Live Layer for the Claude CLI LLM service.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const llm = yield* LLM;
 *   return yield* llm.execute(prompt).pipe(Stream.runCollect);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(ClaudeCLI.Live)));
 * ```
 */
export const Live = Layer.succeed(LLM, make);

/**
 * ClaudeCLI namespace containing the Live layer.
 */
export const ClaudeCLI = {
  Live,
} as const;
