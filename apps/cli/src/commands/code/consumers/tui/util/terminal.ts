/**
 * Terminal utility functions.
 *
 * These functions help detect terminal capabilities and state
 * before initializing the TUI renderer.
 */

// Regex for parsing OSC 11 response - defined at module level for performance
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for terminal escape sequences
const OSC_11_REGEX = /\x1b]11;([^\x07\x1b]+)/;

/**
 * Parse RGB color from terminal response string.
 */
function parseColorString(color: string | undefined): {
  r: number;
  g: number;
  b: number;
} {
  if (!color) {
    return { r: 0, g: 0, b: 0 };
  }

  if (color.startsWith("rgb:")) {
    const parts = color.substring(4).split("/");
    // Convert 16-bit color values to 8-bit by dividing by 256
    return {
      r: Math.floor(Number.parseInt(parts[0] ?? "0", 16) / 256),
      g: Math.floor(Number.parseInt(parts[1] ?? "0", 16) / 256),
      b: Math.floor(Number.parseInt(parts[2] ?? "0", 16) / 256),
    };
  }

  if (color.startsWith("#")) {
    return {
      r: Number.parseInt(color.substring(1, 3), 16),
      g: Number.parseInt(color.substring(3, 5), 16),
      b: Number.parseInt(color.substring(5, 7), 16),
    };
  }

  if (color.startsWith("rgb(")) {
    const parts = color.substring(4, color.length - 1).split(",");
    return {
      r: Number.parseInt(parts[0] ?? "0", 10),
      g: Number.parseInt(parts[1] ?? "0", 10),
      b: Number.parseInt(parts[2] ?? "0", 10),
    };
  }

  return { r: 0, g: 0, b: 0 };
}

/**
 * Detect terminal background color by querying the terminal.
 *
 * This function temporarily sets stdin to raw mode to capture the
 * terminal's response to an OSC 11 query. This is important for
 * determining whether to use dark or light theme.
 *
 * The terminal setup/cleanup ensures a clean state before OpenTUI
 * takes over terminal control.
 *
 * @returns "dark" or "light" based on terminal background
 */
export function getTerminalBackgroundColor(): Promise<"dark" | "light"> {
  // Can't set raw mode if not a TTY
  if (!process.stdin.isTTY) {
    return Promise.resolve("dark");
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", handler);
      clearTimeout(timeout);
    };

    const handler = (data: Buffer) => {
      const str = data.toString();
      const match = str.match(OSC_11_REGEX);

      if (match) {
        cleanup();
        const { r, g, b } = parseColorString(match[1]);

        // Calculate luminance using relative luminance formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Determine if dark or light based on luminance threshold
        resolve(luminance > 0.5 ? "light" : "dark");
      }
    };

    // Set raw mode to receive terminal response
    process.stdin.setRawMode(true);
    process.stdin.on("data", handler);

    // Send OSC 11 query for background color
    process.stdout.write("\x1b]11;?\x07");

    // Timeout after 1 second - assume dark if no response
    timeout = setTimeout(() => {
      cleanup();
      resolve("dark");
    }, 1000);
  });
}
