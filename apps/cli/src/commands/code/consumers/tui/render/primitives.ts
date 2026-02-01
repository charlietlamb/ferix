import pc from "picocolors";

// ANSI escape code pattern for stripping
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for ANSI detection
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

// Colors - DOS/BIOS inspired palette
export const colors = {
  brand: pc.white,
  brandDim: pc.gray,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  info: pc.cyan,
  muted: pc.dim,
  highlight: pc.bold,
  border: pc.blue,
  brightWhite: (s: string) => pc.bold(pc.white(s)),
  brightCyan: (s: string) => pc.bold(pc.cyan(s)),
  brightGreen: (s: string) => pc.bold(pc.green(s)),
  brightYellow: (s: string) => pc.bold(pc.yellow(s)),
  brightRed: (s: string) => pc.bold(pc.red(s)),
  brightBlue: (s: string) => pc.bold(pc.blue(s)),
};

// Tool-specific colors
const toolColors: Record<string, (s: string) => string> = {
  Read: pc.cyan,
  Edit: pc.yellow,
  Write: pc.green,
  Bash: pc.cyan,
  Glob: pc.blue,
  Grep: pc.blue,
  Task: colors.brightWhite,
  WebFetch: pc.cyan,
  WebSearch: pc.blue,
};

export function getToolColor(tool: string): (s: string) => string {
  return toolColors[tool] || pc.white;
}

// Symbols - Clean retro style
export const symbols = {
  arrow: ">",
  prompt: ">>",
  bulletEmpty: "○",
  bulletFilled: "●",
  checkmark: "✓",
  cross: "✗",
  separator: "│",
  treeMiddle: "├─",
  treeLast: "└─",
  treeVertical: "│  ",
};

// Status text (muted words)
export const statusText = {
  done: colors.muted("done"),
  active: colors.muted("active"),
  paused: colors.muted("paused"),
  failed: colors.muted("failed"),
  running: colors.muted("running"),
  pending: colors.muted("pending"),
  completed: colors.muted("completed"),
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
  return colors.border(
    `${box.topLeft}${box.horizontal.repeat(repeatCount)}${box.topRight}`
  );
}

export function separator(width: number): string {
  const repeatCount = Math.max(0, width - 2);
  return colors.border(
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

  return `${colors.border(box.vertical)} ${finalContent}${" ".repeat(padding)} ${colors.border(box.vertical)}`;
}

export function emptyBorderedLine(width: number): string {
  const repeatCount = Math.max(0, width - 2);
  return `${colors.border(box.vertical)}${" ".repeat(repeatCount)}${colors.border(box.vertical)}`;
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
  let hasAnsi = false;

  for (const char of str) {
    if (char === "\x1b") {
      inEscape = true;
      hasAnsi = true;
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

  // Reset ANSI styling if we truncated a string with escape codes
  if (hasAnsi) {
    result += "\x1b[0m";
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
