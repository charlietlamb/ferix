/**
 * @fileoverview Worker prompt for per-task execution.
 *
 * This phase runs for each task where a fresh LLM context:
 * 1. Reads the plan with pre-defined phases from the planner
 * 2. Executes each phase in order, signaling progress
 * 3. Runs configured verification commands (lint, type-check, etc.)
 * 4. Updates the plan file with completion notes
 *
 * The worker is the "hands-on" phase that actually implements changes. It
 * signals phase progress for real-time TUI updates and keeps the plan file
 * synchronized as work progresses.
 *
 * @see breakdown.ts for the initial task breakdown phase
 * @see planner.ts for the per-task planning phase
 */

import { getPlanPath } from "../plan/index.js";
import { writePlanFile } from "../plan/writer.js";
import type { Plan, PlanTask } from "../types/plan.js";

/**
 * Creates the worker prompt for executing a specific task.
 *
 * The prompt instructs the LLM to:
 * - Execute each planned phase in order
 * - Signal phase start/completion via `<ferix:phase-*>` signals
 * - Run verification commands and fix any failures
 * - Update the plan file with progress and completion notes
 * - Handle errors gracefully with proper signaling
 *
 * @param plan - The current plan (included in prompt for context)
 * @param task - The specific task to execute (should have phases defined)
 * @param verifyCommands - Commands to run after phases complete (e.g., lint, build)
 * @param branch - Optional git branch name for commit instructions
 * @returns Complete prompt string for the worker phase
 */
export function createWorkerPrompt(
  plan: Plan,
  task: PlanTask,
  verifyCommands: string[],
  branch?: string
): string {
  const planPath = getPlanPath();
  const planContent = writePlanFile(plan);

  // Build verification section
  let verifySection = "";
  if (verifyCommands.length > 0) {
    const commandList = verifyCommands
      .map((cmd, i) => `${i + 1}. \`${cmd}\``)
      .join("\n");
    verifySection = `

## Verification Commands

After completing all phases, run these commands in order:
${commandList}

**Rules:**
- ALL commands must pass before marking the task complete
- If any command fails, fix the issue and re-run ALL checks
- Do NOT mark the task done until every check passes`;
  }

  // Build git section
  let gitSection = "";
  if (branch) {
    gitSection = `

## Git

You are working on branch: \`${branch}\`
After completing and verifying the task, commit your changes with a clear message.
Use \`git log\` to see previous commit messages and match the style.`;
  }

  // Build phases list for display
  const phasesDisplay =
    task.phases && task.phases.length > 0
      ? task.phases
          .map(
            (p) => `- ${p.completed ? "[x]" : "[ ]"} ${p.id}: ${p.description}`
          )
          .join("\n")
      : "No phases defined (this is unexpected - please define phases first)";

  return `## Your Role: Task Worker

You are executing a specific task from the plan. Your job is to:
1. Implement each phase in order
2. Signal progress as you work
3. Run verification commands
4. Update the plan with completion notes

## The Current Plan

\`\`\`markdown
${planContent}
\`\`\`

## Your Current Task

Execute **Task ${task.id}: ${task.title}**

Description: ${task.description}

### Phases to Complete

${phasesDisplay}
${verifySection}${gitSection}

## Instructions

### Step 1: Execute Each Phase

For each phase, in order:

1. **Signal start:**
   \`\`\`
   <ferix:phase-start id="${task.id}.N"/>
   \`\`\`

2. **Do the work** - implement the changes for this phase

3. **Signal completion:**
   \`\`\`
   <ferix:phase-done id="${task.id}.N"/>
   \`\`\`

4. **Update the plan file** - mark the phase as complete:
   Change \`- [ ] ${task.id}.N: ...\` to \`- [x] ${task.id}.N: ...\`

### Step 2: Run Verification

After ALL phases are complete:
${verifyCommands.length > 0 ? "1. Run each verification command\n2. If any fail, fix the issues and re-run\n3. Only proceed when all pass" : "No verification commands configured - proceed to completion"}

### Step 3: Complete the Task

When all phases pass and verification succeeds:

1. **Update the plan file** (\`${planPath}\`):
   - Change Task ${task.id} status from "in_progress" to "done"
   - Add a "### Completed" section with brief notes:
     \`\`\`
     ### Completed
     Brief summary of what was implemented and any notable decisions.
     \`\`\`

2. **Signal task completion:**
   \`\`\`
   <ferix:task-done id="${task.id}"/>
   \`\`\`

## Error Handling

If you encounter a blocker you cannot resolve:

1. **Signal the error:**
   \`\`\`
   <ferix:error>Cannot complete task: [specific reason]</ferix:error>
   \`\`\`

2. **Update the plan file:**
   - Change Task ${task.id} status to "failed"
   - Add a "### Error" section explaining what went wrong

3. **Stop immediately** - do not continue with other work

## Important Notes

- Focus ONLY on Task ${task.id} - do not work on other tasks
- Signal each phase start/done for progress tracking
- Keep the plan file in sync with your progress
- Be thorough but focused - complete this task fully before stopping`;
}
