# Web UI for Streaming Terminal TUI to Browser

## Summary

**Effort Level: Medium (~2 weeks)**

Using Convex as the backend significantly simplifies the architecture. Instead of a direct WebSocket from CLI to browser, we use **Convex as a relay** - the CLI writes events to Convex, and the web app subscribes to them via Convex's real-time queries.

CLI authentication via device flow is already implemented.

## Architecture: Convex-Mediated Streaming

```
CLI (ferix code)              Convex Backend              Web Browser
     │                              │                          │
     │  mutations: writeEvent()     │                          │
     ├─────────────────────────────►│                          │
     │                              │  useQuery(getEvents)     │
     │                              │◄─────────────────────────┤
     │                              │  (auto-updates)          │
     │                              ├─────────────────────────►│
```

**Why this approach:**
- No WebSocket server needed in CLI
- Auth already solved (Better Auth + device flow)
- Convex handles real-time sync automatically
- Multiple browsers can watch same session
- Sessions persist even if CLI restarts
- Works across networks (no localhost limitation)

## Implementation Phases

### Phase 1: Convex Session/Event Schema - ~2-3 days

Add tables to store CLI session events in Convex.

**File to modify:** `apps/server/convex/schema.ts`

```typescript
// New tables
cliSessions: defineTable({
  sessionId: v.string(),         // matches .ferix/sessions/{id}.json
  userId: v.string(),            // authenticated user
  task: v.string(),              // original task description
  status: v.union(v.literal("active"), v.literal("completed"), v.literal("failed")),
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  // TUI state snapshot for late-joining viewers
  latestState: v.optional(v.any()),
  latestStateIndex: v.optional(v.number()),
})
.index("by_user", ["userId"])
.index("by_session", ["sessionId"]),

cliEvents: defineTable({
  sessionId: v.string(),
  eventIndex: v.number(),        // ordering
  event: v.any(),                // DomainEvent JSON
  timestamp: v.number(),
})
.index("by_session", ["sessionId"])
.index("by_session_index", ["sessionId", "eventIndex"]),
```

**Files to create:** `apps/server/convex/cliSessions.ts`
- `createSession` mutation - called when CLI starts
- `writeEvent` mutation - called for each DomainEvent
- `writeEvents` mutation - batch write for efficiency
- `updateState` mutation - periodic TUI state snapshots
- `endSession` mutation - called when CLI finishes
- `getSession` query - get session metadata
- `getEvents` query - get events (with cursor/pagination)
- `getActiveSessionsForUser` query - list user's active sessions

### Phase 2: CLI Convex Consumer - ~3-4 days

Create a new Consumer that writes events to Convex.

**Files to create:**
```
apps/cli/src/commands/code/consumers/convex/
├── index.ts
├── consumer.ts
└── client.ts
```

**Key implementation:**
```typescript
// consumer.ts
export function createConvexConsumer(
  sessionId: string,
  userId: string,
  task: string
): Consumer {
  const client = getAuthenticatedConvexClient(); // uses stored credentials

  return {
    consume: (events: Stream.Stream<DomainEvent, unknown, never>) =>
      Effect.gen(function* () {
        // Create session in Convex
        yield* Effect.promise(() =>
          client.mutation(api.cliSessions.createSession, { sessionId, userId, task })
        );

        let eventIndex = 0;
        let batch: DomainEvent[] = [];

        yield* events.pipe(
          Stream.runForEach((event) =>
            Effect.gen(function* () {
              batch.push(event);
              // Batch writes every 10 events or on important events
              if (batch.length >= 10 || isImportantEvent(event)) {
                yield* Effect.promise(() =>
                  client.mutation(api.cliSessions.writeEvents, {
                    sessionId,
                    events: batch.map((e, i) => ({
                      eventIndex: eventIndex + i,
                      event: e,
                    })),
                  })
                );
                eventIndex += batch.length;
                batch = [];
              }
            })
          )
        );

        // Flush remaining batch
        if (batch.length > 0) {
          yield* Effect.promise(() =>
            client.mutation(api.cliSessions.writeEvents, { sessionId, events: batch })
          );
        }

        // End session
        yield* Effect.promise(() =>
          client.mutation(api.cliSessions.endSession, { sessionId })
        );
      }),
  };
}
```

**CLI changes to `apps/cli/src/commands/code/index.ts`:**
- Add `--stream` or `--web` flag to enable Convex streaming
- Check for stored auth credentials before starting
- Run Convex consumer alongside TUI consumer (both consume same event stream)

### Phase 3: React Terminal Components - ~5-7 days

Create React components that render the TUI in browser.

**Files to create:**
```
packages/ui/src/components/terminal/
├── terminal.tsx
├── hooks/
│   ├── useSession.ts
│   ├── useEvents.ts
│   └── useTerminalState.ts
├── layout/
│   ├── statusBar.tsx
│   ├── taskBar.tsx
│   ├── footer.tsx
│   └── contentArea.tsx
├── views/
│   ├── logsView.tsx
│   ├── tasksView.tsx
│   └── detailView.tsx
├── reducer/
│   └── index.ts
└── styles/
    └── terminalColors.ts
```

**Key hook:**
```typescript
// useTerminalState.ts
function useTerminalState(sessionId: string) {
  // Get session with latest state snapshot
  const session = useQuery(api.cliSessions.getSession, { sessionId });

  // Get events since last snapshot (real-time updates)
  const events = useQuery(api.cliSessions.getEvents, {
    sessionId,
    afterIndex: session?.latestStateIndex ?? 0
  });

  // Reduce events into TUIState
  const state = useMemo(() => {
    let state = session?.latestState ?? createInitialState();
    for (const { event } of events ?? []) {
      state = reduce(state, event);
    }
    return state;
  }, [session?.latestState, events]);

  return { state, isLoading: session === undefined };
}
```

**Keyboard navigation hook:**
```typescript
// useKeyboard.ts - port bindings from CLI
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'j': case 'ArrowDown': dispatch({ type: 'SCROLL_DOWN' }); break;
      case 'k': case 'ArrowUp': dispatch({ type: 'SCROLL_UP' }); break;
      case '1': dispatch({ type: 'SET_VIEW', view: 'logs' }); break;
      case '2': dispatch({ type: 'SET_VIEW', view: 'tasks' }); break;
      case '3': dispatch({ type: 'SET_VIEW', view: 'detail' }); break;
      // etc.
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Phase 4: Web App Pages - ~2-3 days

Add terminal viewing pages to Next.js app.

**Files to create:**
```
apps/web/app/(app)/sessions/
├── page.tsx
└── [sessionId]/
    └── page.tsx
```

**Sessions list page:**
- Query `getActiveSessionsForUser`
- Show: task, status (active/completed/failed), duration, started time
- Active sessions highlighted
- Click to open terminal view

**Terminal viewer page:**
- Full-screen terminal component
- Real-time updates via Convex queries
- Status indicator (live/completed)
- Share button (copy URL)

## Shared Types Strategy

Export domain types from CLI package for web to import.

**Modify:** `apps/cli/package.json`
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./domain": "./dist/commands/code/domain/index.js",
    "./tui": "./dist/commands/code/consumers/tui/index.js"
  }
}
```

**Web imports:**
```typescript
import { type DomainEvent } from '@ferix/cli/domain';
import { reduce, createInitialState, type TUIState } from '@ferix/cli/tui';
```

## Critical Files Reference

| Purpose | File Path |
|---------|-----------|
| Consumer interface | `apps/cli/src/commands/code/consumers/types.ts` |
| TUI reducer | `apps/cli/src/commands/code/consumers/tui/reducers/index.ts` |
| TUI state schema | `apps/cli/src/commands/code/domain/schemas/tui.ts` |
| Event types | `apps/cli/src/commands/code/domain/schemas/events.ts` |
| Existing Convex schema | `apps/server/convex/schema.ts` |
| Existing CLI Convex usage | `apps/cli/src/commands/sync/resolveOrgs.ts` |

## Verification Plan

1. **Session creation**: Run `ferix code --stream "test"`, verify session appears in Convex dashboard
2. **Event streaming**: Verify events populate in `cliEvents` table
3. **Web list**: Open `/sessions`, verify session appears in list
4. **Web viewer**: Click session, verify terminal UI renders
5. **Real-time**: Make progress in CLI, verify web updates within ~1s
6. **Late join**: Start CLI, wait 30s, open browser - should show current state
7. **Multiple viewers**: Open same session in 2 tabs, both update
8. **Session end**: CLI finishes, verify status changes to "completed"

## Effort Breakdown

| Phase | Effort |
|-------|--------|
| Phase 1: Convex Schema + Functions | 2-3 days |
| Phase 2: CLI Consumer | 3-4 days |
| Phase 3: React Components | 5-7 days |
| Phase 4: Web Pages | 2-3 days |
| **Total** | **12-17 days (~2-3 weeks)** |

## Considerations

**Event volume:** LLMText events can be frequent. Mitigation:
- Batch writes (every 10 events or 500ms)
- State snapshots every ~50 events (late joiners don't replay all)
- Pagination on event queries

**Convex limits:** Check Convex document size limits for large state snapshots. May need to store state separately or compress.

**Offline handling:** If CLI loses network, buffer events locally and sync when reconnected.
