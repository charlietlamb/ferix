import { Effect } from "effect";
import { humanId } from "human-id";
import {
  createSignal,
  ErrorBoundary,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import {
  useConfig,
  useDaemon,
  useRoute,
  useTheme,
  useToast,
} from "../../context/index.js";
import { createInitialState } from "../../state.js";
import { loadSessionHistory } from "../../util/load-history.js";
import { loadPersistedSessionMetadata } from "../../util/load-session-metadata.js";
import {
  createStreamConsumer,
  type MutableTUIState,
} from "../../util/stream-to-store.js";
import { SessionContent } from "./session-content.js";

interface SessionViewProps {
  /**
   * Session ID to view (for existing sessions).
   */
  readonly sessionId?: string;

  /**
   * Task to start a new session with.
   */
  readonly task?: string;

  /**
   * Whether this is a new session.
   */
  readonly isNew?: boolean;
}

/**
 * Generate a session ID.
 */
function generateSessionId(): string {
  const id = humanId({ separator: "-", capitalize: false });
  return `${id}-${Date.now()}`;
}

/**
 * Try to subscribe to a live daemon session.
 * Returns true if subscription succeeded, false if the session is not in daemon memory.
 * Throws for new sessions where failure is unexpected.
 */
async function trySubscribeToSession(
  daemon: ReturnType<typeof useDaemon>,
  sessionId: string,
  isNew: boolean
): Promise<boolean> {
  try {
    await Effect.runPromise(daemon.subscribeToSession(sessionId));
    return true;
  } catch {
    // Subscribe failed — session not active in daemon memory.
    // Expected for completed/failed sessions after daemon restart.
    if (isNew) {
      throw new Error("Failed to subscribe to newly started session");
    }
    return false;
  }
}

/**
 * Load historical output lines from disk into the store.
 */
function loadHistoricalOutput(
  sessionId: string,
  setStore: SetStoreFunction<MutableTUIState>
): void {
  const historicalLines = loadSessionHistory(sessionId);
  if (historicalLines.length > 0) {
    setStore("outputLines", historicalLines);
  }
}

interface SessionSetupConfig {
  readonly task: string;
  readonly maxIterations: number;
  readonly verifyCommands: readonly string[];
  readonly provider: "claude" | "cursor" | "opencode";
  readonly yolo: boolean;
}

/**
 * Start a new session on the daemon.
 */
async function startNewSession(
  daemon: ReturnType<typeof useDaemon>,
  sessionId: string,
  config: SessionSetupConfig
): Promise<void> {
  await Effect.runPromise(
    daemon.startSession(sessionId, {
      task: config.task,
      maxIterations: config.maxIterations,
      verifyCommands: config.verifyCommands,
      provider: config.provider,
      yolo: config.yolo,
    })
  );
}

/**
 * Session view component.
 *
 * Handles daemon subscription, history loading, and connection state.
 * Delegates all rendering and keyboard navigation to SessionContent.
 */
export function SessionView(props: SessionViewProps) {
  const config = useConfig();
  const daemon = useDaemon();
  const route = useRoute();
  const toast = useToast();
  const { theme } = useTheme();

  // Session ID - either provided or generated for new sessions
  const sessionId = props.sessionId ?? generateSessionId();

  // State management using SolidJS store with direct event updates
  const [state, setStore] = createStore<MutableTUIState>(
    createInitialState() as MutableTUIState
  );
  const [connected, setConnected] = createSignal(false);

  // Cleanup reference for stream consumer
  let cleanupRef: (() => Promise<void>) | null = null;

  // Pre-compute session config outside the setup closure to reduce complexity
  const sessionConfig: SessionSetupConfig | undefined =
    props.isNew && props.task
      ? {
          task: props.task,
          maxIterations: config.iterations ?? 10,
          verifyCommands: config.verify ?? [],
          provider: config.provider ?? "claude",
          yolo: config.yolo ?? true,
        }
      : undefined;

  // Start or subscribe to session
  onMount(() => {
    const setup = async () => {
      try {
        // Step 1: Start if new session
        if (sessionConfig) {
          await startNewSession(daemon, sessionId, sessionConfig);
        }

        // Step 2: Load historical output from disk for existing sessions
        if (!props.isNew) {
          loadHistoricalOutput(sessionId, setStore);
        }

        // Step 3: Try to subscribe to live events
        const isLiveSession = await trySubscribeToSession(
          daemon,
          sessionId,
          props.isNew ?? false
        );

        // Step 4: Set up event stream only for live sessions
        if (isLiveSession) {
          const stream = daemon.getEventStream(sessionId);
          const { cleanup } = createStreamConsumer(stream, setStore);
          cleanupRef = cleanup;
        }

        // Step 5: Enrich store from persisted session metadata for historical sessions
        if (!(isLiveSession || props.isNew)) {
          loadPersistedSessionMetadata(sessionId, setStore);
        }

        setConnected(true);
      } catch (err) {
        route.toLauncher(sessionId);
        toast.error(err);
      }
    };

    setup();
  });

  // Cleanup on unmount
  onCleanup(() => {
    if (cleanupRef) {
      cleanupRef();
    }

    // Only unsubscribe if we actually subscribed (live session)
    if (connected() && cleanupRef) {
      Effect.runPromise(
        daemon.unsubscribeFromSession(sessionId).pipe(Effect.ignore)
      );
    }
  });

  return (
    <ErrorBoundary
      fallback={(err) => {
        console.error("[SessionView] ErrorBoundary caught", err);
        return (
          <box flexDirection="column" height="100%" width="100%">
            <text fg="red">
              {`Error in SessionView: ${err?.message ?? String(err)}`}
            </text>
          </box>
        );
      }}
    >
      <Show
        fallback={
          <box
            backgroundColor="transparent"
            flexDirection="column"
            height="100%"
            paddingLeft={2}
            paddingTop={1}
            width="100%"
          >
            <text fg={theme.textDim}>Connecting to session...</text>
          </box>
        }
        when={connected()}
      >
        <SessionContent
          onEscape={() => route.toLauncher(sessionId)}
          setStore={setStore}
          store={state}
        />
      </Show>
    </ErrorBoundary>
  );
}
