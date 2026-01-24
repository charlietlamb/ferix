import type { ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { Effect, Stream } from "effect";
import { LLMError } from "../../domain/errors.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import { safeParseJson } from "./providers/parsers/stream-json.js";

/**
 * State for tracking tool usage during streaming.
 */
export interface ToolState {
  currentTool: string;
  inputChunks: string[];
}

/**
 * Emit interface for stream events.
 */
export interface StreamEmit {
  single: (event: LLMEvent) => void;
  fail: (error: LLMError) => void;
  end: () => void;
}

/**
 * Parser interface for processing CLI JSON output.
 */
export interface StreamParser {
  /** Parse a raw line into JSON, returning null if invalid */
  parseJsonLine(line: string): unknown | null;

  /** Process a JSON event and emit appropriate LLM events */
  processEvent(
    json: unknown,
    outputChunks: string[],
    toolState: ToolState,
    emit: StreamEmit
  ): void;
}

/**
 * Handle tool-related events and emit appropriate LLM events.
 */
export function handleToolEvent(
  toolInfo: {
    type: "start" | "input_delta" | "end";
    name: string;
    partialJson?: string;
  },
  toolState: ToolState,
  emit: Pick<StreamEmit, "single">
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
 * Creates an LLM event stream from a CLI child process.
 *
 * @param child - The spawned child process
 * @param parser - The parser for processing JSON events
 * @param providerName - Name of the provider for error messages
 */
export function createLLMEventStream(
  child: ChildProcess,
  parser: StreamParser,
  providerName: string
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
      const json = parser.parseJsonLine(line);
      if (json) {
        parser.processEvent(json, outputChunks, toolState, emit);
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
            message: `${providerName} CLI exited with code ${exitCode}`,
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
