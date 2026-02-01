import { Effect, Layer, Ref, Stream } from "effect";
import {
  createDaemonClient,
  getDaemonPid,
  isDaemonRunning,
  stopDaemon,
} from "../../daemon/index.js";
import { FileSystemSession } from "../../layers/session/file-system.js";
import { SessionStore } from "../../services/session-store.js";
import { ANSIOutput } from "../tui/output/index.js";
import { applyAction, parseKey } from "./input.js";
import { render } from "./render/index.js";
import {
  createInitialLauncherState,
  type DaemonInfo,
  type LauncherResult,
  type LauncherState,
  sessionToLauncherSession,
  updateViewportHeight,
} from "./state.js";
import {
  createStdinStream,
  disableRawMode,
  enableRawMode,
  setActiveOutput,
  setupSignalHandlers,
} from "./terminal-utils.js";

/**
 * Query daemon for current status and active session count.
 */
function getDaemonInfo(): Effect.Effect<DaemonInfo, never, never> {
  return Effect.gen(function* () {
    if (!isDaemonRunning()) {
      return { running: false, pid: null, activeSessions: 0 };
    }

    const pid = getDaemonPid();

    // Query daemon for active sessions using proper Effect composition
    const client = createDaemonClient();
    const activeSessions = yield* client.connect().pipe(
      Effect.flatMap(() => client.listSessions()),
      Effect.tap(() => client.disconnect()),
      Effect.map(
        (sessions) =>
          sessions.filter(
            (s) => s.status === "running" || s.status === "starting"
          ).length
      ),
      Effect.catchAll(() => Effect.succeed(0))
    );

    return { running: true, pid, activeSessions };
  });
}

/**
 * Handle stopping the daemon.
 */
function handleStopDaemon(): DaemonInfo {
  stopDaemon();
  return { running: false, pid: null, activeSessions: 0 };
}

/** Fixed rows: header (3) + separator + footer (1) */
const FIXED_ROWS = 5;

/**
 * Safe render wrapper that updates viewport height before rendering.
 */
function safeRender(
  state: LauncherState,
  output: ANSIOutput,
  stateRef: Ref.Ref<LauncherState>
): void {
  try {
    // Calculate content height and update state if needed
    const contentHeight = output.getHeight() - FIXED_ROWS;
    const updatedState = updateViewportHeight(state, contentHeight);

    // Update ref if viewport height changed
    if (updatedState !== state) {
      Effect.runSync(Ref.set(stateRef, updatedState));
    }

    render(updatedState, output);
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
        setActiveOutput(output);

        // Setup signal handlers
        const removeSignalHandlers = setupSignalHandlers();

        // Cleanup function
        const cleanup = () => {
          output.fullCleanup();
          setActiveOutput(null);
          removeSignalHandlers();
        };

        // Setup terminal - enter alternate buffer and clear it
        output.enterAlternateBuffer();
        output.clearScreen();
        output.cursorHome();
        output.hideCursor();
        output.enableMouse();

        // Initial render (loading state)
        const initialState = yield* Ref.get(stateRef);
        safeRender(initialState, output, stateRef);

        // Load sessions
        const sessionStore = yield* SessionStore;
        const sessionsResult = yield* sessionStore.list().pipe(
          Effect.map((sessions) => sessions.map(sessionToLauncherSession)),
          Effect.catchAll(() => Effect.succeed([]))
        );

        // Load daemon info
        const daemonInfo = yield* getDaemonInfo();

        // Update state with sessions and daemon info
        yield* Ref.update(stateRef, (s) => ({
          ...s,
          sessions: sessionsResult,
          daemon: daemonInfo,
          isLoading: false,
        }));

        // Render with sessions
        const loadedState = yield* Ref.get(stateRef);
        safeRender(loadedState, output, stateRef);

        // Subscribe to resize
        const unsubscribeResize = output.onResize(() => {
          const state = Effect.runSync(Ref.get(stateRef));
          safeRender(state, output, stateRef);
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

              // Handle side effects
              if (actionResult.type === "effect") {
                let newState = actionResult.state;
                if (actionResult.effect.type === "stop_daemon") {
                  const newDaemonInfo = handleStopDaemon();
                  newState = { ...newState, daemon: newDaemonInfo };
                }
                yield* Ref.set(stateRef, newState);
                yield* Effect.sync(() =>
                  safeRender(newState, output, stateRef)
                );
                return null;
              }

              // Update state and render
              yield* Ref.set(stateRef, actionResult.state);
              yield* Effect.sync(() =>
                safeRender(actionResult.state, output, stateRef)
              );
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
