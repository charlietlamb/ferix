import pc from "picocolors";
import { MAX_TOOL_INPUT_LENGTH } from "../constants.js";

// Define brightWhite locally to avoid circular dependency with primitives
const brightWhite = (s: string) => pc.bold(pc.white(s));

/**
 * Normalize tool name for case-insensitive lookup.
 */
function normalizeToolName(tool: string): string {
  return tool.toLowerCase();
}

/**
 * Get value from input object trying multiple key formats.
 * Handles both snake_case (file_path) and camelCase (filePath) variants.
 */
function getInputValue(obj: Record<string, unknown>, key: string): unknown {
  // Try exact key first
  if (obj[key] !== undefined) {
    return obj[key];
  }

  // Try camelCase version (file_path -> filePath)
  const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (obj[camelKey] !== undefined) {
    return obj[camelKey];
  }

  // Try snake_case version (filePath -> file_path)
  const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (obj[snakeKey] !== undefined) {
    return obj[snakeKey];
  }

  return undefined;
}

/**
 * Configuration for how a tool is displayed.
 */
export interface ToolDisplayConfig {
  readonly tool: string;
  readonly inputKey: string;
  readonly color: (s: string) => string;
  readonly maxLength?: number;
}

/**
 * Registry for tool display configurations.
 */
export interface ToolDisplayRegistry {
  register(config: ToolDisplayConfig): void;
  getInputKey(tool: string): string | undefined;
  getColor(tool: string): (s: string) => string;
  getMaxLength(tool: string): number;
  formatInput(tool: string, input: unknown): string;
}

/**
 * Creates the tool display registry.
 */
export function createToolDisplayRegistry(): ToolDisplayRegistry {
  const configs = new Map<string, ToolDisplayConfig>();
  const defaultColor = pc.white;

  return {
    register(config) {
      // Normalize tool name on registration for case-insensitive lookup
      configs.set(normalizeToolName(config.tool), config);
    },

    getInputKey(tool: string): string | undefined {
      return configs.get(normalizeToolName(tool))?.inputKey;
    },

    getColor(tool: string): (s: string) => string {
      return configs.get(normalizeToolName(tool))?.color ?? defaultColor;
    },

    getMaxLength(tool: string): number {
      return (
        configs.get(normalizeToolName(tool))?.maxLength ?? MAX_TOOL_INPUT_LENGTH
      );
    },

    formatInput(tool: string, input: unknown): string {
      if (!input || typeof input !== "object") {
        return "";
      }

      const config = configs.get(normalizeToolName(tool));
      if (!config) {
        return "";
      }

      const obj = input as Record<string, unknown>;
      // Try multiple key formats (snake_case and camelCase)
      const value = getInputValue(obj, config.inputKey);
      if (!value) {
        return "";
      }

      const str = String(value);
      const maxLen = config.maxLength ?? MAX_TOOL_INPUT_LENGTH;
      return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
    },
  };
}

// Singleton registry instance
export const toolDisplayRegistry = createToolDisplayRegistry();

// Register default tool configurations
toolDisplayRegistry.register({
  tool: "Read",
  inputKey: "file_path",
  color: pc.cyan,
});

toolDisplayRegistry.register({
  tool: "Edit",
  inputKey: "file_path",
  color: pc.yellow,
});

toolDisplayRegistry.register({
  tool: "Write",
  inputKey: "file_path",
  color: pc.green,
});

toolDisplayRegistry.register({
  tool: "Bash",
  inputKey: "command",
  color: pc.magenta,
});

toolDisplayRegistry.register({
  tool: "Glob",
  inputKey: "pattern",
  color: pc.blue,
});

toolDisplayRegistry.register({
  tool: "Grep",
  inputKey: "pattern",
  color: pc.blue,
});

toolDisplayRegistry.register({
  tool: "Task",
  inputKey: "description",
  color: brightWhite,
});

toolDisplayRegistry.register({
  tool: "WebFetch",
  inputKey: "url",
  color: pc.cyan,
});

toolDisplayRegistry.register({
  tool: "WebSearch",
  inputKey: "query",
  color: pc.blue,
});
