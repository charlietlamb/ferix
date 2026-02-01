import { Effect, Layer, Ref, Stream } from "effect";
import type { Session } from "../../domain/index.js";
import type { SessionState } from "../../domain/schemas/state.js";
import type { TUIState, TUITask } from "../../domain/schemas/tui.js";
import { FileSystemSession } from "../../layers/session/file-system.js";
import { FileSystemState } from "../../layers/state/file-system.js";
import { SessionStore } from "../../services/session-store.js";
import { StateStore } from "../../services/state-store.js";
import { ANSIOutput } from "../tui/output/index.js";
import { render } from "../tui/render/index.js";
import { navigate, scroll, scrollTo } from "../tui/state.js";

/**
 * Result from the session view.
 */
export type SessionViewResult = "back" | "quit";

/**
 * Key action types for the session view.
 */
type SessionViewKeyAction =
  | { readonly type: "back" }
  | { readonly type: "quit" }
  | { readonly type: "scroll"; readonly direction: "up" | "down" }
  | { readonly type: "scrollTo"; readonly position: "top" | "bottom" }
  | {
      readonly type: "navigate";
      readonly direction: "next" | "prev" | "first" | "last";
    }
  | { readonly type: "switchView"; readonly view: "logs" | "tasks" }
  | { readonly type: "select" }
  | { readonly type: "none" };

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
function safeRender(state: TUIState, output: ANSIOutput): void {
  try {
    render(state, output);
  } catch {
    // Ignore render errors
  }
}

/**
 * Map session status to TUI status.
 */
function mapSessionStatus(status: Session["status"]): TUIState["status"] {
  switch (status) {
    case "completed":
      return "complete";
    case "active":
      return "idle";
    case "failed":
      return "error";
    case "paused":
      return "paused";
    default:
      return "idle";
  }
}

/**
 * Convert stored task to TUI task format.
 */
function convertToTUITask(
  currentTask: NonNullable<SessionState["currentTask"]>
): TUITask {
  return {
    id: currentTask.id,
    title: currentTask.title,
    status: "in_progress",
    phases: currentTask.phases.map((phase) => ({
      id: phase.id,
      description: phase.description,
      status: phase.status,
    })),
    criteria: currentTask.criteria.map((criterion) => ({
      id: criterion.id,
      description: criterion.description,
      status: criterion.status,
    })),
  };
}

/**
 * Build TUIState from stored session and state data.
 */
function buildTUIStateFromSession(
  session: Session,
  sessionState: SessionState | null
): TUIState {
  return {
    task: session.originalTask,
    iteration: sessionState?.iteration ?? 0,
    maxIterations: sessionState?.maxIterations ?? 0,
    status: mapSessionStatus(session.status),
    startTime: new Date(session.createdAt).getTime(),
    discoveryInProgress: false,
    discoveryCompleted: true,
    executionMode: "idle",
    outputLines: sessionState?.recentProgress ?? [],
    partialLine: "",
    tasks: sessionState?.currentTask
      ? [convertToTUITask(sessionState.currentTask)]
      : [],
    viewMode: "logs",
    selectedTaskIndex: 0,
    scrollOffset: 0,
    userScrolled: false,
    gitBranch: session.branchName,
    gitPushed: false,
    yolo: false,
    debug: false,
    pr: false,
    provider: "claude",
  };
}

/**
 * Parse a key input into an action based on view mode.
 */
function parseKey(
  data: Buffer,
  viewMode: TUIState["viewMode"]
): SessionViewKeyAction {
  const key = data.toString();

  // Ctrl+C always quits
  if (key === "\x03") {
    return { type: "quit" };
  }

  // Escape in logs view returns to launcher
  if (key === "\x1b" && data.length === 1) {
    if (viewMode === "logs") {
      return { type: "back" };
    }
    // In tasks/detail view, escape goes back within TUI
    return {
      type: "switchView",
      view: viewMode === "detail" ? "tasks" : "logs",
    };
  }

  switch (viewMode) {
    case "logs":
      return parseLogsKey(key);
    case "tasks":
      return parseTasksKey(key);
    case "detail":
      return parseDetailKey(key);
    default:
      return { type: "none" };
  }
}

/**
 * Parse key for logs view.
 */
function parseLogsKey(key: string): SessionViewKeyAction {
  switch (key) {
    // Scroll
    case "j":
    case "\x1b[B": // Down arrow
      return { type: "scroll", direction: "down" };
    case "k":
    case "\x1b[A": // Up arrow
      return { type: "scroll", direction: "up" };
    case "g":
      return { type: "scrollTo", position: "top" };
    case "G":
      return { type: "scrollTo", position: "bottom" };
    // Switch to tasks view
    case "t":
      return { type: "switchView", view: "tasks" };
    default:
      return { type: "none" };
  }
}

/**
 * Parse key for tasks view.
 */
function parseTasksKey(key: string): SessionViewKeyAction {
  switch (key) {
    // Navigation
    case "j":
    case "\x1b[B":
      return { type: "navigate", direction: "next" };
    case "k":
    case "\x1b[A":
      return { type: "navigate", direction: "prev" };
    case "g":
      return { type: "navigate", direction: "first" };
    case "G":
      return { type: "navigate", direction: "last" };
    // Select task for detail
    case "\r":
    case "\n":
      return { type: "select" };
    default:
      return { type: "none" };
  }
}

/**
 * Parse key for detail view.
 */
function parseDetailKey(key: string): SessionViewKeyAction {
  switch (key) {
    // Scroll
    case "j":
    case "\x1b[B":
      return { type: "scroll", direction: "down" };
    case "k":
    case "\x1b[A":
      return { type: "scroll", direction: "up" };
    case "g":
      return { type: "scrollTo", position: "top" };
    case "G":
      return { type: "scrollTo", position: "bottom" };
    default:
      return { type: "none" };
  }
}

/**
 * Apply an action to the TUI state.
 * Returns the new state or a result to exit.
 */
function applyAction(
  state: TUIState,
  action: SessionViewKeyAction,
  outputHeight: number
):
  | { type: "state"; state: TUIState }
  | { type: "result"; result: SessionViewResult } {
  switch (action.type) {
    case "back":
      return { type: "result", result: "back" };

    case "quit":
      return { type: "result", result: "quit" };

    case "scroll": {
      const maxOffset = Math.max(0, state.outputLines.length - outputHeight);
      return {
        type: "state",
        state: scroll(state, action.direction, 1, maxOffset),
      };
    }

    case "scrollTo": {
      const maxOffset = Math.max(0, state.outputLines.length - outputHeight);
      return {
        type: "state",
        state: scrollTo(state, action.position, maxOffset),
      };
    }

    case "navigate":
      return {
        type: "state",
        state: navigate(state, action.direction),
      };

    case "switchView":
      return {
        type: "state",
        state: {
          ...state,
          viewMode: action.view,
          scrollOffset: 0,
          userScrolled: false,
        },
      };

    case "select":
      // If in tasks view and there are tasks, switch to detail
      if (state.viewMode === "tasks" && state.tasks.length > 0) {
        return {
          type: "state",
          state: {
            ...state,
            viewMode: "detail",
            scrollOffset: 0,
            userScrolled: false,
          },
        };
      }
      return { type: "state", state };

    default:
      return { type: "state", state };
  }
}

/**
 * Create a session view consumer.
 *
 * Displays the session TUI in read-only mode.
 * - Escape from logs view returns "back" to go to launcher
 * - Ctrl+C returns "quit" to exit
 * - Navigate with j/k, t for tasks, Enter for detail
 */
export function createSessionViewConsumer(sessionId: string): {
  run: () => Effect.Effect<SessionViewResult, never, never>;
} {
  return {
    run: () =>
      Effect.gen(function* () {
        // Load session data
        const sessionStore = yield* SessionStore;
        const session = yield* sessionStore
          .get(sessionId)
          .pipe(Effect.catchAll(() => Effect.succeed(null)));

        if (!session) {
          // Session not found, return to launcher
          return "back" as SessionViewResult;
        }

        // Load session state
        const stateStore = yield* StateStore;
        const sessionState = yield* stateStore
          .read(sessionId)
          .pipe(Effect.catchAll(() => Effect.succeed(null)));

        // Build initial TUI state
        const initialState = buildTUIStateFromSession(session, sessionState);
        const stateRef = yield* Ref.make(initialState);

        // Setup output
        const output = new ANSIOutput();
        activeOutput = output;
        const removeSignalHandlers = setupSignalHandlers();

        const cleanup = () => {
          output.fullCleanup();
          activeOutput = null;
          removeSignalHandlers();
        };

        // Setup terminal
        output.enterAlternateBuffer();
        output.hideCursor();

        // Initial render
        safeRender(initialState, output);

        // Subscribe to resize
        const unsubscribeResize = output.onResize(() => {
          const state = Effect.runSync(Ref.get(stateRef));
          safeRender(state, output);
        });

        // Enable raw mode and create stdin stream
        yield* enableRawMode();
        const stdinStream = createStdinStream();

        // Calculate output height for scroll calculations
        const outputHeight = output.getHeight() - 6; // FIXED_ROWS

        // Process input and return result
        const result = yield* stdinStream.pipe(
          Stream.mapEffect((data) =>
            Effect.gen(function* () {
              const currentState = yield* Ref.get(stateRef);
              const action = parseKey(data, currentState.viewMode);
              const actionResult = applyAction(
                currentState,
                action,
                outputHeight
              );

              if (actionResult.type === "result") {
                return actionResult.result;
              }

              // Update state and render
              yield* Ref.set(stateRef, actionResult.state);
              yield* Effect.sync(() => safeRender(actionResult.state, output));
              return null;
            })
          ),
          Stream.filter((r): r is SessionViewResult => r !== null),
          Stream.take(1),
          Stream.runHead,
          Effect.map((maybeResult) =>
            maybeResult._tag === "Some" ? maybeResult.value : "back"
          )
        );

        // Cleanup
        yield* disableRawMode();
        unsubscribeResize();
        cleanup();

        return result;
      }).pipe(
        Effect.provide(
          Layer.merge(FileSystemSession.Live, FileSystemState.Live)
        ),
        Effect.ensuring(disableRawMode())
      ),
  };
}
