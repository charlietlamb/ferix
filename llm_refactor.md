# Plan: Multi-File Context System - Complete Prompt Redesign

## Overview

This plan details the comprehensive changes needed to implement a phase-based context system where each LLM invocation receives a **purpose-built context file** optimized for its specific role, rather than the raw PLAN.md.

## Architecture

```
.ferix/
  PLAN.md                    # Human-readable plan (unchanged format)
  contexts/
    {sessionId}/             # e.g., "brave-purple-dolphin"
      breakdown.md           # Output: codebase analysis + tasks
      task-{id}/
        planner-context.md   # Output: phases + files for worker
        worker-context.md    # Output: changes made for checker
        check-context.md     # Output: criteria results for reviewer
        review-context.md    # Output: final state
        changes.json         # Structured change tracking
```

### Session ID

- Generated using `human-id` package: `bun add human-id`
- Stored in PLAN.md frontmatter
- Preserved on `--resume` / `--continue`

---

## Current State Analysis

### How Prompts Currently Work

| Phase | Input | LLM Output Signals | Side Effects |
|-------|-------|-------------------|--------------|
| **Breakdown** | User task only | `<ferix:tasks>`, `<ferix:criteria>` | Creates PLAN.md |
| **Planner** | Full PLAN.md + task | `<ferix:phases>` | Updates PLAN.md with phases/files |
| **Worker** | Full PLAN.md + task + phases | `<ferix:phase-start/done>`, `<ferix:task-done>` | Implements code, updates PLAN.md |
| **Check** | Full PLAN.md + task + criteria | `<ferix:criterion-passed/failed>`, `<ferix:check-passed/failed>` | Updates PLAN.md with results |
| **Review** | Full PLAN.md + task + files | `<ferix:review-complete>`, `<ferix:review-changes-made>` | Updates PLAN.md with review notes |

### Problems with Current Approach

1. **Redundant context**: Every phase gets the entire PLAN.md even if irrelevant
2. **No file change tracking**: Phases don't know what files were actually modified
3. **Context grows unboundedly**: As tasks accumulate, PLAN.md gets larger
4. **No phase-specific guidance**: Each phase gets generic instructions, not tailored context

---

## New Prompt Architecture

### Key Principle: Each Phase Gets Exactly What It Needs

Instead of embedding the full PLAN.md, each phase receives:
1. **Role context**: What this phase is supposed to do
2. **Input context**: Output from the previous phase (tailored)
3. **Output requirements**: What signals/files to produce for the NEXT phase
4. **Constraints**: What NOT to do

---

## Detailed Prompt Changes

### 1. BREAKDOWN (`breakdown.ts`)

#### Current Input
- User task string only

#### Current Output
- Creates PLAN.md with context, tasks, criteria
- Emits `<ferix:tasks>` and `<ferix:criteria>` signals

#### New Changes

**Add to prompt - Output Requirements section:**

```markdown
## Output Requirements

After completing the breakdown, you must produce TWO outputs:

### 1. Signal Output (for TUI tracking)
<ferix:tasks>
  <task id="1">...</task>
</ferix:tasks>
<ferix:criteria task="1">
  <criterion id="1.c1">...</criterion>
</ferix:criteria>

### 2. Context File for Next Phase

After creating PLAN.md, also create `.ferix/contexts/{sessionId}/breakdown.md`:

\`\`\`markdown
# Breakdown Context

## Session
- ID: {sessionId}
- Created: {ISO timestamp}
- Original Task: {user task}

## Codebase Analysis

### Tech Stack
- Language: [detected]
- Runtime: [detected]
- Framework: [detected]

### Directory Structure
[Tree structure with purposes]

### Key Patterns
- Naming: [conventions]
- Exports: [patterns]
- Error handling: [approach]

### Relevant Files
[List of files relevant to this task with 1-line descriptions]

## Tasks Summary

### Task 1: {title}
- Description: {description}
- Success Criteria:
  - {criterion 1}
  - {criterion 2}
- Estimated Files: {list of files likely to be modified}

### Task 2: {title}
...

## Notes for Planner
[Any important context the planner should know about dependencies, gotchas, or patterns]
\`\`\`

This context file will be passed to the Planner phase instead of the full PLAN.md.
```

**New function signature:**
```typescript
export function createBreakdownPrompt(task: string, sessionId: string): string
```

---

### 2. PLANNER (`planner.ts`)

#### Current Input
- Full PLAN.md (serialized)
- Current task object

#### Current Output
- Emits `<ferix:phases>` signal
- Updates PLAN.md with phases and files

#### New Changes

**Replace PLAN.md embedding with breakdown context:**

```typescript
// OLD
const planContent = writePlanFile(plan);
// Include full plan in prompt

// NEW
const breakdownContext = readContextFile(sessionId, 'breakdown');
// Include tailored context only
```

**New prompt structure:**

```markdown
## Your Role: Task Planner

You are planning the implementation of a specific task.

## Context from Breakdown Phase

{contents of breakdown.md}

## Your Current Task

**Task {id}: {title}**

Description: {description}

Success Criteria:
{criteria list}

## Instructions

### Step 1: Verify Context
- Check if the breakdown context covers all files needed for this task
- If gaps exist, explore and document them

### Step 2: Define Phases
[existing instructions]

### Step 3: Identify Files
[existing instructions]

### Step 4: Update Plan File
[existing instructions - updates PLAN.md]

### Step 5: Create Context File for Worker

After updating PLAN.md, create `.ferix/contexts/{sessionId}/task-{id}/planner-context.md`:

\`\`\`markdown
# Worker Context for Task {id}

## Task Overview
- ID: {id}
- Title: {title}
- Description: {description}

## Success Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

## Implementation Phases

### Phase {id}.1: {description}
- What to do: [detailed instructions]
- Files involved: [list]
- Expected outcome: [what success looks like]

### Phase {id}.2: {description}
...

## Files to Modify
- {path} - {what to change and why}
- {path} - {what to change and why}

## Files to Create (if any)
- {path} - {purpose}

## Verify Commands
{list from config}

## Key Context
[Relevant patterns, imports, or existing code snippets the worker should reference]

## Constraints
- Do NOT modify files outside this list without explicit need
- Follow existing patterns in the codebase
- Signal each phase start/done for progress tracking
\`\`\`

This context file will be passed to the Worker phase.
```

**New function signature:**
```typescript
export function createPlannerPrompt(
  sessionId: string,
  breakdownContext: string,
  task: PlanTask,
  verifyCommands: string[]
): string
```

---

### 3. WORKER (`worker.ts`)

#### Current Input
- Full PLAN.md (serialized)
- Current task with phases
- Verify commands
- Optional verify error context

#### Current Output
- Emits `<ferix:phase-start/done>`, `<ferix:task-done>` signals
- Updates PLAN.md with completion notes

#### New Changes

**Replace PLAN.md with planner context:**

```markdown
## Your Role: Task Worker

You are executing a specific task.

## Context from Planner

{contents of planner-context.md}

## Current State

Phases completed: {list of completed phases if any}
Current phase: {next incomplete phase}

{verify error section if retry}

## Instructions

### For Each Phase

1. Signal start: `<ferix:phase-start id="{id}"/>`
2. Implement the changes described in the phase
3. Signal completion: `<ferix:phase-done id="{id}"/>`
4. Track your changes (see below)

### Change Tracking

As you work, maintain a mental list of:
- Files modified (with brief description of changes)
- Files created (with purpose)
- Any unexpected changes or decisions made

### After All Phases Complete

1. Run verification commands
2. Fix any issues
3. Update PLAN.md
4. Create context file for Check phase
5. Signal task done: `<ferix:task-done id="{id}"/>`

### Create Context File for Checker

Create `.ferix/contexts/{sessionId}/task-{id}/worker-context.md`:

\`\`\`markdown
# Check Context for Task {id}

## Task Summary
- Title: {title}
- Phases completed: {count}

## Changes Made

### Modified Files
- {path}: {summary of changes - what was added/modified/removed}
- {path}: {summary}

### Created Files
- {path}: {purpose and contents summary}

### Deleted Files
- {path}: {reason for deletion}

## Implementation Notes
[Any decisions, tradeoffs, or deviations from the plan]

## Success Criteria to Verify
- [ ] {criterion 1}
- [ ] {criterion 2}

## Verification Commands Run
- `{command}`: {result summary}

## Potential Issues for Checker
[Anything the checker should pay special attention to]
\`\`\`
```

Also update `changes.json`:
```json
{
  "taskId": "{id}",
  "files": [
    {"path": "...", "action": "modified|created|deleted", "summary": "..."}
  ],
  "commands": [
    {"command": "...", "exitCode": 0, "summary": "..."}
  ]
}
```

**New function signature:**
```typescript
export function createWorkerPrompt(
  sessionId: string,
  plannerContext: string,
  task: PlanTask,
  options: WorkerPromptOptions
): string
```

---

### 4. CHECK (`reviewer.ts`)

#### Current Input
- Full PLAN.md (serialized)
- Current task with criteria
- Attempt number

#### Current Output
- Emits `<ferix:criterion-passed/failed>`, `<ferix:check-passed/failed>` signals
- Updates PLAN.md with criterion statuses

#### New Changes

**Replace PLAN.md with worker context:**

```markdown
## Your Role: Success Criteria Checker

You are verifying that a completed task meets its requirements.

## Context from Worker

{contents of worker-context.md}

## Success Criteria to Verify

{criteria list with current status}

{retry section if attempt > 1}

## Instructions

### Step 0: Verify Scope
- Check if all relevant files were modified based on the changes list
- If files were missed, signal scope failure

### Step 1: Verify Each Criterion
[existing instructions]

### Step 2: Update Plan File
[existing instructions]

### Step 3: Create Context File for Review

If check PASSES, create `.ferix/contexts/{sessionId}/task-{id}/check-context.md`:

\`\`\`markdown
# Review Context for Task {id}

## Task Summary
- Title: {title}
- Check Status: PASSED
- Attempt: {number}

## Criteria Results
- [x] {criterion 1} - Verified: {how you verified it}
- [x] {criterion 2} - Verified: {how you verified it}

## Files Modified (from Worker)
{list from worker context}

## Files to Review
{list of files the reviewer should examine for code quality}

## Implementation Quality Notes
[Any observations about code quality during verification]

## Suggestions for Reviewer
[Optional: areas that might benefit from improvement]
\`\`\`

### Step 4: Signal Result
[existing check-passed/failed signals]
```

**New function signature:**
```typescript
export function createCheckPrompt(
  sessionId: string,
  workerContext: string,
  task: PlanTask,
  attemptNumber: number
): string
```

---

### 5. REVIEW (`review.ts`)

#### Current Input
- Full PLAN.md (serialized)
- Current task with files
- Attempt number

#### Current Output
- Emits `<ferix:review-complete>`, `<ferix:review-changes-made>` signals
- Updates PLAN.md with review notes

#### New Changes

**Replace PLAN.md with check context:**

```markdown
## Your Role: Code Quality Reviewer

You are improving code quality for a task that has passed verification.

## Context from Checker

{contents of check-context.md}

## Files to Review

{list from check context with file summaries}

## Review Focus Areas

### 1. Conciseness
[existing instructions]

### 2. Documentation
[existing instructions]

### 3. Scalability
[existing instructions]

## Instructions

### Step 1: Examine Files
Read each file listed in the check context.

### Step 2: Make Improvements
[existing instructions]

### Step 3: Update Plan File
[existing instructions]

### Step 4: Update Context File

Update `.ferix/contexts/{sessionId}/task-{id}/review-context.md`:

\`\`\`markdown
# Final Context for Task {id}

## Task Summary
- Title: {title}
- Status: COMPLETE
- Total Attempts: {check attempts}
- Review Attempts: {review attempts}

## Final File State

### Files Modified
{updated list including review changes}

### Changes Made in Review
- [Conciseness] {change description}
- [Documentation] {change description}
- [Scalability] {change description}

## Quality Assessment
- Code quality: {rating}
- Test coverage: {assessment}
- Documentation: {assessment}

## Lessons Learned
[Any patterns or issues discovered that might inform future tasks]
\`\`\`

Also update `changes.json` with any review changes.

### Step 5: Signal Completion
[existing signals]
```

**New function signature:**
```typescript
export function createReviewPrompt(
  sessionId: string,
  checkContext: string,
  task: PlanTask,
  attemptNumber: number
): string
```

---

## New Files to Create

### 1. `apps/cli/src/context/types.ts`

```typescript
export interface ContextFile {
  sessionId: string;
  phase: 'breakdown' | 'planner' | 'worker' | 'check' | 'review';
  taskId?: number;
  content: string;
}

export interface FileChange {
  path: string;
  action: 'created' | 'modified' | 'deleted';
  summary: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  summary: string;
}

export interface ChangesJson {
  taskId: string;
  files: FileChange[];
  commands: CommandResult[];
}
```

### 2. `apps/cli/src/context/session.ts`

```typescript
import { humanId } from 'human-id';

export function generateSessionId(): string {
  return humanId({ separator: '-', capitalize: false });
}

export function getSessionId(plan: Plan): string | undefined {
  // Extract from PLAN.md frontmatter
}

export function setSessionId(plan: Plan, sessionId: string): Plan {
  // Add to PLAN.md frontmatter
}
```

### 3. `apps/cli/src/context/files.ts`

```typescript
export function getContextDir(sessionId: string): string {
  return `.ferix/contexts/${sessionId}`;
}

export function getTaskContextDir(sessionId: string, taskId: number): string {
  return `.ferix/contexts/${sessionId}/task-${taskId}`;
}

export function writeContextFile(
  sessionId: string,
  phase: string,
  content: string,
  taskId?: number
): void;

export function readContextFile(
  sessionId: string,
  phase: string,
  taskId?: number
): string | null;

export function writeChangesJson(
  sessionId: string,
  taskId: number,
  changes: ChangesJson
): void;

export function readChangesJson(
  sessionId: string,
  taskId: number
): ChangesJson | null;
```

---

## Files to Modify

### Core Changes

| File | Changes |
|------|---------|
| `prompt/breakdown.ts` | Add context file output instructions, accept sessionId |
| `prompt/planner.ts` | Replace PLAN.md with breakdown context, add worker context output |
| `prompt/worker.ts` | Replace PLAN.md with planner context, add checker context output |
| `prompt/reviewer.ts` | Replace PLAN.md with worker context, add review context output |
| `prompt/review.ts` | Replace PLAN.md with check context, add final context output |
| `loop/runner.ts` | Generate session ID, pass context between phases |
| `plan/writer.ts` | Add frontmatter support for sessionId |
| `plan/parser.ts` | Parse frontmatter for sessionId |
| `types/plan.ts` | Add sessionId to Plan type |

### Runner Changes (`loop/runner.ts`)

```typescript
// In executeBreakdown
const sessionId = generateSessionId();
const prompt = createBreakdownPrompt(config.task, sessionId);
// After execution, context file is created by LLM

// In executePlanner
const breakdownContext = readContextFile(sessionId, 'breakdown');
const prompt = createPlannerPrompt(sessionId, breakdownContext, task, config.verify);

// In executeWorker
const plannerContext = readContextFile(sessionId, 'planner', task.id);
const prompt = createWorkerPrompt(sessionId, plannerContext, task, options);

// In executeCheck
const workerContext = readContextFile(sessionId, 'worker', task.id);
const prompt = createCheckPrompt(sessionId, workerContext, task, attemptNumber);

// In executeReview
const checkContext = readContextFile(sessionId, 'check', task.id);
const prompt = createReviewPrompt(sessionId, checkContext, task, attemptNumber);
```

---

## Implementation Order

### Phase 1: Infrastructure (Day 1)
1. Add `human-id` dependency
2. Create `context/types.ts`
3. Create `context/session.ts`
4. Create `context/files.ts`
5. Update `types/plan.ts` with sessionId
6. Update `plan/writer.ts` and `plan/parser.ts` for frontmatter

### Phase 2: Breakdown Changes (Day 2)
1. Update `breakdown.ts` prompt with context output instructions
2. Update runner to generate and pass sessionId
3. Test breakdown creates context file

### Phase 3: Planner Changes (Day 2)
1. Update `planner.ts` to read breakdown context
2. Add worker context output instructions
3. Test planner reads context and creates worker context

### Phase 4: Worker Changes (Day 3)
1. Update `worker.ts` to read planner context
2. Add checker context output instructions
3. Add changes.json tracking
4. Test worker flow

### Phase 5: Check Changes (Day 3)
1. Update `reviewer.ts` to read worker context
2. Add review context output instructions
3. Test check flow

### Phase 6: Review Changes (Day 4)
1. Update `review.ts` to read check context
2. Add final context output
3. Test full flow

### Phase 7: Integration & Testing (Day 4)
1. Test complete multi-task flow
2. Test resume with existing session
3. Test retry flows (check fail, verify fail)
4. Verify TUI unchanged

---

## Verification

### Unit Tests
1. Context file read/write utilities
2. Session ID generation
3. Frontmatter parsing

### Integration Tests
1. Run single-task ferix and verify:
   - Context files created in correct locations
   - Each phase receives appropriate context
   - PLAN.md still works correctly
   - TUI output unchanged
2. Run multi-task ferix and verify context isolation
3. Test `--resume` preserves session ID
4. Test retry flows create updated contexts

### Manual Testing
1. Run `ferix "Add a simple feature"` and inspect:
   - `.ferix/contexts/{sessionId}/` directory structure
   - Content of each context file
   - Compare token counts before/after
