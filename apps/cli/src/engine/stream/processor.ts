/**
 * Stream line processor for Claude CLI output
 */

import type {
  ClaudeEvent,
  ProcessorState,
  StreamMessage,
} from "../../types/events.js";
import { handleAssistantMessage, handleStreamEvent } from "./handlers.js";

/**
 * Check if a tool result block contains an error
 */
function isToolResultError(block: {
  type: string;
  content?: string;
  is_error?: boolean;
}): boolean {
  return (
    block.type === "tool_result" &&
    typeof block.content === "string" &&
    (block.content.includes("Error:") || Boolean(block.is_error))
  );
}

/**
 * Handle tool result messages that may contain errors
 */
function handleToolResultErrors(
  msg: StreamMessage,
  emit: (e: ClaudeEvent) => void
): void {
  if (msg.type !== "user" || !msg.message?.content) {
    return;
  }

  for (const block of msg.message.content) {
    if (isToolResultError(block) && typeof block.content === "string") {
      emit({ type: "error", message: block.content });
    }
  }
}

/**
 * Process a single line of stream output
 */
export function processLine(
  line: string,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  outputText: (t: string) => void,
  writeToStdout: boolean
): void {
  if (!line.trim()) {
    return;
  }

  try {
    const msg: StreamMessage = JSON.parse(line);

    if (msg.type === "stream_event" && msg.event) {
      handleStreamEvent(msg.event, state, emit, outputText, writeToStdout);
    }

    handleAssistantMessage(msg, emit, writeToStdout);

    // Handle tool result messages that may contain errors
    handleToolResultErrors(msg, emit);

    if (msg.type === "result") {
      emit({ type: "complete" });
      if (writeToStdout) {
        process.stdout.write("\n");
      }
    }
  } catch {
    // Non-JSON line - could be an error or other output, show it to the user
    if (line.trim()) {
      emit({ type: "error", message: line });
    }
    if (writeToStdout) {
      process.stdout.write(`${line}\n`);
    }
    state.fullOutput += `${line}\n`;
  }
}

/**
 * Create initial processor state
 */
export function createProcessorState(): ProcessorState {
  return {
    fullOutput: "",
    currentToolName: "",
    textBuffer: "",
    tasksEmitted: false,
    completedTaskIds: new Set(),
    phasesEmittedForTasks: new Set(),
    startedPhaseIds: new Set(),
    completedPhaseIds: new Set(),
    reportedCriterionIds: new Set(),
    criteriaEmittedForTasks: new Set(),
  };
}
