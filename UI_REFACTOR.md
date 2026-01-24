# Ferix TUI Design PRD

## Design Vision

Transform Ferix's terminal interface into a **Cyberpunk/Synthwave-inspired TUI** that feels professionally crafted while maintaining a polished, minimal execution. The aesthetic evokes 80s futurism with neon accents, but prioritizes clean typography and subtle enhancement over heavy decoration.

**Design Principles:**
- Bold neon accents (magenta, cyan) against dark backgrounds
- Double-line box borders for structure, single-line for internal divisions
- Bright, confident typography hierarchy
- Static layouts (no animations) for performance
- Version prominently displayed in creative placement

---

## Color Palette

### Primary Colors
| Name | ANSI Code | Use Case |
|------|-----------|----------|
| **Neon Magenta** | `\x1b[95m` (brightMagenta) | Primary accent, logo, key UI elements |
| **Neon Cyan** | `\x1b[96m` (brightCyan) | Secondary accent, borders, highlights |
| **Hot Pink** | `\x1b[35m` (magenta) | Subtle accent, secondary text |
| **Electric Blue** | `\x1b[94m` (brightBlue) | Links, interactive hints |

### Neutral Colors
| Name | ANSI Code | Use Case |
|------|-----------|----------|
| **Bright White** | `\x1b[97m` | Primary text, headings |
| **Dim** | `\x1b[2m` | Secondary info, placeholders |
| **White** | `\x1b[37m` | Body text |

### Semantic Colors (unchanged)
| Name | ANSI Code | Use Case |
|------|-----------|----------|
| **Green** | `\x1b[32m` | Success, complete, pass |
| **Yellow** | `\x1b[33m` | Warning, in-progress |
| **Red** | `\x1b[31m` | Error, failed |

---

## Typography System

### Hierarchy
1. **Logo/Brand** - ASCII art in neon magenta
2. **Section Headers** - Bright white, bold
3. **Labels** - Cyan, normal weight
4. **Body Text** - White
5. **Hints/Secondary** - Dim white
6. **Placeholders** - Dim magenta (themed)

### ASCII Art Logo

Keep the existing logo style but render in **neon magenta** with cyan decorative elements:

```
███████████ ██████████ ███████████   █████ █████ █████     ← Neon Magenta
░░███░░░░░░█░░███░░░░░█░░███░░░░░███ ░░███ ░░███ ░░███
 ░███   █ ░  ░███  █ ░  ░███    ░███  ░███  ░░███ ███
 ░███████    ░██████    ░██████████   ░███   ░░█████
 ░███░░░█    ░███░░█    ░███░░░░░███  ░███    ███░███
 ░███  ░     ░███ ░   █ ░███    ░███  ░███   ███ ░░███
 █████       ██████████ █████   █████ █████ █████ █████
░░░░░       ░░░░░░░░░░ ░░░░░   ░░░░░ ░░░░░ ░░░░░ ░░░░░
```

---

## Component Designs

### 1. Intro Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     ███████████ ██████████ ███████████   █████ █████ █████      │  ← Neon Magenta
│     ░░███░░░░░░█░░███░░░░░█░░███░░░░░███ ░░███ ░░███ ░░███       │
│      ░███   █ ░  ░███  █ ░  ░███    ░███  ░███  ░░███ ███        │
│      ░███████    ░██████    ░██████████   ░███   ░░█████         │
│      ░███░░░█    ░███░░█    ░███░░░░░███  ░███    ███░███        │
│      ░███  ░     ░███ ░   █ ░███    ░███  ░███   ███ ░░███       │
│      █████       ██████████ █████   █████ █████ █████ █████      │
│     ░░░░░       ░░░░░░░░░░ ░░░░░   ░░░░░ ░░░░░ ░░░░░ ░░░░░       │
│                                                                 │
│                    ══════ v0.1.0 ══════                          │  ← Cyan, version centered
│                                                                 │
│                  Composable RALPH Loops                         │  ← Bright White
│                                                                 │
│         An AI-powered coding assistant that breaks down         │  ← Dim
│         complex tasks into composable loops, executing          │
│         them autonomously with real-time progress tracking.     │
│                                                                 │
│     ◆─────────────────────────────────────────────────────◆     │  ← Magenta diamonds, dim line
│                                                                 │
│                   Press any key to continue...                  │  ← Dim
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Logo rendered in **neon magenta** (brightMagenta)
- Version display: `══════ v0.1.0 ══════` in **cyan**, centered below logo
- Decorative line uses **magenta diamonds** at ends: `◆────────◆`

---

### 2. Form Question Box

```
╔══════════════════════════════════════════════════════════════╗  ← Cyan double border
║                                                              ║
║  What should the AI work on?                                 ║  ← Bright White (question)
║  e.g., Get ticket ENG-345 from Linear and implement it       ║  ← Dim Magenta (placeholder)
║                                                              ║
╠──────────────────────────────────────────────────────────────╣  ← Cyan tee + dim single line
║                                                              ║
║  █                                                           ║  ← Input area
║                                                              ║
╠──────────────────────────────────────────────────────────────╣
║  ◆ Enter submit  ◆ Alt+Enter newline  ◆ Ctrl+C cancel        ║  ← Dim with magenta diamonds
╚══════════════════════════════════════════════════════════════╝
```

**Styling:**
- **Placeholder text**: Dim magenta instead of just dim (themed)
- **Footer shortcuts**: Magenta diamond bullets (◆) with dim text

---

### 3. Select Input

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  How many iterations?                                        ║  ← Bright White
║                                                              ║
╠──────────────────────────────────────────────────────────────╣
║                                                              ║
║    ▸ 1                    single run                         ║  ← Magenta arrow, bright label
║      3                                                       ║  ← Dim unselected
║      5                                                       ║
║      10                                                      ║
║      Until complete       loops until done                   ║
║                                                              ║
╠──────────────────────────────────────────────────────────────╣
║  ◆ ↑/↓ navigate  ◆ Enter select  ◆ Ctrl+C cancel             ║
╚══════════════════════════════════════════════════════════════╝
```

**Selection Indicator:**
- Change arrow from cyan `▸` to **magenta `▸`**
- Selected label in **bright white**
- Hint text in **dim** (only for selected)

---

### 4. Configuration Summary

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                     ◆ CONFIGURATION ◆                        ║  ← Magenta diamonds, bright white
║                                                              ║
╠──────────────────────────────────────────────────────────────╣
║                                                              ║
║   Task          Get ticket ENG-345 from Linear...           ║  ← Cyan key, white value
║   Verify        bun lint, bun test                          ║
║   Iterations    5                                            ║
║   Branch        feat/eng-345                                 ║
║   After         push + PR                                    ║
║   Progress      .ferix/PROGRESS.md                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

                    Starting Ferix loop...                        ← Bright Green
```

**Title Enhancement:**
- Add magenta diamond decorations: `◆ CONFIGURATION ◆`

---

## Decorative Elements

### Symbols
| Symbol | Use | Color |
|--------|-----|-------|
| `◆` | Section titles, keyboard hints | Magenta |
| `▸` | Selected option indicator | Magenta |
| `○` | Unselected/pending | Dim |
| `●` | Active/in-progress | Yellow |
| `✓` | Success/complete | Green |
| `✗` | Error/failed | Red |

### Dividers
| Pattern | Use | Color |
|---------|-----|-------|
| `══════` | Version flanking, emphasis | Cyan |
| `──────` | Content separation | Dim |
| `◆────◆` | Decorative section breaks | Magenta ends |

---

## Files to Modify

### 1. `apps/cli/src/tui/ansi.ts`
Add new color:
```typescript
brightMagenta: `${ESC}95m`,
```

Add decorative symbols:
```typescript
export const symbols = {
  diamond: "◆",
  arrowRight: "▸",
  bulletEmpty: "○",
  bulletFilled: "●",
  checkmark: "✓",
  cross: "✗",
};
```

### 2. `apps/cli/src/tui/form/intro.ts`
- Change `LOGO_COLOR` from `colors.white` to `colors.brightMagenta`
- Add version display below logo: `══════ v${CLI.VERSION} ══════` in cyan
- Change decorative line to use magenta diamonds: `◆────────◆`
- Import version from constants

### 3. `apps/cli/src/tui/form/inputs/text.ts`
- Change placeholder from `dim` to `dim + magenta` combination
- Add diamond bullets to footer shortcuts

### 4. `apps/cli/src/tui/form/inputs/select.ts`
- Change selection arrow from `colors.cyan` to `colors.brightMagenta`
- Add diamond bullets to footer

### 5. `apps/cli/src/tui/form/inputs/confirm.ts`
- Same arrow color change as select.ts
- Add diamond bullets to footer

### 6. `apps/cli/src/tui/form/summary.ts`
- Add diamond decorations to title: `◆ CONFIGURATION ◆`
- Use magenta for diamonds

### 7. `apps/cli/src/constants.ts`
Ensure `CLI.VERSION` is available (may need to import from package.json or define explicitly)

---

## Implementation Order

1. **`ansi.ts`** - Add brightMagenta color and symbols constant
2. **`constants.ts`** - Ensure version is accessible
3. **`intro.ts`** - Logo color, version display, decorative line
4. **`text.ts`** - Placeholder color, footer bullets
5. **`select.ts`** - Selection arrow color, footer bullets
6. **`confirm.ts`** - Selection arrow color, footer bullets
7. **`summary.ts`** - Title decorations

---

## Verification

After implementation:
1. Run the CLI with `bun run dev` or `ferix`
2. Verify intro screen shows:
   - Magenta logo
   - Version with cyan `══════` flanking
   - Magenta diamond decorative line
3. Test all form questions:
   - Text input shows magenta placeholder
   - Select shows magenta arrow for selected
   - Confirm shows magenta arrow
   - All footers have diamond bullets
4. Configuration summary shows diamond-decorated title
5. Run `bun x ultracite check` for lint compliance

---

## Visual Comparison

| Element | Current | New |
|---------|---------|-----|
| Logo color | White | Neon Magenta |
| Version display | Not shown | `══════ v0.1.0 ══════` in cyan |
| Decorative line | Cyan double horizontal | Magenta diamonds: `◆────◆` |
| Selection arrow | Cyan `▸` | Magenta `▸` |
| Placeholders | Dim white | Dim magenta |
| Footer bullets | None | Magenta `◆` |
| Summary title | Plain | `◆ CONFIGURATION ◆` |

---

## Research Sources

Design patterns and best practices informed by:
- [Command Line Interface Guidelines](https://clig.dev/) - Core UX principles for CLI design
- [Terminal UI Design Skill](https://agent-skills.md/skills/ingpoc/SKILLS/terminal-ui-design) - Aesthetic directions and patterns
- [UX patterns for CLI tools](https://lucasfcosta.com/2022/06/01/ux-patterns-cli-tools.html) - User experience patterns
- [Designing for Command Line Interface](https://yannglt.com/writing/designing-for-command-line-interface) - Visual design constraints
- [Cool Retro Term](https://github.com/Swordfish90/cool-retro-term) - CRT aesthetic reference
- [Ink](https://github.com/vadimdemedes/ink) / [Blessed](https://github.com/chjj/blessed) - Node.js TUI libraries
