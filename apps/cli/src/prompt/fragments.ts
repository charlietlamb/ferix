import type { PromptFragment } from "../types.js";

/**
 * Create the task fragment
 */
export function createTaskFragment(task: string): PromptFragment {
  return {
    id: "task",
    order: 0,
    content: `## Task

${task}`,
  };
}

/**
 * Create verification fragment
 */
export function createVerifyFragment(
  commands: string[]
): PromptFragment | null {
  if (commands.length === 0) {
    return null;
  }

  const commandList = commands
    .map((cmd, i) => `${i + 1}. \`${cmd}\``)
    .join("\n");

  return {
    id: "verify",
    order: 10,
    content: `## Verification

Before committing, run these commands in order:
${commandList}

Rules:
- ALL commands must pass before committing
- If any command fails, fix the issue and re-run ALL checks
- Do NOT commit until every check passes
- Do NOT skip or ignore failures`,
  };
}

/**
 * Create git fragment
 */
export function createGitFragment(branch?: string): PromptFragment | null {
  if (!branch) {
    return null;
  }

  return {
    id: "git",
    order: 20,
    content: `## Git

You are working on branch: \`${branch}\`
Commit your changes with a clear, descriptive message that summarizes the work done.`,
  };
}

/**
 * Create progress tracking fragment
 */
export function createProgressFragment(path: string): PromptFragment {
  return {
    id: "progress",
    order: 30,
    content: `## Progress Tracking

After completing work, append a summary to \`${path}\`:
- What was accomplished
- Key files changed
- Any notes or follow-up items

Keep entries concise but informative.`,
  };
}

/**
 * Create loop execution fragment (for multi-iteration)
 */
export function createLoopFragment(
  iterations: number | "unlimited"
): PromptFragment {
  const iterationText =
    iterations === "unlimited"
      ? "until all tasks are complete"
      : `${iterations} iterations`;

  return {
    id: "loop",
    order: 40,
    content: `## Loop Execution

You are running in a loop (${iterationText}).

Each iteration:
1. Check progress file for previously completed work
2. Identify the next task to complete
3. Implement it fully
4. Run all verification checks
5. Commit your changes
6. Update the progress file

When ALL tasks are complete, output exactly (on its own line):
<ferix:complete>

This signals the loop to stop.`,
  };
}

/**
 * Create task breakdown fragment - instructs LLM to analyze and output structured tasks
 */
export function createTaskBreakdownFragment(): PromptFragment {
  return {
    id: "task-breakdown",
    order: 2,
    content: `## Task Breakdown

Before starting any work, analyze the task and break it into discrete subtasks.

**Output your task list in this exact format:**
<ferix:tasks>
  <task id="1">Brief description of first subtask</task>
  <task id="2">Brief description of second subtask</task>
</ferix:tasks>

**Rules:**
- Output the tasks block FIRST, before any other work
- Each task should be a single, completable unit of work
- Use sequential numeric IDs starting at 1
- For simple requests, use a single task
- For complex requests (PRDs, multiple features), break into logical chunks
- Keep descriptions concise (under 60 characters)

**After completing each task, immediately output:**
<ferix:task-done id="N"/>

Where N is the task ID. This tracks progress through the work.`,
  };
}

/**
 * Create task validation fragment - instructs LLM to reject bad/unclear tasks
 */
export function createValidationFragment(): PromptFragment {
  return {
    id: "validation",
    order: 1,
    content: `## Task Validation

Before starting any work, evaluate if the task is actionable:

**Reject the task immediately if:**
- The task is too vague or ambiguous to act on (e.g., "make it better", "fix stuff")
- Critical information is missing (e.g., which file, which feature, which ticket)
- The task references resources you cannot access and no alternative is provided
- The task is contradictory or impossible to complete
- You don't understand what is being asked

**If the task is not actionable, output:**
<ferix:error>Task rejected: [specific reason why the task cannot be completed]</ferix:error>

Then exit immediately without making any changes.

**Only proceed if** you have a clear understanding of:
1. What needs to be done
2. Where to do it (files, components, etc.)
3. How to verify it's complete`,
  };
}

/**
 * Create error handling fragment
 */
export function createErrorFragment(): PromptFragment {
  return {
    id: "error",
    order: 50,
    content: `## Error Handling

If at any point during execution you encounter issues:

**Resource access errors:**
If you cannot access required resources (Linear, GitHub, APIs, external services, etc.):
<ferix:error>Cannot access [resource]: [specific reason]</ferix:error>

**Context/codebase issues:**
If the codebase doesn't match expectations or you lack sufficient context:
<ferix:error>Insufficient context: [what's missing and why it's needed]</ferix:error>

**Implementation blockers:**
If you discover the task cannot be completed as specified:
<ferix:error>Cannot complete task: [specific blocker and why]</ferix:error>

**In all error cases:**
1. Output the error message on its own line
2. Do NOT make any file changes
3. Exit immediately

This allows the loop to handle the error appropriately.`,
  };
}
