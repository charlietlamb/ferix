/**
 * Signal text generation utilities for testing.
 *
 * These functions create the XML-like signal strings that the LLM emits,
 * which are then parsed by the signal parser.
 */

/**
 * Task definition for signal generation.
 */
export interface MockTask {
  id: string;
  description: string;
}

/**
 * Phase definition for signal generation.
 */
export interface MockPhase {
  id: string;
  description: string;
}

/**
 * Task completion data for signal generation.
 */
export interface MockTaskCompletion {
  taskId: string;
  summary: string;
  filesModified?: string[];
  filesCreated?: string[];
  commitMessage?: string;
}

/**
 * Creates a tasks definition signal.
 *
 * @param tasks - Array of task definitions
 * @returns XML signal string
 *
 * @example
 * ```typescript
 * const signal = mockTasksSignal([
 *   { id: "1", description: "Implement feature" },
 *   { id: "2", description: "Write tests" },
 * ]);
 * // Returns: <ferix:tasks>\n  <task id="1">Implement feature</task>\n...
 * ```
 */
export function mockTasksSignal(tasks: MockTask[]): string {
  const taskLines = tasks
    .map((t) => `  <task id="${t.id}">${t.description}</task>`)
    .join("\n");
  return `<ferix:tasks>\n${taskLines}\n</ferix:tasks>`;
}

/**
 * Creates a phases definition signal.
 *
 * @param taskId - The task ID these phases belong to
 * @param phases - Array of phase definitions
 * @returns XML signal string
 */
export function mockPhasesSignal(taskId: string, phases: MockPhase[]): string {
  const phaseLines = phases
    .map((p) => `  <phase id="${p.id}">${p.description}</phase>`)
    .join("\n");
  return `<ferix:phases task="${taskId}">\n${phaseLines}\n</ferix:phases>`;
}

/**
 * Creates a phase-start signal.
 *
 * @param phaseId - The phase ID to start
 * @returns XML signal string
 */
export function mockPhaseStartSignal(phaseId: string): string {
  return `<ferix:phase-start id="${phaseId}"/>`;
}

/**
 * Creates a phase-done signal.
 *
 * @param phaseId - The phase ID that completed
 * @returns XML signal string
 */
export function mockPhaseDoneSignal(phaseId: string): string {
  return `<ferix:phase-done id="${phaseId}"/>`;
}

/**
 * Creates a task-complete signal.
 *
 * @param data - The task completion data
 * @returns XML signal string
 */
export function mockTaskCompleteSignal(data: MockTaskCompletion): string {
  const parts = [
    `<ferix:task-complete id="${data.taskId}">`,
    `  <summary>${data.summary}</summary>`,
  ];

  if (data.filesModified && data.filesModified.length > 0) {
    parts.push(
      `  <files-modified>${data.filesModified.join(", ")}</files-modified>`
    );
  }

  if (data.filesCreated && data.filesCreated.length > 0) {
    parts.push(
      `  <files-created>${data.filesCreated.join(", ")}</files-created>`
    );
  }

  // Add commit message (default to chore if not provided)
  const commitMessage =
    data.commitMessage || `chore: complete task ${data.taskId}`;
  parts.push(`  <commit-message>${commitMessage}</commit-message>`);

  parts.push("</ferix:task-complete>");

  return parts.join("\n");
}

/**
 * Creates a loop-complete signal.
 *
 * @returns XML signal string
 */
export function mockLoopCompleteSignal(): string {
  return "<ferix:complete>";
}

/**
 * Combines multiple signals into a single text block.
 *
 * @param signals - Array of signal strings
 * @returns Combined signal string with newlines
 */
export function combineSignals(...signals: string[]): string {
  return signals.join("\n");
}
