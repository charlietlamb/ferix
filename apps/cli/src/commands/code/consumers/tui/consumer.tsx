import {
  render,
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/solid";
import { Effect, type Stream } from "effect";
import { onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import type { DomainEvent } from "../../domain/index.js";
import type { ConsumeResult, Consumer, ConsumerContext } from "../types.js";
import {
  ExitProvider,
  ThemeProvider,
  ToastProvider,
  useTheme,
} from "./context/index.js";
import { createInitialState } from "./state.js";
import {
  createStreamConsumer,
  type MutableTUIState,
} from "./util/stream-to-store.js";
import { getTerminalBackgroundColor } from "./util/terminal.js";
import { SessionContent } from "./views/session/session-content.js";

/**
 * Result of user interaction in the consumer TUI.
 */
type ConsumerTUIResult = { type: "back_to_launcher" } | { type: "quit" };

/**
 * Props for the ConsumerApp component.
 */
interface ConsumerAppProps {
  readonly events: Stream.Stream<DomainEvent, unknown, never>;
  readonly onResult: (result: ConsumerTUIResult) => void;
}

/**
 * Standalone session view for the Consumer adapter.
 *
 * Sets up stream consumption and Ctrl+C handling, then delegates
 * all rendering and keyboard navigation to SessionContent.
 */
function ConsumerSession(props: ConsumerAppProps) {
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer();
  const { theme } = useTheme();

  // Disable stdout interception
  renderer.disableStdoutInterception();

  // State management using SolidJS store with direct event updates
  const [state, setStore] = createStore<MutableTUIState>(
    createInitialState() as MutableTUIState
  );

  // Cleanup reference for stream consumer
  let cleanupRef: (() => Promise<void>) | null = null;

  // Start consuming events on mount
  onMount(() => {
    const { cleanup } = createStreamConsumer(props.events, setStore);
    cleanupRef = cleanup;
  });

  // Cleanup on unmount
  onCleanup(() => {
    if (cleanupRef) {
      cleanupRef();
    }
  });

  // Handle Ctrl+C to quit
  useKeyboard((evt) => {
    if (evt.ctrl && evt.name === "c") {
      renderer.destroy();
      props.onResult({ type: "quit" });
    }
  });

  return (
    <box
      backgroundColor={theme.background}
      flexDirection="column"
      height={dimensions().height}
      width={dimensions().width}
    >
      <SessionContent
        onEscape={() => {
          renderer.destroy();
          props.onResult({ type: "back_to_launcher" });
        }}
        setStore={setStore}
        store={state}
      />
    </box>
  );
}

/**
 * Options for the TUI consumer.
 */
export interface TUIConsumerOptions {
  /** Target frames per second for rendering */
  readonly targetFps?: number;
}

/**
 * Unsubscribe from daemon session if context is provided.
 */
function unsubscribeFromDaemon(
  context: ConsumerContext | undefined
): Effect.Effect<void, never, never> {
  if (!context) {
    return Effect.void;
  }
  return context.daemonClient
    .unsubscribeFromSession(context.sessionId)
    .pipe(Effect.ignore);
}

/**
 * Creates a TUI consumer that renders events to a full-screen terminal interface.
 *
 * This is the Consumer adapter that wraps the new TUI components into the
 * Consumer interface used by action.ts for direct session runs.
 *
 * @param options - Configuration options
 * @returns A Consumer that renders to the terminal
 */
export function createTUIConsumer(options: TUIConsumerOptions = {}): Consumer {
  return {
    consume: (
      events: Stream.Stream<DomainEvent, unknown, never>,
      context?: ConsumerContext
    ) =>
      Effect.gen(function* () {
        let exitResult: ConsumeResult = "completed";
        let resultResolver: ((result: ConsumerTUIResult) => void) | undefined;

        // Create promise that resolves when user completes
        const resultPromise = new Promise<ConsumerTUIResult>((resolve) => {
          resultResolver = resolve;
        });

        // Detect terminal theme
        const mode = yield* Effect.promise(() => getTerminalBackgroundColor());

        // Exit handler for the provider tree
        const handleExit = () => {
          resultResolver?.({ type: "quit" });
          return Promise.resolve();
        };

        // Render the app with provider tree
        const renderPromise = render(
          () => (
            <ExitProvider onExit={handleExit}>
              <ToastProvider>
                <ThemeProvider mode={mode}>
                  <ConsumerSession
                    events={events}
                    onResult={(result) => {
                      resultResolver?.(result);
                    }}
                  />
                </ThemeProvider>
              </ToastProvider>
            </ExitProvider>
          ),
          {
            targetFps: options.targetFps ?? 60,
            exitOnCtrlC: false,
            useKittyKeyboard: {},
          }
        );

        // Wait for user action (Escape or Ctrl+C)
        const result = yield* Effect.promise(() => resultPromise);

        // Handle result
        if (result.type === "back_to_launcher") {
          exitResult = "back_to_launcher";
          yield* unsubscribeFromDaemon(context);
        }

        // Wait for render to clean up
        yield* Effect.promise(() =>
          renderPromise.catch(() => {
            // Ignore render cleanup errors
          })
        );

        return exitResult;
      }),
  };
}
