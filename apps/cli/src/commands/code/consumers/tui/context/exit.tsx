import { useRenderer } from "@opentui/solid";
import { untrack } from "solid-js";
import { createSimpleContext } from "./helper.js";

/**
 * Exit context for proper TUI cleanup.
 *
 * This context provides a clean exit function that:
 * 1. Resets the terminal title
 * 2. Destroys the OpenTUI renderer (restores terminal state)
 * 3. Calls any cleanup callback
 * 4. Exits the process
 *
 * This pattern ensures the terminal is always restored to a clean state,
 * even when exiting due to errors.
 */
export const { use: useExit, provider: ExitProvider } = createSimpleContext({
  name: "Exit",
  init: (input: { onExit?: () => Promise<void> }) => {
    // Use untrack to prevent reactivity conflicts when this provider
    // initializes inside nested memo contexts (like Switch/Match)
    const renderer = untrack(() => useRenderer());

    return async (reason?: unknown) => {
      // Reset window title before destroying renderer
      renderer.setTerminalTitle("");

      // Destroy renderer - this restores terminal to normal mode
      renderer.destroy();

      // Call cleanup callback if provided
      await input.onExit?.();

      // Log error if provided
      if (reason) {
        const message =
          reason instanceof Error ? reason.message : String(reason);
        process.stderr.write(`Error: ${message}\n`);
      }

      // Exit process
      process.exit(reason ? 1 : 0);
    };
  },
});
