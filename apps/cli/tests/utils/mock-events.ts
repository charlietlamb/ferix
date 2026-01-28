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

/**
 * Creates a sequence of tool events (start, use, end).
 *
 * @param tool - The tool name
 * @param input - Optional input for the tool
 * @returns Array of LLM events representing a complete tool call
 */
export function mockToolSequence(tool: string, input?: unknown): LLMEvent[] {
  return [
    mockToolStartEvent(tool),
    mockToolUseEvent(tool, input),
    mockToolEndEvent(tool),
  ];
}

/**
 * Creates a simple conversation sequence with text and done events.
 *
 * @param texts - Array of text strings to emit
 * @returns Array of LLM events
 */
export function mockConversation(...texts: string[]): LLMEvent[] {
  const events: LLMEvent[] = texts.map((text) => mockTextEvent(text));
  const fullOutput = texts.join("");
  events.push(mockDoneEvent(fullOutput));
  return events;
}

/**
 * Creates a sequence that simulates reading a file.
 *
 * @param path - The file path
 * @param content - The file content (optional)
 * @returns Array of LLM events
 */
export function mockReadFileSequence(
  path: string,
  content?: string
): LLMEvent[] {
  return [
    mockTextEvent(`Reading file: ${path}\n`),
    ...mockToolSequence("Read", { file_path: path }),
    ...(content ? [mockTextEvent(content)] : []),
  ];
}

/**
 * Creates a sequence that simulates writing a file.
 *
 * @param path - The file path
 * @param content - The file content
 * @returns Array of LLM events
 */
export function mockWriteFileSequence(
  path: string,
  content: string
): LLMEvent[] {
  return [
    mockTextEvent(`Writing file: ${path}\n`),
    ...mockToolSequence("Write", { file_path: path, content }),
  ];
}

/**
 * Creates a sequence that simulates running a bash command.
 *
 * @param command - The command to run
 * @returns Array of LLM events
 */
export function mockBashSequence(command: string): LLMEvent[] {
  return [
    mockTextEvent(`Running: ${command}\n`),
    ...mockToolSequence("Bash", { command }),
  ];
}
