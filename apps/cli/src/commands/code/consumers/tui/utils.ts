import type { TUIState } from "../../domain/schemas/tui.js";
import type { TerminalOutput } from "./output/index.js";
import { render } from "./render/index.js";

/**
 * Safe wrapper for render that catches exceptions and logs to stderr.
 * This prevents render crashes from silently killing the TUI.
 */
export function safeRender(state: TUIState, output: TerminalOutput): void {
  try {
    render(state, output);
  } catch (err) {
    process.stderr.write(`Render error: ${err}\n`);
  }
}
