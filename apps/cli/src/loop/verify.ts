/**
 * @fileoverview Verify command runner for the verification phase.
 *
 * This module handles running verification commands after task completion:
 * - Executes commands sequentially
 * - Captures output and exit codes
 * - Handles timeouts (5 minutes per command)
 * - Formats error context for worker retry
 */

import type { VerifyError } from "../types/plan.js";
import { shell } from "../utils/shell.js";

/** Maximum time (in ms) for a single verify command to run */
const VERIFY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum output length to capture (prevents memory issues) */
const MAX_OUTPUT_LENGTH = 10_000;

/**
 * Result of a single verify command execution
 */
export interface VerifyCommandResult {
  /** The command that was run */
  command: string;
  /** Whether the command succeeded (exit code 0) */
  success: boolean;
  /** Exit code from the command */
  exitCode: number;
  /** Combined stdout and stderr output (truncated if needed) */
  output: string;
}

/**
 * Result of running all verify commands
 */
export interface VerifyResult {
  /** Whether all commands passed */
  success: boolean;
  /** Results for each command */
  results: VerifyCommandResult[];
  /** Error context if any command failed (for worker retry) */
  error?: VerifyError;
}

/**
 * Callback for verify progress updates
 */
export interface VerifyCallbacks {
  /** Called when starting a command */
  onCommandStart?: (command: string, index: number, total: number) => void;
  /** Called when a command completes */
  onCommandComplete?: (result: VerifyCommandResult) => void;
}

/**
 * Truncates output to a maximum length, adding indicator if truncated.
 *
 * @param output - The output to truncate
 * @param maxLength - Maximum length (default MAX_OUTPUT_LENGTH)
 * @returns Truncated output with indicator if needed
 */
function truncateOutput(output: string, maxLength = MAX_OUTPUT_LENGTH): string {
  if (output.length <= maxLength) {
    return output;
  }
  return `${output.slice(0, maxLength)}\n... (output truncated, ${output.length - maxLength} more characters)`;
}

/**
 * Parses a command string into command and arguments.
 *
 * Handles basic shell-style quoting for arguments with spaces.
 *
 * @param commandString - The full command string (e.g., "npm run build")
 * @returns Object with command and args array
 */
function parseCommand(commandString: string): { cmd: string; args: string[] } {
  // Simple parsing - split on spaces, but handle quoted strings
  const parts: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const char of commandString) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = "";
    } else if (char === " " && !inQuote) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  const [cmd = "", ...args] = parts;
  return { cmd, args };
}

/**
 * Runs a single verification command.
 *
 * @param command - The command to run (e.g., "npm run lint")
 * @returns Result with success status, exit code, and output
 */
async function runVerifyCommand(command: string): Promise<VerifyCommandResult> {
  const { cmd, args } = parseCommand(command);

  if (!cmd) {
    return {
      command,
      success: false,
      exitCode: 1,
      output: "Empty command",
    };
  }

  try {
    const result = await shell(cmd, args, {
      timeout: VERIFY_TIMEOUT_MS,
      all: true, // Capture both stdout and stderr combined
    });

    const output = truncateOutput(
      result.stdout + (result.stderr ? `\n${result.stderr}` : "")
    );

    return {
      command,
      success: result.success,
      exitCode: result.exitCode,
      output: output.trim(),
    };
  } catch (error) {
    // Handle timeout or other errors
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = message.includes("timed out");

    return {
      command,
      success: false,
      exitCode: isTimeout ? 124 : 1, // 124 is the standard timeout exit code
      output: isTimeout
        ? `Command timed out after ${VERIFY_TIMEOUT_MS / 1000} seconds`
        : `Command failed: ${message}`,
    };
  }
}

/**
 * Runs all verification commands sequentially.
 *
 * Stops at the first failure and returns error context for retry.
 *
 * @param commands - Array of commands to run (e.g., ["npm run lint", "npm run build"])
 * @param callbacks - Optional callbacks for progress updates
 * @returns Result with overall success status and individual command results
 */
export async function runVerifyCommands(
  commands: string[],
  callbacks?: VerifyCallbacks
): Promise<VerifyResult> {
  if (commands.length === 0) {
    return { success: true, results: [] };
  }

  const results: VerifyCommandResult[] = [];

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (!command) {
      continue;
    }

    callbacks?.onCommandStart?.(command, i, commands.length);

    const result = await runVerifyCommand(command);
    results.push(result);

    callbacks?.onCommandComplete?.(result);

    if (!result.success) {
      // Stop at first failure
      return {
        success: false,
        results,
        error: {
          command: result.command,
          exitCode: result.exitCode,
          output: result.output,
        },
      };
    }
  }

  return { success: true, results };
}

/**
 * Formats verify error for display in the TUI or logs.
 *
 * @param error - The verify error context
 * @returns Formatted error string
 */
export function formatVerifyError(error: VerifyError): string {
  const lines = [
    `Command: ${error.command}`,
    `Exit code: ${error.exitCode}`,
    "",
    "Output:",
    error.output || "(no output)",
  ];

  return lines.join("\n");
}
