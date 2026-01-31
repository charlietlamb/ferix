# Error Handling Refactor: better-result Integration

## Executive Summary

This PRD outlines a comprehensive refactor of the Ferix CLI's error handling to use the `better-result` package. The goal is to replace scattered try/catch blocks with a consistent, type-safe Result pattern that improves code readability, error traceability, and maintainability.

---

## Background

### Current State

The Ferix CLI currently uses a mix of error handling patterns:

1. **Custom Error Classes** (`types/errors.ts`):
   - `FerixError` (base class with exit codes)
   - `UserCancelledError` (exit code 0)
   - `AgentError` (LLM signal-based errors)
   - `ExecutionError` (execution phase failures)
   - `DependencyError` (missing dependencies)
   - `ConfigParseError` / `ConfigValidationError`

2. **Try/Catch Blocks** (8+ files):
   - `config/loader.ts` - JSON parsing and file reading
   - `loop/progress.ts` - Silent catches for directory/file ops
   - `loop/verify.ts` - Timeout detection via string matching
   - `plan/utils.ts` - Nested try/catch in `archivePlan()`
   - `loop/runner.ts` - Git operations and main loop
   - `engine/stream/processor.ts` - Silent JSON parse failures

3. **Problem Patterns**:
   - Nested try/catch with swallowed inner errors
   - Type assertions without proper guards (`error as NodeJS.ErrnoException`)
   - Timeout detection via fragile string matching
   - Silent error swallowing hiding real issues
   - Inconsistent error context preservation

### Why better-result?

The `better-result` package provides:

1. **Generator-based composition** - Sequential code that collects error types automatically
2. **TaggedError classes** - Discriminated unions for exhaustive pattern matching
3. **Built-in retry logic** - `Result.tryPromise()` with exponential backoff
4. **Panic vs Err distinction** - Separates programmer bugs from recoverable errors
5. **Serialization support** - For potential future API/RPC boundaries
6. **Lightweight** - Minimal bundle impact

---

## Proposed Solution

### Core Pattern: Result.gen() for Flow Control

Replace nested try/catch with generator composition:

```typescript
// BEFORE (current pattern)
async function archivePlan(cwd: string): Promise<ArchiveResult> {
  try {
    const content = readFileSync(planPath, "utf-8");
    const plan = parsePlanFile(content);
    // ... more operations
    try {
      unlinkSync(planPath);
    } catch {
      // Ignore deletion errors
    }
    return { success: true, filename };
  } catch (error) {
    logger.warn(`Failed to archive plan: ${error}`);
    return { success: false };
  }
}

// AFTER (with better-result)
function archivePlan(cwd: string): Result<ArchiveSuccess, ArchiveError> {
  return Result.gen(function* () {
    const content = yield* readFileSafe(planPath);
    const plan = yield* parsePlanSafe(content);
    const archivePath = yield* createArchiveDir(cwd);
    yield* moveFile(planPath, archivePath);
    yield* deleteFileSafe(planPath); // Returns Ok even if file doesn't exist
    return Result.ok({ filename: archivePath });
  });
}
```

### TaggedError Classes

Create domain-specific error types for exhaustive handling:

```typescript
// errors/tagged.ts
import { TaggedError } from "better-result";

export class FileNotFoundError extends TaggedError("FileNotFoundError")<{
  path: string;
  message: string;
}>() {}

export class FilePermissionError extends TaggedError("FilePermissionError")<{
  path: string;
  operation: "read" | "write" | "delete";
  message: string;
}>() {}

export class JsonParseError extends TaggedError("JsonParseError")<{
  content: string;
  line?: number;
  message: string;
}>() {}

export class CommandTimeoutError extends TaggedError("CommandTimeoutError")<{
  command: string;
  timeoutMs: number;
}>() {}

export class CommandFailedError extends TaggedError("CommandFailedError")<{
  command: string;
  exitCode: number;
  output: string;
}>() {}

export class GitError extends TaggedError("GitError")<{
  operation: "branch" | "push" | "pr";
  message: string;
}>() {}

export class ConfigError extends TaggedError("ConfigError")<{
  field?: string;
  line?: number;
  message: string;
}>() {}
```

---

## Implementation Plan

### Phase 1: Foundation (Core Utilities)

**Files to modify:**
- `package.json` - Add better-result dependency
- `types/errors/tagged.ts` (new) - TaggedError class definitions
- `types/errors/index.ts` (new) - Re-export all error types
- `utils/result.ts` (new) - Utility wrappers for common operations

**New utilities to create:**

```typescript
// utils/result.ts
import { Result } from "better-result";

export function readFileSafe(path: string): Result<string, FileNotFoundError | FilePermissionError>;
export function writeFileSafe(path: string, content: string): Result<void, FilePermissionError>;
export function parseJsonSafe<T>(content: string): Result<T, JsonParseError>;
export function shellSafe(cmd: string, args: string[], opts?: ShellOptions): Promise<Result<ShellOutput, CommandFailedError | CommandTimeoutError>>;
```

### Phase 2: Config Loading

**Files to modify:**
- `config/loader.ts`
- `config/errors.ts` (migrate to TaggedError)

**Changes:**
- Replace try/catch with `Result.gen()`
- Distinguish `FileNotFoundError` from `FilePermissionError`
- Use `parseJsonSafe` for JSON parsing
- Return `Result<LoadedConfig, ConfigError>` instead of throwing

### Phase 3: Plan Operations

**Files to modify:**
- `plan/utils.ts`
- `plan/parser.ts`

**Changes:**
- Refactor `archivePlan()` to use Result.gen()
- Add `loadPlanSafe()` alongside existing `loadPlan()`
- Replace nested try/catch with explicit error handling
- Remove silent error swallowing

### Phase 4: Verify Commands

**Files to modify:**
- `loop/verify.ts`
- `utils/shell.ts`

**Changes:**
- Replace string-based timeout detection with `CommandTimeoutError`
- Use `Result.tryPromise()` with retry config
- Return `Result<VerifyResult, VerifyError>` from `runVerifyCommands()`

### Phase 5: Main Runner Loop

**Files to modify:**
- `loop/runner.ts`
- `git/index.ts`

**Changes:**
- Wrap git operations with Result types
- Replace boolean + error message patterns with `Result<T, E>`
- Use `Result.match()` for clear success/failure handling
- Improve error context preservation

### Phase 6: Entry Point Integration

**Files to modify:**
- `index.ts`
- `cli.ts`

**Changes:**
- Update `handleError()` to handle both legacy errors and Result unwrap failures
- Add graceful degradation for Result.err cases
- Preserve exit code semantics

---

## Migration Strategy

### Approach: Incremental Adoption

1. **Add utilities first** - Create Result wrappers that existing code can use
2. **Convert leaf functions** - Start with utils (shell, file ops) that don't call other functions
3. **Work inward** - Convert callers once their dependencies return Results
4. **Preserve legacy errors** - Keep `FerixError` hierarchy during transition
5. **Convert top-level last** - Update entry point error handling last

### Backward Compatibility

During migration, functions can return either:
- `Result<T, E>` for new pattern
- Throw `FerixError` subclass for legacy pattern

The entry point `handleError()` handles both:

```typescript
function handleError(error: unknown): never {
  // Handle Panic from better-result
  if (isPanic(error)) {
    logger.error("Internal error:", error.cause);
    process.exit(1);
  }

  // Handle legacy FerixError hierarchy
  if (error instanceof FerixError) {
    // ... existing handling
  }

  // Handle unknown errors
  logger.error("Unexpected error:", error);
  process.exit(1);
}
```

---

## Key Patterns Reference

### Pattern 1: Sync Operations with Result.gen()

```typescript
const result = Result.gen(function* () {
  const a = yield* operationA();
  const b = yield* operationB(a);
  return Result.ok(b);
});
```

### Pattern 2: Async Operations with Result.gen()

```typescript
const result = await Result.gen(async function* () {
  const data = yield* Result.await(fetchData());
  const processed = yield* processData(data);
  return Result.ok(processed);
});
```

### Pattern 3: Wrapping Throwing Functions

```typescript
const result = Result.try({
  try: () => JSON.parse(content),
  catch: (e) => new JsonParseError({ content, message: e.message })
});
```

### Pattern 4: Promise with Retry

```typescript
const result = await Result.tryPromise(
  () => shell(cmd, args),
  {
    retry: { times: 3, delayMs: 100, backoff: "exponential" },
    catch: (e) => new CommandFailedError({ command: cmd, ... })
  }
);
```

### Pattern 5: Pattern Matching

```typescript
result.match({
  ok: (value) => { /* handle success */ },
  err: (error) => {
    matchError(error, {
      FileNotFoundError: (e) => logger.warn(`File not found: ${e.path}`),
      FilePermissionError: (e) => logger.error(`Permission denied: ${e.path}`),
    });
  }
});
```

### Pattern 6: Graceful Degradation

```typescript
const config = loadConfigSafe().unwrapOr({ verify: [], iterations: 1 });
```

---

## Files Summary

### New Files
- `types/errors/tagged.ts` - TaggedError class definitions
- `types/errors/index.ts` - Error type exports
- `utils/result.ts` - Result utility wrappers

### Modified Files (by phase)
1. **Phase 1**: `package.json`
2. **Phase 2**: `config/loader.ts`, `config/errors.ts`
3. **Phase 3**: `plan/utils.ts`, `plan/parser.ts`
4. **Phase 4**: `loop/verify.ts`, `utils/shell.ts`
5. **Phase 5**: `loop/runner.ts`, `git/index.ts`
6. **Phase 6**: `index.ts`, `cli.ts`

---

## Verification Plan

### Testing Strategy

1. **Unit tests** for new Result utilities
2. **Integration tests** for each converted module
3. **Manual testing** of full CLI flow after each phase
4. **Error scenario testing**:
   - Missing config file
   - Invalid JSON in config
   - Git not available
   - Verify command timeout
   - Network errors during git push

### Acceptance Criteria

- [ ] All existing functionality preserved
- [ ] Exit codes remain unchanged (0 for success/cancel, 1 for errors)
- [ ] Error messages are at least as informative as before
- [ ] No silent error swallowing without explicit intent
- [ ] Type-safe error handling throughout

---

## Design Decisions

1. **Panic handling**: Log and exit with code 1. Simple approach that preserves current behavior - no need for additional file logging or error tracking.

2. **Retry configuration**: Use sensible hardcoded defaults (3 retries, exponential backoff). No user configuration needed - keeps the codebase simpler.

3. **Legacy error timeline**: Remove `FerixError` hierarchy completely after full migration. Clean break with all errors using TaggedError for a simpler, more consistent codebase.

4. **Silent error handling**: Keep silent for optional operations like progress file checking. Current behavior is fine - no need for debug logging on routine file existence checks.

5. **Serialization**: Keep purely internal for now. No immediate need for `Result.serialize()` at API boundaries.
