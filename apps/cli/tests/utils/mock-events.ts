import type { LLMEvent } from "../../src/commands/code/domain/schemas/llm.js";

/**
 * Creates a Text LLM event.
 *
 * @param text - The text content
 * @returns An LLM Text event
 */
export function mockTextEvent(text: string): LLMEvent {
  return { _tag: "Text", text };
}

/**
 * Creates a Done LLM event.
 *
 * @param output - The final output (defaults to empty string)
 * @returns An LLM Done event
 */
export function mockDoneEvent(output = ""): LLMEvent {
  return { _tag: "Done", output };
}

/**
 * Creates a ToolStart LLM event.
 *
 * @param tool - The tool name (e.g., "Read", "Write", "Edit", "Bash")
 * @returns An LLM ToolStart event
 */
export function mockToolStartEvent(tool: string): LLMEvent {
  return { _tag: "ToolStart", tool };
}

/**
 * Creates a ToolUse LLM event.
 *
 * @param tool - The tool name
 * @param input - Optional input object for the tool
 * @returns An LLM ToolUse event
 */
export function mockToolUseEvent(tool: string, input?: unknown): LLMEvent {
  return { _tag: "ToolUse", tool, input };
}

/**
 * Creates a ToolEnd LLM event.
 *
 * @param tool - The tool name
 * @returns An LLM ToolEnd event
 */
export function mockToolEndEvent(tool: string): LLMEvent {
  return { _tag: "ToolEnd", tool };
}
