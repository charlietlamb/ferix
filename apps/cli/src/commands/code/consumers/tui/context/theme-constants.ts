import { RGBA } from "@opentui/core";

/**
 * Theme mode - dark or light.
 */
export type ThemeMode = "dark" | "light";

/**
 * Core dark theme colors.
 */
export const darkTheme = {
  // Brand colors
  brand: RGBA.fromHex("#7C3AED"),
  brandDim: RGBA.fromHex("#5B21B6"),
  brandGlow: RGBA.fromHex("#A78BFA"),

  // Primary color (matches web dark mode --primary)
  primary: RGBA.fromHex("#FFE244"),

  // Accent colors (retro amber)
  accent: RGBA.fromHex("#F59E0B"),
  accentDim: RGBA.fromHex("#D97706"),

  // Text colors (wider contrast range)
  text: RGBA.fromHex("#EEEEEE"),
  textDim: RGBA.fromHex("#A3A3A3"),
  textMuted: RGBA.fromHex("#606060"),
  textGhost: RGBA.fromHex("#404040"),

  // Status colors
  success: RGBA.fromHex("#22C55E"),
  warning: RGBA.fromHex("#EAB308"),
  error: RGBA.fromHex("#EF4444"),
  info: RGBA.fromHex("#3B82F6"),

  // Background layers (depth)
  background: RGBA.fromHex("#0D0D0D"),
  backgroundPanel: RGBA.fromHex("#171717"),
  backgroundElement: RGBA.fromHex("#1E1E1E"),
  backgroundHighlight: RGBA.fromHex("#2A2A2A"),

  // Legacy aliases
  backgroundDim: RGBA.fromHex("#171717"),

  // Border tiers
  border: RGBA.fromHex("#404040"),
  borderActive: RGBA.fromHex("#7C3AED"),
  borderSubtle: RGBA.fromHex("#262626"),
  borderDim: RGBA.fromHex("#303030"),

  // Special colors
  selection: RGBA.fromHex("#7C3AED"),
  cursor: RGBA.fromHex("#FFFFFF"),

  // Additional bright colors for styled text
  brightWhite: RGBA.fromHex("#FFFFFF"),
  brightCyan: RGBA.fromHex("#22D3EE"),
  brightGreen: RGBA.fromHex("#4ADE80"),
  brightYellow: RGBA.fromHex("#FACC15"),
  brightRed: RGBA.fromHex("#F87171"),
  brightBlue: RGBA.fromHex("#60A5FA"),

  // Cyan variant (distinct from info blue)
  cyan: RGBA.fromHex("#06B6D4"),

  // Blue variant
  blue: RGBA.fromHex("#3B82F6"),
} as const;

/**
 * Light theme - extends dark with adjusted colors.
 */
export const lightTheme = {
  ...darkTheme,
  brandGlow: RGBA.fromHex("#7C3AED"),
  accent: RGBA.fromHex("#D97706"),
  accentDim: RGBA.fromHex("#B45309"),
  text: RGBA.fromHex("#1A1A1A"),
  textDim: RGBA.fromHex("#525252"),
  textMuted: RGBA.fromHex("#737373"),
  textGhost: RGBA.fromHex("#A3A3A3"),
  background: RGBA.fromHex("#FAFAFA"),
  backgroundPanel: RGBA.fromHex("#F5F5F5"),
  backgroundElement: RGBA.fromHex("#EEEEEE"),
  backgroundHighlight: RGBA.fromHex("#E5E5E5"),
  backgroundDim: RGBA.fromHex("#F5F5F5"),
  border: RGBA.fromHex("#D4D4D4"),
  borderActive: RGBA.fromHex("#7C3AED"),
  borderSubtle: RGBA.fromHex("#E5E5E5"),
  borderDim: RGBA.fromHex("#E5E5E5"),
} as const;

/**
 * Tool-specific colors for syntax highlighting.
 */
const toolColors: Record<string, RGBA> = {
  Read: darkTheme.cyan,
  Edit: darkTheme.warning,
  Write: darkTheme.success,
  Bash: darkTheme.cyan,
  Glob: darkTheme.blue,
  Grep: darkTheme.blue,
  Task: darkTheme.brightWhite,
  WebFetch: darkTheme.cyan,
  WebSearch: darkTheme.blue,
};

/**
 * Get the color for a specific tool.
 */
export function getToolColor(tool: string): RGBA {
  return toolColors[tool] ?? darkTheme.text;
}

/**
 * UI symbols for consistent iconography.
 */
export const symbols = {
  arrow: ">",
  arrowFilled: "▸",
  prompt: ">>",
  bulletEmpty: "○",
  bulletFilled: "●",
  checkmark: "✓",
  cross: "✗",
  separator: "│",
  treeMiddle: "├─",
  treeLast: "└─",
  treeVertical: "│  ",
  dot: "·",
  diamond: "◆",
  diamondEmpty: "◇",
  triangle: "△",
  splitVertical: "┃",
  blockFull: "█",
  blockUpper: "▀",
  blockLower: "▄",
} as const;

/**
 * Box drawing characters for borders and containers.
 */
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
  singleTopLeft: "┌",
  singleBottomLeft: "└",
  singleBottomRight: "┘",
} as const;

/**
 * Spinner configuration for animated braille spinner.
 */
export const spinnerFrames = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
] as const;

export const SPINNER_INTERVAL_MS = 80;
