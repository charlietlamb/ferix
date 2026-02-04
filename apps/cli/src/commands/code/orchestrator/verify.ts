import { execSync } from "node:child_process";
import { DateTime, Effect, Stream } from "effect";
import type { DomainEvent } from "../domain/index.js";

/**
 * Result of running a single verify command.
 */
interface VerifyCommandResult {
  readonly command: string;
  readonly passed: boolean;
  readonly output: string;
  readonly exitCode: number;
}

/**
 * Execute a single shell command in the given directory.
 * Returns structured result regardless of success or failure.
 */
function executeCommand(command: string, cwd: string): VerifyCommandResult {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 300_000,
    });
    return { command, passed: true, output: output.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    const output = [execError.stdout ?? "", execError.stderr ?? ""]
      .filter(Boolean)
      .join("\n")
      .trim();
    return {
      command,
      passed: false,
      output,
      exitCode: execError.status ?? 1,
    };
  }
}

/**
 * Run verification commands sequentially and emit domain events.
 *
 * Executes each command in order within the worktree directory.
 * Stops at the first failure and reports which commands failed.
 *
 * @param commands - Shell commands to execute
 * @param sessionId - Session identifier for events
 * @param cwd - Working directory (worktree path) for command execution
 * @param attempt - Current verify attempt number (for retry tracking)
 * @returns Stream of verify domain events
 */
export function runVerifyCommands(
  commands: readonly string[],
  sessionId: string,
  cwd: string,
  attempt: number
): Stream.Stream<DomainEvent, never, never> {
  if (commands.length === 0) {
    return Stream.empty;
  }

  return Stream.unwrap(
    Effect.gen(function* () {
      const startTime = DateTime.toEpochMillis(yield* DateTime.now);
      const events: DomainEvent[] = [];

      events.push({
        _tag: "VerifyStarted",
        sessionId,
        commands: [...commands],
        attempt,
        timestamp: startTime,
      });

      const failedCommands: string[] = [];

      for (const command of commands) {
        const result = executeCommand(command, cwd);
        const timestamp = DateTime.toEpochMillis(yield* DateTime.now);

        if (result.passed) {
          events.push({
            _tag: "VerifyCommandPassed",
            sessionId,
            command: result.command,
            output: result.output,
            timestamp,
          });
        } else {
          failedCommands.push(result.command);
          events.push({
            _tag: "VerifyCommandFailed",
            sessionId,
            command: result.command,
            output: result.output,
            exitCode: result.exitCode,
            timestamp,
          });
          break;
        }
      }

      const endTime = DateTime.toEpochMillis(yield* DateTime.now);

      if (failedCommands.length === 0) {
        events.push({
          _tag: "VerifyPassed",
          sessionId,
          attempt,
          timestamp: endTime,
        });
      } else {
        events.push({
          _tag: "VerifyFailed",
          sessionId,
          failedCommands,
          attempt,
          timestamp: endTime,
        });
      }

      return Stream.fromIterable(events);
    })
  );
}
