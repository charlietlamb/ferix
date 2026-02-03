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

  // Text colors
  text: RGBA.fromHex("#E5E5E5"),
  textDim: RGBA.fromHex("#A3A3A3"),
  textMuted: RGBA.fromHex("#737373"),

  // Status colors
  success: RGBA.fromHex("#22C55E"),
  warning: RGBA.fromHex("#EAB308"),
  error: RGBA.fromHex("#EF4444"),
  info: RGBA.fromHex("#3B82F6"),

  // Background colors
  background: RGBA.fromHex("#171717"),
  backgroundDim: RGBA.fromHex("#262626"),
  backgroundHighlight: RGBA.fromHex("#404040"),

  // Border colors
  border: RGBA.fromHex("#404040"),
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
  text: RGBA.fromHex("#1A1A1A"),
  textDim: RGBA.fromHex("#525252"),
  textMuted: RGBA.fromHex("#737373"),
  background: RGBA.fromHex("#FAFAFA"),
  backgroundDim: RGBA.fromHex("#F5F5F5"),
  backgroundHighlight: RGBA.fromHex("#E5E5E5"),
  border: RGBA.fromHex("#D4D4D4"),
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
  prompt: ">>",
  bulletEmpty: "○",
  bulletFilled: "●",
  checkmark: "✓",
  cross: "✗",
  separator: "│",
  treeMiddle: "├─",
  treeLast: "└─",
  treeVertical: "│  ",
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
