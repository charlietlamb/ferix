// Re-export registry and types

// Convenience accessors
import { toolDisplayRegistry } from "./registry.js";

/**
 * Format tool input for display.
 */
export function formatToolInput(tool: string, input: unknown): string {
  return toolDisplayRegistry.formatInput(tool, input);
}
