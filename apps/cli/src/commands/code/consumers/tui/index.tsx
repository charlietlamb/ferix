import { render } from "@opentui/solid";
import type { FerixConfig } from "../../config/index.js";
import type { DaemonClient } from "../../daemon/client.js";
import { App } from "./app.js";
import {
  ConfigProvider,
  DaemonProvider,
  ExitProvider,
  type Route,
  RouteProvider,
  ThemeProvider,
  ToastProvider,
} from "./context/index.js";
import { getTerminalBackgroundColor } from "./util/terminal.js";

/**
 * Options for starting the TUI.
 */
export interface TuiOptions {
  /**
   * Daemon client for communication with the background daemon.
   */
  readonly daemonClient: DaemonClient;

  /**
   * Initial route to display.
   * @default { type: "launcher" }
   */
  readonly initialRoute?: Route;

  /**
   * Loaded ferix.json config for pre-filling session defaults.
   */
  readonly config?: FerixConfig;

  /**
   * Callback when the TUI exits.
   */
  readonly onExit?: () => Promise<void>;
}

/**
 * Main TUI entry point.
 *
 * This function sets up the TUI with the proper provider tree and
 * terminal configuration. It follows OpenCode's architecture:
 *
 * 1. Detect terminal background color (dark/light mode)
 * 2. Set up provider tree with all contexts
 * 3. Call render() with proper options
 * 4. Return a Promise that resolves when the TUI exits
 *
 * The Promise pattern keeps the process alive until the user exits,
 * and allows proper cleanup through the exit callback.
 *
 * @param options - TUI configuration options
 * @returns Promise that resolves when TUI exits
 */
export function tui(options: TuiOptions): Promise<void> {
  const { daemonClient, initialRoute, config = {}, onExit } = options;

  // Promise to keep process alive until exit
  return new Promise<void>((resolve) => {
    // Async setup
    const setup = async () => {
      // Detect terminal theme before rendering
      const mode = await getTerminalBackgroundColor();

      // Exit handler that cleans up and resolves the promise
      const handleExit = async () => {
        await onExit?.();
        resolve();
      };

      // Render the TUI with full provider tree
      render(
        () => (
          <ExitProvider onExit={handleExit}>
            <ToastProvider>
              <ConfigProvider config={config}>
                <RouteProvider initial={initialRoute}>
                  <ThemeProvider mode={mode}>
                    <DaemonProvider client={daemonClient}>
                      <App />
                    </DaemonProvider>
                  </ThemeProvider>
                </RouteProvider>
              </ConfigProvider>
            </ToastProvider>
          </ExitProvider>
        ),
        {
          targetFps: 60,
          gatherStats: false,
          exitOnCtrlC: false,
          useKittyKeyboard: {},
        }
      );
    };

    // Start setup
    setup().catch((err) => {
      console.error("TUI setup failed:", err);
      resolve();
    });
  });
}

// Re-export Route type for launcher.ts
export type { Route } from "./context/index.js";
