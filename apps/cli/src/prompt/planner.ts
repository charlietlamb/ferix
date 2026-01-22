/**
 * @fileoverview Planner prompt for per-task phase planning.
 *
 * This phase runs before each task execution where a fresh LLM context:
 * 1. Reads the existing plan file to understand context
 * 2. Plans detailed phases for the specific task
 * 3. Identifies which files will need modification
 * 4. Updates the plan file with phases and file list
 *
 * The planner phase bridges the gap between high-level task breakdown and
 * granular execution, ensuring the worker has clear, trackable steps.
 *
 * @see breakdown.ts for the initial task breakdown phase
 * @see worker.ts for the per-task execution phase
 */

import { getPlanPath } from "../plan/index.js";
import { writePlanFile } from "../plan/writer.js";
import type { Plan, PlanTask } from "../types/plan.js";

/**
 * Creates the planner prompt for a specific task.
 *
 * The prompt instructs the LLM to:
 * - Analyze the task within the plan context
 * - Break the task into small, trackable phases
 * - Identify files to modify or create
 * - Output phases via `<ferix:phases>` signal for TUI tracking
 * - Update the plan file with phases and files
 *
 * @param plan - The current plan (included in prompt for context)
 * @param task - The specific task to plan
 * @returns Complete prompt string for the planner phase
 */
export function createPlannerPrompt(plan: Plan, task: PlanTask): string {
  const planPath = getPlanPath();
  const planContent = writePlanFile(plan);

  return `## Your Role: Task Planner

You are planning the implementation of a specific task. Your job is to:
1. Understand the task in context of the overall plan
2. Break it into small, trackable phases
3. Identify which files need to be modified
4. Update the plan file with this information

## The Current Plan

\`\`\`markdown
${planContent}
\`\`\`

## Your Current Task

Plan **Task ${task.id}: ${task.title}**

Description: ${task.description}

## Instructions

### Step 1: Verify and Extend Context

**REQUIRED: Verify the component inventory is complete for this task.**

1. Read the Context section from the plan
2. Check if any files are MISSING from the inventory that this task will touch
3. If gaps exist, explore and add them NOW

**Output any additions:**
\`\`\`
## Context Additions

### [Directory]
- [file] - [purpose] (missed in breakdown)
\`\`\`

Then analyze:
- What this task needs to accomplish
- How it fits with completed and pending tasks
- Which files from the inventory need modification

### Step 2: Define Phases

Break this task into small, trackable phases. Each phase should be:
- A single, atomic unit of work
- Completable in a few minutes
- Verifiable (you can tell when it's done)

**Output the phases in this exact format:**
<ferix:phases task="${task.id}">
  <phase id="${task.id}.1">Brief description of first phase</phase>
  <phase id="${task.id}.2">Brief description of second phase</phase>
</ferix:phases>

**Rules:**
- Every task MUST have at least one phase
- Phase IDs use format: taskId.phaseNumber (e.g., "${task.id}.1", "${task.id}.2")
- Keep phase descriptions concise (under 60 characters)
- Order phases logically (dependencies first)

### Step 3: Identify Files

List the files that will need to be modified or created for this task.

### Step 4: Update the Plan File

After outputting the phases signal, update \`${planPath}\` with:

1. Change Task ${task.id} status from "pending" to "in_progress"
2. Add a "### Phases" section with the phases:
   \`\`\`
   ### Phases
   - [ ] ${task.id}.1: First phase description
   - [ ] ${task.id}.2: Second phase description
   \`\`\`
3. Add a "### Files" section listing files to modify:
   \`\`\`
   ### Files
   - path/to/file1.ts
   - path/to/file2.ts (new)
   \`\`\`

## What NOT to Do

- Do NOT implement anything
- Do NOT write any code
- Do NOT modify any source files
- Only update the plan file

Your only job is to plan this specific task in detail.`;
}
