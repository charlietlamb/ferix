/**
 * @fileoverview Review prompt for code quality improvement pass.
 *
 * This is Stage 3 of the post-worker flow (Check → Verify → Review).
 *
 * The Review phase runs AFTER Check and Verify pass. A fresh LLM context:
 * 1. Reviews the implementation for code quality
 * 2. Makes improvements for conciseness, documentation, and scalability
 * 3. Signals whether changes were made (triggers re-verification if so)
 *
 * Unlike the Check phase, Review CAN and SHOULD make code changes.
 * After Review makes changes, Verify runs again to ensure no regressions.
 *
 * @see reviewer.ts for the check stage (success criteria verification)
 * @see worker.ts for task implementation
 */

import { getPlanPath } from "../plan/index.js";
import { writePlanFile } from "../plan/writer.js";
import type { Plan, PlanTask } from "../types/plan.js";

/**
 * Creates the review prompt for code quality improvement.
 *
 * The prompt instructs the LLM to:
 * - Review the implementation for conciseness, documentation, and scalability
 * - Make improvements without changing behavior
 * - Signal if changes were made (so Verify can re-run)
 * - Update the plan file with review notes
 *
 * @param plan - The current plan (included in prompt for context)
 * @param task - The task to review (should have passed Check and Verify)
 * @param attemptNumber - Current attempt number (1-3)
 * @returns Complete prompt string for the review phase
 */
export function createReviewPrompt(
  plan: Plan,
  task: PlanTask,
  attemptNumber: number
): string {
  const planPath = getPlanPath();
  const planContent = writePlanFile(plan);

  // Build files list from task phases
  const filesSection = buildFilesSection(task);

  return `## Your Role: Code Quality Reviewer

You are performing a code quality review on a completed task. Unlike the Check phase (which verifies requirements), your job is to IMPROVE the code.

## The Current Plan

\`\`\`markdown
${planContent}
\`\`\`

## Task to Review

**Task ${task.id}: ${task.title}**

Description: ${task.description}

${filesSection}

## Review Focus Areas

You MUST review the implementation for these three areas:

### 1. Conciseness
- Remove unnecessary code, comments, or complexity
- Simplify overly verbose logic
- Consolidate duplicate code
- Remove dead code paths

### 2. Documentation
- Add JSDoc comments to exported functions
- Document complex algorithms or business logic
- Ensure inline comments explain "why", not "what"
- Update or add file-level documentation

### 3. Scalability
- Identify potential performance bottlenecks
- Check for hardcoded values that should be configurable
- Ensure error handling is comprehensive
- Verify edge cases are handled

## Instructions

### Step 1: Examine the Implementation

Read all files that were modified in this task. Check the Phases section in the plan for the list of files.

### Step 2: Make Improvements

You CAN and SHOULD make code changes to improve quality. Changes should be:
- Non-breaking (don't change behavior or APIs)
- Focused on the three areas above
- Conservative (don't over-engineer)

**If you make ANY changes, signal this:**
\`\`\`
<ferix:review-changes-made/>
\`\`\`

This is important because Verify will need to run again after your changes.

### Step 3: Update the Plan File

After your review, update the plan file (\`${planPath}\`) with a "### Review" section under this task:

\`\`\`markdown
### Review
**Attempt**: ${attemptNumber}
**Changes Made**: [Yes/No]

**Improvements:**
- [Conciseness] Description of change
- [Documentation] Description of change
- [Scalability] Description of change

**Notes:**
Any observations or minor suggestions not worth changing.
\`\`\`

### Step 4: Signal Completion

After reviewing and making any improvements:

\`\`\`
<ferix:review-complete/>
\`\`\`

## Important Rules

- You MAY modify code (unlike the Check phase)
- Focus on QUALITY, not requirements (those were verified in Check)
- Be conservative - don't refactor just for the sake of it
- If you break something, Verify will catch it (and you'll retry)
- This is attempt ${attemptNumber} of 3 - ${attemptNumber === 3 ? "**FINAL ATTEMPT**" : `${3 - attemptNumber} attempts remaining`}

## What NOT to Do

- Do NOT change the behavior of the code
- Do NOT add new features
- Do NOT remove functionality
- Do NOT make breaking API changes
- Keep changes minimal and focused on quality`;
}

/**
 * Builds a section listing files to review from the task phases.
 *
 * @param task - The task with phases
 * @returns Formatted string for prompt display
 */
function buildFilesSection(task: PlanTask): string {
  // Check if task has filesToModify from planner
  if (task.filesToModify && task.filesToModify.length > 0) {
    const filesList = task.filesToModify.map((f) => `- ${f}`).join("\n");
    return `### Files to Review

${filesList}`;
  }

  // Otherwise, hint to check phases
  return `### Files to Review

Check the Phases section in the plan for files modified during this task.`;
}
