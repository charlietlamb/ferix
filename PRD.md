# PRD: ferix.json Configuration File Support

## Overview

Add support for a `ferix.json` configuration file that provides project-level defaults for the Ferix CLI. This allows teams to define standard verification commands, iteration limits, and progress tracking settings that apply to all runs within a project.

## Problem Statement

Currently, users must manually specify verification commands (`--verify`), iteration counts (`--iterations`), and other options every time they run Ferix. This leads to:

1. **Repetitive input**: Users repeatedly type the same lint/test commands
2. **Inconsistency**: Team members may use different verification commands
3. **Onboarding friction**: New team members don't know which commands to run
4. **Error-prone**: Easy to forget important verification steps

## Goals

1. Allow projects to define default configuration in a `ferix.json` file
2. Pre-fill interactive prompts with config file values
3. Use config defaults when running in non-interactive mode
4. Maintain CLI flag precedence over config file values
5. Integrate verify command failures into the retry loop

## Non-Goals

- Global user-level config (~/.ferix.json) - out of scope for v1
- Environment-specific configs (dev/staging/prod)
- Config file generation/scaffolding commands
- JSON schema validation beyond basic type checking

---

## Detailed Design

### 1. Config File Location & Discovery

**Location**: `./ferix.json` in the project root (same directory where ferix is run)

**Discovery**: On startup, Ferix will:
1. Check if `ferix.json` exists in the current working directory
2. If found, parse and validate the JSON
3. If not found, proceed with default behavior (no error)
4. If found but invalid JSON, exit with a clear error message

### 2. Config File Schema

```json
{
  "verify": ["bun lint", "bun test", "bun run build"],
  "iterations": 5,
  "progress": ".ferix/PROGRESS.md"
}
```

#### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `verify` | `string[]` | `[]` | Array of shell commands to run for verification |
| `iterations` | `number` | `5` | Default iteration limit (-1 for unlimited) |
| `progress` | `string \| false` | `".ferix/PROGRESS.md"` | Progress file path, or `false` to disable |

#### Type Definition

```typescript
interface FerixFileConfig {
  /** Verification commands to run after task completion */
  verify?: string[];
  
  /** Default iteration limit. Use -1 for unlimited. */
  iterations?: number;
  
  /** Progress file path, or false to disable progress tracking */
  progress?: string | false;
}
```

### 3. Config Loading & Validation

**Loading behavior**:
```
1. Attempt to read ./ferix.json
2. If file doesn't exist -> return empty config {}
3. If file exists but is invalid JSON -> throw ConfigParseError
4. If file exists and is valid JSON -> validate schema
5. If schema invalid -> throw ConfigValidationError  
6. Return parsed config
```

**Validation rules**:
- `verify`: Must be array of strings (if present)
- `iterations`: Must be number, >= -1 (if present)
- `progress`: Must be string or boolean false (if present)

**Error messages**:
```
Error: Failed to parse ferix.json - invalid JSON at line 3
Error: Invalid ferix.json - 'verify' must be an array of strings
Error: Invalid ferix.json - 'iterations' must be a number >= -1
```

### 4. CLI Precedence Rules

**Rule**: CLI flags always override config file values when explicitly provided.

| Scenario | Result |
|----------|--------|
| Config has `verify`, CLI has `--verify` | Use CLI value |
| Config has `verify`, CLI has no flag | Use config value |
| Config has `verify`, CLI has `--verify ""` | Use empty (CLI override) |
| No config, no CLI flag | Use default (empty) |

**Implementation**: Track which CLI options were explicitly set vs using defaults.

### 5. Interactive Mode Integration

When running in interactive mode (`ferix` with no arguments):

1. **Verify field**: Pre-fill with config values as comma-separated string
   - Config: `["bun lint", "bun test"]`
   - Pre-filled: `bun lint, bun test`
   - User can edit or clear

2. **Iterations field**: Pre-select the config value in dropdown
   - If config value matches an option, select it
   - Otherwise, select closest or default

3. **Progress field**: Pre-fill based on config
   - If `progress: false` -> pre-select "No"
   - If `progress: "custom/path.md"` -> pre-select "Yes" (use custom path)
   - If not set -> pre-select "Yes" (use default path)

### 6. Verify Command Execution & Retry Loop

**When verify runs**: After all phases of a task complete (before moving to next task)

**Execution flow**:
```
Task N completes all phases
    |
    v
Run verify commands sequentially
    |
    +---> All pass --> Mark task done, move to Task N+1
    |
    +---> Any fails --> Capture output, increment verify_attempts
              |
              +---> attempts < 3 --> Re-run worker with error context
              |
              +---> attempts >= 3 --> Fail task, exit with error
```

**Retry behavior**:
- Verify has its own attempt counter (separate from success criteria)
- Maximum 3 verify retry attempts per task
- On failure, worker receives the failed command output in context
- Worker should analyze the error and fix the code

**Error context format** (provided to worker on retry):
```
VERIFICATION FAILED (attempt 2/3)

Command: bun lint
Exit code: 1
Output:
  src/foo.ts:42:5 - error: 'bar' is declared but never used

Please fix this issue and ensure all verification commands pass.
```

### 7. TUI Status Display

**Status bar mode**: When running verify commands, show:
```
[VERIFY] Running: bun lint (1/3)
```

**On retry**: Show attempt count:
```
[VERIFY #2] Running: bun test (2/3)
```

---

## File Structure

New/modified files:

```
apps/cli/src/
  config/
    index.ts        # Config loading, validation, exports
    schema.ts       # Type definitions and validation
    errors.ts       # Config-specific error types
  cli.ts            # Add config loading, pre-fill prompts
  index.ts          # Integrate config loading on startup
  loop/
    runner.ts       # Add verify execution and retry logic
  tui/
    form/inputs/
      text.ts       # Support initial value pre-fill
      select.ts     # Support initial value pre-selection
  types/
    questions.ts    # Add 'initial' field to question types
    config.ts       # Add verify-related fields
    tui.ts          # Add 'verifying' execution mode
```

---

## Success Criteria

1. **Config file loading**
   - [ ] ferix.json is read from current directory on startup
   - [ ] Missing file is handled gracefully (no error)
   - [ ] Invalid JSON shows clear error with line number
   - [ ] Invalid schema shows clear error with field name

2. **Interactive mode pre-fill**
   - [ ] Verify field shows config values as comma-separated text
   - [ ] Iterations dropdown pre-selects config value
   - [ ] Progress toggle reflects config setting
   - [ ] User can override all pre-filled values

3. **CLI precedence**
   - [ ] Explicit CLI flags override config values
   - [ ] Config values used when CLI flags not provided
   - [ ] Empty CLI values (`--verify ""`) override config

4. **Verify execution**
   - [ ] Verify commands run after all phases complete
   - [ ] Commands run sequentially in order
   - [ ] Pass/fail status captured for each command

5. **Verify retry loop**
   - [ ] Failed verify triggers worker retry with error context
   - [ ] Maximum 3 retry attempts before task failure
   - [ ] Attempt counter displayed in TUI
   - [ ] Clear error message on final failure

6. **TUI integration**
   - [ ] "VERIFY" mode shown in status bar during verification
   - [ ] Retry attempt number displayed
   - [ ] Command being run shown in status

---

## Implementation Plan

### Phase 1: Config Infrastructure
1. Create config module with types and validation
2. Implement config file loading
3. Add error types for config failures
4. Unit tests for config loading/validation

### Phase 2: CLI Integration  
1. Load config on startup in index.ts
2. Update cli.ts to accept config defaults
3. Implement CLI precedence logic
4. Add 'initial' field support to form inputs

### Phase 3: Interactive Mode Pre-fill
1. Update text input to support initial value
2. Update select input to support initial selection
3. Pre-fill verify, iterations, progress fields
4. Test interactive flow with config file

### Phase 4: Verify Execution
1. Add verify command runner function
2. Integrate into task completion flow
3. Capture command output on failure
4. Add "verifying" execution mode to TUI

### Phase 5: Verify Retry Loop
1. Add verify_attempts counter to task state
2. Implement retry logic with 3-attempt limit
3. Format error context for worker retry
4. Update TUI to show verify retry status

---

## Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| ferix.json doesn't exist | Proceed normally, no error |
| ferix.json is empty `{}` | Valid, use all defaults |
| ferix.json has extra fields | Ignore unknown fields (forward compat) |
| verify command not found | Fail with clear "command not found" error |
| verify command hangs | Timeout after 5 minutes, treat as failure |
| verify command killed (Ctrl+C) | Propagate interrupt, exit cleanly |
| Config + CLI both empty verify | No verification runs (valid) |

---

## Future Considerations (Out of Scope)

- **Global config**: `~/.ferix.json` for user-level defaults
- **Config inheritance**: Extend from base configs
- **ferix init**: Command to generate config file
- **JSON Schema**: Publish schema for IDE autocomplete
- **Environment variables**: `FERIX_VERIFY`, `FERIX_ITERATIONS`
- **Per-task verify**: Different verify commands per task type
- **Parallel verify**: Run independent commands in parallel
