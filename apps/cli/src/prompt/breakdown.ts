/**
 * @fileoverview Breakdown prompt for initial task analysis and planning.
 *
 * This is the first phase in the planner/worker architecture where a fresh
 * LLM context:
 * 1. Explores the codebase to understand structure and patterns
 * 2. Creates a context summary for future LLM calls
 * 3. Breaks the user's task into discrete, sequential subtasks
 * 4. Creates the `.ferix/PLAN.md` file to persist this analysis
 *
 * The breakdown phase is designed to front-load codebase exploration so that
 * subsequent planner and worker phases have sufficient context without needing
 * to re-explore.
 *
 * @see planner.ts for the per-task planning phase
 * @see worker.ts for the per-task execution phase
 */

import { getPlanPath } from "../plan/index.js";

/**
 * Creates the breakdown prompt for initial task analysis.
 *
 * The prompt instructs the LLM to:
 * - Explore the codebase thoroughly
 * - Create a context summary capturing tech stack and patterns
 * - Break the task into numbered subtasks
 * - Output subtasks via `<ferix:tasks>` signal for TUI tracking
 * - Create the plan file at `.ferix/PLAN.md`
 *
 * @param task - The user's original task description
 * @returns Complete prompt string for the breakdown phase
 */
export function createBreakdownPrompt(task: string): string {
  const planPath = getPlanPath();

  return `## Your Role: Task Breakdown

You are analyzing a task and breaking it into discrete subtasks. Your job is to:
1. Explore the codebase to understand its structure
2. Create a comprehensive plan for completing the task
3. Output the plan in a specific format

## Task

${task}

## Instructions

### Step 1: Explore the Codebase

Before planning, explore the codebase to understand:
- Project structure and key directories
- Tech stack and frameworks used
- Coding patterns and conventions
- Relevant existing code for this task

Take your time to read files and understand the architecture.

### Step 2: Create Context Summary

Write a 2-3 paragraph summary capturing:
- Tech stack and architecture overview
- Key files and their purposes
- Patterns to follow when implementing

### Step 3: Break into Subtasks

Analyze the task and break it into discrete, sequential subtasks.

**Output your task list in this exact format:**
<ferix:tasks>
  <task id="1">Brief description of first subtask</task>
  <task id="2">Brief description of second subtask</task>
</ferix:tasks>

**Rules:**
- Output the tasks block FIRST, before creating the plan file
- Each task should be a single, completable unit of work
- Use sequential numeric IDs starting at 1
- Order tasks by dependencies (prerequisites first)
- For simple requests, use 1-3 tasks
- For complex requests (PRDs, multiple features), use more tasks
- Keep descriptions concise (under 60 characters)

### Step 4: Create the Plan File

After outputting the tasks signal, create the plan file at \`${planPath}\`.

The plan file format:

\`\`\`markdown
# Ferix Plan

> Created: [ISO timestamp]
> Task: [original task]

## Context

[Your 2-3 paragraph context summary from Step 2]

---

## Task 1: [title]
**Status**: pending

[Detailed description of what this task involves]

---

## Task 2: [title]
**Status**: pending

[Detailed description]

---

[Continue for all tasks...]
\`\`\`

**Important:**
- The Status should be "pending" for all tasks
- Include enough detail in each task description that a fresh LLM context can understand what to do
- Do NOT include phases yet - those will be added by the planner phase

## What NOT to Do

- Do NOT implement anything
- Do NOT write any code
- Do NOT modify any existing files (except creating the plan file)
- Do NOT skip the codebase exploration step

Your only job is to understand the task and create a comprehensive plan.`;
}
