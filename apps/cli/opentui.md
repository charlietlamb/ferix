# OpenTUI Migration Plan

## Executive Summary

Migrate the current custom TUI implementation in `apps/cli/src/commands/code/consumers/` to use **OpenTUI** (`@opentui/core` and `@opentui/solid`). This will provide proper Kitty keyboard protocol support, enabling Shift+Enter to work correctly in Ghostty and other modern terminals.

---

## Why Migrate?

### Current Problem
- Shift+Enter doesn't work in Ghostty (sends same `\n` as regular Enter)
- Manual Kitty keyboard protocol implementation (`\x1b[>9u`) is not being respected
- No way to distinguish Shift+Enter from Enter without terminal-specific configuration

### Solution
OpenTUI has native Zig-based Kitty keyboard protocol support that works correctly with Ghostty, Kitty, iTerm2, and other modern terminals.

---

## Current State Analysis

### Architecture Overview

The current TUI has two main consumers:

1. **Launcher Consumer** (`consumers/launcher/`)
   - Session selector/launcher screen
   - New session input with text entry
   - Session list navigation
   - PR creation flow

2. **TUI Consumer** (`consumers/tui/`)
   - Main session view
   - Multiple view modes (logs, tasks, detail)
   - Live streaming output
   - Scrollable content

### Current File Count: ~60 files in consumers/

| Directory | Files | Purpose |
|-----------|-------|---------|
| `launcher/` | 8 | Launcher UI (consumer, input, state, render, terminal-utils) |
| `tui/` | 45+ | Main TUI (input handling, state, rendering, reducers, tags) |
| `headless/` | 10 | Non-interactive output formatters |
| Root | 2 | Types, index exports |

### Current Rendering Approach
- Manual ANSI escape code generation via `picocolors`
- Line-by-line rendering with box drawing characters
- Manual cursor positioning and screen clearing
- Custom input parsing with regex for key sequences

### Current Input Handling
- Raw mode via `process.stdin.setRawMode(true)`
- Manual stdin stream creation
- Regex-based key sequence parsing
- Attempted Kitty keyboard protocol (`\x1b[>9u`) - **not working**

---

## OpenTUI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - SolidJS Components (JSX)                                 │
│  - State management, business logic                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @opentui/solid                            │
│  - render() function                                         │
│  - JSX elements: <box>, <text>, <textarea>                  │
│  - Hooks: useRenderer, useKeyboard, useTerminalDimensions   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @opentui/core                             │
│  - Native Zig-based rendering                                │
│  - Kitty keyboard protocol (properly implemented)           │
│  - Yoga layout engine (CSS Flexbox)                          │
│  - Optimized buffer management                               │
└─────────────────────────────────────────────────────────────┘
```

### Key OpenTUI Features
- **Kitty Keyboard Protocol**: Native support via `useKittyKeyboard: {}` option
- **Declarative Rendering**: SolidJS components instead of imperative ANSI strings
- **Automatic Layout**: Yoga (CSS Flexbox) for layout calculations
- **Keyboard Events**: Structured `KeyEvent` objects with `shift`, `ctrl`, `meta` properties
- **Built-in Components**: `<textarea>`, `<box>`, `<text>`, `<scrollbox>`, etc.

---

## Dependencies Required

### New Dependencies
```json
{
  "@opentui/core": "0.1.75",
  "@opentui/solid": "0.1.75",
  "solid-js": "1.9.9"
}
```

### Build Requirements
- **Zig** must be installed (OpenTUI core includes Zig-based native rendering)
- **Bun** is the recommended runtime (already in use)

### Installation
```bash
# Install Zig (macOS)
brew install zig

# Install Zig (Linux)
# See https://ziglang.org/download/

# Add dependencies
bun add @opentui/core @opentui/solid solid-js
```

---

## Migration Strategy

### Phase 1: Setup & Infrastructure (1-2 days)

#### 1.1 Add Dependencies
```bash
cd apps/cli
bun add @opentui/core @opentui/solid solid-js
```

#### 1.2 Verify Zig Installation
```bash
zig version  # Should output version like 0.13.0
```

#### 1.3 Create OpenTUI Wrapper Module
Create new directory: `apps/cli/src/commands/code/consumers/opentui/`

**Files to create:**
- `index.ts` - Main exports
- `theme.ts` - Shared colors/styles  
- `utils.ts` - OpenTUI utilities

```typescript
// opentui/theme.ts
import { RGBA } from "@opentui/core"

export const theme = {
  brand: RGBA.fromHex("#7C3AED"),
  text: RGBA.fromHex("#E5E5E5"),
  textDim: RGBA.fromHex("#A3A3A3"),
  success: RGBA.fromHex("#22C55E"),
  warning: RGBA.fromHex("#EAB308"),
  error: RGBA.fromHex("#EF4444"),
  background: RGBA.fromHex("#171717"),
  border: RGBA.fromHex("#404040"),
}
```

---

### Phase 2: Launcher Consumer Migration (2-3 days)

The launcher is simpler and a good starting point.

#### 2.1 Create OpenTUI Launcher Components

| Current | OpenTUI Replacement |
|---------|---------------------|
| `render/index.ts` | `<LauncherApp />` root component |
| `render/sessions-list.ts` | `<SessionsList />`, `<SessionItem />` |
| `input.ts` (new task input) | `<textarea>` component with `onSubmit`, `onKeyDown` |
| `state.ts` | Keep as-is (pure state management) |
| `terminal-utils.ts` | Remove (OpenTUI handles this) |

#### 2.2 New Task Input with OpenTUI

This is the key component that fixes Shift+Enter:

```tsx
// launcher/components/NewTaskInput.tsx
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"

interface NewTaskInputProps {
  onSubmit: (text: string) => void
  onCancel: () => void
}

export function NewTaskInput(props: NewTaskInputProps) {
  const [text, setText] = createSignal("")

  return (
    <box flexDirection="column" width="100%" padding={1}>
      <text fg={theme.textDim}>What would you like to build?</text>
      <textarea
        value={text()}
        placeholder="Describe your task..."
        minHeight={1}
        maxHeight={6}
        onContentChange={(newText) => setText(newText)}
        onSubmit={() => {
          // Enter pressed (without shift) - submit task
          if (text().trim()) {
            props.onSubmit(text())
          }
        }}
        onKeyDown={(e) => {
          // Shift+Enter is handled automatically by textarea - inserts newline
          // Only handle other keys here
          if (e.name === "escape") {
            props.onCancel()
          }
        }}
      />
      <text fg={theme.textDim}>
        Press Enter to submit, Shift+Enter for new line, Esc to cancel
      </text>
    </box>
  )
}
```

#### 2.3 Session List with OpenTUI

```tsx
// launcher/components/SessionsList.tsx
import { For, createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { LauncherSession } from "../state"

interface SessionsListProps {
  sessions: LauncherSession[]
  onSelect: (session: LauncherSession) => void
  onNewTask: () => void
}

export function SessionsList(props: SessionsListProps) {
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  useKeyboard((evt) => {
    if (evt.name === "up" || evt.name === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1))
    }
    if (evt.name === "down" || evt.name === "j") {
      setSelectedIndex((i) => Math.min(props.sessions.length - 1, i + 1))
    }
    if (evt.name === "return" && !evt.shift) {
      const session = props.sessions[selectedIndex()]
      if (session) props.onSelect(session)
    }
    if (evt.name === "n") {
      props.onNewTask()
    }
  })

  return (
    <box flexDirection="column" width="100%">
      <For each={props.sessions}>
        {(session, index) => (
          <SessionItem
            session={session}
            selected={index() === selectedIndex()}
          />
        )}
      </For>
    </box>
  )
}
```

#### 2.4 Launcher App Root

```tsx
// launcher/components/App.tsx
import { render, useTerminalDimensions } from "@opentui/solid"
import { createSignal, Show } from "solid-js"
import { SessionsList } from "./SessionsList"
import { NewTaskInput } from "./NewTaskInput"
import { Header } from "./Header"
import type { LauncherState } from "../state"

export function LauncherApp(props: { initialState: LauncherState }) {
  const dimensions = useTerminalDimensions()
  const [state, setState] = createSignal(props.initialState)

  return (
    <box
      flexDirection="column"
      width={dimensions().width}
      height={dimensions().height}
    >
      <Header />
      
      <Show
        when={state().viewMode === "new_task"}
        fallback={
          <SessionsList
            sessions={state().sessions}
            onSelect={(session) => {/* handle selection */}}
            onNewTask={() => setState(s => ({ ...s, viewMode: "new_task" }))}
          />
        }
      >
        <NewTaskInput
          onSubmit={(text) => {/* handle submit */}}
          onCancel={() => setState(s => ({ ...s, viewMode: "sessions" }))}
        />
      </Show>
      
      <Footer />
    </box>
  )
}

// Entry point
export function runLauncher(initialState: LauncherState) {
  return new Promise<LauncherResult>((resolve) => {
    render(
      () => <LauncherApp initialState={initialState} onResult={resolve} />,
      {
        targetFps: 60,
        exitOnCtrlC: false,
        useKittyKeyboard: {}, // This enables proper Shift+Enter handling!
      }
    )
  })
}
```

---

### Phase 3: TUI Consumer Migration (3-5 days)

More complex due to streaming output and multiple views.

#### 3.1 Create Core TUI Components

| Current | OpenTUI Replacement |
|---------|---------------------|
| `consumer.ts` | `<TUIApp />` root component |
| `render/output-area.ts` | `<scrollbox>` with streaming content |
| `render/task-bar.ts` | `<TaskBar />` component |
| `render/status-bar.ts` | `<StatusBar />` component |
| `render/footer.ts` | `<Footer />` component |
| `render/views/*.ts` | View components (`<LogsView />`, `<TasksView />`, `<DetailView />`) |

#### 3.2 State Integration

Keep existing pure state management, use SolidJS signals for reactivity:

```tsx
// tui/components/App.tsx
import { createSignal, createEffect, Switch, Match } from "solid-js"
import { render, useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { reduce } from "../reducers"
import type { TUIState } from "../state"
import type { DomainEvent } from "../../types"

interface TUIAppProps {
  initialState: TUIState
  eventStream: AsyncIterable<DomainEvent>
}

export function TUIApp(props: TUIAppProps) {
  const dimensions = useTerminalDimensions()
  const [state, setState] = createSignal(props.initialState)

  // Subscribe to event stream
  createEffect(async () => {
    for await (const event of props.eventStream) {
      setState((s) => reduce(s, event))
    }
  })

  // Global keyboard handling
  useKeyboard((evt) => {
    if (evt.name === "escape") {
      // Handle escape
    }
    if (evt.name === "1") {
      setState((s) => ({ ...s, viewMode: "logs" }))
    }
    if (evt.name === "2") {
      setState((s) => ({ ...s, viewMode: "tasks" }))
    }
  })

  return (
    <box
      flexDirection="column"
      width={dimensions().width}
      height={dimensions().height}
    >
      <TaskBar state={state()} />
      
      <Switch>
        <Match when={state().viewMode === "logs"}>
          <LogsView state={state()} />
        </Match>
        <Match when={state().viewMode === "tasks"}>
          <TasksView state={state()} />
        </Match>
        <Match when={state().viewMode === "detail"}>
          <DetailView state={state()} />
        </Match>
      </Switch>
      
      <StatusBar state={state()} />
      <Footer />
    </box>
  )
}
```

#### 3.3 Streaming Output with Scrollbox

```tsx
// tui/components/OutputArea.tsx
import { For, createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"

interface OutputAreaProps {
  lines: string[]
  height: number
}

export function OutputArea(props: OutputAreaProps) {
  const [scrollOffset, setScrollOffset] = createSignal(0)
  const [userScrolled, setUserScrolled] = createSignal(false)

  // Auto-scroll to bottom unless user has scrolled up
  createEffect(() => {
    if (!userScrolled()) {
      setScrollOffset(Math.max(0, props.lines.length - props.height))
    }
  })

  useKeyboard((evt) => {
    if (evt.name === "up" || evt.name === "k") {
      setScrollOffset((o) => Math.max(0, o - 1))
      setUserScrolled(true)
    }
    if (evt.name === "down" || evt.name === "j") {
      setScrollOffset((o) => Math.min(props.lines.length - props.height, o + 1))
    }
    if (evt.name === "g" && evt.shift) {
      // Shift+G - go to bottom
      setScrollOffset(Math.max(0, props.lines.length - props.height))
      setUserScrolled(false)
    }
  })

  return (
    <scrollbox
      height={props.height}
      scrollY={scrollOffset()}
      onScroll={(offset) => {
        setScrollOffset(offset)
        setUserScrolled(true)
      }}
    >
      <For each={props.lines}>
        {(line) => <text>{styleFerixTags(line)}</text>}
      </For>
    </scrollbox>
  )
}
```

---

### Phase 4: Tag Styling Migration (1-2 days)

Adapt the ferix tag system for OpenTUI's styled text.

#### 4.1 Current Tag System
- Parses `<ferix:tool>` tags in output
- Applies ANSI color codes via `picocolors`

#### 4.2 OpenTUI Equivalent

```typescript
// tui/tags/opentui.ts
import { t, bold, fg, dim, underline } from "@opentui/core"
import type { StyledChunk } from "@opentui/core"

export function styleFerixTags(text: string): StyledChunk[] {
  const chunks: StyledChunk[] = []
  
  // Parse ferix tags and convert to OpenTUI styled chunks
  const tagRegex = /<ferix:(\w+)>(.*?)<\/ferix:\1>/g
  let lastIndex = 0
  let match
  
  while ((match = tagRegex.exec(text)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      chunks.push({ text: text.slice(lastIndex, match.index) })
    }
    
    const [, tagType, content] = match
    
    // Style based on tag type
    switch (tagType) {
      case "tool":
        chunks.push({ text: content, fg: theme.brand, attributes: TextAttributes.BOLD })
        break
      case "success":
        chunks.push({ text: content, fg: theme.success })
        break
      case "error":
        chunks.push({ text: content, fg: theme.error })
        break
      default:
        chunks.push({ text: content })
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    chunks.push({ text: text.slice(lastIndex) })
  }
  
  return chunks
}
```

---

### Phase 5: Cleanup & Testing (1-2 days)

#### 5.1 Files to Remove

After migration, these files become obsolete:

```
consumers/launcher/
├── terminal-utils.ts          # DELETE - OpenTUI handles terminal
├── render/                    # DELETE - Replaced by components/
│   ├── index.ts
│   └── sessions-list.ts

consumers/tui/
├── output/                    # DELETE - OpenTUI handles output
│   ├── ansi.ts
│   ├── types.ts
│   └── index.ts
├── render/                    # DELETE - Replaced by components/
│   ├── primitives.ts
│   ├── output-area.ts
│   ├── task-bar.ts
│   ├── status-bar.ts
│   ├── footer.ts
│   ├── index.ts
│   └── views/
├── input/                     # DELETE - OpenTUI handles input
│   ├── index.ts
│   ├── registry.ts
│   └── bindings/
```

#### 5.2 Files to Keep (Unchanged or Minimal Changes)

```
consumers/launcher/
├── state.ts                   # KEEP - Pure state management
├── index.ts                   # MODIFY - Update exports

consumers/tui/
├── state.ts                   # KEEP - Pure state management
├── reducers/                  # KEEP - Pure reducers
│   ├── index.ts
│   ├── registry.ts
│   ├── llm.ts
│   ├── tasks.ts
│   └── ...
├── tags/                      # MODIFY - Return OpenTUI styled text
│   ├── index.ts
│   ├── registry.ts
│   └── handlers/
├── constants.ts               # KEEP - Configuration
└── index.ts                   # MODIFY - Update exports

consumers/headless/            # KEEP - Unchanged
```

#### 5.3 Update Tests

```typescript
// tests/launcher.test.tsx
import { render } from "@opentui/solid"
import { LauncherApp } from "../launcher/components/App"

describe("Launcher", () => {
  it("should handle Shift+Enter in new task input", async () => {
    // OpenTUI provides testing utilities
    const { findByType, simulateKeyPress } = render(() => (
      <LauncherApp initialState={mockState} />
    ))
    
    const textarea = findByType("textarea")
    
    // Simulate Shift+Enter - should NOT submit
    simulateKeyPress({ name: "return", shift: true })
    expect(textarea.value).toContain("\n")
    
    // Simulate Enter - should submit
    simulateKeyPress({ name: "return", shift: false })
    expect(onSubmit).toHaveBeenCalled()
  })
})
```

---

## File Structure After Migration

```
apps/cli/src/commands/code/consumers/
├── opentui/                    # NEW: OpenTUI integration
│   ├── index.ts                # Main exports
│   ├── theme.ts                # Shared colors/styles
│   └── utils.ts                # OpenTUI utilities
├── launcher/
│   ├── components/             # NEW: SolidJS components
│   │   ├── App.tsx
│   │   ├── SessionsList.tsx
│   │   ├── SessionItem.tsx
│   │   ├── NewTaskInput.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── consumer.ts             # MODIFIED: Uses OpenTUI render()
│   ├── state.ts                # KEEP: Pure state management
│   └── index.ts
├── tui/
│   ├── components/             # NEW: SolidJS components
│   │   ├── App.tsx
│   │   ├── OutputArea.tsx
│   │   ├── TaskBar.tsx
│   │   ├── StatusBar.tsx
│   │   ├── Footer.tsx
│   │   └── views/
│   │       ├── LogsView.tsx
│   │       ├── TasksView.tsx
│   │       └── DetailView.tsx
│   ├── consumer.ts             # MODIFIED: Uses OpenTUI render()
│   ├── state.ts                # KEEP: Pure state management
│   ├── reducers/               # KEEP: Pure reducers
│   ├── tags/                   # MODIFIED: Return OpenTUI styled text
│   └── index.ts
├── headless/                   # KEEP: Unchanged
├── types.ts                    # KEEP: Shared types
└── index.ts
```

---

## Key Code Changes Summary

### Before (Current - Not Working)

```typescript
// terminal-utils.ts
process.stdin.setRawMode(true);
process.stdout.write("\x1b[>9u"); // Kitty protocol - NOT WORKING IN GHOSTTY

// input.ts
function parseInputKey(key: string, data: Buffer): LauncherKeyAction {
  if (key === "\x1b[13;2u") { // Shift+Enter - NEVER RECEIVED
    return { type: "newline" };
  }
  if (key === "\r" || key === "\n") { // Both Enter AND Shift+Enter hit this
    return { type: "submit" };
  }
}
```

### After (OpenTUI - Working)

```tsx
// components/NewTaskInput.tsx
<textarea
  onSubmit={() => props.onSubmit(inputText())}  // Enter only
  onKeyDown={(e) => {
    // Shift+Enter automatically inserts newline (handled by OpenTUI)
    if (e.name === "escape") props.onCancel()
  }}
/>

// consumer.ts
render(() => <LauncherApp />, {
  useKittyKeyboard: {}, // Proper Kitty protocol via native Zig code
  exitOnCtrlC: false,
})
```

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Setup & Infrastructure | 1-2 days | None |
| Phase 2: Launcher Migration | 2-3 days | Phase 1 |
| Phase 3: TUI Migration | 3-5 days | Phase 2 |
| Phase 4: Tag Styling | 1-2 days | Phase 3 |
| Phase 5: Cleanup & Testing | 1-2 days | Phase 4 |
| **Total** | **8-14 days** | |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zig dependency | Users need Zig installed | Document requirement, provide install instructions |
| Breaking changes | Existing functionality could break | Comprehensive testing, phased rollout |
| Performance | OpenTUI overhead | OpenTUI is optimized; benchmark critical paths |
| SolidJS learning curve | Development slowdown | SolidJS is similar to React, good docs available |
| OpenTUI bugs | Blocked on upstream fixes | Can contribute fixes to OpenTUI (same org) |

---

## References

- [OpenTUI GitHub](https://github.com/anomalyco/opentui)
- [OpenCode GitHub](https://github.com/anomalyco/opencode) - Reference implementation
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)
- [Kitty Keyboard Protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/)
- [Zig Installation](https://ziglang.org/download/)
