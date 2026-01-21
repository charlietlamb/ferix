/**
 * Stream event handlers for processing Claude CLI output
 */

import { BUFFER, SIGNALS } from "../../constants.js";
import { colors } from "../../tui/ansi.js";
import type {
  ClaudeEvent,
  ProcessorState,
  StreamEvent,
  StreamMessage,
} from "../../types/events.js";
import {
  extractTasks,
  mightContainFerixTagStart,
  stripSignalTags,
} from "../signals/index.js";
import { getToolColor, getToolDetail } from "../tools/index.js";

/**
 * Handle stream event messages
 */
export function handleStreamEvent(
  event: StreamEvent,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  outputText: (t: string) => void,
  writeToStdout: boolean
): void {
  handleToolStart(event, state, emit, writeToStdout);
  handleTextDelta(event, state, emit, outputText);
  handleContentBlockStop(event, state, emit, outputText);
}

/**
 * Handle tool starting events
 */
export function handleToolStart(
  event: StreamEvent,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  writeToStdout: boolean
): void {
  if (
    event.type === "content_block_start" &&
    event.content_block?.type === "tool_use"
  ) {
    state.currentToolName = event.content_block.name || "tool";
    emit({ type: "tool_start", tool: state.currentToolName });
    if (writeToStdout) {
      process.stdout.write(`\n[${state.currentToolName}] `);
    }
  }
}

/**
 * Check for and emit task-related signals from buffer
 */
export function checkTaskSignals(
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void
): void {
  // Check for tasks definition
  if (!state.tasksEmitted) {
    const tasks = extractTasks(state.fullOutput);
    if (tasks) {
      state.tasksEmitted = true;
      emit({ type: "tasks_defined", tasks });
    }
  }

  // Check for task completion signals
  const taskDoneMatches = state.fullOutput.matchAll(
    /<ferix:task-done id="(\d+)"\/>/g
  );
  for (const match of taskDoneMatches) {
    const taskId = match[1];
    if (taskId && !state.completedTaskIds.has(taskId)) {
      state.completedTaskIds.add(taskId);
      emit({ type: "task_done", id: taskId });
    }
  }
}

/**
 * Handle text delta events
 */
export function handleTextDelta(
  event: StreamEvent,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  outputText: (t: string) => void
): void {
  if (
    event.type !== "content_block_delta" ||
    event.delta?.type !== "text_delta" ||
    !event.delta.text
  ) {
    return;
  }

  const text = event.delta.text;
  state.fullOutput += text;
  state.textBuffer += text;

  // Check for task signals
  checkTaskSignals(state, emit);

  // Handle buffering for ferix tags
  const hasErrorStart = state.textBuffer.includes(SIGNALS.ERROR_START);
  const hasErrorEnd = state.textBuffer.includes(SIGNALS.ERROR_END);
  const hasTasksStart = state.textBuffer.includes(SIGNALS.TASKS_START);
  const hasTasksEnd = state.textBuffer.includes(SIGNALS.TASKS_END);

  // If we have a complete error or tasks block, clear buffer
  if ((hasErrorStart && hasErrorEnd) || (hasTasksStart && hasTasksEnd)) {
    state.textBuffer = "";
  } else if (
    (hasErrorStart && !hasErrorEnd) ||
    (hasTasksStart && !hasTasksEnd)
  ) {
    // Inside a block, keep buffering but with a limit
    if (state.textBuffer.length > BUFFER.MAX_SIZE) {
      outputText(stripSignalTags(state.textBuffer));
      state.textBuffer = "";
    }
  } else if (
    mightContainFerixTagStart(state.textBuffer) &&
    state.textBuffer.length < BUFFER.FERIX_TAG_SIZE
  ) {
    // Keep buffering - might be start of a ferix tag
  } else {
    outputText(stripSignalTags(state.textBuffer));
    state.textBuffer = "";
  }
}

/**
 * Handle content block stop events
 */
export function handleContentBlockStop(
  event: StreamEvent,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  outputText: (t: string) => void
): void {
  if (event.type !== "content_block_stop") {
    return;
  }

  if (state.textBuffer) {
    outputText(stripSignalTags(state.textBuffer));
    state.textBuffer = "";
  }
  if (state.currentToolName) {
    emit({ type: "tool_end" });
    state.currentToolName = "";
  }
}

/**
 * Handle assistant messages with tool results
 */
export function handleAssistantMessage(
  msg: StreamMessage,
  emit: (e: ClaudeEvent) => void,
  writeToStdout: boolean
): void {
  if (msg.type !== "assistant" || !msg.message?.content) {
    return;
  }

  for (const block of msg.message.content) {
    if (block.type === "tool_use" && block.name) {
      const input = block.input || {};
      const detail = getToolDetail(block.name, input);

      emit({ type: "tool_use", tool: block.name, detail });

      if (writeToStdout) {
        const color = getToolColor(block.name);
        process.stdout.write(
          `\n${color}[${block.name}]${colors.reset} ${detail}\n`
        );
      }
    }
  }
}
