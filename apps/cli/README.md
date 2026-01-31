# @ferix/cli-v2

Composable RALPH loops for AI coding agents, built with Effect.

## Architecture

This CLI implements the RALPH (Review, Analyze, Learn, Plan, Help) loop pattern using Effect for type-safe, composable, and testable code.

### Directory Structure

```
src/
├── consumers/           # Event consumers (output handlers)
│   ├── headless/       # Simple console output
│   └── tui/            # Full-screen terminal UI
│       ├── input/      # Keyboard/mouse input handling
│       ├── output/     # ANSI terminal output
│       ├── reducers/   # State reducers for events
│       ├── render/     # UI rendering components
│       └── tools/      # Tool formatting utilities
│
├── domain/             # Core domain types and schemas
│   └── schemas/        # Effect.Schema definitions
│       ├── config.ts   # Loop configuration
│       ├── events.ts   # Domain events
│       ├── llm.ts      # LLM event types
│       ├── logger.ts   # Logger types
│       ├── plan.ts     # Plan/task schemas
│       ├── program.ts  # Program options
│       ├── session.ts  # Session state
│       ├── signals.ts  # Signal types
│       ├── shared.ts   # Shared utilities
│       └── tui.ts      # TUI state types
│
├── layers/             # Effect Layer implementations
│   ├── llm/           # LLM providers (Claude CLI, Mock)
│   ├── logger/        # Logger implementations
│   ├── plan/          # Plan storage
│   ├── session/       # Session storage
│   └── signal/        # Signal parsers
│
├── orchestrator/       # Loop orchestration
│   └── mapping/       # Event mapping (LLM → Domain)
│
└── services/          # Effect Service definitions
```

## Effect Best Practices

### Schema-First Design

All data types are defined using `Effect.Schema` for runtime validation and type inference:

```typescript
import { Schema as S } from "effect";

export const TaskStatusSchema = S.Literal("pending", "in_progress", "done", "failed");
export type TaskStatus = typeof TaskStatusSchema.Type;

export const TaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  status: TaskStatusSchema,
});
export type Task = typeof TaskSchema.Type;
```

### Service Pattern

Services are defined as interfaces with Effect Context tags:

```typescript
import { Context, Effect } from "effect";

export interface LoggerService {
  readonly info: (message: string) => Effect.Effect<void>;
  readonly error: (message: string) => Effect.Effect<void>;
}

export class Logger extends Context.Tag("@ferix/Logger")<Logger, LoggerService>() {}
```

### Layer Composition

Implementations are provided via Layers for dependency injection:

```typescript
import { Effect, Layer } from "effect";

export const ConsoleLoggerLive = Layer.succeed(Logger, {
  info: (msg) => Effect.sync(() => console.log(msg)),
  error: (msg) => Effect.sync(() => console.error(msg)),
});
```

### Tagged Unions for Events

Domain events use discriminated unions with `_tag`:

```typescript
export const TextEventSchema = S.TaggedStruct("Text", {
  text: S.String,
});

export const DoneEventSchema = S.TaggedStruct("Done", {
  output: S.String,
});

export const LLMEventSchema = S.Union(TextEventSchema, DoneEventSchema);
```

### Stream-Based Processing

LLM output is processed as Effect Streams for backpressure and composability:

```typescript
const events: Stream.Stream<LLMEvent, LLMError> = llm.execute(prompt);

const domainEvents = events.pipe(
  Stream.mapConcat(mapLLMEventToDomain),
  Stream.tap((event) => logger.info(`Event: ${event._tag}`))
);
```

### Error Handling

Errors are typed and handled explicitly:

```typescript
import { Data } from "effect";

export class LLMError extends Data.TaggedError("LLMError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

## Key Patterns

### Registry Pattern

Extensible handlers use a registry pattern:

```typescript
// Define registry
const registry = new Map<string, Handler>();

// Register handlers
registry.set("Text", handleText);
registry.set("Done", handleDone);

// Use registry
const handler = registry.get(event._tag);
```

### Reducer Pattern (TUI)

TUI state updates use pure reducer functions:

```typescript
function reduce(state: TUIState, event: DomainEvent): TUIState {
  return stateReducerRegistry.reduce(state, event);
}
```

### Direct Schema Imports

Types are imported directly from schema files (no re-exports):

```typescript
// Good - direct import
import type { TUIState } from "../domain/schemas/tui.js";

// Avoid - re-exports
import type { TUIState } from "../state.js"; // re-exporting from schema
```

## Usage

```typescript
import { Effect } from "effect";
import { run } from "@ferix/cli-v2";

await run({
  config: {
    task: "Implement the feature",
    maxIterations: 3,
    verifyCommands: ["bun test"],
  },
  consumer: "tui",
}).pipe(Effect.runPromise);
```

## Testing

Mock layers enable isolated testing:

```typescript
import { Mock } from "./layers/llm/mock.js";

const mockEvents: LLMEvent[] = [
  { _tag: "Text", text: "Working..." },
  { _tag: "Done", output: "Complete" },
];

const testLayer = Mock.layer({ events: mockEvents });
```

## Commands

```bash
bun run build      # Build the CLI
bun run dev        # Watch mode
bun run test       # Run tests
bun run check-types # Type check
```
