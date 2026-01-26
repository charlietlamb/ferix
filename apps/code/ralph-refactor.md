# RALPH Loop Refactor PRD

## Overview

This document outlines improvements to the RALPH (Read-Analyze-Loop-Plan-Handle) loop implementation in `apps/code` to align with modern best practices for agentic AI systems.

**Current State**: The codebase has excellent Effect.ts architecture but needs improvements in LLM instance lifecycle, context window management, and iteration isolation.

**Target State**: A fully isolated, token-aware RALPH loop with explicit instance management and robust retry logic.

---

## Goals

1. **Explicit LLM Instance Isolation** - Each iteration gets a demonstrably fresh LLM context
2. **Token-Aware Prompt Construction** - Prevent context window overflow with explicit budgeting
3. **Robust Retry Logic** - Handle transient failures gracefully without loop termination
4. **Iteration-Scoped State** - Prevent accidental state mutation leakage between iterations
5. **Observability** - Add metrics and logging for debugging iteration behavior

---

## Non-Goals

- Changing the underlying CLI providers (Claude, Cursor, OpenCode)
- Modifying the consumer architecture (TUI, headless)
- Changing the signal parsing system
- Modifying git worktree isolation (already excellent)

---

## Technical Design

### 1. LLM Session Abstraction

#### Problem

The current design injects a single `LLM` service instance at loop start and reuses it for all iterations:

```typescript
// Current: src/orchestrator/loop.ts:81
const llm = yield* LLM;  // Injected once

// Used for discovery AND all iterations
createDiscoveryStream(llm, ...)
createIterationStream(llm, ...)  // Same instance
```

While each `execute()` call spawns a fresh CLI process, the service layer doesn't enforce or communicate iteration isolation.

#### Solution

Introduce an `LLMSession` abstraction that makes iteration boundaries explicit:

```typescript
// New: src/services/llm-session.ts

export interface LLMSessionConfig {
  readonly sessionId: string;
  readonly iterationId: number;
  readonly maxTokens?: number;
}

export interface LLMSession {
  readonly config: LLMSessionConfig;
  readonly execute: (
    prompt: string,
    options?: LLMExecuteOptions
  ) => Stream.Stream<LLMEvent, LLMError>;
  readonly getTokensUsed: () => Effect.Effect<number>;
}

export interface LLMSessionFactory {
  readonly createSession: (
    config: LLMSessionConfig
  ) => Effect.Effect<LLMSession, LLMError>;
}

export class LLMFactory extends Context.Tag("@ferix/LLMFactory")<
  LLMFactory,
  LLMSessionFactory
>() {}
```

#### Implementation

```typescript
// New: src/layers/llm/session-factory.ts

export function createSessionFactory(
  provider: Provider
): LLMSessionFactory {
  return {
    createSession: (config: LLMSessionConfig) =>
      Effect.gen(function* () {
        const tokensUsedRef = yield* Ref.make(0);

        return {
          config,

          execute: (prompt, options) => {
            // Log session context for debugging
            return pipe(
              provider.execute(prompt, options),
              Stream.tap((event) =>
                event._tag === "Done"
                  ? Ref.update(tokensUsedRef, (n) => n + estimateTokens(event.output))
                  : Effect.void
              ),
              Stream.ensuring(
                Effect.logDebug("LLM session execute completed", {
                  sessionId: config.sessionId,
                  iterationId: config.iterationId,
                })
              )
            );
          },

          getTokensUsed: () => Ref.get(tokensUsedRef),
        };
      }),
  };
}
```

#### Migration Path

1. Add `LLMFactory` service alongside existing `LLM` service
2. Update `createIterationStream` to accept `LLMSession` instead of `LLM`
3. Create new session at start of each iteration
4. Deprecate direct `LLM` usage in iteration code
5. Remove deprecated code after migration complete

#### Files to Modify

- `src/services/llm.ts` - Add `LLMSession` and `LLMFactory` interfaces
- `src/layers/llm/session-factory.ts` - New file for session factory
- `src/layers/llm/providers/*.ts` - Update to use session factory
- `src/orchestrator/loop.ts` - Use factory to create sessions per iteration
- `src/orchestrator/iteration.ts` - Accept `LLMSession` instead of `LLM`

---

### 2. Token-Aware Prompt Construction

#### Problem

Prompts are built by concatenating sections with no size awareness:

```typescript
// Current: src/orchestrator/prompt.ts:398
return sections.join("\n\n");  // No token checking
```

This can cause context window overflow, especially with:
- Large guardrail collections
- Long progress histories
- Complex task descriptions

#### Solution

Implement a token budget system with intelligent truncation:

```typescript
// New: src/services/token-budget.ts

export interface TokenBudget {
  readonly maxTokens: number;
  readonly reservedForResponse: number;
  readonly sections: TokenSection[];
}

export interface TokenSection {
  readonly name: string;
  readonly content: string;
  readonly tokens: number;
  readonly priority: "required" | "high" | "medium" | "low";
  readonly truncatable: boolean;
}

export interface TokenBudgetService {
  readonly estimateTokens: (text: string) => Effect.Effect<number>;
  readonly buildPromptWithBudget: (
    sections: TokenSection[],
    budget: TokenBudget
  ) => Effect.Effect<string, TokenBudgetExceededError>;
}

export class TokenBudgetError extends Data.TaggedError("TokenBudgetError")<{
  readonly message: string;
  readonly budgetUsed: number;
  readonly budgetMax: number;
  readonly overflowSections: string[];
}> {}
```

#### Implementation

```typescript
// New: src/layers/token-budget/tiktoken.ts

import { encoding_for_model } from "tiktoken";

export const TiktokenBudget = Layer.effect(
  TokenBudget,
  Effect.gen(function* () {
    // Use cl100k_base for Claude models
    const encoder = encoding_for_model("gpt-4");  // Compatible tokenizer

    return {
      estimateTokens: (text: string) =>
        Effect.sync(() => encoder.encode(text).length),

      buildPromptWithBudget: (sections, budget) =>
        Effect.gen(function* () {
          const availableTokens = budget.maxTokens - budget.reservedForResponse;
          let usedTokens = 0;
          const includedSections: string[] = [];
          const overflowSections: string[] = [];

          // Sort by priority
          const sorted = [...sections].sort((a, b) =>
            priorityOrder(a.priority) - priorityOrder(b.priority)
          );

          for (const section of sorted) {
            if (usedTokens + section.tokens <= availableTokens) {
              includedSections.push(section.content);
              usedTokens += section.tokens;
            } else if (section.truncatable) {
              // Truncate to fit
              const remainingTokens = availableTokens - usedTokens;
              const truncated = yield* truncateToTokens(
                section.content,
                remainingTokens,
                encoder
              );
              includedSections.push(truncated);
              usedTokens = availableTokens;
            } else if (section.priority === "required") {
              // Required section doesn't fit - error
              return yield* Effect.fail(
                new TokenBudgetError({
                  message: `Required section "${section.name}" exceeds budget`,
                  budgetUsed: usedTokens,
                  budgetMax: availableTokens,
                  overflowSections: [section.name],
                })
              );
            } else {
              overflowSections.push(section.name);
            }
          }

          if (overflowSections.length > 0) {
            yield* Effect.logWarning("Sections excluded due to token budget", {
              excluded: overflowSections,
              budgetUsed: usedTokens,
              budgetMax: availableTokens,
            });
          }

          return includedSections.join("\n\n");
        }),
    };
  })
);
```

#### Prompt Builder Updates

```typescript
// Updated: src/orchestrator/prompt.ts

export function buildRalphPromptWithBudget(
  config: LoopConfig,
  iteration: number,
  context: RalphIterationContext,
  tokenBudget: TokenBudgetService
): Effect.Effect<string, TokenBudgetError> {
  return Effect.gen(function* () {
    const sections: TokenSection[] = [];

    // System prompt - required, not truncatable
    const systemPrompt = buildSystemPrompt(config.prompts);
    sections.push({
      name: "system",
      content: systemPrompt,
      tokens: yield* tokenBudget.estimateTokens(systemPrompt),
      priority: "required",
      truncatable: false,
    });

    // Current task - required
    const taskSection = buildCurrentTaskOnlySection(context.currentTask);
    sections.push({
      name: "currentTask",
      content: taskSection,
      tokens: yield* tokenBudget.estimateTokens(taskSection),
      priority: "required",
      truncatable: false,
    });

    // Guardrails - high priority, truncatable
    const guardrailsSection = buildGuardrailsSection(context.guardrails);
    if (guardrailsSection) {
      sections.push({
        name: "guardrails",
        content: guardrailsSection,
        tokens: yield* tokenBudget.estimateTokens(guardrailsSection),
        priority: "high",
        truncatable: true,
      });
    }

    // Progress summary - medium priority, truncatable
    if (context.progressSummary) {
      sections.push({
        name: "progress",
        content: `## Previous Progress\n\n${context.progressSummary}`,
        tokens: yield* tokenBudget.estimateTokens(context.progressSummary),
        priority: "medium",
        truncatable: true,
      });
    }

    // Learnings - low priority, truncatable
    const learningsSection = buildLearningsSection(context.recentLearnings);
    if (learningsSection) {
      sections.push({
        name: "learnings",
        content: learningsSection,
        tokens: yield* tokenBudget.estimateTokens(learningsSection),
        priority: "low",
        truncatable: true,
      });
    }

    // Phase prompts - required
    // ... add other required sections

    const budget: TokenBudget = {
      maxTokens: config.maxContextTokens ?? 100000,  // Default for Claude
      reservedForResponse: config.maxResponseTokens ?? 8000,
      sections,
    };

    return yield* tokenBudget.buildPromptWithBudget(sections, budget);
  });
}
```

#### Files to Modify

- `src/services/token-budget.ts` - New service interface
- `src/layers/token-budget/tiktoken.ts` - New tiktoken implementation
- `src/layers/token-budget/simple.ts` - New simple char-based fallback
- `src/orchestrator/prompt.ts` - Add budget-aware prompt builder
- `src/orchestrator/iteration.ts` - Use budget-aware prompt builder
- `src/domain/schemas/config.ts` - Add `maxContextTokens`, `maxResponseTokens`

---

### 3. Retry Logic for Transient Failures

#### Problem

LLM failures currently terminate the iteration immediately:

```typescript
// Current: src/orchestrator/iteration.ts:271-281
Stream.catchAll((error: OrchestratorError) =>
  Stream.succeed({
    _tag: "LoopFailed",
    error: { message, phase, iteration },
  } as DomainEvent)
)
```

Transient failures (network issues, rate limits, temporary API errors) should be retried.

#### Solution

Implement configurable retry logic with exponential backoff:

```typescript
// New: src/services/retry-policy.ts

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly retryableErrors: readonly string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "rate_limit",
    "overloaded",
    "internal_error",
  ],
};

export function isRetryable(error: LLMError, policy: RetryPolicy): boolean {
  return policy.retryableErrors.some(
    (pattern) =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

#### Implementation

```typescript
// Updated: src/orchestrator/iteration.ts

function createLLMStreamWithRetry(
  llmSession: LLMSession,
  prompt: string,
  options: LLMExecuteOptions | undefined,
  retryPolicy: RetryPolicy,
  iteration: number
): Stream.Stream<LLMEvent, OrchestratorError> {
  return pipe(
    llmSession.execute(prompt, options),
    Stream.mapError((e) => new OrchestratorError({
      message: `LLM execution failed: ${String(e)}`,
      phase: "iteration",
      cause: e,
    })),
    // Retry the entire stream on retryable errors
    retryStream(retryPolicy, (error, attempt) =>
      Effect.gen(function* () {
        if (!isRetryable(error, retryPolicy)) {
          return false;  // Don't retry
        }

        const delay = Math.min(
          retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, attempt - 1),
          retryPolicy.maxDelayMs
        );

        yield* Effect.logWarning("Retrying LLM execution", {
          iteration,
          attempt,
          delay,
          error: error.message,
        });

        yield* Effect.sleep(Duration.millis(delay));

        return true;  // Retry
      })
    )
  );
}

// Helper to retry a stream
function retryStream<A, E>(
  policy: RetryPolicy,
  shouldRetry: (error: E, attempt: number) => Effect.Effect<boolean>
): (stream: Stream.Stream<A, E>) => Stream.Stream<A, E> {
  return (stream) =>
    Stream.unwrap(
      Effect.gen(function* () {
        let attempt = 1;

        const tryStream = (): Stream.Stream<A, E> =>
          pipe(
            stream,
            Stream.catchAll((error) =>
              Stream.unwrap(
                Effect.gen(function* () {
                  if (attempt >= policy.maxAttempts) {
                    return Stream.fail(error);
                  }

                  const retry = yield* shouldRetry(error, attempt);
                  if (!retry) {
                    return Stream.fail(error);
                  }

                  attempt += 1;
                  return tryStream();  // Recursive retry
                })
              )
            )
          );

        return tryStream();
      })
    );
}
```

#### Events for Observability

```typescript
// Add to: src/domain/schemas/events.ts

export interface LLMRetryEvent {
  readonly _tag: "LLMRetry";
  readonly iteration: number;
  readonly attempt: number;
  readonly delay: number;
  readonly error: string;
  readonly timestamp: number;
}

export interface LLMRetryExhaustedEvent {
  readonly _tag: "LLMRetryExhausted";
  readonly iteration: number;
  readonly attempts: number;
  readonly finalError: string;
  readonly timestamp: number;
}
```

#### Files to Modify

- `src/services/retry-policy.ts` - New retry policy interface
- `src/orchestrator/iteration.ts` - Add retry wrapper
- `src/domain/schemas/events.ts` - Add retry events
- `src/domain/schemas/config.ts` - Add retry configuration
- `src/consumers/headless/formatters.ts` - Format retry events
- `src/consumers/tui/reducers.ts` - Handle retry events in TUI

---

### 4. Iteration-Scoped State

#### Problem

The `currentPlanRef` is shared across iterations and mutated in place:

```typescript
// Current: src/orchestrator/loop.ts:142
const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

// Shared and mutated by all iterations
```

This creates potential for:
- Accidental state leakage between iterations
- Race conditions if iterations overlap
- Difficult debugging of state changes

#### Solution

Create iteration-scoped state with explicit merge points:

```typescript
// New: src/orchestrator/iteration-state.ts

export interface IterationState {
  readonly plan: Plan | undefined;
  readonly learnings: IterationLearnings;
  readonly persistenceState: PlanPersistenceState;
}

export interface IterationStateManager {
  /** Create a fresh state snapshot for an iteration */
  readonly snapshot: () => Effect.Effect<IterationState>;

  /** Merge iteration changes back to shared state */
  readonly commit: (state: IterationState) => Effect.Effect<void>;

  /** Discard iteration changes (on failure) */
  readonly rollback: () => Effect.Effect<void>;
}

export function createIterationStateManager(
  sharedPlanRef: Ref.Ref<Plan | undefined>,
  planStore: PlanStoreService,
  sessionId: string
): IterationStateManager {
  return {
    snapshot: () =>
      Effect.gen(function* () {
        const plan = yield* Ref.get(sharedPlanRef);
        return {
          // Deep clone to prevent mutation leakage
          plan: plan ? structuredClone(plan) : undefined,
          learnings: { learnings: [], guardrails: [] },
          persistenceState: { dirty: false, pendingOperation: null },
        };
      }),

    commit: (state) =>
      Effect.gen(function* () {
        // Update shared ref
        yield* Ref.set(sharedPlanRef, state.plan);

        // Persist to disk
        if (state.plan && state.persistenceState.dirty) {
          yield* planStore.save(sessionId, state.plan);
        }
      }),

    rollback: () =>
      Effect.logDebug("Iteration state rolled back (changes discarded)"),
  };
}
```

#### Updated Iteration Stream

```typescript
// Updated: src/orchestrator/iteration.ts

export function createIterationStreamV2(
  llmFactory: LLMSessionFactory,
  signalParser: SignalParserService,
  planStore: PlanStoreService,
  stateManager: IterationStateManager,
  loopCompletedRef: Ref.Ref<boolean>,
  config: LoopConfig,
  iteration: number,
  sessionId: string,
  worktreePath?: string
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      // 1. Create fresh LLM session for this iteration
      const llmSession = yield* llmFactory.createSession({
        sessionId,
        iterationId: iteration,
        maxTokens: config.maxContextTokens,
      });

      // 2. Snapshot state for this iteration
      const iterationState = yield* stateManager.snapshot();
      const iterationPlanRef = yield* Ref.make(iterationState.plan);
      const iterationLearningsRef = yield* Ref.make(iterationState.learnings);
      const persistenceStateRef = yield* Ref.make(iterationState.persistenceState);

      // 3. Build prompt with current state
      const prompt = buildPrompt(config, iteration, iterationState.plan);

      // 4. Execute with iteration-scoped refs
      const llmStream = createLLMStreamWithRetry(
        llmSession,
        prompt,
        worktreePath ? { cwd: worktreePath } : undefined,
        config.retryPolicy ?? DEFAULT_RETRY_POLICY,
        iteration
      ).pipe(
        Stream.flatMap((llmEvent) =>
          processLLMEventWithState(
            signalParser,
            llmEvent,
            iterationPlanRef,
            iterationLearningsRef,
            persistenceStateRef,
            loopCompletedRef,
            sessionId,
            config.task
          )
        )
      );

      // 5. Commit on success, rollback on failure
      const completionStream = Stream.fromEffect(
        Effect.gen(function* () {
          const finalPlan = yield* Ref.get(iterationPlanRef);
          const finalLearnings = yield* Ref.get(iterationLearningsRef);
          const finalPersistence = yield* Ref.get(persistenceStateRef);

          yield* stateManager.commit({
            plan: finalPlan,
            learnings: finalLearnings,
            persistenceState: finalPersistence,
          });

          return { _tag: "IterationCompleted", iteration } as DomainEvent;
        })
      );

      return pipe(
        Stream.succeed({ _tag: "IterationStarted", iteration } as DomainEvent),
        Stream.concat(llmStream),
        Stream.concat(completionStream),
        Stream.catchAll((error) =>
          Stream.unwrap(
            Effect.gen(function* () {
              yield* stateManager.rollback();
              return Stream.succeed({
                _tag: "LoopFailed",
                error: { message: error.message, phase: "iteration", iteration },
              } as DomainEvent);
            })
          )
        )
      );
    })
  );
}
```

#### Files to Modify

- `src/orchestrator/iteration-state.ts` - New state manager
- `src/orchestrator/iteration.ts` - Use iteration-scoped state
- `src/orchestrator/loop.ts` - Create state manager per loop

---

### 5. Observability Improvements

#### Problem

Limited visibility into iteration behavior, especially:
- Token usage per iteration
- Retry attempts and failures
- State changes and mutations
- Performance timing

#### Solution

Add structured logging and metrics:

```typescript
// New: src/services/metrics.ts

export interface IterationMetrics {
  readonly iterationId: number;
  readonly sessionId: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly durationMs?: number;
  readonly tokensUsed?: number;
  readonly retryAttempts: number;
  readonly eventsEmitted: number;
  readonly signalsParsed: number;
  readonly planUpdates: number;
  readonly outcome: "success" | "failure" | "in_progress";
}

export interface MetricsService {
  readonly recordIteration: (metrics: IterationMetrics) => Effect.Effect<void>;
  readonly getSessionMetrics: (sessionId: string) => Effect.Effect<readonly IterationMetrics[]>;
}

export class Metrics extends Context.Tag("@ferix/Metrics")<
  Metrics,
  MetricsService
>() {}
```

#### Implementation

```typescript
// New: src/layers/metrics/in-memory.ts

export const InMemoryMetrics = Layer.effect(
  Metrics,
  Effect.gen(function* () {
    const store = yield* Ref.make<Map<string, IterationMetrics[]>>(new Map());

    return {
      recordIteration: (metrics) =>
        Ref.update(store, (map) => {
          const existing = map.get(metrics.sessionId) ?? [];
          map.set(metrics.sessionId, [...existing, metrics]);
          return map;
        }),

      getSessionMetrics: (sessionId) =>
        Ref.get(store).pipe(
          Effect.map((map) => map.get(sessionId) ?? [])
        ),
    };
  })
);
```

#### New Events

```typescript
// Add to: src/domain/schemas/events.ts

export interface IterationMetricsEvent {
  readonly _tag: "IterationMetrics";
  readonly metrics: IterationMetrics;
}

export interface TokenBudgetWarningEvent {
  readonly _tag: "TokenBudgetWarning";
  readonly iteration: number;
  readonly budgetUsed: number;
  readonly budgetMax: number;
  readonly excludedSections: readonly string[];
  readonly timestamp: number;
}
```

#### Files to Modify

- `src/services/metrics.ts` - New metrics service
- `src/layers/metrics/in-memory.ts` - In-memory implementation
- `src/layers/metrics/file.ts` - File-based implementation for persistence
- `src/domain/schemas/events.ts` - Add metrics events
- `src/orchestrator/iteration.ts` - Record metrics per iteration
- `src/orchestrator/loop.ts` - Inject metrics service

---

## Configuration Schema Updates

```typescript
// Updated: src/domain/schemas/config.ts

export const LoopConfigSchema = S.Struct({
  // Existing fields...
  task: S.String,
  maxIterations: S.Number,
  verifyCommands: S.Array(S.String),
  prompts: S.optional(PromptConfigSchema),

  // New fields
  maxContextTokens: S.optional(S.Number).pipe(
    S.propertySignature,
    S.withDefault(() => 100000)
  ),
  maxResponseTokens: S.optional(S.Number).pipe(
    S.propertySignature,
    S.withDefault(() => 8000)
  ),
  retryPolicy: S.optional(RetryPolicySchema),
  enableMetrics: S.optional(S.Boolean).pipe(
    S.propertySignature,
    S.withDefault(() => true)
  ),
});
```

---

## Migration Plan

### Phase 1: Foundation (Non-Breaking)
1. Add `LLMSession` and `LLMFactory` interfaces
2. Add `TokenBudgetService` interface
3. Add `RetryPolicy` configuration
4. Add `MetricsService` interface
5. **No changes to existing code paths**

### Phase 2: Implementation
1. Implement `TiktokenBudget` layer
2. Implement `InMemoryMetrics` layer
3. Implement session factory for each provider
4. Add retry wrapper utility

### Phase 3: Integration
1. Add `createIterationStreamV2` alongside existing function
2. Add `createRalphIterationStreamV2` alongside existing function
3. Add feature flag to switch between v1 and v2
4. Update consumers to handle new events

### Phase 4: Validation
1. Add integration tests for new iteration streams
2. Add property tests for token budget logic
3. Add load tests for retry behavior
4. Compare metrics between v1 and v2

### Phase 5: Migration
1. Make v2 the default
2. Deprecate v1 functions
3. Remove v1 after one release cycle

---

## Testing Strategy

### Unit Tests

```typescript
// test/token-budget.test.ts
describe("TokenBudgetService", () => {
  it("should include all sections when under budget", () => {...});
  it("should truncate low-priority sections when over budget", () => {...});
  it("should fail when required section exceeds budget", () => {...});
  it("should log warning when sections are excluded", () => {...});
});

// test/retry-policy.test.ts
describe("RetryPolicy", () => {
  it("should retry on retryable errors", () => {...});
  it("should not retry on non-retryable errors", () => {...});
  it("should respect max attempts", () => {...});
  it("should use exponential backoff", () => {...});
});

// test/iteration-state.test.ts
describe("IterationStateManager", () => {
  it("should create isolated snapshots", () => {...});
  it("should commit changes to shared state", () => {...});
  it("should rollback on failure", () => {...});
  it("should not leak mutations between iterations", () => {...});
});
```

### Integration Tests

```typescript
// test/iteration-v2.integration.test.ts
describe("createIterationStreamV2", () => {
  it("should create fresh LLM session per iteration", () => {...});
  it("should retry on transient failures", () => {...});
  it("should respect token budget", () => {...});
  it("should emit metrics events", () => {...});
  it("should rollback state on failure", () => {...});
});
```

### Property Tests

```typescript
// test/token-budget.property.test.ts
describe("Token Budget Properties", () => {
  it("output tokens should never exceed budget", () => {
    fc.assert(
      fc.property(
        fc.array(sectionArbitrary),
        fc.integer({ min: 1000, max: 100000 }),
        (sections, maxTokens) => {
          const result = buildPromptWithBudget(sections, { maxTokens, ... });
          return estimateTokens(result) <= maxTokens;
        }
      )
    );
  });
});
```

---

## Success Criteria

1. **LLM Isolation**: Each iteration demonstrably uses a fresh LLM session (verified via logs/metrics)
2. **Token Management**: No context window overflow errors in production
3. **Retry Success**: Transient failures are automatically recovered in >90% of cases
4. **State Isolation**: No state mutation leakage detected in integration tests
5. **Observability**: Full visibility into iteration behavior via metrics and events
6. **Performance**: No significant regression in iteration throughput (<5% overhead)

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | 1 week | Interfaces and types |
| Phase 2: Implementation | 2 weeks | Layer implementations |
| Phase 3: Integration | 1 week | V2 iteration streams |
| Phase 4: Validation | 1 week | Test coverage |
| Phase 5: Migration | 1 week | Default to v2, deprecate v1 |

**Total: 6 weeks**

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token estimation inaccuracy | Medium | Use tiktoken with fallback to character-based estimation |
| Retry storms on persistent failures | High | Cap total retry time per iteration, add circuit breaker |
| Performance overhead from state cloning | Low | Use structural sharing for large plans |
| Breaking changes during migration | High | Feature flags, gradual rollout, v1/v2 coexistence |

---

## Open Questions

1. Should we support different token budgets per provider (Claude vs Cursor)?
2. Should retry policy be configurable per-provider or global?
3. Should metrics be opt-in or opt-out by default?
4. Should we add a circuit breaker for repeated failures across iterations?

---

## Appendix: File Change Summary

### New Files
- `src/services/llm-session.ts`
- `src/services/token-budget.ts`
- `src/services/retry-policy.ts`
- `src/services/metrics.ts`
- `src/layers/llm/session-factory.ts`
- `src/layers/token-budget/tiktoken.ts`
- `src/layers/token-budget/simple.ts`
- `src/layers/metrics/in-memory.ts`
- `src/layers/metrics/file.ts`
- `src/orchestrator/iteration-state.ts`

### Modified Files
- `src/services/llm.ts` - Add session types
- `src/domain/schemas/config.ts` - Add new config fields
- `src/domain/schemas/events.ts` - Add new events
- `src/domain/errors.ts` - Add new error types
- `src/orchestrator/prompt.ts` - Add budget-aware builders
- `src/orchestrator/iteration.ts` - Add v2 iteration streams
- `src/orchestrator/loop.ts` - Integrate new services
- `src/layers/llm/providers/*.ts` - Add session factory support
- `src/consumers/headless/formatters.ts` - Handle new events
- `src/consumers/tui/reducers.ts` - Handle new events
