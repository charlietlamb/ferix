import { For } from "solid-js";
import { useTheme } from "../context/index.js";

const LOGO_LINES = [
  "███████╗███████╗██████╗ ██╗██╗  ██╗",
  "██╔════╝██╔════╝██╔══██╗██║╚██╗██╔╝",
  "█████╗  █████╗  ██████╔╝██║ ╚███╔╝ ",
  "██╔══╝  ██╔══╝  ██╔══██╗██║ ██╔██╗ ",
  "██║     ███████╗██║  ██║██║██╔╝ ██╗",
  "╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝",
] as const;

/**
 * ASCII art "FERIX" logo using ANSI Shadow block characters.
 * Rendered in primary yellow matching the web dark mode primary.
 */
export function Logo() {
  const { theme } = useTheme();

  return (
    <box flexDirection="column">
      <For each={[...LOGO_LINES]}>
        {(line) => (
          <box height={1}>
            <text fg={theme.primary}>{line}</text>
          </box>
        )}
      </For>
    </box>
  );
}
