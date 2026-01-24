# Ferix TUI Design PRD - V2 (Dev Mode)

## Overview

This PRD covers the **remaining 75%** of visual components not addressed in `UI_REFACTOR.md`. The original PRD styled the intro screen and forms. This PRD styles the **dev-mode execution interface** - where users spend the majority of their time.

**Prerequisite:** UI_REFACTOR.md (100% complete)

---

## Design Continuity

Maintain the Cyberpunk/Synthwave aesthetic from V1:
- **Primary accent**: Neon Magenta (`brightMagenta`)
- **Secondary accent**: Neon Cyan (`brightCyan`)
- **Borders**: Cyan double-line
- **Decorative elements**: Magenta diamonds (`◆`)
- **Status icons**: Semantic colors (green/yellow/red)

---

## Component Designs

### 1. Status Bar

**Current:**
```
║ FERIX | ● WORKING | 5/10 | 00:23 | TASK 2/4 | bash                 ║
```

**New Design:**
```
║ ◆ FERIX ◆ │ ● WORKING │ 5/10 │ 00:23 │ TASK 2/4 │ bash            ║
```

**Styling:**
| Element | Current | New |
|---------|---------|-----|
| Brand | `FERIX` (brightWhite) | `◆ FERIX ◆` (magenta diamonds, brightMagenta text) |
| Separators | Dim `\|` | Dim `│` (box drawing character) |
| Status modes | Mixed colors | Consistent: brightGreen (running), brightCyan (done), brightRed (error) |
| Tool name | Tool-specific color | Keep as-is (already good) |

**Mode Labels:**
| Mode | Color |
|------|-------|
| IDLE | dim |
| BREAKDOWN | brightMagenta |
| PLAN | brightCyan |
| WORK | brightGreen |
| REVIEW | brightYellow |
| VERIFY | yellow |
| DONE | brightCyan |
| ERR! | brightRed |

---

### 2. Task Bar

**Current:**
```
║ TASK: Build authentication system for user dashboard               ║
```

**New Design:**
```
║ ◆ TASK │ Build authentication system for user dashboard            ║
```

**Styling:**
- Label: `◆ TASK` (magenta diamond, brightWhite text)
- Separator: `│` (dim)
- Description: white (current task text)

---

### 3. Footer (All Views)

**Current (Logs):**
```
║ j/k scroll  1-50/150  t tasks  ^C quit                             ║
```

**New Design:**
```
║ ◆ j/k scroll  ◆ 1-50/150  ◆ t tasks  ◆ ^C quit                     ║
```

**Styling:**
- Diamond bullets before each hint (magenta `◆`)
- Keys: brightWhite (`j/k`, `t`, `^C`, `Enter`, `Esc`, `G`)
- Descriptions: dim
- Scroll position: yellow when scrolled, dim at bottom

**Footer Variants:**

| View | Content |
|------|---------|
| Logs | `◆ j/k scroll  ◆ [pos]  ◆ t tasks  ◆ G bottom  ◆ ^C quit` |
| Tasks List | `◆ j/k navigate  ◆ Enter details  ◆ Esc back  ◆ ^C quit` |
| Task Detail | `◆ j/k scroll  ◆ [pos]  ◆ Esc back  ◆ ^C quit` |

---

### 4. Ferix Tag Styling (Output Area)

#### 4.1 Tasks Block

**Current:**
```
┌─ TASKS ─────────────
│ [1] First task
│ [2] Second task
└─────────────────────
```

**New Design:**
```
┌─◆ TASKS ◆───────────
│ [1] First task
│ [2] Second task
└─────────────────────
```

**Styling:**
- Header: `┌─◆ TASKS ◆` (cyan border, magenta diamonds, brightWhite text)
- Task ID: `[N]` (brightMagenta instead of yellow)
- Border: cyan

#### 4.2 Completion Banners

**Current:**
```
━━━ ALL TASKS COMPLETE ━━━
━━━ REVIEW PASSED ━━━
━━━ REVIEW FAILED ━━━
```

**New Design:**
```
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
                      ✓ ALL TASKS COMPLETE
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
```

**Styling:**
| Banner | Border | Icon | Text |
|--------|--------|------|------|
| ALL TASKS COMPLETE | brightGreen `━` with magenta `◆` | `✓` green | brightGreen |
| REVIEW PASSED | brightGreen `━` with magenta `◆` | `✓` green | brightGreen |
| REVIEW FAILED | brightRed `━` with magenta `◆` | `✗` red | brightRed |

#### 4.3 Phase/Criteria Tree

**Current:**
```
│   ├─ ○ [1.1] Create types
│   ├─ ● [1.2] Implement logic
│   └─ ✓ [1.3] Add tests
```

**New Design:**
```
│   ├─ ○ [1.1] Create types
│   ├─ ● [1.2] Implement logic
│   └─ ✓ [1.3] Add tests
```

**Styling (unchanged, already good):**
- Tree structure: dim `├─` / `└─`
- Phase ID: dim `[N.M]`
- Icons: `○` dim, `●` yellow, `✓` green, `✗` red

#### 4.4 Error Display

**Current:**
```
ERROR: Something went wrong
```

**New Design:**
```
◆ ERROR │ Something went wrong
```

**Styling:**
- Diamond: magenta `◆`
- Label: brightRed `ERROR`
- Separator: dim `│`
- Message: red

---

### 5. Tasks List View

**Current:**
```
   TASKS
  ────────────────────────

  > [1] ✓ First task          00:23  2/4
  ▸ [2] ● Second task        00:15  1/4
    [3] ○ Third task         --     0/0
```

**New Design:**
```
   ◆ TASKS ◆
  ══════════════════════════

  ▸ [1] ✓ First task          00:23  2/4
    [2] ● Second task         00:15  1/4
    [3] ○ Third task          --     0/0
```

**Styling:**
| Element | Current | New |
|---------|---------|-----|
| Header | `TASKS` (brightWhite) | `◆ TASKS ◆` (magenta diamonds, brightWhite text) |
| Separator | `─` (dim) | `═` (cyan, double line) |
| Selector | `>` (brightCyan) | `▸` (brightMagenta) |
| Task ID | `[N]` (yellow) | `[N]` (brightMagenta) |
| Duration | dim | cyan |
| Phase count | dim | dim (keep) |

**Git Info Section:**
```
  ══════════════════════════
   ◆ GIT │ feat/123 → main │ Pushed ✓
   ◆ PR  │ https://github.com/.../pull/123
```

**Styling:**
- Separator: `═` (cyan)
- Labels: `◆ GIT`, `◆ PR` (magenta diamond, dim label)
- Branch: brightWhite
- Arrow: dim `→`
- Base branch: dim
- Pushed status: `✓` green or dim if not
- PR URL: cyan hyperlink

---

### 6. Task Detail View

**Current:**
```
   TASK #1
   First task description
   ──────────────────────

   Status: ✓ Complete
   Duration: 00:23
   Started: 10:15  Completed: 10:38

   PHASES
   ├─ ✓ [1.1] Create types       00:05
   └─ ✓ [1.2] Implement logic    00:18

   SUCCESS CRITERIA (attempt 1/5)
   ├─ ✓ [1.c1] Types are correct
   └─ ✗ [1.c2] Tests pass
      ↳ 2 tests failing
```

**New Design:**
```
   ◆ TASK #1 ◆
   First task description
   ══════════════════════════

   Status: ✓ Complete
   Duration: 00:23
   Started: 10:15  Completed: 10:38

   ◆ PHASES ◆
   ├─ ✓ [1.1] Create types       00:05
   └─ ✓ [1.2] Implement logic    00:18

   ◆ SUCCESS CRITERIA ◆ (attempt 1/5)
   ├─ ✓ [1.c1] Types are correct
   └─ ✗ [1.c2] Tests pass
      ↳ 2 tests failing
```

**Styling:**
| Element | Current | New |
|---------|---------|-----|
| Task header | `TASK #1` (brightWhite) | `◆ TASK #1 ◆` (magenta diamonds, brightWhite) |
| Separator | `─` (dim) | `═` (cyan) |
| Section headers | `PHASES`, `SUCCESS CRITERIA` | `◆ PHASES ◆`, `◆ SUCCESS CRITERIA ◆` |
| Status label | dim | cyan |
| Duration value | white | brightWhite |
| Timestamps | dim | dim (keep) |
| Phase duration | dim | cyan |
| Failure arrow | red `↳` | brightRed `↳` |

---

### 7. Logger Output (Standard Mode)

**Current:**
```
🦊 Ferix
─────────────────────────────
ℹ Info message
✓ Success message
⚠ Warning message
✖ Error message
→ Step message
```

**New Design:**
```
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
       🦊 FERIX v0.1.0
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆

◆ ℹ Info message
◆ ✓ Success message
◆ ⚠ Warning message
◆ ✖ Error message
◆ → Step message
```

**Styling:**
| Element | Current | New |
|---------|---------|-----|
| Header border | `─` (dim) | `━` with `◆` ends (magenta diamonds, cyan line) |
| Brand | `🦊 Ferix` (bold cyan) | `🦊 FERIX v0.1.0` (bold brightMagenta) |
| Log prefixes | Icons only | `◆` + icon (magenta diamond before each) |

**Summary Box:**
```
◆════════════════════════════════════◆
│ Key              Value             │
│ Key              Value             │
◆════════════════════════════════════◆
```

**Error Box:**
```
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
│ ✖ ErrorType                        │
├────────────────────────────────────┤
│ Error message wrapped to fit       │
│ within the available width         │
◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
```

---

## Files to Modify

### 1. `apps/cli/src/tui/dev-mode/components/status-bar.ts`
- Add magenta diamonds around `FERIX`
- Change separators to box drawing `│`
- Standardize mode colors

### 2. `apps/cli/src/tui/dev-mode/components/task-bar.ts`
- Add magenta diamond prefix
- Add separator after label

### 3. `apps/cli/src/tui/dev-mode/components/footer.ts`
- Add diamond bullets before each hint
- Style keys as brightWhite

### 4. `apps/cli/src/tui/dev-mode/components/output-area.ts`
- Update tasks block header with diamonds
- Update completion banners with diamond borders
- Update error display format

### 5. `apps/cli/src/tui/dev-mode/components/tasks-list.ts`
- Add diamonds to header
- Change separator to double line
- Change selector to `▸` in magenta
- Change task IDs to brightMagenta
- Style git info section

### 6. `apps/cli/src/tui/dev-mode/components/task-detail.ts`
- Add diamonds to all headers
- Change separators to double line
- Style section headers consistently

### 7. `apps/cli/src/utils/logger.ts`
- Update header with diamond border
- Add version to brand
- Add diamond prefix to all log types
- Update summary and error box borders

---

## Implementation Order

1. `status-bar.ts` - Brand styling, separators, mode colors
2. `task-bar.ts` - Label and separator styling
3. `footer.ts` - Diamond bullets, key styling
4. `output-area.ts` - Ferix tag styling updates
5. `tasks-list.ts` - Header, selector, git info
6. `task-detail.ts` - Headers and separators
7. `logger.ts` - Standard mode output styling

---

## Verification

After implementation:

1. Run `ferix` with a multi-task PRD
2. Verify status bar shows:
   - `◆ FERIX ◆` branding
   - Box drawing separators
   - Correct mode colors
3. Verify task bar shows diamond prefix
4. Verify footers have diamond bullets
5. Verify output area:
   - Tasks block has diamond header
   - Completion banners have diamond borders
   - Errors show new format
6. Verify tasks list:
   - Diamond header
   - Magenta selector and task IDs
   - Styled git info
7. Verify task detail:
   - Diamond section headers
   - Double-line separators
8. Run in standard mode and verify logger styling
9. Run `bun x ultracite check` for lint compliance

---

## Visual Summary

| Component | Key Changes |
|-----------|-------------|
| Status Bar | `◆ FERIX ◆`, box separators, mode colors |
| Task Bar | `◆ TASK │` prefix |
| Footer | Diamond bullets, brightWhite keys |
| Tasks Block | `◆ TASKS ◆` header |
| Banners | Diamond-bordered full-width |
| Tasks List | Diamond header, magenta selector/IDs |
| Task Detail | Diamond section headers |
| Logger | Diamond-bordered header, prefixed logs |
