import pc from "picocolors";

// ANSI escape code pattern for stripping
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for ANSI detection
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

// Colors
export const colors = {
  brand: pc.magenta,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  info: pc.cyan,
  muted: pc.dim,
  highlight: pc.bold,
  brightWhite: (s: string) => pc.bold(pc.white(s)),
  brightMagenta: (s: string) => pc.bold(pc.magenta(s)),
  brightCyan: (s: string) => pc.bold(pc.cyan(s)),
  brightGreen: (s: string) => pc.bold(pc.green(s)),
  brightYellow: (s: string) => pc.bold(pc.yellow(s)),
  brightRed: (s: string) => pc.bold(pc.red(s)),
};

// Tool-specific colors
const toolColors: Record<string, (s: string) => string> = {
  Read: pc.cyan,
  Edit: pc.yellow,
  Write: pc.green,
  Bash: pc.magenta,
  Glob: pc.blue,
  Grep: pc.blue,
  Task: colors.brightWhite,
  WebFetch: pc.cyan,
  WebSearch: pc.blue,
};

export function getToolColor(tool: string): (s: string) => string {
  return toolColors[tool] || pc.white;
}

// Symbols
export const symbols = {
  diamond: "◆",
  arrow: "▸",
  bulletEmpty: "○",
  bulletFilled: "●",
  checkmark: "✓",
  cross: "✗",
  separator: "│",
  treeMiddle: "├─",
  treeLast: "└─",
  treeVertical: "│  ",
};

// Box drawing
export const box = {
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  horizontal: "═",
  vertical: "║",
  teeRight: "╠",
  teeLeft: "╣",
  singleHorizontal: "─",
};

export function topBorder(width: number): string {
  const repeatCount = Math.max(0, width - 2);
  return pc.cyan(
    `${box.topLeft}${box.horizontal.repeat(repeatCount)}${box.topRight}`
  );
}

export function separator(width: number): string {
  const repeatCount = Math.max(0, width - 2);
  return pc.cyan(
    `${box.teeRight}${box.horizontal.repeat(repeatCount)}${box.teeLeft}`
  );
}

export function borderedLine(content: string, width: number): string {
  const innerWidth = width - 4; // borders + padding on each side

  // Truncate if content exceeds available width
  const finalContent =
    stripAnsi(content).length > innerWidth
      ? truncate(content, innerWidth)
      : content;

  const finalStripped = stripAnsi(finalContent);
  const padding = Math.max(0, innerWidth - finalStripped.length);

  return `${pc.cyan(box.vertical)} ${finalContent}${" ".repeat(padding)} ${pc.cyan(box.vertical)}`;
}

export function emptyBorderedLine(width: number): string {
  const repeatCount = Math.max(0, width - 2);
  return `${pc.cyan(box.vertical)}${" ".repeat(repeatCount)}${pc.cyan(box.vertical)}`;
}

// Text utilities
export function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, "");
}

export function truncate(str: string, maxWidth: number): string {
  // Guard against small widths
  if (maxWidth <= 3) {
    return maxWidth <= 0 ? "" : ".".repeat(maxWidth);
  }

  const stripped = stripAnsi(str);
  if (stripped.length <= maxWidth) {
    return str;
  }

  // Simple truncation - just cut at maxWidth-3 and add ellipsis
  let visible = 0;
  let result = "";
  let inEscape = false;

  for (const char of str) {
    if (char === "\x1b") {
      inEscape = true;
      result += char;
    } else if (inEscape) {
      result += char;
      if (char === "m") {
        inEscape = false;
      }
    } else {
      if (visible >= maxWidth - 3) {
        result += "...";
        break;
      }
      result += char;
      visible++;
    }
  }

  return result;
}

export function padRight(str: string, width: number): string {
  const stripped = stripAnsi(str);
  const padding = Math.max(0, width - stripped.length);
  return str + " ".repeat(padding);
}

export function formatDuration(startMs: number, endMs?: number): string {
  const elapsed = (endMs || Date.now()) - startMs;
  const secs = Math.floor(elapsed / 1000);
  const mins = Math.floor(secs / 60);
  return `${String(mins).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Status icons
export function statusIcon(
  status: "pending" | "in_progress" | "done" | "failed" | "passed"
): string {
  switch (status) {
    case "done":
    case "passed":
      return colors.success(symbols.checkmark);
    case "in_progress":
      return colors.warning(symbols.bulletFilled);
    case "failed":
      return colors.error(symbols.cross);
    default:
      return colors.muted(symbols.bulletEmpty);
  }
}

// Spinner frames
const SPINNER_FRAMES = ["|", "/", "-", "\\"] as const;
let spinnerIndex = 0;

export function getSpinner(): string {
  const frame = SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length] ?? "|";
  spinnerIndex++;
  return frame;
}
