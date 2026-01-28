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
 * Criterion definition for signal generation.
 */
export interface MockCriterion {
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
 * Creates a criteria definition signal.
 *
 * @param taskId - The task ID these criteria belong to
 * @param criteria - Array of criterion definitions
 * @returns XML signal string
 */
export function mockCriteriaSignal(
  taskId: string,
  criteria: MockCriterion[]
): string {
  const criterionLines = criteria
    .map((c) => `  <criterion id="${c.id}">${c.description}</criterion>`)
    .join("\n");
  return `<ferix:criteria task="${taskId}">\n${criterionLines}\n</ferix:criteria>`;
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
 * Creates a phase-failed signal.
 *
 * @param phaseId - The phase ID that failed
 * @param reason - The failure reason
 * @returns XML signal string
 */
export function mockPhaseFailedSignal(phaseId: string, reason: string): string {
  return `<ferix:phase-failed id="${phaseId}">${reason}</ferix:phase-failed>`;
}

/**
 * Creates a criterion-passed signal.
 *
 * @param criterionId - The criterion ID that passed
 * @returns XML signal string
 */
export function mockCriterionPassedSignal(criterionId: string): string {
  return `<ferix:criterion-passed id="${criterionId}"/>`;
}

/**
 * Creates a criterion-failed signal.
 *
 * @param criterionId - The criterion ID that failed
 * @param reason - The failure reason
 * @returns XML signal string
 */
export function mockCriterionFailedSignal(
  criterionId: string,
  reason: string
): string {
  return `<ferix:criterion-failed id="${criterionId}" reason="${reason}"/>`;
}

/**
 * Creates a check-passed signal.
 *
 * @returns XML signal string
 */
export function mockCheckPassedSignal(): string {
  return "<ferix:check-passed/>";
}

/**
 * Creates a check-failed signal.
 *
 * @returns XML signal string
 */
export function mockCheckFailedSignal(): string {
  return "<ferix:check-failed/>";
}

/**
 * Creates a review-complete signal.
 *
 * @returns XML signal string
 */
export function mockReviewCompleteSignal(): string {
  return "<ferix:review-complete/>";
}

/**
 * Creates a review-changes-made signal.
 *
 * @returns XML signal string
 */
export function mockReviewChangesMadeSignal(): string {
  return "<ferix:review-changes-made/>";
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
 * Creates a session-name signal.
 *
 * @param name - The session name (kebab-case slug)
 * @returns XML signal string
 */
export function mockSessionNameSignal(name: string): string {
  return `<ferix:session-name>${name}</ferix:session-name>`;
}

/**
 * Creates a learning signal.
 *
 * @param content - The learning content
 * @param category - Optional category (success, failure, optimization)
 * @returns XML signal string
 */
export function mockLearningSignal(
  content: string,
  category?: "success" | "failure" | "optimization"
): string {
  if (category) {
    return `<ferix:learning category="${category}">${content}</ferix:learning>`;
  }
  return `<ferix:learning>${content}</ferix:learning>`;
}

/**
 * Creates a guardrail signal.
 *
 * @param pattern - The pattern that was detected
 * @param sign - Signs that indicate the pattern
 * @param avoidance - How to avoid the pattern
 * @param severity - The severity level
 * @returns XML signal string
 */
export function mockGuardrailSignal(
  pattern: string,
  sign: string,
  avoidance: string,
  severity: "warning" | "critical"
): string {
  return `<ferix:guardrail severity="${severity}">
  <pattern>${pattern}</pattern>
  <sign>${sign}</sign>
  <avoidance>${avoidance}</avoidance>
</ferix:guardrail>`;
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

/**
 * Creates a complete task flow with tasks, phases, and lifecycle signals.
 *
 * @param taskId - The task ID
 * @param taskDescription - The task description
 * @param phases - Array of phases
 * @returns Combined signal string for a complete task
 */
export function mockCompleteTaskFlow(
  taskId: string,
  taskDescription: string,
  phases: MockPhase[]
): string {
  const signals: string[] = [];

  // Define task
  signals.push(mockTasksSignal([{ id: taskId, description: taskDescription }]));

  // Define phases
  signals.push(mockPhasesSignal(taskId, phases));

  // Execute each phase
  for (const phase of phases) {
    signals.push(mockPhaseStartSignal(phase.id));
    signals.push(mockPhaseDoneSignal(phase.id));
  }

  // Complete task
  signals.push(
    mockTaskCompleteSignal({
      taskId,
      summary: `Completed: ${taskDescription}`,
    })
  );

  return combineSignals(...signals);
}
