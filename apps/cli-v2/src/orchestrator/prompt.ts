import type { LoopConfig, Plan, PromptConfig } from "../domain/index.js";

/**
 * Default system prompt for the ralph loop.
 */
const DEFAULT_SYSTEM_PROMPT = `You are executing a ralph loop - an iterative AI coding workflow.

Your output must include structured signals that the orchestrator will parse.
These signals MUST appear on their own lines, not inside code blocks.

## Signal Format

Use these XML-like tags to communicate structured information:

### Task Breakdown (first iteration only)
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

### Loop Completion
<ferix:complete>

IMPORTANT: Always emit signals on their own lines, never inside markdown code blocks.`;

/**
 * Default phase prompts.
 */
const DEFAULT_BREAKDOWN_PROMPT = `## Phase 1: BREAKDOWN

This is the first iteration. Analyze the task and break it into subtasks.

1. Read and understand the codebase structure
2. Identify the files that need to be modified
3. Break the work into logical tasks

Emit a <ferix:tasks> block with your task breakdown.
For each task, also emit a <ferix:criteria> block with success criteria.`;

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

When the task is complete, emit:
<ferix:task-complete id="N">
  <summary>What was accomplished</summary>
  <files-modified>list of modified files</files-modified>
  <files-created>list of new files</files-created>
</ferix:task-complete>

When ALL tasks are complete, emit <ferix:complete>`;

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

  // Breakdown phase (first iteration only)
  if (iteration === 1) {
    sections.push(
      getPhasePrompt("breakdown", prompts, DEFAULT_BREAKDOWN_PROMPT)
    );
  }

  // Current task context
  if (plan && plan.tasks.length > 0) {
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
