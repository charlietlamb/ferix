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

    if (msg.type === "result") {
      emit({ type: "complete" });
      if (writeToStdout) {
        process.stdout.write("\n");
      }
    }
  } catch {
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
