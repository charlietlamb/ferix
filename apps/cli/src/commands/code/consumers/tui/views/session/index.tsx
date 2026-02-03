import { Effect } from "effect";
import { humanId } from "human-id";
import {
  createSignal,
  ErrorBoundary,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  useDaemon,
  useRoute,
  useTheme,
  useToast,
} from "../../context/index.js";
import { createInitialState } from "../../state.js";
import { loadSessionHistory } from "../../util/load-history.js";
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
 * Session view component.
 *
 * Handles daemon subscription, history loading, and connection state.
 * Delegates all rendering and keyboard navigation to SessionContent.
 */
export function SessionView(props: SessionViewProps) {
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

  // Start or subscribe to session
  onMount(() => {
    const setup = async () => {
      try {
        // STEP 1: Subscribe to session FIRST (ensure daemon routes events)
        if (props.isNew && props.task) {
          await Effect.runPromise(
            daemon.startSession(sessionId, {
              task: props.task,
              maxIterations: 10,
              verifyCommands: [],
              provider: "claude",
              yolo: true,
            })
          );
        }

        // Load historical output from disk for existing sessions
        if (!props.isNew) {
          const historicalLines = loadSessionHistory(sessionId);
          if (historicalLines.length > 0) {
            setStore("outputLines", historicalLines);
          }
        }

        await Effect.runPromise(daemon.subscribeToSession(sessionId));

        // STEP 2: THEN create stream consumer (now events will flow)
        const stream = daemon.getEventStream(sessionId);
        const { cleanup } = createStreamConsumer(stream, setStore);
        cleanupRef = cleanup;

        setConnected(true);
      } catch (err) {
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

    Effect.runPromise(
      daemon.unsubscribeFromSession(sessionId).pipe(Effect.ignore)
    );
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
            backgroundColor={theme.background}
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
          onEscape={() => route.toLauncher()}
          setStore={setStore}
          store={state}
        />
      </Show>
    </ErrorBoundary>
  );
}
