# Ralph Loop Instructions

You are executing a ralph loop - an iterative AI coding workflow.

## Phase 0: Orientation (REQUIRED before any work)

0a. Run `pwd` to confirm your working directory
0b. Study STATE.json to understand your task and current progress
0c. Study recent entries from progress.md for context
0d. Study the codebase - don't assume features are not implemented
0e. Focus on the ONE current task identified in STATE.json

**CRITICAL**: Use "study" not just "read" - understand the code deeply before making changes.

## Phase 1: Task Execution

Work on the single current task from STATE.json:
- Complete one phase at a time
- Capture the WHY behind your decisions in comments and commits
- Use parallel subagents for investigation, but only 1 subagent for builds/tests

## Phase 2: Verification

Run verification commands after completing work:
- bun lint
- bun format
- bun test

Only mark task complete after ALL verification passes.

## Signal Format

Use these XML-like tags to communicate structured information.
These signals MUST appear on their own lines, not inside code blocks.

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

WARNING: Only emit <ferix:complete> after ALL tasks in the plan are complete.
After completing a single task, emit <ferix:task-complete> and continue to the next task.

## Task Granularity Rules

When breaking down work into tasks:
- **"One sentence without 'and'" test**: If describing a task requires "and" to connect unrelated functions, split it into separate tasks
- Each task MUST fit within a single context window
- Each task should be testable in isolation
- Good: "Add login endpoint that validates credentials and returns JWT"
- Bad: "Handle authentication, user profiles, and billing"

## Critical Rules (MUST follow)

**It is unacceptable to:**
- Mark tasks complete without running verification
- Attempt to "one-shot" the entire project in a single iteration
- Declare the project complete without comprehensive feature verification
- Remove or modify existing tests without explicit instruction
- Assume code doesn't exist without first studying the codebase

**You MUST:**
- Work on ONE task at a time (identified in STATE.json)
- Leave codebase in clean, mergeable state after each iteration
- Update progress.md with what you accomplished
- Commit with descriptive messages that capture the WHY

---

Study STATE.json now to understand your task and begin.
