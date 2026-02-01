import { Effect, Layer, Ref, Stream } from "effect";
import { FileSystemSession } from "../../layers/session/file-system.js";
import { SessionStore } from "../../services/session-store.js";
import { ANSIOutput } from "../tui/output/index.js";
import { applyAction, parseKey } from "./input.js";
import { render } from "./render/index.js";
import {
  createInitialLauncherState,
  type LauncherResult,
  type LauncherState,
  sessionToLauncherSession,
} from "./state.js";

/** Global reference for emergency cleanup on SIGINT */
let activeOutput: ANSIOutput | null = null;

/**
 * Setup signal handlers for emergency cleanup.
 */
function setupSignalHandlers(): () => void {
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
function enableRawMode(): Effect.Effect<void> {
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
function disableRawMode(): Effect.Effect<void> {
  return Effect.sync(() => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  });
}

/**
 * Create stdin stream.
 */
function createStdinStream(): Stream.Stream<Buffer, never, never> {
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

/**
 * Safe render wrapper.
 */
function safeRender(state: LauncherState, output: ANSIOutput): void {
  try {
    render(state, output);
  } catch {
    // Ignore render errors
  }
}

/**
 * Options for the launcher consumer.
 */
export interface LauncherConsumerOptions {
  /** Initial selected index (0 = "Create new", 1+ = sessions) */
  readonly initialSelectedIndex?: number;
}

/**
 * Launcher consumer that displays the session selector TUI.
 */
export function createLauncherConsumer(options: LauncherConsumerOptions = {}): {
  run: () => Effect.Effect<LauncherResult, never, never>;
} {
  return {
    run: () =>
      Effect.gen(function* () {
        // Initialize state and output
        const baseState = createInitialLauncherState();
        const stateRef = yield* Ref.make({
          ...baseState,
          selectedIndex: options.initialSelectedIndex ?? 0,
        });
        const output = new ANSIOutput();

        // Register output for emergency cleanup
        activeOutput = output;

        // Setup signal handlers
        const removeSignalHandlers = setupSignalHandlers();

        // Cleanup function
        const cleanup = () => {
          output.fullCleanup();
          activeOutput = null;
          removeSignalHandlers();
        };

        // Setup terminal
        output.enterAlternateBuffer();
        output.hideCursor();

        // Initial render (loading state)
        const initialState = yield* Ref.get(stateRef);
        safeRender(initialState, output);

        // Load sessions
        const sessionStore = yield* SessionStore;
        const sessionsResult = yield* sessionStore.list().pipe(
          Effect.map((sessions) => sessions.map(sessionToLauncherSession)),
          Effect.catchAll(() => Effect.succeed([]))
        );

        // Update state with sessions
        yield* Ref.update(stateRef, (s) => ({
          ...s,
          sessions: sessionsResult,
          isLoading: false,
        }));

        // Render with sessions
        const loadedState = yield* Ref.get(stateRef);
        safeRender(loadedState, output);

        // Subscribe to resize
        const unsubscribeResize = output.onResize(() => {
          const state = Effect.runSync(Ref.get(stateRef));
          safeRender(state, output);
        });

        // Enable raw mode and create stdin stream
        yield* enableRawMode();
        const stdinStream = createStdinStream();

        // Process input and return result
        const result = yield* stdinStream.pipe(
          Stream.mapEffect((data) =>
            Effect.gen(function* () {
              const currentState = yield* Ref.get(stateRef);
              const action = parseKey(data, currentState.viewMode);
              const actionResult = applyAction(currentState, action);

              if (actionResult.type === "result") {
                return actionResult.result;
              }

              // Update state and render
              yield* Ref.set(stateRef, actionResult.state);
              yield* Effect.sync(() => safeRender(actionResult.state, output));
              return null;
            })
          ),
          Stream.filter((r): r is LauncherResult => r !== null),
          Stream.take(1),
          Stream.runHead,
          Effect.map((maybeResult) =>
            maybeResult._tag === "Some"
              ? maybeResult.value
              : { type: "quit" as const }
          )
        );

        // Cleanup
        yield* disableRawMode();
        unsubscribeResize();
        cleanup();

        return result;
      }).pipe(
        Effect.provide(Layer.merge(FileSystemSession.Live, Layer.empty)),
        Effect.ensuring(disableRawMode())
      ),
  };
}
