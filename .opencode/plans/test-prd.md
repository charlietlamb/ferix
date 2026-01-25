# Test Infrastructure PRD - apps/code

## Executive Summary

This document outlines a comprehensive testing overhaul for `apps/code/` to establish robust test coverage, improve development velocity, and ensure application security. The current test infrastructure has only 2 test files covering signal parsing and basic orchestration. This PRD aims to achieve 80%+ coverage of critical paths.

---

## Current State Analysis

### What Exists
- **Framework:** Bun's native test runner (`bun:test`)
- **Test Files:** 2 files in `src/__tests__/`
  - `signal-parser.test.ts` (348 lines) - Good coverage
  - `orchestrator.test.ts` (282 lines) - Basic coverage
- **Mock Infrastructure:** Memory layers for all services (excellent foundation)
- **Configuration:** Zero-config (Bun defaults)

### What's Missing
- Property-based testing
- Error path tests
- Plan update handler tests
- Prompt building tests
- Event mapping tests
- TUI reducer tests
- CI/CD test integration
- Test utilities/helpers extraction
- Monorepo test task in Turborepo

---

## Goals

1. **Coverage Target:** 80%+ line coverage on critical paths
2. **Test Types:** Unit, Integration, Property-based, Error path
3. **Dev Velocity:** Tests run in <10s for rapid feedback
4. **Security:** All error paths tested, no unhandled exceptions
5. **CI Integration:** Tests block deployment on failure

---

## Architecture

### Test Directory Structure

```
apps/code/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                    # Global test setup
│   │   ├── utils/
│   │   │   ├── create-test-layers.ts   # Layer composition helpers
│   │   │   ├── mock-events.ts          # LLM event factories
│   │   │   ├── mock-signals.ts         # Signal factories
│   │   │   ├── assertions.ts           # Custom Effect assertions
│   │   │   └── index.ts                # Barrel export
│   │   │
│   │   ├── unit/
│   │   │   ├── plan-updates-helpers.test.ts
│   │   │   ├── prompt-building.test.ts
│   │   │   ├── event-mapping.test.ts
│   │   │   ├── registry.test.ts
│   │   │   └── tui-reducers.test.ts
│   │   │
│   │   ├── integration/
│   │   │   ├── orchestrator.test.ts     # (existing, enhanced)
│   │   │   ├── discovery-stream.test.ts
│   │   │   ├── iteration-stream.test.ts
│   │   │   ├── plan-update-handlers.test.ts
│   │   │   └── memory-stores.test.ts
│   │   │
│   │   ├── error-paths/
│   │   │   ├── llm-errors.test.ts
│   │   │   ├── store-errors.test.ts
│   │   │   ├── git-errors.test.ts
│   │   │   └── signal-parsing-errors.test.ts
│   │   │
│   │   └── properties/
│   │       ├── plan-state-machine.test.ts
│   │       ├── signal-roundtrip.test.ts
│   │       └── reducer-determinism.test.ts
│   │
│   └── ... (source files)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

#### 1.1 Test Utilities Setup

Create shared test utilities to eliminate duplication:

**`src/__tests__/utils/create-test-layers.ts`**
```typescript
import { Layer } from "effect";
import type { LLMEvent } from "@/domain/schemas/llm";
import type { Plan } from "@/domain/schemas/plan";
import type { Session } from "@/domain/schemas/session";
import * as Mock from "@/layers/llm/mock";
import * as MemorySession from "@/layers/session/memory";
import * as MemoryPlan from "@/layers/plan/memory";
import * as MemoryProgress from "@/layers/progress/memory";
import * as MemoryGuardrails from "@/layers/guardrails/memory";
import * as MemoryGit from "@/layers/git/memory";
import * as FerixParser from "@/layers/signal/ferix-parser";

export interface TestLayerOptions {
  events?: LLMEvent[];
  initialPlan?: Plan;
  initialSession?: Session;
}

export function createTestLayers(options: TestLayerOptions = {}) {
  const { events = [] } = options;
  return Layer.mergeAll(
    Mock.layer({ events }),
    MemorySession.layer(),
    MemoryPlan.layer(),
    MemoryProgress.layer(),
    MemoryGuardrails.layer(),
    MemoryGit.layer(),
    FerixParser.Live
  );
}
```

**`src/__tests__/utils/mock-events.ts`**
```typescript
import type { LLMEvent } from "@/domain/schemas/llm";

export const mockTextEvent = (text: string): LLMEvent => ({
  _tag: "Text",
  text,
});

export const mockDoneEvent = (output = ""): LLMEvent => ({
  _tag: "Done",
  output,
});

export const mockToolStartEvent = (tool: string): LLMEvent => ({
  _tag: "ToolStart",
  tool,
});

export const mockToolUseEvent = (tool: string, input?: string): LLMEvent => ({
  _tag: "ToolUse",
  tool,
  input,
});

export const mockToolEndEvent = (tool: string, result?: string): LLMEvent => ({
  _tag: "ToolEnd",
  tool,
  result,
});

// Signal text helpers
export const wrapSignal = (tag: string, content: string): string =>
  `<ferix:${tag}>${content}</ferix:${tag}>`;

export const mockTasksSignal = (tasks: Array<{ id: string; title: string; description: string }>) =>
  wrapSignal("tasks", JSON.stringify(tasks));

export const mockPhasesSignal = (phases: Array<{ id: string; name: string; description: string }>) =>
  wrapSignal("phases", JSON.stringify(phases));
```

**`src/__tests__/utils/assertions.ts`**
```typescript
import { Effect, Exit, Cause, Option } from "effect";
import { expect } from "bun:test";

export async function expectEffectSuccess<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isFailure(exit)) {
    throw new Error(`Expected success but got failure: ${Cause.pretty(exit.cause)}`);
  }
  return exit.value;
}

export async function expectEffectFailure<A, E>(
  effect: Effect.Effect<A, E, never>,
  errorTag?: string
): Promise<E> {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) {
    throw new Error(`Expected failure but got success: ${JSON.stringify(exit.value)}`);
  }
  const error = Cause.failureOption(exit.cause);
  if (Option.isNone(error)) {
    throw new Error("Expected failure but got defect");
  }
  if (errorTag && (error.value as { _tag?: string })?._tag !== errorTag) {
    throw new Error(`Expected error tag ${errorTag} but got ${(error.value as { _tag?: string })?._tag}`);
  }
  return error.value;
}

export function expectEventSequence<T extends { _tag: string }>(
  events: T[],
  expectedTags: string[]
): void {
  const actualTags = events.map((e) => e._tag);
  expect(actualTags).toEqual(expectedTags);
}

export function findEvent<T extends { _tag: string }>(
  events: T[],
  tag: string
): T | undefined {
  return events.find((e) => e._tag === tag);
}

export function findEvents<T extends { _tag: string }>(
  events: T[],
  tag: string
): T[] {
  return events.filter((e) => e._tag === tag);
}
```

**`src/__tests__/utils/index.ts`**
```typescript
export * from "./create-test-layers";
export * from "./mock-events";
export * from "./assertions";
```

#### 1.2 Update package.json

Add new test scripts:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:unit": "bun test src/__tests__/unit",
    "test:integration": "bun test src/__tests__/integration",
    "test:errors": "bun test src/__tests__/error-paths",
    "test:properties": "bun test src/__tests__/properties"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "fast-check": "^3.22.0"
  }
}
```

#### 1.3 Add test task to turbo.json

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^test"],
      "cache": false,
      "inputs": ["src/**/*.ts", "src/**/*.test.ts"]
    }
  }
}
```

#### 1.4 Update CLAUDE.md

Add test commands to the root CLAUDE.md:

```markdown
Whenever you make changes make sure to run `bun lint` & `bun format` to ensure the code is meeting code standards.

**After making changes to apps/code, also run:**
- `bun test` in apps/code - Run all tests to ensure nothing is broken

Never use any. Always prefer strong types.

When working in an app that uses Effect make sure to use Effect schemas to validate data.
```

---

### Phase 2: Unit Tests (Week 1-2)

#### 2.1 Plan Updates Helpers Tests

**File:** `src/__tests__/unit/plan-updates-helpers.test.ts`

Test all pure functions in `src/orchestrator/plan-updates/helpers.ts`:

| Function | Test Cases |
|----------|------------|
| `createPlanFromTasks` | Valid tasks, Empty tasks array, Tasks with existing IDs |
| `updatePlanWithPhases` | Add phases to existing plan, Replace phases, Empty phases |
| `updatePlanWithCriteria` | Add criteria to phase, Phase not found error |
| `updatePhaseStatus` | Valid transitions (pending->in-progress->completed), Invalid transitions |
| `updateCriterionStatus` | Pass/fail transitions, Already passed/failed |
| `markTaskCompleted` | Task exists, Task not found, Already completed |
| `findCurrentPhase` | Has in-progress phase, All pending, All completed |
| `findCurrentCriterion` | In current phase, No criteria defined |

Example test structure:
```typescript
import { describe, expect, it } from "bun:test";
import {
  createPlanFromTasks,
  updatePlanWithPhases,
  updatePhaseStatus,
  markTaskCompleted,
} from "@/orchestrator/plan-updates/helpers";

describe("Plan Updates Helpers", () => {
  describe("createPlanFromTasks", () => {
    it("should create plan with generated IDs when none provided", () => {
      const tasks = [
        { title: "Task 1", description: "Description 1" },
        { title: "Task 2", description: "Description 2" },
      ];
      const plan = createPlanFromTasks(tasks);
      
      expect(plan.tasks).toHaveLength(2);
      expect(plan.tasks[0].id).toBeDefined();
      expect(plan.tasks[0].status).toBe("pending");
    });

    it("should preserve existing IDs when provided", () => {
      const tasks = [
        { id: "custom-id", title: "Task 1", description: "Description 1" },
      ];
      const plan = createPlanFromTasks(tasks);
      
      expect(plan.tasks[0].id).toBe("custom-id");
    });

    it("should handle empty tasks array", () => {
      const plan = createPlanFromTasks([]);
      expect(plan.tasks).toHaveLength(0);
    });
  });

  describe("updatePhaseStatus", () => {
    it("should transition from pending to in-progress", () => {
      // ... test implementation
    });

    it("should not allow transition from completed to pending", () => {
      // ... test implementation
    });
  });
});
```

#### 2.2 Prompt Building Tests

**File:** `src/__tests__/unit/prompt-building.test.ts`

Test all functions in `src/orchestrator/prompt.ts`:

| Function | Test Cases |
|----------|------------|
| `buildPrompt` | With plan, Without plan, With guardrails, With progress |
| `buildDiscoveryPrompt` | Valid task, Task with complex context |
| `buildRalphPrompt` | All phases present, With progress summary |
| `selectCurrentTask` | First incomplete task, All tasks complete, Mixed states |
| `buildProgressSummary` | Empty progress, Multiple entries |

#### 2.3 Event Mapping Tests

**File:** `src/__tests__/unit/event-mapping.test.ts`

Test all mappers in `src/orchestrator/mapping/`:

| Mapper | Test Cases |
|--------|------------|
| `mapLLMTextEvent` | Plain text, Text containing signals |
| `mapLLMToolStart` | All known tool types (Read, Write, Edit, Bash, etc.) |
| `mapLLMToolUse` | With input, Without input |
| `mapLLMToolEnd` | With result, With error result |
| `mapLLMDone` | Normal completion |
| `mapSignalToDomain` | All 15 signal types (tasks, phases, criteria, phase-start, etc.) |

#### 2.4 TUI Reducer Tests

**File:** `src/__tests__/unit/tui-reducers.test.ts`

Test reducers in `src/consumers/tui/reducers/`:

| Reducer | Test Cases |
|---------|------------|
| `loopReducer` | LoopStarted, LoopCompleted, LoopFailed state transitions |
| `iterationReducer` | IterationStarted, IterationCompleted |
| `llmReducer` | Text accumulation, ToolStart, ToolUse, ToolEnd |
| `progressReducer` | Add progress entry, Multiple entries |
| `discoveryReducer` | Discovery start/complete/fail events |

---

### Phase 3: Integration Tests (Week 2-3)

#### 3.1 Discovery Stream Tests

**File:** `src/__tests__/integration/discovery-stream.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import { Effect, Stream, Chunk } from "effect";
import { createDiscoveryStream } from "@/orchestrator/discovery";
import { createTestLayers, mockTextEvent, mockDoneEvent, mockTasksSignal } from "../utils";

describe("Discovery Stream", () => {
  it("should emit DiscoveryStarted at beginning", async () => {
    const testLayers = createTestLayers({
      events: [mockDoneEvent()],
    });

    const events = await Effect.runPromise(
      createDiscoveryStream({ task: "Test task" }).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      )
    );

    const eventArray = Chunk.toArray(events);
    expect(eventArray[0]?._tag).toBe("DiscoveryStarted");
  });

  it("should emit DiscoveryCompleted with tasks on success", async () => {
    const tasks = [
      { id: "1", title: "Task 1", description: "Desc 1" },
      { id: "2", title: "Task 2", description: "Desc 2" },
    ];
    
    const testLayers = createTestLayers({
      events: [
        mockTextEvent(mockTasksSignal(tasks)),
        mockDoneEvent(),
      ],
    });

    const events = await Effect.runPromise(
      createDiscoveryStream({ task: "Test task" }).pipe(
        Stream.runCollect,
        Effect.provide(testLayers)
      )
    );

    const eventArray = Chunk.toArray(events);
    const completed = eventArray.find((e) => e._tag === "DiscoveryCompleted");
    expect(completed).toBeDefined();
  });

  it("should emit DiscoveryFailed on LLM error", async () => {
    // Test with mock LLM that throws
  });

  it("should parse TasksDefined signal and create plan", async () => {
    // Test signal parsing integration
  });
});
```

#### 3.2 Iteration Stream Tests

**File:** `src/__tests__/integration/iteration-stream.test.ts`

```typescript
describe("Iteration Stream", () => {
  describe("createIterationStream", () => {
    it("should emit IterationStarted with iteration number");
    it("should emit LLM events as they stream");
    it("should parse signals and emit plan updates");
    it("should emit IterationCompleted on LLM done");
    it("should handle tool use events");
  });
  
  describe("createRalphIterationStream", () => {
    it("should handle phase transitions");
    it("should extract learnings from guardrails");
    it("should handle criterion pass/fail");
    it("should continue to next phase on completion");
  });
});
```

#### 3.3 Plan Update Handlers Tests

**File:** `src/__tests__/integration/plan-update-handlers.test.ts`

Test all handlers in `src/orchestrator/plan-updates/handlers/`:

| Handler | Test Cases |
|---------|------------|
| `handleTasksDefined` | Create plan from tasks, Update existing plan |
| `handlePhasesDefined` | Add phases to current task, Replace phases |
| `handleCriteriaDefined` | Add criteria to phase, Phase validation |
| `handlePhaseStarted` | Update phase to in-progress, Emit event |
| `handlePhaseCompleted` | Update phase to completed, Advance to next |
| `handlePhaseFailed` | Update phase to failed, Include error reason |
| `handleCriterionPassed` | Mark criterion passed, Update plan |
| `handleCriterionFailed` | Mark criterion failed, Include reason |
| `handleTaskComplete` | Mark task completed, Move to next task |
| `handleGuardrail` | Store guardrail for learning |
| `handleLearning` | Store learning entry in progress |

#### 3.4 Memory Store Tests

**File:** `src/__tests__/integration/memory-stores.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { PlanStore } from "@/services/plan-store";
import * as MemoryPlan from "@/layers/plan/memory";

describe("Memory Stores", () => {
  describe("MemoryPlanStore", () => {
    it("should create a plan", async () => {
      const program = Effect.gen(function* () {
        const store = yield* PlanStore;
        const plan = { id: "test-1", tasks: [] };
        yield* store.create(plan);
        return yield* store.get("test-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryPlan.layer()))
      );

      expect(result._tag).toBe("Some");
    });

    it("should return None for non-existent plan", async () => {
      const program = Effect.gen(function* () {
        const store = yield* PlanStore;
        return yield* store.get("non-existent");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryPlan.layer()))
      );

      expect(result._tag).toBe("None");
    });

    it("should update a plan", async () => {
      // ... test implementation
    });

    it("should list all plans", async () => {
      // ... test implementation
    });
  });

  describe("MemorySessionStore", () => {
    it("should create a session");
    it("should get a session by id");
    it("should update session status");
    it("should list sessions");
  });

  describe("MemoryProgressStore", () => {
    it("should append progress entry");
    it("should load all entries for session");
  });

  describe("MemoryGuardrailsStore", () => {
    it("should add guardrail");
    it("should load guardrails for session");
  });

  describe("MemoryGit", () => {
    it("should create worktree");
    it("should commit changes");
    it("should create PR");
  });
});
```

---

### Phase 4: Error Path & Property Tests (Week 3-4)

#### 4.1 LLM Error Handling

**File:** `src/__tests__/error-paths/llm-errors.test.ts`

```typescript
describe("LLM Error Handling", () => {
  it("should emit IterationFailed when LLM throws", async () => {
    // Create mock LLM that throws
  });

  it("should include error details in failure event", async () => {
    // Verify error information is preserved
  });

  it("should allow loop to continue after LLM error", async () => {
    // Test retry behavior
  });

  it("should handle stream interruption gracefully", async () => {
    // Test partial stream handling
  });

  it("should not expose sensitive data in error messages", async () => {
    // Security: verify no API keys leaked
  });
});
```

#### 4.2 Store Error Handling

**File:** `src/__tests__/error-paths/store-errors.test.ts`

```typescript
describe("Store Error Handling", () => {
  describe("PlanStore errors", () => {
    it("should handle plan not found gracefully");
    it("should handle concurrent update conflict");
  });
  
  describe("SessionStore errors", () => {
    it("should handle session not found");
    it("should reject invalid status transition");
  });

  describe("Git errors", () => {
    it("should handle worktree creation failure");
    it("should handle commit failure");
    it("should handle push failure");
  });
});
```

#### 4.3 Signal Parsing Errors

**File:** `src/__tests__/error-paths/signal-parsing-errors.test.ts`

```typescript
describe("Signal Parsing Errors", () => {
  it("should handle malformed XML tags");
  it("should handle incomplete/unclosed signals");
  it("should handle unknown signal types");
  it("should handle invalid JSON in signal content");
  it("should not crash on random binary data");
  it("should handle nested signals correctly");
  it("should handle signals split across chunks");
});
```

#### 4.4 Property-Based Tests

**File:** `src/__tests__/properties/plan-state-machine.test.ts`

```typescript
import * as fc from "fast-check";
import { describe, it } from "bun:test";

// Arbitraries for generating test data
const taskStatusArbitrary = fc.constantFrom("pending", "in-progress", "completed", "failed");
const phaseStatusArbitrary = fc.constantFrom("pending", "in-progress", "completed", "failed");

describe("Plan State Machine Properties", () => {
  it("task status transitions are always valid", () => {
    fc.assert(
      fc.property(taskStatusArbitrary, taskStatusArbitrary, (from, to) => {
        const isValidTransition = validateStatusTransition(from, to);
        // Define valid transitions
        if (from === "pending") return to === "in-progress" || !isValidTransition;
        if (from === "in-progress") return ["completed", "failed"].includes(to) || !isValidTransition;
        if (from === "completed" || from === "failed") return !isValidTransition || from === to;
        return true;
      })
    );
  });

  it("completed tasks cannot be uncompleted", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          status: fc.constant("completed"),
          title: fc.string(),
        }),
        (task) => {
          const updated = attemptStatusChange(task, "pending");
          return updated.status === "completed";
        }
      )
    );
  });

  it("plan always maintains task count after updates", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), title: fc.string() }), { minLength: 1 }),
        (tasks) => {
          const plan = createPlanFromTasks(tasks);
          const updatedPlan = updatePlanWithPhases(plan, []);
          return updatedPlan.tasks.length === plan.tasks.length;
        }
      )
    );
  });
});
```

**File:** `src/__tests__/properties/signal-roundtrip.test.ts`

```typescript
import * as fc from "fast-check";

describe("Signal Roundtrip Properties", () => {
  it("parsed signal can be serialized and reparsed identically", () => {
    fc.assert(
      fc.property(signalArbitrary, (signal) => {
        const serialized = serializeSignal(signal);
        const reparsed = parseSignal(serialized);
        return deepEqual(signal, reparsed);
      })
    );
  });

  it("parser is idempotent on valid signals", () => {
    fc.assert(
      fc.property(validSignalTextArbitrary, (text) => {
        const parsed1 = parseSignals(text);
        const parsed2 = parseSignals(text);
        return deepEqual(parsed1, parsed2);
      })
    );
  });
});
```

**File:** `src/__tests__/properties/reducer-determinism.test.ts`

```typescript
import * as fc from "fast-check";

describe("Reducer Determinism Properties", () => {
  it("same state + event always produces same result", () => {
    fc.assert(
      fc.property(tuiStateArbitrary, domainEventArbitrary, (state, event) => {
        const result1 = reduce(state, event);
        const result2 = reduce(state, event);
        return deepEqual(result1, result2);
      })
    );
  });

  it("reducer never throws on valid input", () => {
    fc.assert(
      fc.property(tuiStateArbitrary, domainEventArbitrary, (state, event) => {
        try {
          reduce(state, event);
          return true;
        } catch {
          return false;
        }
      })
    );
  });
});
```

---

## Test Coverage Requirements

### Critical Paths (Must be 90%+)

| Module | Coverage Target | Rationale |
|--------|-----------------|-----------|
| `orchestrator/loop.ts` | 90% | Core execution flow |
| `orchestrator/iteration.ts` | 90% | Iteration lifecycle |
| `orchestrator/plan-updates.ts` | 95% | State correctness |
| `orchestrator/plan-updates/helpers.ts` | 100% | Pure functions, easy to test |
| `orchestrator/plan-updates/handlers/*` | 95% | Signal handling correctness |
| `layers/signal/ferix-parser.ts` | 95% | Input parsing security |

### Important Paths (Must be 80%+)

| Module | Coverage Target | Rationale |
|--------|-----------------|-----------|
| `orchestrator/prompt.ts` | 80% | LLM instruction quality |
| `orchestrator/mapping/*` | 80% | Event transformation |
| `layers/*/memory.ts` | 80% | Test infrastructure |

### Supporting Paths (Must be 60%+)

| Module | Coverage Target | Rationale |
|--------|-----------------|-----------|
| `consumers/tui/reducers/*` | 60% | UI state management |
| `consumers/headless/formatters/*` | 60% | Output formatting |
| `lib/registry.ts` | 70% | Utility functions |

---

## Security Considerations

### Test Security Checklist

1. **No secrets in tests:** All API keys/tokens use mocks
2. **Isolated test state:** Each test uses fresh memory layers
3. **Error exposure:** Ensure errors don't leak sensitive data
4. **Input validation:** Test schema validation rejects malformed input
5. **Boundary testing:** Test max input sizes, special characters

### Security-Focused Test Cases

```typescript
describe("Security", () => {
  it("should not expose API keys in error messages", async () => {
    // Trigger error and verify no sensitive data in message
  });

  it("should validate all external input against schemas", async () => {
    // Test invalid input is rejected
  });

  it("should handle oversized input gracefully", async () => {
    // Test with very large strings
  });

  it("should sanitize user input in prompts", async () => {
    // Test prompt injection prevention
  });

  it("should not execute arbitrary code from signals", async () => {
    // Test malicious signal content
  });
});
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Line Coverage | 80%+ | `bun test --coverage` |
| Critical Path Coverage | 90%+ | Coverage report by file |
| Test Execution Time | <10s | CI timing |
| Test Reliability | 0 flaky tests | CI history |
| Error Path Coverage | 100% of error types | Manual audit |

---

## Implementation Timeline

| Week | Deliverables |
|------|--------------|
| Week 1 | Test utilities setup, package.json updates, turbo.json config, Plan helpers unit tests |
| Week 2 | Prompt tests, Event mapping tests, TUI reducer unit tests |
| Week 3 | Integration tests (discovery, iteration, handlers, stores) |
| Week 4 | Error path tests, Property-based tests with fast-check |

---

## Dependencies

### New Dev Dependencies

```json
{
  "devDependencies": {
    "fast-check": "^3.22.0"
  }
}
```

### No Additional Runtime Dependencies

All test infrastructure uses existing Effect patterns and Bun's built-in test runner.

---

## CI/CD Integration (Future)

When ready to add CI coverage checks:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun run test
        working-directory: apps/code
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flaky tests from timing | High | Use deterministic mocks, avoid real timers |
| Test maintenance burden | Medium | Extract common patterns to utilities |
| Coverage gaming | Medium | Focus on meaningful assertions, code review |
| Slow test execution | Medium | Parallel execution, memory layers only |

---

## Appendix: Test File Priority

### P0 - Must Have (Week 1-2)

1. `src/__tests__/utils/*` - Test utilities foundation
2. `src/__tests__/unit/plan-updates-helpers.test.ts` - Core plan logic
3. `src/__tests__/unit/prompt-building.test.ts` - LLM prompt quality
4. `src/__tests__/integration/plan-update-handlers.test.ts` - Signal handling

### P1 - Should Have (Week 2-3)

5. `src/__tests__/unit/event-mapping.test.ts` - Event transformations
6. `src/__tests__/integration/discovery-stream.test.ts` - Discovery phase
7. `src/__tests__/integration/iteration-stream.test.ts` - Iteration phase
8. `src/__tests__/integration/memory-stores.test.ts` - Store implementations

### P2 - Nice to Have (Week 3-4)

9. `src/__tests__/error-paths/*.test.ts` - Error handling
10. `src/__tests__/properties/*.test.ts` - Property-based tests
11. `src/__tests__/unit/tui-reducers.test.ts` - TUI state management
