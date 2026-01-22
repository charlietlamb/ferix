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

### Step 1: Create Component Inventory

Before planning, create a COMPLETE inventory of components relevant to this task.

**Process:**
1. Identify the domain of the task (e.g., "UI", "API", "auth")
2. Find ALL directories that touch this domain
3. List EVERY file in those directories
4. For each file, note its purpose in 1 line

**Output format:**
\`\`\`
## Component Inventory

### [Directory 1]
- file1.ts - [purpose]
- file2.ts - [purpose]

### [Directory 2]
- file3.ts - [purpose]
\`\`\`

**Completeness check:**
- Did you check for related directories? (e.g., utils/, helpers/, shared/)
- Did you check for test files?
- Did you check for type definitions?

Do NOT proceed to planning until the inventory is complete.

### Step 2: Create Structured Context

Document the following in a structured format (NOT prose):

**Tech Stack:**
- Language: [e.g., TypeScript 5.x]
- Runtime: [e.g., Bun 1.x]
- Framework: [e.g., None / React / etc.]

**Directory Structure:**
\`\`\`
src/
├── [dir]/ - [purpose]
├── [dir]/ - [purpose]
\`\`\`

**Patterns:**
- Naming: [e.g., camelCase files, PascalCase types]
- Exports: [e.g., named exports, barrel files]
- Error handling: [e.g., custom error classes, Result types]

**Files from Inventory Relevant to This Task:**
- [file] - will need [modification type]
- [file] - will need [modification type]

This context will be passed to future phases - be thorough.

### Step 3: Break into High-Level Tasks

Analyze the task and break it into high-level, feature-sized tasks.

**IMPORTANT: Task Granularity**

Tasks should be **features or significant units of work**, NOT implementation steps.

**WRONG (too granular):**
- Create config module structure
- Implement config file loading
- Implement config validation
- Add config types to types directory
- Integrate config loading into CLI startup

**CORRECT (feature-level):**
- Implement config file support (ferix.json)

The implementation details (module structure, loading, validation, types, integration) are **phases within a task**, not separate tasks. The planner phase will break each task into phases later.

**Output your task list in this exact format:**
<ferix:tasks>
  <task id="1">Brief description of first feature/task</task>
  <task id="2">Brief description of second feature/task</task>
</ferix:tasks>

**Rules:**
- Output the tasks block FIRST, before creating the plan file
- Each task should be a **feature, major component, or significant deliverable**
- Tasks are NOT implementation steps - those become phases later
- Use sequential numeric IDs starting at 1
- Order tasks by dependencies (prerequisites first)
- A PRD with 2 features = 2 tasks
- Keep descriptions concise (under 60 characters)

**Examples of good task sizing:**
- "Add dark mode toggle" (1 task) - NOT 5 tasks for component, state, styles, etc.
- "Implement user authentication" (1 task) - NOT 8 tasks for middleware, login, logout, tests, etc.
- PRD with Config + Summary features 2 tasks - NOT 14 implementation steps

### Step 3.5: Extract and Output Success Criteria

For EACH task, extract **testable success criteria** from the requirements.

**IMPORTANT: If the task references a PRD or requirements file:**
1. READ the PRD/requirements file FIRST
2. Verify the file exists before extracting criteria
3. Extract criteria directly from the documented acceptance criteria or requirements

**Rules for good criteria:**
- Must be objectively verifiable (yes/no answer, not subjective)
- Cover functional requirements ("loads config from CWD")
- Cover error handling and edge cases ("shows error on invalid JSON")
- Cover integration points ("config is merged with CLI args")
- No minimum or maximum - use as many as needed to fully cover the task

**REQUIRED: Add a completeness criterion for EVERY task:**
- Include at least one criterion that verifies NOTHING was missed
- Examples:
  - "All files in [directory] follow the new pattern"
  - "No hardcoded values remain in [scope]"
  - "All [components] are covered by the change"

This prevents passing review with incomplete work.

**Criteria will be verified by a reviewer after implementation.**
If ANY criterion fails after 5 attempts, the task will be marked as failed and execution will stop.

**After outputting the tasks, emit success criteria for EACH task in this format:**
<ferix:criteria task="1">
  <criterion id="1.c1">First criterion description</criterion>
  <criterion id="1.c2">Second criterion description</criterion>
</ferix:criteria>
<ferix:criteria task="2">
  <criterion id="2.c1">Criterion for task 2</criterion>
  <criterion id="2.c2">Another criterion</criterion>
</ferix:criteria>

**Rules for criteria signals:**
- Emit criteria AFTER the tasks block, BEFORE writing the plan file
- Use ID format: taskId.cN (e.g., "1.c1", "1.c2", "2.c1")
- Each task should have at least one criterion
- Keep criterion descriptions concise but specific

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

**Success Criteria:**
- [ ] First criterion from requirements
- [ ] Second criterion
- [ ] Third criterion
- [ ] ...

---

## Task 2: [title]
**Status**: pending

[Detailed description]

**Success Criteria:**
- [ ] Criteria for this task...

---

[Continue for all tasks...]
\`\`\`

**Important:**
- The Status should be "pending" for all tasks
- Include enough detail in each task description that a fresh LLM context can understand what to do
- Do NOT include phases yet - those will be added by the planner phase
- Success criteria use checkbox format: \`- [ ]\` for pending, \`- [x]\` for passed

## What NOT to Do

- Do NOT implement anything
- Do NOT write any code
- Do NOT modify any existing files (except creating the plan file)
- Do NOT skip the codebase exploration step

Your only job is to understand the task and create a comprehensive plan.`;
}
