import type {
  Guardrail,
  LoopConfig,
  Plan,
  ProgressEntry,
  PromptConfig,
  Task,
} from "../domain/index.js";

/**
 * Context for a RALPH iteration.
 * Contains only the information needed for the current task.
 */
export interface RalphIterationContext {
  readonly currentTask: Task | undefined;
  readonly progressSummary: string | undefined;
  readonly guardrails: readonly Guardrail[];
  readonly recentLearnings: readonly ProgressEntry[];
}

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
2. Analyze the task and break it into logical subtasks

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
 * Learning and guardrail signal instructions.
 */
const LEARNING_SIGNAL_INSTRUCTIONS = `## Recording Learnings

If you discover something important during this task, record it:

<ferix:learning category="success">
What you learned and why it matters
</ferix:learning>

<ferix:learning category="failure">
What went wrong and how to avoid it
</ferix:learning>

<ferix:learning category="optimization">
A better approach or pattern you discovered
</ferix:learning>

If you encounter a failure pattern that should be avoided in future iterations:

<ferix:guardrail severity="warning">
  <pattern>What went wrong</pattern>
  <sign>How to recognize this situation</sign>
  <avoidance>How to avoid it in the future</avoidance>
</ferix:guardrail>

Use severity="critical" for severe issues that could cause major problems.`;

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

If any fail, fix the issues and re-verify.`;

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

  // Verify phase (only if verify commands are configured)
  if (config.verifyCommands.length > 0) {
    sections.push(buildVerifyPrompt(config.verifyCommands, prompts));
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
 * Builds the guardrails section for the prompt.
 * Critical guardrails are highlighted prominently.
 */
function buildGuardrailsSection(guardrails: readonly Guardrail[]): string {
  if (guardrails.length === 0) {
    return "";
  }

  const critical = guardrails.filter((g) => g.severity === "critical");
  const warnings = guardrails.filter((g) => g.severity === "warning");

  const lines: string[] = ["## ⚠️ Guardrails - Avoid These Patterns", ""];

  if (critical.length > 0) {
    lines.push("### 🚨 CRITICAL (Must Avoid)");
    lines.push("");
    for (const g of critical) {
      lines.push(`**Pattern:** ${g.pattern}`);
      lines.push(`- Sign: ${g.sign}`);
      lines.push(`- Avoidance: ${g.avoidance}`);
      lines.push("");
    }
  }

  if (warnings.length > 0) {
    lines.push("### ⚡ Warnings");
    lines.push("");
    for (const g of warnings) {
      lines.push(`**${g.pattern}**`);
      lines.push(`- Sign: ${g.sign}`);
      lines.push(`- Avoidance: ${g.avoidance}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Builds the learnings section from recent progress entries.
 */
function buildLearningsSection(
  recentLearnings: readonly ProgressEntry[]
): string {
  const learningEntries = recentLearnings.filter(
    (e) => e.learnings && e.learnings.length > 0
  );

  if (learningEntries.length === 0) {
    return "";
  }

  const lines: string[] = ["## Recent Learnings", ""];

  for (const entry of learningEntries) {
    if (entry.learnings) {
      for (const learning of entry.learnings) {
        lines.push(`- ${learning}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Maps phase status to an icon.
 */
const PHASE_STATUS_ICONS: Record<string, string> = {
  done: "✓",
  in_progress: "~",
  failed: "✗",
  pending: "○",
};

/**
 * Maps criterion status to an icon.
 */
const CRITERION_STATUS_ICONS: Record<string, string> = {
  passed: "✓",
  failed: "✗",
  pending: "○",
};

/**
 * Builds the current task section for RALPH prompt (single task focus).
 * This replaces the full task list with just the current task.
 */
function buildCurrentTaskOnlySection(task: Task | undefined): string {
  if (!task) {
    return `## Current Task

No task currently assigned. All tasks may be complete.
If all work is done, emit <ferix:complete>`;
  }

  const lines: string[] = [
    "## Current Task",
    "",
    `**Task ${task.id}: ${task.title}**`,
    "",
    task.description,
    "",
  ];

  // Phases
  if (task.phases.length > 0) {
    lines.push("### Phases");
    for (const phase of task.phases) {
      const statusIcon = PHASE_STATUS_ICONS[phase.status] || "○";
      lines.push(`- [${statusIcon}] ${phase.id}: ${phase.description}`);
    }
    lines.push("");
  } else {
    lines.push(
      "No phases defined yet. Emit a <ferix:phases> block to define phases."
    );
    lines.push("");
  }

  // Criteria
  if (task.criteria.length > 0) {
    lines.push("### Success Criteria");
    for (const criterion of task.criteria) {
      const statusIcon = CRITERION_STATUS_ICONS[criterion.status] || "○";
      lines.push(`- [${statusIcon}] ${criterion.id}: ${criterion.description}`);
    }
    lines.push("");
  }

  // Attempts
  if (task.attempts > 0) {
    lines.push(`Attempt: ${task.attempts + 1}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Builds a RALPH prompt focused on a single task with file-based context.
 *
 * Key differences from buildPrompt:
 * 1. Only includes the current task, not all tasks
 * 2. Includes guardrails learned from previous iterations
 * 3. Includes recent learnings from progress file
 * 4. Includes learning signal instructions
 *
 * @param config - Loop configuration
 * @param iteration - Current iteration number
 * @param context - RALPH iteration context (current task, guardrails, learnings)
 * @returns The complete RALPH prompt for this iteration
 */
export function buildRalphPrompt(
  config: LoopConfig,
  iteration: number,
  context: RalphIterationContext
): string {
  const prompts = config.prompts;
  const sections: string[] = [];

  // System prompt
  sections.push(buildSystemPrompt(prompts));

  // Guardrails first (if any) - these are critical context
  const guardrailsSection = buildGuardrailsSection(context.guardrails);
  if (guardrailsSection) {
    sections.push(guardrailsSection);
  }

  // Progress summary (condensed history from files)
  if (context.progressSummary) {
    sections.push(`## Previous Progress\n\n${context.progressSummary}`);
  }

  // Recent learnings
  const learningsSection = buildLearningsSection(context.recentLearnings);
  if (learningsSection) {
    sections.push(learningsSection);
  }

  // Additional context if provided
  if (prompts?.additionalContext) {
    sections.push(`## Additional Context\n\n${prompts.additionalContext}`);
  }

  // Original task description
  sections.push(`## Original Request\n\n${config.task}`);

  // ONLY the current task (NOT all tasks) - this is the key RALPH change
  sections.push(buildCurrentTaskOnlySection(context.currentTask));

  // Planning phase
  sections.push(getPhasePrompt("planning", prompts, DEFAULT_PLANNING_PROMPT));

  // Execution phase
  sections.push(getPhasePrompt("execution", prompts, DEFAULT_EXECUTION_PROMPT));

  // Check phase
  sections.push(getPhasePrompt("check", prompts, DEFAULT_CHECK_PROMPT));

  // Verify phase (only if verify commands are configured)
  if (config.verifyCommands.length > 0) {
    sections.push(buildVerifyPrompt(config.verifyCommands, prompts));
  }

  // Review phase
  sections.push(getPhasePrompt("review", prompts, DEFAULT_REVIEW_PROMPT));

  // Completion
  sections.push(
    getPhasePrompt("completion", prompts, DEFAULT_COMPLETION_PROMPT)
  );

  // Learning signal instructions
  sections.push(LEARNING_SIGNAL_INSTRUCTIONS);

  // Iteration info
  sections.push(`---

Iteration ${iteration} of ${config.maxIterations || "unlimited"}

Focus on the current task only. Begin.`);

  return sections.join("\n\n");
}

/**
 * Selects the next task to work on from a plan.
 * Priority: in_progress > pending (by order)
 */
export function selectCurrentTask(plan: Plan | undefined): Task | undefined {
  if (!plan) {
    return undefined;
  }

  // First, find any task that's already in progress
  const inProgress = plan.tasks.find((t) => t.status === "in_progress");
  if (inProgress) {
    return inProgress;
  }

  // Then, find the first pending task
  const pending = plan.tasks.find((t) => t.status === "pending");
  return pending;
}

/**
 * Builds a progress summary from recent entries.
 */
export function buildProgressSummary(
  entries: readonly ProgressEntry[]
): string | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const completed = entries.filter((e) => e.action === "completed");
  const failed = entries.filter((e) => e.action === "failed");

  if (completed.length === 0 && failed.length === 0) {
    return undefined;
  }

  const lines: string[] = [];

  if (completed.length > 0) {
    lines.push("**Completed:**");
    for (const entry of completed.slice(-5)) {
      lines.push(`- Task ${entry.taskId}: ${entry.summary}`);
    }
  }

  if (failed.length > 0) {
    lines.push("");
    lines.push("**Previous failures:**");
    for (const entry of failed.slice(-3)) {
      lines.push(`- Task ${entry.taskId}: ${entry.summary}`);
    }
  }

  return lines.join("\n");
}
