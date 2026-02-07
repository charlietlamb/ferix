import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/solid";
import { ErrorBoundary, Match, Switch } from "solid-js";
import { Toast, useExit, useRoute } from "./context/index.js";
import { LauncherView } from "./views/launcher.js";
import { SessionView } from "./views/session/index.js";

/**
 * Main TUI App component.
 *
 * This is the root component of the TUI, responsible for:
 * - Setting up the renderer (disabling stdout interception)
 * - Handling global keyboard shortcuts (Ctrl+C to exit)
 * - Routing between launcher and session views
 * - Rendering the toast overlay
 */
export function App() {
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer();
  const route = useRoute();
  const exit = useExit();

  // Disable stdout interception - critical for proper terminal rendering
  // This restores the original stdout.write after OpenTUI has set up its interceptor
  renderer.disableStdoutInterception();

  // Handle global keyboard shortcuts
  useKeyboard((evt) => {
    // Ctrl+C - exit the TUI
    if (evt.ctrl && evt.name === "c") {
      exit();
      return;
    }
  });

  return (
    <ErrorBoundary
      fallback={(err) => {
        return (
          <box
            backgroundColor="transparent"
            flexDirection="column"
            height={dimensions().height}
            width={dimensions().width}
          >
            <text fg="red">{`Fatal error: ${err?.message ?? String(err)}`}</text>
          </box>
        );
      }}
    >
      <box
        backgroundColor="transparent"
        flexDirection="column"
        height={dimensions().height}
        width={dimensions().width}
      >
        {/* Main content - switches based on current route */}
        <Switch>
          <Match when={route.data.type === "launcher"}>
            <LauncherView />
          </Match>
          <Match when={route.data.type === "session"}>
            <SessionView
              sessionId={(route.data as { sessionId: string }).sessionId}
            />
          </Match>
          <Match when={route.data.type === "new"}>
            <SessionView isNew task={(route.data as { task: string }).task} />
          </Match>
        </Switch>

        {/* Toast overlay - positioned absolutely */}
        <Toast />
      </box>
    </ErrorBoundary>
  );
}
