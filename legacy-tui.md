# Legacy CLI TUI Features - Complete Documentation

This document catalogs every feature of the legacy TUI implementation in `apps/cli/` for migration to CLI v2.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [ANSI Terminal Utilities](#2-ansi-terminal-utilities)
3. [RetroForm - Interactive Configuration](#3-retroform---interactive-configuration)
4. [DevMode - Full-Screen Execution Monitor](#4-devmode---full-screen-execution-monitor)
5. [Keyboard Shortcuts](#5-keyboard-shortcuts)
6. [Signal/Tag System](#6-signaltag-system)
7. [CLI Commands & Options](#7-cli-commands--options)
8. [Logger Utilities](#8-logger-utilities)
9. [Constants & Configuration](#9-constants--configuration)

---

## 1. Architecture Overview

### File Structure
```
apps/cli/src/tui/
├── index.ts                     # Main exports
├── retro-form.ts                # Backward compat wrapper
├── ansi.ts                      # ANSI escape codes (116 lines)
├── form/
│   ├── index.ts                 # RetroForm class (123 lines)
│   ├── intro.ts                 # ASCII logo screen (113 lines)
│   ├── summary.ts               # Config summary (74 lines)
│   ├── box-primitives.ts        # Box drawing (131 lines)
│   ├── box-renderer.ts          # High-level boxes (95 lines)
│   └── inputs/
│       ├── keyboard.ts          # Key parsing (154 lines)
│       ├── text.ts              # Text input (226 lines)
│       ├── select.ts            # Select input (116 lines)
│       └── confirm.ts           # Confirm input (117 lines)
└── dev-mode/
    ├── index.ts                 # DevMode class (744 lines)
    ├── state.ts                 # State management (76 lines)
    ├── layout.ts                # Layout constants (26 lines)
    ├── renderer.ts              # Full-screen render (156 lines)
    └── components/
        ├── status-bar.ts        # Execution status (134 lines)
        ├── task-bar.ts          # Current task (19 lines)
        ├── footer.ts            # Context help (108 lines)
        ├── output-area.ts       # Output formatting (208 lines)
        ├── tasks-list.ts        # Tasks list view (217 lines)
        └── task-detail.ts       # Task detail view (402 lines)
```

### Two Main TUI Modes
1. **RetroForm** - Interactive form system for configuration
2. **DevMode** - Full-screen real-time execution monitor

---

## 2. ANSI Terminal Utilities

**File**: `apps/cli/src/tui/ansi.ts`

### Screen Control Functions (lines 11-28)
| Function | Description | ANSI Code |
|----------|-------------|-----------|
| `screen.clear()` | Clear entire screen | `ESC 2J` |
| `screen.home()` | Move cursor to home | `ESC H` |
| `screen.moveTo(row, col)` | Position cursor | `ESC {row};{col}H` |
| `screen.hideCursor()` | Hide cursor | `ESC ?25l` |
| `screen.showCursor()` | Show cursor | `ESC ?25h` |
| `screen.alternateBuffer()` | Enter alternate buffer | `ESC ?1049h` |
| `screen.normalBuffer()` | Exit alternate buffer | `ESC ?1049l` |
| `screen.enableMouse()` | Enable mouse tracking | `ESC ?1000h + ESC ?1006h` |
| `screen.disableMouse()` | Disable mouse tracking | `ESC ?1000l + ESC ?1006l` |
| `screen.setScrollRegion(top, bottom)` | Set scroll region | 1-indexed |
| `screen.resetScrollRegion()` | Reset scroll region | Full screen |

### Color Palette (lines 31-53)
- **Basic**: red, green, yellow, blue, magenta, cyan, white
- **Bright**: brightRed, brightGreen, brightYellow, brightBlue, brightMagenta, brightCyan, brightWhite
- **Modifiers**: bold, dim, reset

### Decorative Symbols (lines 56-63)
| Symbol | Character | Usage |
|--------|-----------|-------|
| `diamond` | `◆` | Decorative bullet (magenta) |
| `arrowRight` | `▸` | Selection indicator |
| `bulletEmpty` | `○` | Unselected/pending |
| `bulletFilled` | `●` | Active/in-progress |
| `checkmark` | `✓` | Success |
| `cross` | `✗` | Failure |

### Box Drawing Characters (lines 66-84)
- **Single line**: `─`, `│`, `├`, `┤`
- **Double line**: `═`, `║`, `╔`, `╗`, `╚`, `╝`, `╠`, `╣`
- **Heavy line**: `━`

### Utility Functions (lines 87-115)
- `getTerminalSize()` - Returns `{rows, cols}` with fallback defaults
- `stripAnsi(str)` - Remove ANSI codes for length calculation
- `truncate(str, maxWidth)` - Truncate with ellipsis (`...`)
- `hyperlink(url, text)` - Create OSC 8 clickable terminal hyperlinks

---

## 3. RetroForm - Interactive Configuration

### RetroForm Class
**File**: `apps/cli/src/tui/form/index.ts`

```typescript
class RetroForm {
  private answers: Record<string, string | number | boolean> = {}
  private cancelled = false

  async showIntro(): Promise<void>
  async run(questions): Promise<Record<string, any> | null>
  private askQuestion(question)
  showSummary(items)
  showCancelled()
  showStarting()
}
```

### Question Types
**File**: `apps/cli/src/types/questions.ts`

#### TextQuestion (lines 9-18)
- `type: "text"`
- `id`, `label`, `placeholder?`, `required?`, `validate?`, `initial?`
- Multi-line input with Alt/Shift/Ctrl+Enter

#### SelectQuestion (lines 28-35)
- `type: "select"`
- `id`, `label`, `options: SelectOption[]`
- `initial?: string | number`
- Options: `{ value, label, hint? }`

#### ConfirmQuestion (lines 38-43)
- `type: "confirm"`
- `id`, `label`, `initial?: boolean`
- Yes/No toggle

### Intro Screen
**File**: `apps/cli/src/tui/form/intro.ts`

Features:
- ASCII art FERIX logo (8 lines, brightMagenta)
- Version display with cyan flanking: `═══════ v0.1.0 ═══════`
- Subtitle: "Composable RALPH Loops"
- 3-line description
- Decorative line with magenta diamonds
- "Press any key to continue" prompt

### Summary Screen
**File**: `apps/cli/src/tui/form/summary.ts`

- Title: "CONFIGURATION" with magenta diamond decorations
- Key-value pairs (keys cyan, 12-char width; values brightWhite)
- Double-bordered box
- `showCancelled()` - Yellow "Cancelled" message
- `showStarting()` - Green "Starting Ferix loop..." message

### Text Input Component
**File**: `apps/cli/src/tui/form/inputs/text.ts`

Features:
- Multi-line input with automatic line wrapping
- Cursor positioning with visual feedback
- Placeholder display (dim magenta)
- Validation: required fields + custom validation functions
- Error display with retry

Footer hints: `"Enter submit ◆ Alt+Enter newline ◆ Ctrl+C cancel"`

### Select Input Component
**File**: `apps/cli/src/tui/form/inputs/select.ts`

Features:
- Arrow/j/k navigation (wraps around)
- Selected: brightMagenta arrow, brightWhite label, hint visible
- Unselected: dim label, no hint
- Cursor hidden during interaction

Footer hints: `"↑/↓ navigate ◆ Enter select ◆ Ctrl+C cancel"`

### Confirm Input Component
**File**: `apps/cli/src/tui/form/inputs/confirm.ts`

Features:
- Yes/No toggle with Up/Down/j/k
- Direct selection with y/Y and n/N
- Default: true if not specified

Footer hints: `"↑/↓ or y/n ◆ Enter confirm ◆ Ctrl+C cancel"`

### Box Rendering
**File**: `apps/cli/src/tui/form/box-primitives.ts`

```typescript
interface BoxLayout {
  boxWidth: number;      // Total width including borders
  innerWidth: number;    // boxWidth - 2
  padding: number;       // Left padding for centering
  pad: string;           // Padding string
}
```

Functions:
- `calculateBoxLayout(cols?)` - Centered box dimensions
- `drawTopBorder(layout)` - Double-line cyan top
- `drawBottomBorder(layout)` - Double-line cyan bottom
- `drawSeparator(layout)` - Horizontal separator
- `drawContentLine(layout, content, options?)` - Bordered content
- `drawEmptyLine(layout)` - Empty bordered line
- `calculateVerticalPadding(boxHeight, rows?)` - Vertical centering

---

## 4. DevMode - Full-Screen Execution Monitor

### DevMode Class
**File**: `apps/cli/src/tui/dev-mode/index.ts`

```typescript
class DevMode {
  private readonly state: DevModeState
  private scrollOffset = 0
  private userScrolled = false

  constructor(task: string, maxIterations: number | string)

  // Lifecycle
  start()
  cleanup()
  waitForExit(): Promise<void>

  // State Updates
  setIteration(iteration)
  setTool(tool?)
  setTasks(tasks: Task[])
  markTaskDone(taskId)
  setPhases(taskId, phases)
  setCriteria(taskId, criteria)
  setPhaseInProgress(phaseId)
  markPhaseDone(phaseId)
  markPhaseFailed(phaseId)
  markCriterionPassed(criterionId)
  markCriterionFailed(criterionId, reason)
  setGitInfo(info)
  setExecutionMode(mode, taskId?)
  setCheckMode(attempt, taskId?)
  setVerifyMode(attempt)
  setReviewMode(attempt, taskId?)
  setVerifyCommand(command?)
  setStageStatus(taskId, stageName, status)
  setReviewChanges(taskId, madeChanges)
  addOutput(text)
  addToolUse(tool, detail)
  setComplete()
  setError()
  setStatus()
}
```

### State Structure
**File**: `apps/cli/src/tui/dev-mode/state.ts`

```typescript
interface DevModeState {
  task: string
  iteration: number
  maxIterations: number | string
  status: "idle" | "running" | "complete" | "error"
  currentTool?: string
  outputLines: string[]
  startTime: number
  taskStatus: "analyzing" | "tracking" | "none"
  tasks: Task[]
  viewMode: "logs" | "tasks" | "task-detail"
  tasksListState: { selectedIndex: number; scrollOffset: number }
  gitInfo: GitInfo
  executionMode: ExecutionMode
  currentTaskId?: number
  currentVerifyCommand?: string
  verifyAttempt?: number
  checkAttempt?: number
  reviewAttempt?: number
}
```

### View Modes
1. **Logs View** - Streaming output display
2. **Tasks List View** - Navigable task list with progress
3. **Task Detail View** - Full task details with phases/criteria

### Screen Layout
```
Row 1:    ╔════════════════════════════════╗  (top border)
Row 2:    ║ STATUS BAR                     ║  (mode, iteration, time, progress)
Row 3:    ║ TASK BAR                       ║  (task description)
Row 4:    ╠────────────────────────────────╠  (separator)
Rows 5-N: ║ CONTENT AREA                   ║  (logs/tasks/detail)
Row N-2:  ╠────────────────────────────────╠  (separator)
Row N-1:  ║ FOOTER                         ║  (keyboard hints)
Row N:    ╚════════════════════════════════╝  (bottom border)
```

### Status Bar Component
**File**: `apps/cli/src/tui/dev-mode/components/status-bar.ts`

Format: `◆ FERIX ◆ [SPINNER MODE] ITER/MAX TIME TASK_PROGRESS [TOOL] [VERIFY_CMD]`

Execution Modes with Colors:
| Mode | Color | Display |
|------|-------|---------|
| breakdown | brightMagenta | `BREAKDOWN` |
| planning | brightCyan | `PLAN #N` |
| working | brightGreen | `WORK #N` |
| checking | brightYellow | `CHECK #N` |
| verifying | yellow | `VERIFY (attempt/3)` |
| reviewing | brightMagenta | `REVIEW #N` |

### Spinner Animation
**File**: `apps/cli/src/tui/dev-mode/layout.ts`

Frames: `["|", "/", "-", "\\"]` - 4-frame rotation

### Task Bar Component
**File**: `apps/cli/src/tui/dev-mode/components/task-bar.ts`

Format: `◆ TASK │ [task description]`

### Footer Component
**File**: `apps/cli/src/tui/dev-mode/components/footer.ts`

**Logs View**: `◆ j/k scroll [pos] ◆ t tasks ◆ ^C quit`
**Tasks List**: `◆ j/k navigate ◆ Enter details ◆ Esc back ◆ ^C quit`
**Task Detail**: `◆ j/k scroll [pos] ◆ Esc back ◆ ^C quit`

### Output Area - Tag Styling
**File**: `apps/cli/src/tui/dev-mode/components/output-area.ts`

| Tag | Display |
|-----|---------|
| `<ferix:tasks>` | `┌─◆ TASKS ◆━━━━` |
| `</ferix:tasks>` | `└────┘` |
| `<task id="N">` | `│ [N] description` |
| `<ferix:task-done id="N"/>` | `✓ Task N complete` |
| `<ferix:complete>` | Diamond banner with checkmark |
| `<ferix:error>` | `◆ ERROR │ message` |
| `<phase id="N.M">` | `│ ├─ ○ [N.M] description` |
| `<ferix:phase-start>` | `│ ● Phase N.M started` |
| `<ferix:phase-done>` | `│ ✓ Phase N.M complete` |
| `<ferix:phase-failed>` | `│ ✗ Phase N.M failed: reason` |
| `<criterion id="N.cM">` | `│ ├─ ○ [N.cM] description` |
| `<ferix:criterion-passed>` | `✓ Criterion N.cM passed` |
| `<ferix:criterion-failed>` | `✗ Criterion N.cM failed: reason` |
| `<ferix:review-passed/>` | Diamond banner: `✓ REVIEW PASSED` |
| `<ferix:review-failed/>` | Diamond banner: `✗ REVIEW FAILED` |

### Tasks List View
**File**: `apps/cli/src/tui/dev-mode/components/tasks-list.ts`

Task Line Format: `▸ [1] ✓ description  00:00  0/0  ✓✓✓`
- Selection indicator (arrow or space)
- Task ID (brightMagenta)
- Status icon (green/yellow/dim)
- Description (truncated)
- Duration (cyan)
- Phase progress (dim)
- Stage indicators (check/verify/review)

Git Info Section:
```
◆ GIT │ branch-name → base-branch  ✓
◆ PR  │ [clickable-url]
```

### Task Detail View
**File**: `apps/cli/src/tui/dev-mode/components/task-detail.ts`

Layout:
1. Header: `◆ TASK #1 ◆`
2. Task description
3. Status with icon and text
4. Duration (if started)
5. Timestamps (start → end)
6. Phases section (tree structure)
7. Criteria section (if available)
8. Stages section (check/verify/review)
9. Git info section

Phase Display:
```
├─ ✓ [1.1] Phase description  00:15
│       10:30 → 10:45
└─ ● [1.2] In progress  00:05
        10:45 → ...
```

### Auto-Scroll Behavior
- Auto-scrolls to bottom as new output arrives
- Scrolling up sets `userScrolled = true`
- Reaching bottom re-enables auto-scroll
- Scroll position shown in footer (yellow when user-scrolled)

### Mouse Support
- Mouse wheel: Button 64 = scroll up, Button 65 = scroll down (3 lines)
- Works in all views
- SGR mouse format (ESC ?1006h)

---

## 5. Keyboard Shortcuts

### Text Input
| Key | Action |
|-----|--------|
| Enter | Submit |
| Alt+Enter / Shift+Enter / Ctrl+Enter | Insert newline |
| Ctrl+C | Cancel |
| Arrow keys | Navigate cursor |
| Backspace | Delete character / merge lines |

### Select Input
| Key | Action |
|-----|--------|
| Up/Down or j/k | Navigate options (wraps) |
| Enter | Select option |
| Ctrl+C | Cancel |

### Confirm Input
| Key | Action |
|-----|--------|
| Up/Down or j/k | Toggle yes/no |
| y/Y | Select yes |
| n/N | Select no |
| Enter | Confirm |
| Ctrl+C | Cancel |

### DevMode - Logs View
| Key | Action |
|-----|--------|
| j/k or arrows | Scroll 1 line |
| Page Up/Down | Scroll full page |
| g | Jump to top |
| G | Jump to bottom |
| t | Switch to tasks view |
| Ctrl+C | Quit |
| Mouse wheel | Scroll 3 lines |

### DevMode - Tasks List
| Key | Action |
|-----|--------|
| j/k or arrows | Select task (wraps) |
| Enter | View task details |
| g | First task |
| G | Last task |
| Esc | Return to logs |
| Ctrl+C | Quit |
| Mouse wheel | Navigate tasks |

### DevMode - Task Detail
| Key | Action |
|-----|--------|
| j/k or arrows | Scroll 1 line |
| Page Up/Down | Scroll full page |
| Esc | Return to tasks list |
| Ctrl+C | Quit |

---

## 6. Signal/Tag System

**File**: `apps/cli/src/constants.ts`

### Completion Signals
- `<ferix:complete>` - Execution finished successfully
- `<ferix:error>...</ferix:error>` - Error occurred

### Task Tracking
- `<ferix:tasks>...</ferix:tasks>` - Task list boundaries
- `<task id="N">...</task>` - Individual task
- `<ferix:task-done id="N"/>` - Task marked complete

### Phase Tracking
- `<ferix:phases task="N">...</ferix:phases>` - Phase list
- `<phase id="N.M">...</phase>` - Phase definition
- `<ferix:phase-start id="N.M"/>` - Phase begins
- `<ferix:phase-done id="N.M"/>` - Phase completes
- `<ferix:phase-failed id="N.M">reason</ferix:phase-failed>` - Phase failed

### Criterion Tracking
- `<ferix:criteria task="N">...</ferix:criteria>` - Criteria list
- `<criterion id="N.cM">...</criterion>` - Criterion definition
- `<ferix:criterion-passed id="N.cM"/>` - Criterion passed
- `<ferix:criterion-failed id="N.cM" reason="..."/>` - Criterion failed

### Stage Signals
- `<ferix:check-passed/>` / `<ferix:check-failed/>` - Check results
- `<ferix:review-passed/>` / `<ferix:review-failed/>` - Review results
- `<ferix:review-complete/>` - Review done
- `<ferix:review-changes-made/>` - Review made changes

---

## 7. CLI Commands & Options

**File**: `apps/cli/src/cli.ts`

### CLI Flags
| Flag | Description |
|------|-------------|
| `-t, --task <text>` | Task description |
| `-v, --verify <cmd>` | Verification commands (repeatable) |
| `--no-verify` | Skip verification |
| `-n, --iterations <n>` | Number of iterations |
| `--until-complete` | Loop until complete signal |
| `-b, --branch <name>` | Create feature branch |
| `--push` | Push after completion |
| `--pr` | Create PR after pushing |
| `--no-commit` | Skip auto-commit |
| `--progress <path>` | Progress file path |
| `--no-progress` | Disable progress tracking |
| `--dry-run` | Show prompt without executing |
| `--verbose` | Detailed output |
| `-c, --continue` | Resume from existing plan |

### Interactive Questions
1. Task description (required text)
2. Verification commands (comma-separated)
3. Iterations (1, 3, 5, 10, or "until complete")
4. Git strategy (current branch or new branch)
5. Progress tracking (yes/no)
6. Final confirmation

### Branch Name Validation
Pattern: `/^[\w\-/]+$/` (alphanumeric, hyphen, underscore, forward slash)

---

## 8. Logger Utilities

**File**: `apps/cli/src/utils/logger.ts`

### Message Types
- `info()` - Diamond + blue i icon
- `success()` - Diamond + green checkmark
- `warn()` - Diamond + yellow warning
- `error()` - Diamond + red x
- `step()` - Diamond + cyan arrow

### Decorative Elements
- Header with diamonds and heavy lines
- Iteration header: "Loop {current}/{total}"
- Summary box with key-value pairs
- Prompt display box
- Agent error box (word-wrapped, max 60 chars)

---

## 9. Constants & Configuration

**File**: `apps/cli/src/constants.ts`

### UI Constants
| Constant | Value |
|----------|-------|
| BOX_MAX_WIDTH | 60 |
| BOX_MARGIN | 4 |
| TASK_DISPLAY_MAX_LENGTH | 40 |
| COMMAND_DISPLAY_MAX_LENGTH | 60 |
| DEFAULT_TERMINAL_ROWS | 24 |
| DEFAULT_TERMINAL_COLS | 80 |
| KEY_COLUMN_WIDTH | 12 |

### Buffer Sizes
| Constant | Value |
|----------|-------|
| MAX_SIZE | 5000 |
| FERIX_TAG_SIZE | 50 |

### Layout Constants (DevMode)
- FIXED_ROWS = 7 (header + footer rows)
- SPINNER_FRAMES = `["|", "/", "-", "\\"]`

### Status Icons
| Status | Icon |
|--------|------|
| done | green `✓` |
| in_progress | yellow `●` |
| pending | dim `○` |
| failed | red `✗` |

### Tool Colors
| Tool | Color |
|------|-------|
| Read | cyan |
| Edit | yellow |
| Write | green |
| Bash | magenta |
| Glob | blue |
| Grep | blue |
| Task | brightWhite |
| WebFetch | cyan |
| WebSearch | blue |
| TodoWrite | green |

---

## Summary Statistics

- **Total TUI Lines**: ~3,400 lines
- **Form System**: ~800 lines
- **DevMode**: ~2,600 lines
- **Supporting Utilities**: ~500 lines
- **ANSI Colors**: 8 basic + 8 bright + 2 modifiers
- **Box Drawing Characters**: 12 variants
- **Decorative Symbols**: 6 types
- **Signal Tags**: 25+ types
- **View Modes**: 3 (logs, tasks, task-detail)
- **Execution Modes**: 6 (breakdown, planning, working, checking, verifying, reviewing)
- **Question Types**: 3 (text, select, confirm)
