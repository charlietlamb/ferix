// Re-export registry and types

export type { ToolDisplayConfig, ToolDisplayRegistry } from "./registry.js";
export { toolDisplayRegistry } from "./registry.js";

// Convenience accessors
import { toolDisplayRegistry } from "./registry.js";

/**
 * Get the color function for a tool.
 */
export function getToolColor(tool: string): (s: string) => string {
  return toolDisplayRegistry.getColor(tool);
}

/**
 * Get the input key for a tool.
 */
export function getToolInputKey(tool: string): string | undefined {
  return toolDisplayRegistry.getInputKey(tool);
}

/**
 * Format tool input for display.
 */
export function formatToolInput(tool: string, input: unknown): string {
  return toolDisplayRegistry.formatInput(tool, input);
}
