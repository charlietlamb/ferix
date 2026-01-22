/**
 * @fileoverview Reviewer prompt for verifying task success criteria.
 *
 * This phase runs after the worker completes a task where a fresh LLM context:
 * 1. Reads the plan with the completed task
 * 2. Verifies each success criterion
 * 3. Signals pass/fail for each criterion
 * 4. Returns a verdict on whether the task is truly complete
 *
 * The reviewer acts as an independent verification step. If criteria fail,
 * the task will be retried (up to 5 attempts). This ensures tasks actually
 * meet their requirements rather than just "completing" without verification.
 *
 * @see breakdown.ts for extracting success criteria
 * @see worker.ts for task implementation
 */

import { getPlanPath } from "../plan/index.js";
import { writePlanFile } from "../plan/writer.js";
import type { Plan, PlanTask, SuccessCriterion } from "../types/plan.js";

/**
 * Creates the reviewer prompt for verifying a completed task's success criteria.
 *
 * The prompt instructs the LLM to:
 * - Review each success criterion independently
 * - Verify the criterion is satisfied by examining code/files/behavior
 * - Signal pass/fail for each criterion with reasons
 * - Update the plan file with criterion statuses
 *
 * @param plan - The current plan (included in prompt for context)
 * @param task - The task to review (should be in done/in_progress state)
 * @param attemptNumber - Current attempt number (1-5)
 * @returns Complete prompt string for the reviewer phase
 */
export function createReviewerPrompt(
  plan: Plan,
  task: PlanTask,
  attemptNumber: number
): string {
  const planPath = getPlanPath();
  const planContent = writePlanFile(plan);

  // Build criteria list for display
  const criteriaDisplay = buildCriteriaDisplay(task.criteria ?? []);

  // Build previous failures section if this is a retry
  const retrySection = buildRetrySection(task.criteria ?? [], attemptNumber);

  return `## Your Role: Task Reviewer

You are verifying that a completed task meets its success criteria. Your job is to:
1. Review each criterion independently
2. Verify it is satisfied by examining the codebase
3. Signal pass/fail for each criterion
4. Provide a final verdict

## The Current Plan

\`\`\`markdown
${planContent}
\`\`\`

## Task to Review

**Task ${task.id}: ${task.title}**

Description: ${task.description}

### Success Criteria to Verify

${criteriaDisplay}
${retrySection}

## Instructions

### Step 0: Verify Scope Completeness

Before checking individual criteria, verify the SCOPE of the work:

1. Read the component inventory from the plan
2. Check if the implementation touched ALL relevant files
3. If files were skipped that should have been modified, this is a SCOPE FAILURE

**Signal scope issues:**
\`\`\`
<ferix:scope-incomplete reason="[file/area] was not addressed"/>
\`\`\`

A scope failure counts as a criterion failure even if all stated criteria pass.

### Step 1: Review Each Criterion

**IMPORTANT:** If any criterion is about completeness (e.g., "all files follow pattern"), you MUST verify by checking EVERY file - do not sample.

For each criterion:

1. **Examine the codebase** to determine if the criterion is met
   - Read relevant files
   - Check for expected behavior/structure
   - Verify edge cases if specified in the criterion

2. **Make a pass/fail decision** - the criterion either IS or ISN'T met (no partial credit)

3. **Signal your verdict:**

   **If criterion PASSES:**
   \`\`\`
   <ferix:criterion-passed id="${task.id}.cN"/>
   \`\`\`

   **If criterion FAILS:**
   \`\`\`
   <ferix:criterion-failed id="${task.id}.cN" reason="Brief explanation of what's missing or wrong"/>
   \`\`\`

### Step 2: Update the Plan File

After reviewing all criteria, update the plan file (\`${planPath}\`):

For each criterion, change its status:
- Passed: \`- [x] criterion description\`
- Failed: \`- [ ] criterion description\`
  \`  > Reason: explanation of failure\`

Also update the attempts count:
\`**Attempts**: ${attemptNumber}\`

### Step 3: Final Verdict

After reviewing ALL criteria:

**If ALL criteria pass:**
- The task status remains "done"
- Signal completion:
  \`\`\`
  <ferix:review-passed/>
  \`\`\`

**If ANY criterion fails:**
- Change task status back to "in_progress"
- Signal failure:
  \`\`\`
  <ferix:review-failed/>
  \`\`\`
- The worker will retry the task with your feedback

## Important Rules

- **Be thorough** - actually examine the code, don't just assume things work
- **Be objective** - if the criterion says "X happens", verify X actually happens
- **Be specific** - if something fails, explain exactly what's missing or wrong
- **Review ALL criteria** - don't stop after finding one failure
- This is attempt ${attemptNumber} of 5 - ${attemptNumber === 5 ? "**FINAL ATTEMPT** - if criteria fail, the task will be marked as failed" : `${5 - attemptNumber} attempts remaining after this`}

## What NOT to Do

- Do NOT implement fixes yourself - just review and report
- Do NOT skip criteria or assume they pass
- Do NOT be lenient - requirements must be fully met
- Do NOT modify code - only update the plan file`;
}

/**
 * Builds a displayable list of criteria with their current status.
 *
 * @param criteria - Array of success criteria
 * @returns Formatted string for prompt display
 */
function buildCriteriaDisplay(criteria: SuccessCriterion[]): string {
  if (criteria.length === 0) {
    return "No success criteria defined (this is unexpected - the task should have criteria from breakdown)";
  }

  return criteria
    .map((c) => {
      const statusIcon = getStatusIcon(c.status);
      let line = `- ${statusIcon} ${c.id}: ${c.description}`;
      if (c.status === "failed" && c.failureReason) {
        line += `\n  > Previous failure: ${c.failureReason}`;
      }
      return line;
    })
    .join("\n");
}

/**
 * Gets the display icon for a criterion status.
 *
 * @param status - The criterion status
 * @returns Icon string for display
 */
function getStatusIcon(status: string): string {
  if (status === "passed") {
    return "[x]";
  }
  if (status === "failed") {
    return "[!]";
  }
  return "[ ]";
}

/**
 * Builds a retry section explaining previous failures.
 *
 * @param criteria - Array of success criteria
 * @param attemptNumber - Current attempt number
 * @returns Formatted string for prompt, empty if first attempt
 */
function buildRetrySection(
  criteria: SuccessCriterion[],
  attemptNumber: number
): string {
  if (attemptNumber === 1) {
    return "";
  }

  const failedCriteria = criteria.filter((c) => c.status === "failed");
  if (failedCriteria.length === 0) {
    return "";
  }

  const failureList = failedCriteria
    .map((c) => `- **${c.id}**: ${c.failureReason ?? "Unknown reason"}`)
    .join("\n");

  return `

## Previous Attempt Failures

This is attempt ${attemptNumber}. The previous attempt failed these criteria:

${failureList}

Focus your review on verifying whether these issues have been addressed.`;
}
