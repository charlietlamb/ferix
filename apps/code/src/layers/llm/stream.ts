import type { ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { Effect, Stream } from "effect";
import { LLMError } from "../../domain/errors.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import {
  extractText,
  extractToolInfo,
  parseJsonLine,
  safeParseJson,
  unwrapStreamEvent,
} from "./parsers.js";

/**
 * State for tracking tool usage during streaming.
 */
export interface ToolState {
  currentTool: string;
  inputChunks: string[];
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
export function processJsonLine(
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
export function createEventStream(
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
