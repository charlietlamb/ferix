# UI Refactor Plan: Success Criteria & Tasks Box Layout

## Problem Statement

The current TUI implementation has several layout bugs causing visual inconsistencies:

1. **Hardcoded footer width**: `taskListFooter()` returns a fixed 32-character string instead of adapting to terminal width
2. **Missing header closing**: `taskListHeader()` has no closing `┐` character
3. **No width parameters on content lines**: Functions like `phaseLine()`, `criterionLine()` don't accept width, causing potential overflow
4. **Nested box aesthetic is cluttered**: The `┌│└` characters inside the main `║` border looks messy

## Design Decisions

| Element | Current | New |
|---------|---------|-----|
| Header | `┌─── ◆ TASKS ◆ ───` (no close, wrong width) | `─── TASKS ───` centered separator |
| Footer | `└────────┘` (hardcoded 32 chars) | `──────────` matching separator |
| Content prefix | `│` | `│` (keep for visual grouping) |
| Tree chars | `├─`, `└─` | Keep as-is |

## Visual Result

```
║ ──────────────────── TASKS ─────────────────────── ║
║ │ [1] Write a poem about the repository            ║
║ │ [2] Identify an improvement opportunity          ║
║ │   Phases for task 1:                             ║
║ │     ├─ ○ [1.1] Explore the repository structure  ║
║ │     └─ ○ [1.2] Write a poem about the repository ║
║ ─────────────────────────────────────────────────  ║
```

## Files to Modify

### 1. `src/consumers/tui/tags/primitives.ts`

Update import to include `stripAnsi` and `truncate`:

```typescript
import { box, colors, getToolColor, stripAnsi, symbols, truncate } from "../render/primitives.js";
```

Replace the following functions:

```typescript
/**
 * Task list header - centered label with horizontal lines.
 */
export function taskListHeader(width: number): string {
  const label = " TASKS ";
  const labelLen = label.length;
  const sideLen = Math.max(1, Math.floor((width - labelLen) / 2));
  const leftSide = box.singleHorizontal.repeat(sideLen);
  const rightSide = box.singleHorizontal.repeat(width - sideLen - labelLen);
  return `${pc.cyan(leftSide)}${colors.brand(label)}${pc.cyan(rightSide)}`;
}

/**
 * Task list footer - horizontal line matching header width.
 */
export function taskListFooter(width: number): string {
  return pc.cyan(box.singleHorizontal.repeat(width));
}

/**
 * Task line with width-aware truncation.
 */
export function taskLine(id: string, description: string, width: number): string {
  const prefix = `${pc.cyan("│")} ${colors.brightMagenta(`[${id}]`)} `;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedDesc = stripAnsi(description).length > availableWidth
    ? truncate(description, availableWidth)
    : description;
    
  return `${prefix}${truncatedDesc}`;
}

/**
 * Phases header with width-aware truncation.
 */
export function phasesHeader(taskId: string, width: number): string {
  const prefix = `${pc.cyan("│")}   `;
  const content = colors.muted(`Phases for task ${taskId}:`);
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedContent = stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
    
  return `${prefix}${truncatedContent}`;
}

/**
 * Phase line with width-aware truncation.
 */
export function phaseLine(id: string, description: string, width: number): string {
  const prefix = `${pc.cyan("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} `;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedDesc = stripAnsi(description).length > availableWidth
    ? truncate(description, availableWidth)
    : description;
    
  return `${prefix}${truncatedDesc}`;
}

/**
 * Phase start notification.
 */
export function phaseStart(id: string, width: number): string {
  const prefix = `${pc.cyan("│")}   `;
  const content = `${colors.warning(symbols.bulletFilled)} ${colors.muted(`Phase ${id} started`)}`;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedContent = stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
    
  return `${prefix}${truncatedContent}`;
}

/**
 * Phase done notification.
 */
export function phaseDone(id: string, width: number): string {
  const prefix = `${pc.cyan("│")}   `;
  const content = `${colors.success(symbols.checkmark)} ${colors.muted(`Phase ${id} complete`)}`;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedContent = stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
    
  return `${prefix}${truncatedContent}`;
}

/**
 * Phase failed notification.
 */
export function phaseFailed(id: string, reason: string, width: number): string {
  const prefix = `${pc.cyan("│")}   `;
  const content = `${colors.error(symbols.cross)} ${colors.muted(`Phase ${id} failed:`)} ${colors.error(reason)}`;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedContent = stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
    
  return `${prefix}${truncatedContent}`;
}

/**
 * Criteria header with width-aware truncation.
 */
export function criteriaHeader(taskId: string, width: number): string {
  const prefix = `${pc.cyan("│")}   `;
  const content = colors.muted(`Success criteria for task ${taskId}:`);
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedContent = stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
    
  return `${prefix}${truncatedContent}`;
}

/**
 * Criterion line with width-aware truncation.
 */
export function criterionLine(id: string, description: string, width: number): string {
  const prefix = `${pc.cyan("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} `;
  const prefixLen = stripAnsi(prefix).length;
  const availableWidth = Math.max(0, width - prefixLen);
  
  const truncatedDesc = stripAnsi(description).length > availableWidth
    ? truncate(description, availableWidth)
    : description;
    
  return `${prefix}${truncatedDesc}`;
}

/**
 * Criterion passed notification.
 */
export function criterionPassed(id: string, width: number): string {
  const content = `${colors.success(symbols.checkmark)} ${colors.muted(`Criterion ${id} passed`)}`;
  const availableWidth = Math.max(0, width);
  
  return stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
}

/**
 * Criterion failed notification.
 */
export function criterionFailed(id: string, reason: string, width: number): string {
  const content = `${colors.error(symbols.cross)} ${colors.muted(`Criterion ${id} failed:`)} ${colors.error(reason)}`;
  const availableWidth = Math.max(0, width);
  
  return stripAnsi(content).length > availableWidth
    ? truncate(content, availableWidth)
    : content;
}
```

### 2. `src/consumers/tui/tags/handlers/tasks.ts`

Update to pass width to all functions:

```typescript
import {
  taskDone,
  taskLine,
  taskListFooter,
  taskListHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Task list boundaries
tagRendererRegistry.register({
  pattern: /<ferix:tasks>/g,
  render: (_, w) => taskListHeader(w),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:tasks>/g,
  render: (_, w) => taskListFooter(w),
});

// Individual task
tagRendererRegistry.register({
  pattern: /<task id="(\d+)">([^<]+)<\/task>/g,
  render: (m, w) => taskLine(m[1] ?? "", m[2] ?? "", w),
});

tagRendererRegistry.register({
  pattern: /<ferix:task-done id="(\d+)"\/>/g,
  render: (m) => taskDone(m[1] ?? ""),
});
```

### 3. `src/consumers/tui/tags/handlers/phases.ts`

Update to pass width to all functions:

```typescript
import {
  phaseDone,
  phaseFailed,
  phaseLine,
  phaseStart,
  phasesHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Phases header
tagRendererRegistry.register({
  pattern: /<ferix:phases task="(\d+)">/g,
  render: (m, w) => phasesHeader(m[1] ?? "", w),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:phases>/g,
  render: () => "",
});

// Phase line
tagRendererRegistry.register({
  pattern: /<phase id="([^"]+)">([^<]+)<\/phase>/g,
  render: (m, w) => phaseLine(m[1] ?? "", m[2] ?? "", w),
});

// Phase start
tagRendererRegistry.register({
  pattern: /<ferix:phase-start id="([^"]+)"\/>/g,
  render: (m, w) => phaseStart(m[1] ?? "", w),
});

// Phase done
tagRendererRegistry.register({
  pattern: /<ferix:phase-done id="([^"]+)"\/>/g,
  render: (m, w) => phaseDone(m[1] ?? "", w),
});

// Phase failed
tagRendererRegistry.register({
  pattern: /<ferix:phase-failed id="([^"]+)">([^<]+)<\/ferix:phase-failed>/g,
  render: (m, w) => phaseFailed(m[1] ?? "", m[2] ?? "", w),
});
```

### 4. `src/consumers/tui/tags/handlers/criteria.ts`

Update to pass width to all functions:

```typescript
import {
  criteriaHeader,
  criterionFailed,
  criterionLine,
  criterionPassed,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Criteria header
tagRendererRegistry.register({
  pattern: /<ferix:criteria task="(\d+)">/g,
  render: (m, w) => criteriaHeader(m[1] ?? "", w),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:criteria>/g,
  render: () => "",
});

// Criterion line
tagRendererRegistry.register({
  pattern: /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
  render: (m, w) => criterionLine(m[1] ?? "", m[2] ?? "", w),
});

// Criterion passed
tagRendererRegistry.register({
  pattern: /<ferix:criterion-passed id="([^"]+)"\/>/g,
  render: (m, w) => criterionPassed(m[1] ?? "", w),
});

// Criterion failed
tagRendererRegistry.register({
  pattern: /<ferix:criterion-failed id="([^"]+)" reason="([^"]+)"\/>/g,
  render: (m, w) => criterionFailed(m[1] ?? "", m[2] ?? "", w),
});
```

## Testing Steps

1. Run `bun lint` and `bun format` to ensure code standards
2. Test with narrow terminal (40 cols)
3. Test with standard terminal (80 cols)
4. Test with wide terminal (200 cols)
5. Test terminal resize during execution
6. Verify all borders align at all widths
7. Verify long descriptions truncate correctly with `...`

## Success Criteria

1. Header and footer separators span the exact same width
2. Content never overflows the outer `║` borders
3. All content lines truncate gracefully when too long
4. Tree structure characters display correctly
5. Colors render properly
6. Works at all reasonable terminal widths (40-200+ cols)
