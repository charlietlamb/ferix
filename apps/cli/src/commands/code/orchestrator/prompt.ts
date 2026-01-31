import type { LoopConfig, Plan, PromptConfig, Task } from "../domain/index.js";
import type { SessionState } from "../domain/schemas/state.js";

/**
 * Default system prompt for the ralph loop.
 */
const DEFAULT_SYSTEM_PROMPT = `You are executing a ralph loop - an iterative AI coding workflow.

Your output must include structured signals that the orchestrator will parse.
These signals MUST appear on their own lines, not inside code blocks.

## Signal Format

Use these XML-like tags to communicate structured information:

### Task Breakdown (discovery phase only)
<ferix:tasks>
  <task id="1">Brief description of first task</task>
  <task id="2">Brief description of second task</task>
</ferix:tasks>

### Phase Planning
<ferix:phases task="1">
  <phase id="1.1">First phase description</phase>
  <phase id="1.2">Second phase description</phase>
</ferix:phases>

### Success Criteria
<ferix:criteria task="1">
  <criterion id="1.c1">First criterion</criterion>
  <criterion id="1.c2">Second criterion</criterion>
</ferix:criteria>

### Phase Lifecycle
<ferix:phase-start id="1.1"/>
<ferix:phase-done id="1.1"/>
<ferix:phase-failed id="1.1">reason</ferix:phase-failed>

### Criterion Verification
<ferix:criterion-passed id="1.c1"/>
<ferix:criterion-failed id="1.c1" reason="Explanation"/>

### Stage Completion
<ferix:check-passed/>
<ferix:check-failed/>
<ferix:review-complete/>
<ferix:review-changes-made/>

### Task Completion
<ferix:task-complete id="1">
  <summary>Brief summary of what was done</summary>
  <files-modified>file1.ts, file2.ts</files-modified>
  <files-created>new-file.ts</files-created>
</ferix:task-complete>

### Loop Completion (use ONLY when ALL tasks are done)
<ferix:complete>

⚠️ IMPORTANT: Only emit <ferix:complete> after ALL tasks in the plan are complete.
After completing a single task, emit <ferix:task-complete> and continue to the next task.

IMPORTANT: Always emit signals on their own lines, never inside markdown code blocks.`;

/**
 * Discovery phase system prompt (focused on task breakdown and session naming).
 */
const DISCOVERY_SYSTEM_PROMPT = `You are in the DISCOVERY phase of a ralph loop - an iterative AI coding workflow.

Your goal is to:
1. Generate a short, descriptive name for this session
2. Analyze the task and break it into SMALL, GRANULAR subtasks

Your output must include these signals that the orchestrator will parse.
These signals MUST appear on their own lines, not inside code blocks.

## Signal Format

### Session Name (REQUIRED - emit first)
<ferix:session-name>short-descriptive-name</ferix:session-name>

Guidelines for session name:
- Use 2-5 words in kebab-case (lowercase with hyphens)
- Describe the main purpose/feature being worked on
- Keep it concise but meaningful
- Examples: "add-dark-mode", "fix-auth-flow", "refactor-api-endpoints", "update-user-profile-ui"

### Task Breakdown (REQUIRED)
<ferix:tasks>
  <task id="1">Brief description of first task</task>
  <task id="2">Brief description of second task</task>
</ferix:tasks>

## Task Granularity Rules (CRITICAL)

Apply the **"one sentence without 'and'" test**:
- If describing a task requires "and" to connect unrelated functions, split it
- Good: "Add login endpoint that validates credentials and returns JWT"
- Bad: "Handle authentication, user profiles, and billing"

Each task MUST be:
- Small enough to complete in ONE context window
- Testable in isolation with automated checks
- A single logical unit of work

For a typical feature, create 5-15 tasks.
For complex projects, create 50-200+ discrete tasks.

## CRITICAL: Task Exclusions

Do NOT create tasks for any of the following - these are handled automatically by the orchestrator:
- Running verification commands (bun lint, bun format, eslint, prettier, etc.)
- Running tests (bun test, jest, vitest, etc.)
- Running build commands (bun build, tsc, etc.)
- Any "Verification", "Testing", or "Testing Plan" sections from PRDs
- Final cleanup, validation, or quality check steps
- Commands that just run and check output without changing code

Tasks should ONLY be for implementation work that creates or modifies source code files.
Verification commands are run automatically after each task completes - do not create tasks for them.

IMPORTANT: Always emit signals on their own lines, never inside markdown code blocks.`;

/**
 * Default phase prompts.
 */
const DEFAULT_PLANNING_PROMPT = `## Phase 2: PLANNING

If no phases are defined for the current task, define them now.
Emit a <ferix:phases> block with the execution phases.`;

const DEFAULT_EXECUTION_PROMPT = `## Phase 3: EXECUTION

Execute each phase in order:
1. Emit <ferix:phase-start id="X.Y"/>
2. Do the work for that phase
3. Emit <ferix:phase-done id="X.Y"/> or <ferix:phase-failed id="X.Y">reason</ferix:phase-failed>`;

const DEFAULT_CHECK_PROMPT = `## Phase 4: CHECK

Verify all success criteria are met:
- For each criterion, emit <ferix:criterion-passed id="X.cY"/> or <ferix:criterion-failed id="X.cY" reason="..."/>
- Then emit <ferix:check-passed/> or <ferix:check-failed/>`;

const DEFAULT_REVIEW_PROMPT = `## Phase 6: REVIEW

Review the code for quality:
- Is it clean and well-organized?
- Are there any obvious improvements?
- If you make changes, emit <ferix:review-changes-made/>
- When done, emit <ferix:review-complete/>`;

const DEFAULT_COMPLETION_PROMPT = `## Completion

When you finish the CURRENT task, emit:
<ferix:task-complete id="N">
  <summary>What was accomplished</summary>
  <files-modified>list of modified files</files-modified>
  <files-created>list of new files</files-created>
</ferix:task-complete>

After emitting task-complete, CONTINUE working on the next pending task.

⚠️ ONLY emit <ferix:complete> when ALL tasks in the plan are done.
Do NOT emit <ferix:complete> after completing just one task - continue to the next task instead.`;

/**
 * Gets a phase prompt, using override if provided.
 */
function getPhasePrompt(
  phase: keyof NonNullable<PromptConfig["phases"]>,
  prompts: PromptConfig | undefined,
  defaultPrompt: string
): string {
  return prompts?.phases?.[phase] ?? defaultPrompt;
}

/**
 * Builds the system prompt, using override if provided.
 */
function buildSystemPrompt(prompts: PromptConfig | undefined): string {
  return prompts?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
}

/**
 * Builds the verify phase prompt with configured commands.
 */
function buildVerifyPrompt(
  verifyCommands: readonly string[],
  prompts: PromptConfig | undefined
): string {
  const defaultVerifyPrompt = `## Phase 5: VERIFY

Run these verification commands:
${verifyCommands.map((cmd) => `- ${cmd}`).join("\n")}

If any fail, fix the issues and re-verify.

IMPORTANT: Once ALL verification commands pass:
- Emit <ferix:task-complete id="N"> with a summary of what was done
- If this was the last task, also emit <ferix:complete>
- Do NOT run verification again after it passes`;

  return prompts?.phases?.verify ?? defaultVerifyPrompt;
}

/**
 * Status icon mapping for task list display.
 */
const TASK_STATUS_ICONS: Record<Task["status"], string> = {
  done: "[x]",
  in_progress: "[~]",
  pending: "[ ]",
  planning: "[~]",
  failed: "[!]",
  skipped: "[-]",
};

/**
 * Builds a full task list section showing all tasks and their status.
 * This gives the LLM context about overall progress.
 */
function buildTaskListSection(plan: Plan): string {
  if (plan.tasks.length === 0) {
    return "";
  }

  const completedCount = plan.tasks.filter((t) => t.status === "done").length;
  const totalCount = plan.tasks.length;

  const lines: string[] = [
    "## Task Progress",
    "",
    `Status: ${completedCount}/${totalCount} complete`,
    "",
  ];

  const currentTaskId = plan.tasks.find(
    (t) => t.status === "in_progress" || t.status === "pending"
  )?.id;

  for (const task of plan.tasks) {
    const icon = TASK_STATUS_ICONS[task.status];
    const currentMarker = task.id === currentTaskId ? " ← current" : "";
    lines.push(
      `- ${icon} Task ${task.id}: ${task.title} (${task.status})${currentMarker}`
    );
  }

  return lines.join("\n");
}

/**
 * Builds the current task context section.
 */
function buildCurrentTaskSection(plan: Plan): string | undefined {
  const currentTask = plan.tasks.find(
    (t) => t.status === "in_progress" || t.status === "pending"
  );

  if (!currentTask) {
    return undefined;
  }

  const phasesSection =
    currentTask.phases.length > 0
      ? `### Phases\n${currentTask.phases.map((p) => `- ${p.id}: ${p.description} (${p.status})`).join("\n")}`
      : "No phases defined yet. Emit a <ferix:phases> block to define phases.";

  const criteriaSection =
    currentTask.criteria.length > 0
      ? `### Success Criteria\n${currentTask.criteria.map((c) => `- ${c.id}: ${c.description} (${c.status})`).join("\n")}`
      : "";

  return `## Current Task

Task ${currentTask.id}: ${currentTask.title}

${currentTask.description}

${phasesSection}

${criteriaSection}`;
}

/**
 * Builds the discovery phase prompt for initial task breakdown.
 *
 * @param config - Loop configuration
 * @returns The complete prompt for the discovery phase
 */
export function buildDiscoveryPrompt(config: LoopConfig): string {
  const sections: string[] = [];

  // Discovery-specific system prompt
  sections.push(DISCOVERY_SYSTEM_PROMPT);

  // Additional context if provided
  if (config.prompts?.additionalContext) {
    sections.push(
      `## Additional Context\n\n${config.prompts.additionalContext}`
    );
  }

  // Task description
  sections.push(`## Task\n\n${config.task}`);

  // Discovery instructions
  sections.push(`## Instructions

Analyze the task above and:

1. **Generate a session name** (2-5 words, kebab-case)
   - Should describe the main purpose of this work
   - Emit: <ferix:session-name>your-descriptive-name</ferix:session-name>

2. **Break the task into logical subtasks** (2-6 tasks)
   - Read and understand what needs to be done
   - Identify the main components or steps
   - Emit: <ferix:tasks>...</ferix:tasks>

Each task should be:
- Self-contained and independently verifiable
- Clear and specific
- Ordered logically (dependencies first)
- ONLY for code implementation (NOT for running lint/test/build commands)

REMINDER: Do NOT create tasks for verification steps like "Run lint", "Run tests", "Verify changes", etc.
The orchestrator handles verification automatically after each task completes.
If the PRD has a "Verification" or "Testing" section, IGNORE it when creating tasks.

Begin your analysis now.`);

  return sections.join("\n\n");
}

/**
 * Builds the iteration prompt with context and instructions.
 *
 * @param config - Loop configuration
 * @param iteration - Current iteration number
 * @param plan - Current plan state (if available)
 * @returns The complete prompt for this iteration
 */
export function buildPrompt(
  config: LoopConfig,
  iteration: number,
  plan?: Plan
): string {
  const prompts = config.prompts;
  const sections: string[] = [];

  // System prompt
  sections.push(buildSystemPrompt(prompts));

  // Additional context if provided
  if (prompts?.additionalContext) {
    sections.push(`## Additional Context\n\n${prompts.additionalContext}`);
  }

  // Task description
  sections.push(`## Task\n\n${config.task}`);

  // Full task list (shows overall progress)
  if (plan && plan.tasks.length > 0) {
    const taskListSection = buildTaskListSection(plan);
    if (taskListSection) {
      sections.push(taskListSection);
    }

    // Current task details
    const taskSection = buildCurrentTaskSection(plan);
    if (taskSection) {
      sections.push(taskSection);
    }
  }

  // Planning phase
  sections.push(getPhasePrompt("planning", prompts, DEFAULT_PLANNING_PROMPT));

  // Execution phase
  sections.push(getPhasePrompt("execution", prompts, DEFAULT_EXECUTION_PROMPT));

  // Check phase
  sections.push(getPhasePrompt("check", prompts, DEFAULT_CHECK_PROMPT));

  // Verify phase (only if verify commands are configured AND there's an active task AND not all complete)
  if (config.verifyCommands.length > 0 && plan && !areAllTasksComplete(plan)) {
    const currentTask = plan.tasks.find(
      (t) => t.status === "in_progress" || t.status === "pending"
    );
    if (currentTask) {
      sections.push(buildVerifyPrompt(config.verifyCommands, prompts));
    }
  }

  // Review phase
  sections.push(getPhasePrompt("review", prompts, DEFAULT_REVIEW_PROMPT));

  // Completion
  sections.push(
    getPhasePrompt("completion", prompts, DEFAULT_COMPLETION_PROMPT)
  );

  // Iteration info
  sections.push(`---

Iteration ${iteration} of ${config.maxIterations || "unlimited"}

Begin.`);

  return sections.join("\n\n");
}

/**
 * Checks if all tasks in the plan are complete (done or skipped).
 * Returns false if there's no plan or no tasks.
 */
export function areAllTasksComplete(plan: Plan | undefined): boolean {
  if (!plan || plan.tasks.length === 0) {
    return false;
  }
  return plan.tasks.every((t) => t.status === "done" || t.status === "skipped");
}

/**
 * Builds session state from plan and config for STATE.json.
 *
 * @param config - Loop configuration
 * @param iteration - Current iteration number
 * @param plan - Current plan state (if available)
 * @param recentProgress - Array of recent progress summaries
 * @returns SessionState object for STATE.json
 */
export function buildSessionState(
  config: LoopConfig,
  iteration: number,
  sessionId: string,
  plan?: Plan,
  recentProgress: string[] = []
): SessionState {
  // Find the current task
  const currentTask = plan?.tasks.find(
    (t) => t.status === "in_progress" || t.status === "pending"
  );

  // Calculate task summary
  const taskSummary = plan
    ? {
        total: plan.tasks.length,
        done: plan.tasks.filter((t) => t.status === "done").length,
        inProgress: plan.tasks.filter((t) => t.status === "in_progress").length,
        pending: plan.tasks.filter(
          (t) => t.status === "pending" || t.status === "planning"
        ).length,
      }
    : { total: 0, done: 0, inProgress: 0, pending: 0 };

  return {
    sessionId,
    originalTask: config.task,
    iteration,
    maxIterations: config.maxIterations,
    taskSummary,
    currentTask: currentTask
      ? {
          id: currentTask.id,
          title: currentTask.title,
          description: currentTask.description,
          phases: currentTask.phases.map((p) => ({
            id: p.id,
            description: p.description,
            status: p.status,
          })),
          criteria: currentTask.criteria.map((c) => ({
            id: c.id,
            description: c.description,
            status: c.status,
          })),
        }
      : null,
    recentProgress,
  };
}
