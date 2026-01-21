/**
 * Event types for Claude engine streaming
 */

import type { Task } from "./config.js";

/**
 * Stream JSON message types from Claude Code CLI
 */
export interface StreamMessage {
  type: string;
  subtype?: string;
  event?: StreamEvent;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
  result?: string;
}

/** Stream event from Claude CLI */
export interface StreamEvent {
  type: string;
  index?: number;
  delta?: {
    type: string;
    text?: string;
    partial_json?: string;
  };
  content_block?: {
    type: string;
    text?: string;
    name?: string;
    id?: string;
  };
}

/**
 * Event types emitted during Claude execution
 */
export type ClaudeEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_use"; tool: string; detail: string }
  | { type: "tool_end" }
  | { type: "complete" }
  | { type: "error"; message: string }
  | { type: "tasks_defined"; tasks: Task[] }
  | { type: "task_done"; id: string };

/**
 * Event handler callback type
 */
export type ClaudeEventHandler = (event: ClaudeEvent) => void;

/**
 * Options for Claude execution
 */
export interface ClaudeOptions {
  /** Event handler for streaming updates */
  onEvent?: ClaudeEventHandler;
  /** Whether to write to stdout (default: true when no onEvent) */
  writeToStdout?: boolean;
}

/**
 * State for the stream processor
 */
export interface ProcessorState {
  fullOutput: string;
  currentToolName: string;
  textBuffer: string;
  tasksEmitted: boolean;
  completedTaskIds: Set<string>;
}
