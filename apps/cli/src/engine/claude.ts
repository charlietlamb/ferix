import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { SIGNALS } from "../constants.js";
import type { ExecuteResult } from "../types.js";
import { shell } from "../utils/shell.js";

// ANSI color codes for retro dev style
const RESET = "\x1b[0m";
const COLORS = {
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  dim: "\x1b[2m",
};

/**
 * Extract error message from output containing <ferix:error>...</ferix:error>
 * Only matches when the tag appears at the start of a line (not in code blocks)
 */
function extractError(output: string): string | undefined {
  const match = output.match(
    new RegExp(`^\\s*${SIGNALS.ERROR_START}(.+?)${SIGNALS.ERROR_END}`, "ms")
  );
  return match?.[1]?.trim();
}

/**
 * Strip ferix signal tags from text for display
 */
function stripSignalTags(text: string): string {
  return text
    .replace(
      new RegExp(`${SIGNALS.ERROR_START}[^]*?${SIGNALS.ERROR_END}`, "g"),
      ""
    )
    .replace(new RegExp(SIGNALS.COMPLETE, "g"), "");
}

/**
 * Get color for tool type - each tool category has a distinct color
 */
function getToolColor(tool: string): string {
  switch (tool) {
    case "Read":
      return COLORS.cyan;
    case "Edit":
      return COLORS.yellow;
    case "Write":
      return COLORS.green;
    case "Bash":
      return COLORS.magenta;
    case "Glob":
    case "Grep":
      return COLORS.blue;
    case "Task":
      return COLORS.white;
    case "WebFetch":
    case "WebSearch":
      return COLORS.cyan;
    default:
      return COLORS.dim;
  }
}

/**
 * Get tool detail string from input
 */
function getToolDetail(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case "Read":
    case "Edit":
    case "Write":
      return (
        (input.file_path as string) || (input.filePath as string) || "file"
      );
    case "Bash": {
      const cmd = (input.command as string) || "command";
      return cmd.length > 60 ? `${cmd.substring(0, 60)}...` : cmd;
    }
    case "Glob":
    case "Grep":
      return (input.pattern as string) || "pattern";
    case "Task":
      return (input.description as string) || "subagent";
    case "WebFetch":
      return (input.url as string) || "url";
    case "WebSearch":
      return (input.query as string) || "search";
    default:
      return "";
  }
}

/**
 * Check if text buffer might contain the start of an error tag
 */
function mightContainErrorTagStart(buffer: string): boolean {
  if (!buffer.includes("<")) {
    return false;
  }
  const partials = [
    "<f",
    "<fe",
    "<fer",
    "<feri",
    "<ferix",
    "<ferix:",
    "<ferix:e",
    "<ferix:er",
    "<ferix:err",
    "<ferix:erro",
    "<ferix:error",
  ];
  return partials.some((p) => buffer.includes(p));
}

/**
 * Stream JSON message types from Claude Code CLI
 */
interface StreamMessage {
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

interface StreamEvent {
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
  | { type: "error"; message: string };

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
interface ProcessorState {
  fullOutput: string;
  currentToolName: string;
  textBuffer: string;
}

/**
 * Handle stream event messages
 */
function handleStreamEvent(
  event: StreamEvent,
  state: ProcessorState,
  emit: (e: ClaudeEvent) => void,
  outputText: (t: string) => void,
  writeToStdout: boolean
): void {
  handleToolStart(event, state, emit, writeToStdout);
  handleTextDelta(event, state, outputText);
  handleContentBlockStop(event, state, emit, outputText);
}

/**
 * Handle tool starting events
 */
function handleToolStart(
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
 * Handle text delta events
 */
function handleTextDelta(
  event: StreamEvent,
  state: ProcessorState,
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

  const hasStartTag = state.textBuffer.includes(SIGNALS.ERROR_START);
  const hasEndTag = state.textBuffer.includes(SIGNALS.ERROR_END);

  if (hasStartTag && hasEndTag) {
    state.textBuffer = "";
  } else if (hasStartTag && !hasEndTag) {
    if (state.textBuffer.length > 5000) {
      outputText(stripSignalTags(state.textBuffer));
      state.textBuffer = "";
    }
  } else if (
    mightContainErrorTagStart(state.textBuffer) &&
    state.textBuffer.length < 50
  ) {
    // Keep buffering - might be start of error tag
  } else {
    outputText(stripSignalTags(state.textBuffer));
    state.textBuffer = "";
  }
}

/**
 * Handle content block stop events
 */
function handleContentBlockStop(
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
function handleAssistantMessage(
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
        process.stdout.write(`\n${color}[${block.name}]${RESET} ${detail}\n`);
      }
    }
  }
}

/**
 * Process a single line of stream output
 */
function processLine(
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
 * Execute a prompt using Claude Code CLI with stream-json output
 */
export function executeWithClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<ExecuteResult> {
  const { onEvent, writeToStdout = !onEvent } = options;

  return new Promise((resolve) => {
    const state: ProcessorState = {
      fullOutput: "",
      currentToolName: "",
      textBuffer: "",
    };

    const emit = (event: ClaudeEvent) => {
      onEvent?.(event);
    };

    const outputText = (text: string) => {
      if (writeToStdout) {
        process.stdout.write(text);
      }
      emit({ type: "text", text });
    };

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

    const stdout = child.stdout;
    if (!stdout) {
      resolve({
        success: false,
        output: "",
        complete: false,
        hasError: true,
        errorMessage: "Failed to get stdout from child process",
      });
      return;
    }

    const rl = createInterface({
      input: stdout,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    rl.on("line", (line) => {
      processLine(line, state, emit, outputText, writeToStdout);
    });

    child.stderr?.on("data", (data: Buffer) => {
      if (writeToStdout) {
        process.stderr.write(data);
      }
    });

    child.on("close", (exitCode) => {
      const errorMessage = extractError(state.fullOutput);

      if (errorMessage) {
        emit({ type: "error", message: errorMessage });
      }

      resolve({
        success: exitCode === 0,
        output: state.fullOutput,
        complete: state.fullOutput.includes(SIGNALS.COMPLETE),
        hasError: errorMessage !== undefined,
        errorMessage,
      });
    });

    child.on("error", (error) => {
      emit({ type: "error", message: error.message });
      resolve({
        success: false,
        output: "",
        complete: false,
        hasError: true,
        errorMessage: error.message,
      });
    });
  });
}

/**
 * Check if Claude Code CLI is available
 */
export async function isClaudeAvailable(): Promise<boolean> {
  const result = await shell("claude", ["--version"]);
  return result.success;
}
