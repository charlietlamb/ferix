import { Either } from "effect";
import pc from "picocolors";
import {
  type AnyToolInput,
  validateToolInput,
} from "../../../domain/schemas/tool-inputs.js";
import { MAX_TOOL_INPUT_LENGTH } from "../constants.js";

// Define brightWhite locally to avoid circular dependency with primitives
const brightWhite = (s: string) => pc.bold(pc.white(s));

/**
 * Represents a validated tool input or a raw object for unknown tools.
 * AnyToolInput provides typed access to known tool fields,
 * while the fallback allows forward compatibility with unknown tools.
 */
type ValidatedToolInput = AnyToolInput | Record<string, unknown>;

/**
 * Normalize tool name for case-insensitive lookup.
 */
function normalizeToolName(tool: string): string {
  return tool.toLowerCase();
}

/**
 * Extract a string value from input object, trying multiple key formats.
 * Handles both snake_case (file_path) and camelCase (filePath) variants.
 * Returns the string value if found, undefined otherwise.
 */
function extractStringValue(
  obj: ValidatedToolInput,
  key: string
): string | undefined {
  const getValue = (k: string): string | undefined => {
    const val = obj[k];
    return typeof val === "string" ? val : undefined;
  };

  // Try exact key first
  const exact = getValue(key);
  if (exact !== undefined) {
    return exact;
  }

  // Try camelCase version (file_path -> filePath)
  const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const camel = getValue(camelKey);
  if (camel !== undefined) {
    return camel;
  }

  // Try snake_case version (filePath -> file_path)
  const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  return getValue(snakeKey);
}

/**
 * Safely extract validated input object from unknown input using schema validation.
 * Returns AnyToolInput for known tools, or raw object for unknown tools (forward compatibility).
 */
function getValidatedInput(
  tool: string,
  input: unknown
): ValidatedToolInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const result = validateToolInput(tool, input);
  if (Either.isRight(result)) {
    return result.right;
  }

  // Fall back to raw input for forward compatibility with unknown tools
  return input as Record<string, unknown>;
}

/**
 * Configuration for how a tool is displayed.
 */
interface ToolDisplayConfig {
  readonly tool: string;
  readonly inputKey: string;
  readonly color: (s: string) => string;
  readonly maxLength?: number;
}

/**
 * Registry for tool display configurations.
 */
interface ToolDisplayRegistry {
  register(config: ToolDisplayConfig): void;
  getInputKey(tool: string): string | undefined;
  getColor(tool: string): (s: string) => string;
  getMaxLength(tool: string): number;
  formatInput(tool: string, input: unknown): string;
}

/**
 * Creates the tool display registry.
 */
function createToolDisplayRegistry(): ToolDisplayRegistry {
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
      const config = configs.get(normalizeToolName(tool));
      if (!config) {
        return "";
      }

      // Use schema-validated input extraction
      const obj = getValidatedInput(tool, input);
      if (!obj) {
        return "";
      }

      // Try multiple key formats (snake_case and camelCase)
      const value = extractStringValue(obj, config.inputKey);
      if (!value) {
        return "";
      }
      const maxLen = config.maxLength ?? MAX_TOOL_INPUT_LENGTH;
      return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
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
  color: pc.cyan,
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
