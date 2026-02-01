import { exec } from "node:child_process";
import { Effect, Layer, Ref, Stream } from "effect";
import {
  createDaemonClient,
  getDaemonPid,
  isDaemonRunning,
  stopDaemon,
} from "../../daemon/index.js";
import { FileSystemGit } from "../../layers/git/file-system.js";
import { FileSystemOutput } from "../../layers/output/file-system.js";
import { FileSystemSession } from "../../layers/session/file-system.js";
import { Git } from "../../services/git.js";
import { OutputStore } from "../../services/output-store.js";
import { SessionStore } from "../../services/session-store.js";
import { ANSIOutput } from "../tui/output/index.js";
import { applyAction, parseKey } from "./input.js";
import { render } from "./render/index.js";
import {
  createInitialLauncherState,
  type DaemonInfo,
  type LauncherResult,
  type LauncherSession,
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

/**
 * Get the platform-specific command to open a URL in the browser.
 */
function getOpenCommand(url: string): string {
  if (process.platform === "darwin") {
    return `open "${url}"`;
  }
  if (process.platform === "win32") {
    return `start "${url}"`;
  }
  return `xdg-open "${url}"`;
}

/**
 * Open a URL in the default browser.
 */
function openInBrowser(url: string): void {
  const command = getOpenCommand(url);
  // Fire and forget - don't need to wait for browser to open
  exec(command, () => {
    // Ignore any errors
  });
}

/** Fixed rows: header (3) + separator + footer (1) */
const FIXED_ROWS = 5;

/** Maximum line length for last output preview */
const MAX_OUTPUT_LENGTH = 80;

/** Regex to match separator lines (box drawing characters) */
const SEPARATOR_LINE_REGEX = /^[-=─═│║┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬]+$/;

/**
 * Check if a line is a skip-worthy line (empty, separator, or tool output).
 */
function isSkipLine(trimmed: string): boolean {
  if (trimmed === "") {
    return true;
  }
  if (SEPARATOR_LINE_REGEX.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith("Tool:")) {
    return true;
  }
  if (trimmed.startsWith("Reading:")) {
    return true;
  }
  if (trimmed.startsWith("Writing:")) {
    return true;
  }
  if (trimmed.startsWith("Searching:")) {
    return true;
  }
  // Skip ferix XML tags
  if (trimmed.includes("<ferix:") || trimmed.includes("</ferix:")) {
    return true;
  }
  return false;
}

/**
 * Find the last meaningful LLM output line from output lines.
 * Skips empty lines, separators, and tool-related output.
 */
function findLastMeaningfulOutput(
  lines: readonly string[]
): string | undefined {
  // Check last 20 lines for meaningful content
  const searchLines = lines.slice(-20);
  for (let i = searchLines.length - 1; i >= 0; i--) {
    const line = searchLines[i];
    if (!line) {
      continue;
    }

    const trimmed = line.trim();
    if (isSkipLine(trimmed)) {
      continue;
    }

    // Found a meaningful line
    return trimmed.length > MAX_OUTPUT_LENGTH
      ? `${trimmed.slice(0, MAX_OUTPUT_LENGTH - 3)}...`
      : trimmed;
  }
  return undefined;
}

/**
 * Enrich a LauncherSession with the last output line.
 * Uses OutputStore to load the session's output.log and find the last meaningful line.
 */
function enrichSessionWithOutput(
  session: LauncherSession,
  outputStore: OutputStoreService
): Effect.Effect<LauncherSession, never, never> {
  return outputStore.read(session.id).pipe(
    Effect.map((lines) => {
      const lastOutput = findLastMeaningfulOutput(lines);
      return lastOutput ? { ...session, lastOutput } : session;
    }),
    Effect.catchAll(() => Effect.succeed(session))
  );
}

/**
 * Interface for OutputStore service.
 */
interface OutputStoreService {
  readonly read: (
    sessionId: string
  ) => Effect.Effect<readonly string[], unknown>;
}

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
 * Side effect type union (re-exported for type safety).
 */
type SideEffect =
  | { readonly type: "stop_daemon" }
  | { readonly type: "open_pr"; readonly url: string }
  | { readonly type: "create_pr"; readonly session: LauncherSession };

/**
 * Update state with new PR creation status.
 */
function updatePrCreationStatus(
  state: LauncherState,
  status:
    | {
        sessionId: string;
        status: "pushing" | "creating" | "success" | "error";
        error?: string;
      }
    | undefined
): LauncherState {
  return { ...state, prCreation: status };
}

/**
 * Update sessions array with a new PR URL for a specific session.
 */
function updateSessionWithPrUrl(
  state: LauncherState,
  sessionId: string,
  prUrl: string
): LauncherState {
  const sessions = state.sessions.map((s) =>
    s.id === sessionId ? { ...s, prUrl } : s
  );
  return { ...state, sessions };
}

/**
 * Handle creating a PR for a session.
 * This is an async operation that pushes the branch and creates a PR.
 * Works with the branch name directly since the worktree is deleted after completion.
 */
function handleCreatePR(
  session: LauncherSession,
  stateRef: Ref.Ref<LauncherState>,
  output: ANSIOutput,
  sessionStore: {
    update: (
      id: string,
      session: {
        id: string;
        createdAt: string;
        status: "active" | "completed" | "failed" | "paused";
        originalTask: string;
        completedTasks: readonly string[];
        prUrl?: string;
        branchName?: string;
        baseBranch?: string;
        displayName?: string;
      }
    ) => Effect.Effect<void, unknown>;
  },
  git: {
    pushBranchByName: (branchName: string) => Effect.Effect<void, unknown>;
    createPRByBranchName: (
      branchName: string,
      title: string,
      body: string,
      baseBranch?: string
    ) => Effect.Effect<string, unknown>;
  }
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const sessionId = session.id;
    const branchName = session.branchName;

    // Branch name is required for PR creation
    if (!branchName) {
      yield* Ref.update(stateRef, (s) =>
        updatePrCreationStatus(s, {
          sessionId,
          status: "error",
          error: "No branch name found for session",
        })
      );
      const errorState = yield* Ref.get(stateRef);
      safeRender(errorState, output, stateRef);
      return;
    }

    // Update state to show "pushing" status
    yield* Ref.update(stateRef, (s) =>
      updatePrCreationStatus(s, { sessionId, status: "pushing" })
    );
    const pushingState = yield* Ref.get(stateRef);
    safeRender(pushingState, output, stateRef);

    // Push the branch by name
    const pushResult = yield* git.pushBranchByName(branchName).pipe(
      Effect.map(() => ({ success: true as const })),
      Effect.catchAll((error) =>
        Effect.succeed({
          success: false as const,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    );

    if (!pushResult.success) {
      yield* Ref.update(stateRef, (s) =>
        updatePrCreationStatus(s, {
          sessionId,
          status: "error",
          error: `Push failed: ${pushResult.error}`,
        })
      );
      const errorState = yield* Ref.get(stateRef);
      safeRender(errorState, output, stateRef);
      return;
    }

    // Update state to show "creating" status
    yield* Ref.update(stateRef, (s) =>
      updatePrCreationStatus(s, { sessionId, status: "creating" })
    );
    const creatingState = yield* Ref.get(stateRef);
    safeRender(creatingState, output, stateRef);

    // Create PR title and body from session info
    const title = session.displayName
      ? `${session.displayName}`
      : session.originalTask.slice(0, 72);
    const body = `## Summary\n\n${session.originalTask}\n\n---\n*Created by Ferix*`;

    // Create the PR using branch name
    const prResult = yield* git
      .createPRByBranchName(branchName, title, body, session.baseBranch)
      .pipe(
        Effect.map((prUrl) => ({ success: true as const, prUrl })),
        Effect.catchAll((error) =>
          Effect.succeed({
            success: false as const,
            error: error instanceof Error ? error.message : String(error),
          })
        )
      );

    if (!prResult.success) {
      yield* Ref.update(stateRef, (s) =>
        updatePrCreationStatus(s, {
          sessionId,
          status: "error",
          error: `PR creation failed: ${prResult.error}`,
        })
      );
      const errorState = yield* Ref.get(stateRef);
      safeRender(errorState, output, stateRef);
      return;
    }

    const prUrl = prResult.prUrl;

    // Update session store with new PR URL
    yield* sessionStore
      .update(sessionId, {
        id: session.id,
        createdAt: session.createdAt,
        status: session.status,
        originalTask: session.originalTask,
        completedTasks: [],
        prUrl,
        branchName: session.branchName,
        baseBranch: session.baseBranch,
        displayName: session.displayName,
      })
      .pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    // Update launcher state with new PR URL and clear prCreation status
    yield* Ref.update(stateRef, (s) => {
      const updated = updateSessionWithPrUrl(s, sessionId, prUrl);
      return updatePrCreationStatus(updated, undefined);
    });
    const successState = yield* Ref.get(stateRef);
    safeRender(successState, output, stateRef);

    // Open PR in browser
    openInBrowser(prUrl);
  });
}

/**
 * Handle synchronous side effects from launcher actions.
 * Returns updated state (or null if effect requires async handling).
 */
function handleSyncSideEffect(
  effect: SideEffect,
  state: LauncherState
): LauncherState | null {
  if (effect.type === "stop_daemon") {
    const newDaemonInfo = handleStopDaemon();
    return { ...state, daemon: newDaemonInfo };
  }
  if (effect.type === "open_pr") {
    openInBrowser(effect.url);
    return state;
  }
  // create_pr requires async handling
  return null;
}

/**
 * Handle a single input action and return a result or null to continue.
 */
function handleInputAction(
  data: Buffer,
  stateRef: Ref.Ref<LauncherState>,
  output: ANSIOutput,
  sessionStore: {
    update: (
      id: string,
      session: {
        id: string;
        createdAt: string;
        status: "active" | "completed" | "failed" | "paused";
        originalTask: string;
        completedTasks: readonly string[];
        prUrl?: string;
        branchName?: string;
        baseBranch?: string;
        displayName?: string;
      }
    ) => Effect.Effect<void, unknown>;
  },
  git: {
    pushBranchByName: (branchName: string) => Effect.Effect<void, unknown>;
    createPRByBranchName: (
      branchName: string,
      title: string,
      body: string,
      baseBranch?: string
    ) => Effect.Effect<string, unknown>;
  }
): Effect.Effect<LauncherResult | null, never, never> {
  return Effect.gen(function* () {
    const currentState = yield* Ref.get(stateRef);
    const action = parseKey(data, currentState.viewMode);
    const actionResult = applyAction(currentState, action);

    if (actionResult.type === "result") {
      return actionResult.result;
    }

    // Handle side effects
    if (actionResult.type === "effect") {
      const effect = actionResult.effect;

      // Handle async create_pr effect
      if (effect.type === "create_pr") {
        yield* handleCreatePR(
          effect.session,
          stateRef,
          output,
          sessionStore,
          git
        );
        return null;
      }

      // Handle sync effects
      const newState = handleSyncSideEffect(effect, actionResult.state);
      if (newState) {
        yield* Ref.set(stateRef, newState);
        safeRender(newState, output, stateRef);
      }
      return null;
    }

    // Update state and render
    yield* Ref.set(stateRef, actionResult.state);
    safeRender(actionResult.state, output, stateRef);
    return null;
  });
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

        // Load sessions and enrich with last output
        const sessionStore = yield* SessionStore;
        const outputStore = yield* OutputStore;
        const git = yield* Git;
        const baseSessions = yield* sessionStore.list().pipe(
          Effect.map((sessions) => sessions.map(sessionToLauncherSession)),
          Effect.catchAll(() => Effect.succeed([] as LauncherSession[]))
        );

        // Enrich each session with last output (in parallel)
        const sessionsResult = yield* Effect.all(
          baseSessions.map((session) =>
            enrichSessionWithOutput(session, outputStore)
          ),
          { concurrency: 5 }
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
            handleInputAction(data, stateRef, output, sessionStore, git)
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
        Effect.provide(
          Layer.mergeAll(
            FileSystemSession.Live,
            FileSystemOutput.Live,
            FileSystemGit.Live
          )
        ),
        Effect.ensuring(disableRawMode())
      ),
  };
}
