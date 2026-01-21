/**
 * Layout constants and calculations for dev mode TUI
 */

// Layout: rows used by non-output content
// Top border (1) + status (1) + task (1) + separator (1) = 4 header rows
// Separator (1) + footer (1) + bottom border (1) = 3 footer rows
// Total fixed = 7 rows
export const FIXED_ROWS = 7;

// Spinner frames for activity indicator
export const SPINNER_FRAMES = ["|", "/", "-", "\\"];

// Re-export tool colors from engine for consistency
export { TOOL_COLORS } from "../../engine/tools/colors.js";
