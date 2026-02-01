import { Effect, Fiber, Layer, Ref, Stream } from "effect";
import {
  createDaemonClient,
  type DaemonClient,
  isDaemonRunning,
} from "../../daemon/index.js";
import type { Session } from "../../domain/index.js";
import type { SessionState } from "../../domain/schemas/state.js";
import type { TUIState, TUITask } from "../../domain/schemas/tui.js";
import { FileSystemOutput } from "../../layers/output/index.js";
import { FileSystemSession } from "../../layers/session/file-system.js";
import { FileSystemState } from "../../layers/state/file-system.js";
import { OutputStore } from "../../services/output-store.js";
import { SessionStore } from "../../services/session-store.js";
import { StateStore } from "../../services/state-store.js";
import { ANSIOutput } from "../tui/output/index.js";
import { render } from "../tui/render/index.js";
import { navigate, reduce, scroll, scrollTo } from "../tui/state.js";
import {
  createStdinStream,
  disableRawMode,
  enableRawMode,
  setActiveOutput,
  setupSignalHandlers,
} from "./terminal-utils.js";

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
  | { readonly type: "mouse_wheel"; readonly delta: number }
  | {
      readonly type: "navigate";
      readonly direction: "next" | "prev" | "first" | "last";
    }
  | { readonly type: "switchView"; readonly view: "logs" | "tasks" }
  | { readonly type: "select" }
  | { readonly type: "none" };

/** Mouse wheel escape sequence pattern */
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for mouse parsing
const MOUSE_WHEEL_REGEX = /\x1b\[<(\d+);(\d+);(\d+)[Mm]/;

/**
 * Parse mouse wheel from SGR format.
 */
function parseMouseWheel(key: string): SessionViewKeyAction | null {
  const mouseMatch = key.match(MOUSE_WHEEL_REGEX);
  if (!mouseMatch) {
    return null;
  }

  const btnStr = mouseMatch[1];
  if (!btnStr) {
    return null;
  }

  const btn = Number.parseInt(btnStr, 10);
  if (btn === 64) {
    return { type: "mouse_wheel", delta: -3 }; // scroll up
  }
  if (btn === 65) {
    return { type: "mouse_wheel", delta: 3 }; // scroll down
  }

  return null;
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
 * Build TUIState from stored session, state data, and persisted output.
 */
function buildTUIStateFromSession(
  session: Session,
  sessionState: SessionState | null,
  persistedOutput: readonly string[]
): TUIState {
  // Use persisted output if available, otherwise fall back to recentProgress
  const outputLines =
    persistedOutput.length > 0
      ? persistedOutput
      : (sessionState?.recentProgress ?? []);

  return {
    task: session.originalTask,
    iteration: sessionState?.iteration ?? 0,
    maxIterations: sessionState?.maxIterations ?? 0,
    status: mapSessionStatus(session.status),
    startTime: new Date(session.createdAt).getTime(),
    discoveryInProgress: false,
    discoveryCompleted: true,
    executionMode: "idle",
    outputLines,
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

  // Check for mouse wheel in scrollable views
  if (viewMode === "logs" || viewMode === "detail") {
    const mouseAction = parseMouseWheel(key);
    if (mouseAction) {
      return mouseAction;
    }
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

    case "mouse_wheel": {
      const maxOffset = Math.max(0, state.outputLines.length - outputHeight);
      const newOffset = Math.max(
        0,
        Math.min(maxOffset, state.scrollOffset + action.delta)
      );
      if (newOffset === state.scrollOffset) {
        return { type: "state", state };
      }
      return {
        type: "state",
        state: { ...state, scrollOffset: newOffset, userScrolled: true },
      };
    }

    default:
      return { type: "state", state };
  }
}

/**
 * Check if a session is currently running in the daemon.
 */
function isSessionRunningInDaemon(
  sessionId: string
): Effect.Effect<boolean, never, never> {
  return Effect.gen(function* () {
    if (!isDaemonRunning()) {
      return false;
    }

    const client = createDaemonClient();
    const connected = yield* client
      .connect()
      .pipe(Effect.map(() => true))
      .pipe(Effect.catchAll(() => Effect.succeed(false)));

    if (!connected) {
      return false;
    }

    const status = yield* client
      .getSessionStatus(sessionId)
      .pipe(Effect.map((info) => info.status === "running"))
      .pipe(Effect.catchAll(() => Effect.succeed(false)));

    yield* client.disconnect();
    return status;
  });
}

/**
 * Subscribe to live events from a daemon session.
 * Returns a fiber that updates the state ref and renders.
 */
function subscribeToLiveEvents(
  sessionId: string,
  stateRef: Ref.Ref<TUIState>,
  output: ANSIOutput
): Effect.Effect<
  { fiber: Fiber.RuntimeFiber<void, unknown>; client: DaemonClient },
  unknown,
  never
> {
  return Effect.gen(function* () {
    const client = createDaemonClient();
    yield* client.connect();
    yield* client.subscribeToSession(sessionId);

    const eventStream = client
      .getEventStream(sessionId)
      .pipe(Stream.catchAll(() => Stream.empty));

    // Fork the event processing
    const fiber = yield* Effect.fork(
      eventStream.pipe(
        Stream.runForEach((event) =>
          Effect.gen(function* () {
            const state = yield* Ref.updateAndGet(stateRef, (s) =>
              reduce(s, event)
            );
            yield* Effect.sync(() => safeRender(state, output));
          })
        )
      )
    );

    return { fiber, client };
  });
}

/**
 * Create a session view consumer.
 *
 * Displays the session TUI in read-only mode.
 * - For active sessions, subscribes to live events from the daemon
 * - For completed sessions, displays stored state
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

        // Load persisted output from file
        const outputStore = yield* OutputStore;
        const persistedOutput = yield* outputStore
          .read(sessionId)
          .pipe(Effect.catchAll(() => Effect.succeed([] as readonly string[])));

        // Build initial TUI state
        const initialState = buildTUIStateFromSession(
          session,
          sessionState,
          persistedOutput
        );
        const stateRef = yield* Ref.make(initialState);

        // Setup output
        const output = new ANSIOutput();
        setActiveOutput(output);
        const removeSignalHandlers = setupSignalHandlers();

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

        // Initial render
        safeRender(initialState, output);

        // Subscribe to resize
        const unsubscribeResize = output.onResize(() => {
          const state = Effect.runSync(Ref.get(stateRef));
          safeRender(state, output);
        });

        // Check if session is running in daemon and subscribe to live events
        const isLive = yield* isSessionRunningInDaemon(sessionId);
        let liveSubscription: {
          fiber: Fiber.RuntimeFiber<void, unknown>;
          client: DaemonClient;
        } | null = null;

        if (isLive) {
          liveSubscription = yield* subscribeToLiveEvents(
            sessionId,
            stateRef,
            output
          ).pipe(Effect.catchAll(() => Effect.succeed(null)));
        }

        // Enable raw mode and create stdin stream
        yield* enableRawMode();
        const stdinStream = createStdinStream();

        // FIXED_ROWS constant for session view
        const FIXED_ROWS = 6;

        // Process input and return result
        const result = yield* stdinStream.pipe(
          Stream.mapEffect((data) =>
            Effect.gen(function* () {
              const currentState = yield* Ref.get(stateRef);
              const action = parseKey(data, currentState.viewMode);
              // Calculate output height dynamically to handle terminal resizes
              const outputHeight = output.getHeight() - FIXED_ROWS;
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

        // Cleanup live subscription if active
        if (liveSubscription) {
          yield* Fiber.interrupt(liveSubscription.fiber).pipe(Effect.ignore);
          yield* liveSubscription.client
            .unsubscribeFromSession(sessionId)
            .pipe(Effect.ignore);
          yield* liveSubscription.client.disconnect();
        }

        // Cleanup
        yield* disableRawMode();
        unsubscribeResize();
        cleanup();

        return result;
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            FileSystemSession.Live,
            FileSystemState.Live,
            FileSystemOutput.Live
          )
        ),
        Effect.ensuring(disableRawMode())
      ),
  };
}
