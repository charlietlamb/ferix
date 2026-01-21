/**
 * Claude Code CLI execution engine
 *
 * Executes prompts using the Claude Code CLI with streaming output,
 * parsing signals and events for the loop runner.
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { SIGNALS } from "../constants.js";
import type { ExecuteResult } from "../types/config.js";
import type { ClaudeEvent, ClaudeOptions } from "../types/events.js";
import { shell } from "../utils/shell.js";
import { extractError } from "./signals/index.js";
import { createProcessorState, processLine } from "./stream/index.js";

/**
 * Execute a prompt using Claude Code CLI with stream-json output
 */
export function executeWithClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<ExecuteResult> {
  const { onEvent, writeToStdout = !onEvent } = options;

  return new Promise((resolve) => {
    const state = createProcessorState();

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
