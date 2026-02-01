import { Effect, Stream } from "effect";
import type { ANSIOutput } from "../tui/output/index.js";

/** Global reference for emergency cleanup on SIGINT */
let activeOutput: ANSIOutput | null = null;

/**
 * Set the active output for emergency cleanup.
 */
export function setActiveOutput(output: ANSIOutput | null): void {
  activeOutput = output;
}

/**
 * Setup signal handlers for emergency cleanup.
 * Returns a cleanup function to remove the handlers.
 */
export function setupSignalHandlers(): () => void {
  const handler = () => {
    if (activeOutput) {
      activeOutput.fullCleanup();
      if (process.stdin.isTTY) {
        try {
          process.stdin.setRawMode(false);
        } catch {
          // stdin may already be closed
        }
      }
      activeOutput = null;
    }
    process.removeListener("SIGINT", handler);
    process.kill(process.pid, "SIGINT");
  };

  process.on("SIGINT", handler);
  return () => process.removeListener("SIGINT", handler);
}

/**
 * Enable raw mode for keyboard input.
 */
export function enableRawMode(): Effect.Effect<void> {
  return Effect.sync(() => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
    }
  });
}

/**
 * Disable raw mode.
 */
export function disableRawMode(): Effect.Effect<void> {
  return Effect.sync(() => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  });
}

/**
 * Create stdin stream for reading keyboard input.
 */
export function createStdinStream(): Stream.Stream<Buffer, never, never> {
  return Stream.async<Buffer>((emit) => {
    const onData = (data: Buffer) => {
      emit.single(data);
    };

    process.stdin.on("data", onData);

    return Effect.sync(() => {
      process.stdin.off("data", onData);
    });
  });
}
