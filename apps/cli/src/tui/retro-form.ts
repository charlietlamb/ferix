/**
 * Retro Form TUI - Terminal form with retro styling
 * One question at a time, bordered box aesthetic
 */

import { box, colors, getTerminalSize, screen, stripAnsi } from "./ansi.js";

// Form question types
export type QuestionType = "text" | "select" | "confirm";

export interface TextQuestion {
  type: "text";
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validate?: (value: string) => string | undefined;
}

export interface SelectOption {
  value: string | number;
  label: string;
  hint?: string;
}

export interface SelectQuestion {
  type: "select";
  id: string;
  label: string;
  options: SelectOption[];
}

export interface ConfirmQuestion {
  type: "confirm";
  id: string;
  label: string;
  initial?: boolean;
}

export type Question = TextQuestion | SelectQuestion | ConfirmQuestion;

// ASCII art FERIX logo (colorful gradient)
const FERIX_LOGO = [
  "███████████ ██████████ ███████████   █████ █████ █████",
  "░░███░░░░░░█░░███░░░░░█░░███░░░░░███ ░░███ ░░███ ░░███ ",
  " ░███   █ ░  ░███  █ ░  ░███    ░███  ░███  ░░███ ███  ",
  " ░███████    ░██████    ░██████████   ░███   ░░█████   ",
  " ░███░░░█    ░███░░█    ░███░░░░░███  ░███    ███░███  ",
  " ░███  ░     ░███ ░   █ ░███    ░███  ░███   ███ ░░███ ",
  " █████       ██████████ █████   █████ █████ █████ █████",
  "░░░░░       ░░░░░░░░░░ ░░░░░   ░░░░░ ░░░░░ ░░░░░ ░░░░░ ",
];

// Logo color
const LOGO_COLOR = colors.white;

interface TextInputState {
  inputLines: string[];
  cursorLine: number;
  cursorCol: number;
}

type TextKeyAction =
  | { type: "cancel" }
  | { type: "submit" }
  | { type: "newline" }
  | { type: "backspace" }
  | { type: "arrow"; direction: "up" | "down" | "left" | "right" }
  | { type: "char"; char: string }
  | { type: "none" };

function parseTextKey(key: string): TextKeyAction {
  if (key === "\x03") {
    return { type: "cancel" };
  }
  // Shift+Enter / Alt+Enter / Ctrl+Enter variations
  // Common escape sequences for modified enter
  if (
    key === "\x1b\r" || // Alt+Enter
    key === "\x1b\n" || // Alt+Enter variant
    key === "\x1b[13;2u" || // Shift+Enter (kitty/modern terminals)
    key === "\x1b[13;5u" || // Ctrl+Enter (kitty/modern terminals)
    key === "\x1bOM" // Some terminals
  ) {
    return { type: "newline" };
  }
  if (key === "\r" || key === "\n") {
    return { type: "submit" };
  }
  if (key === "\x7f" || key === "\b") {
    return { type: "backspace" };
  }
  if (key === "\x1b[A") {
    return { type: "arrow", direction: "up" };
  }
  if (key === "\x1b[B") {
    return { type: "arrow", direction: "down" };
  }
  if (key === "\x1b[C") {
    return { type: "arrow", direction: "right" };
  }
  if (key === "\x1b[D") {
    return { type: "arrow", direction: "left" };
  }
  if (key.length === 1 && key >= " ") {
    return { type: "char", char: key };
  }
  return { type: "none" };
}

function handleBackspace(state: TextInputState): void {
  const { inputLines, cursorLine, cursorCol } = state;
  if (cursorCol > 0) {
    const line = inputLines[cursorLine] || "";
    inputLines[cursorLine] =
      line.slice(0, cursorCol - 1) + line.slice(cursorCol);
    state.cursorCol--;
  } else if (cursorLine > 0) {
    const prevLine = inputLines[cursorLine - 1] || "";
    const currentLine = inputLines[cursorLine] || "";
    state.cursorCol = prevLine.length;
    inputLines[cursorLine - 1] = prevLine + currentLine;
    inputLines.splice(cursorLine, 1);
    state.cursorLine--;
  }
}

function handleArrow(
  state: TextInputState,
  direction: "up" | "down" | "left" | "right"
): void {
  const { inputLines, cursorLine, cursorCol } = state;
  switch (direction) {
    case "up":
      if (cursorLine > 0) {
        state.cursorLine--;
        state.cursorCol = Math.min(
          cursorCol,
          (inputLines[state.cursorLine] || "").length
        );
      }
      break;
    case "down":
      if (cursorLine < inputLines.length - 1) {
        state.cursorLine++;
        state.cursorCol = Math.min(
          cursorCol,
          (inputLines[state.cursorLine] || "").length
        );
      }
      break;
    case "right": {
      const line = inputLines[cursorLine] || "";
      if (cursorCol < line.length) {
        state.cursorCol++;
      } else if (cursorLine < inputLines.length - 1) {
        state.cursorLine++;
        state.cursorCol = 0;
      }
      break;
    }
    case "left":
      if (cursorCol > 0) {
        state.cursorCol--;
      } else if (cursorLine > 0) {
        state.cursorLine--;
        state.cursorCol = (inputLines[state.cursorLine] || "").length;
      }
      break;
    default:
      break;
  }
}

function handleNewline(state: TextInputState): void {
  const { inputLines, cursorLine, cursorCol } = state;
  const line = inputLines[cursorLine] || "";
  // Split current line at cursor position
  const beforeCursor = line.slice(0, cursorCol);
  const afterCursor = line.slice(cursorCol);
  inputLines[cursorLine] = beforeCursor;
  inputLines.splice(cursorLine + 1, 0, afterCursor);
  state.cursorLine++;
  state.cursorCol = 0;
}

function handleCharInput(
  state: TextInputState,
  char: string,
  maxWidth: number
): void {
  const { inputLines, cursorLine, cursorCol } = state;
  const line = inputLines[cursorLine] || "";
  if (line.length >= maxWidth) {
    inputLines.splice(cursorLine + 1, 0, char);
    state.cursorLine++;
    state.cursorCol = 1;
  } else {
    inputLines[cursorLine] =
      line.slice(0, cursorCol) + char + line.slice(cursorCol);
    state.cursorCol++;
  }
}

export class RetroForm {
  private readonly answers: Record<string, string | number | boolean> = {};
  private cancelled = false;

  /**
   * Show the intro screen with logo and wait for keypress
   */
  async showIntro(): Promise<void> {
    screen.clear();
    screen.home();

    const { cols, rows } = getTerminalSize();

    // Calculate total content height for vertical centering
    // Logo (8 lines) + spacing (1) + subtitle (1) + spacing (1) + description (3) + spacing (1) + line (1) + spacing (1) + prompt (1)
    const contentHeight = 18;
    const topPadding = Math.max(0, Math.floor((rows - contentHeight) / 2));

    // Top padding for vertical centering
    for (let i = 0; i < topPadding; i++) {
      console.log();
    }

    // FERIX logo in white
    for (const line of FERIX_LOGO) {
      const padding = Math.max(0, Math.floor((cols - line.length) / 2));
      console.log(`${" ".repeat(padding)}${LOGO_COLOR}${line}${colors.reset}`);
    }

    console.log();

    // Subtitle
    const subtitle = "Composable RALPH Loops";
    const subtitlePadding = Math.max(
      0,
      Math.floor((cols - subtitle.length) / 2)
    );
    console.log(
      `${" ".repeat(subtitlePadding)}${colors.brightWhite}${subtitle}${colors.reset}`
    );

    console.log();

    // Description lines
    const descLines = [
      "An AI-powered coding assistant that breaks down complex tasks",
      "into composable loops, executing them autonomously with",
      "real-time progress tracking and intelligent error recovery.",
    ];

    for (const desc of descLines) {
      const descPadding = Math.max(0, Math.floor((cols - desc.length) / 2));
      console.log(
        `${" ".repeat(descPadding)}${colors.dim}${desc}${colors.reset}`
      );
    }

    console.log();

    // Decorative line
    const lineWidth = Math.min(56, cols - 4);
    const linePadding = Math.max(0, Math.floor((cols - lineWidth) / 2));
    console.log(
      `${" ".repeat(linePadding)}${colors.cyan}${box.horizontal.repeat(lineWidth)}${colors.reset}`
    );

    console.log();

    // Press any key prompt
    const prompt = "Press any key to continue...";
    const promptPadding = Math.max(0, Math.floor((cols - prompt.length) / 2));
    console.log(
      `${" ".repeat(promptPadding)}${colors.dim}${prompt}${colors.reset}`
    );

    // Wait for keypress
    await this.waitForKeypress();
  }

  /**
   * Wait for any keypress
   */
  private waitForKeypress(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onKey = (key: string) => {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onKey);

        // Ctrl+C - exit
        if (key === "\x03") {
          process.exit(0);
        }

        resolve();
      };

      process.stdin.once("data", onKey);
    });
  }

  /**
   * Run through all questions and collect answers
   */
  async run(
    questions: Question[]
  ): Promise<Record<string, string | number | boolean> | null> {
    await this.showIntro();

    for (const question of questions) {
      if (this.cancelled) {
        return null;
      }

      // Clear screen and center for each question
      screen.clear();
      screen.home();

      switch (question.type) {
        case "text":
          await this.askText(question);
          break;
        case "select":
          await this.askSelect(question);
          break;
        case "confirm":
          await this.askConfirm(question);
          break;
        default:
          break;
      }
    }

    if (this.cancelled) {
      return null;
    }

    return this.answers;
  }

  /**
   * Display a question box
   */
  private renderQuestionBox(
    label: string,
    hint?: string,
    options?: { content?: string[]; footer?: string }
  ): void {
    const { cols } = getTerminalSize();
    const boxWidth = Math.min(60, cols - 4);
    const innerWidth = boxWidth - 2;
    const padding = Math.max(0, Math.floor((cols - boxWidth) / 2));
    const pad = " ".repeat(padding);

    // Top border
    console.log(
      `${pad}${colors.cyan}${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}${colors.reset}`
    );

    // Label line
    const labelText = ` ${label} `;
    const labelPad = Math.max(0, innerWidth - stripAnsi(labelText).length);
    console.log(
      `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.brightWhite}${labelText}${colors.reset}${" ".repeat(labelPad)}${colors.cyan}${box.vertical}${colors.reset}`
    );

    // Hint line (if provided)
    if (hint) {
      const hintText = ` ${hint} `;
      const hintPad = Math.max(0, innerWidth - hintText.length);
      console.log(
        `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${hintText}${colors.reset}${" ".repeat(hintPad)}${colors.cyan}${box.vertical}${colors.reset}`
      );
    }

    // Separator
    console.log(
      `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
    );

    // Content lines
    if (options?.content) {
      for (const line of options.content) {
        const lineText = ` ${line} `;
        const stripped = stripAnsi(lineText);
        const linePad = Math.max(0, innerWidth - stripped.length);
        console.log(
          `${pad}${colors.cyan}${box.vertical}${colors.reset}${lineText}${" ".repeat(linePad)}${colors.cyan}${box.vertical}${colors.reset}`
        );
      }
    }

    // Footer (if provided)
    if (options?.footer) {
      console.log(
        `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
      );
      const footerText = ` ${options.footer} `;
      const footerPad = Math.max(0, innerWidth - stripAnsi(footerText).length);
      console.log(
        `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${footerText}${colors.reset}${" ".repeat(footerPad)}${colors.cyan}${box.vertical}${colors.reset}`
      );
    }

    // Bottom border
    console.log(
      `${pad}${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
    );
  }

  /**
   * Ask a text question with inline input inside the box
   */
  private askText(question: TextQuestion): Promise<void> {
    return new Promise((resolve) => {
      const { cols } = getTerminalSize();
      const boxWidth = Math.min(60, cols - 4);
      const innerWidth = boxWidth - 2;
      const padding = Math.max(0, Math.floor((cols - boxWidth) / 2));
      const pad = " ".repeat(padding);
      const hasPlaceholder = !!question.placeholder;

      const inputLines: string[] = [""];
      let cursorLine = 0;
      let cursorCol = 0;

      // Calculate total box height: top border + label + [placeholder] + separator + input lines + separator + footer + bottom border
      const getBoxHeight = () => {
        const baseHeight = 6; // top + label + separator + separator + footer + bottom
        return baseHeight + (hasPlaceholder ? 1 : 0) + inputLines.length;
      };

      const render = () => {
        // Clear screen and reset cursor
        screen.clear();
        screen.home();

        const boxHeight = getBoxHeight();
        const { rows } = getTerminalSize();
        const topPadding = Math.max(0, Math.floor((rows - boxHeight) / 2));

        // Vertical centering
        for (let i = 0; i < topPadding; i++) {
          console.log();
        }

        // Top border
        console.log(
          `${pad}${colors.cyan}${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}${colors.reset}`
        );

        // Label line
        const labelText = ` ${question.label} `;
        const labelPad = Math.max(0, innerWidth - stripAnsi(labelText).length);
        console.log(
          `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.brightWhite}${labelText}${colors.reset}${" ".repeat(labelPad)}${colors.cyan}${box.vertical}${colors.reset}`
        );

        // Hint line (placeholder)
        if (hasPlaceholder) {
          const hintText = ` ${question.placeholder} `;
          const hintPad = Math.max(0, innerWidth - hintText.length);
          console.log(
            `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${hintText}${colors.reset}${" ".repeat(hintPad)}${colors.cyan}${box.vertical}${colors.reset}`
          );
        }

        // Separator
        console.log(
          `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
        );

        // Input lines
        for (const line of inputLines) {
          const displayLine = ` ${line}`;
          const linePad = Math.max(0, innerWidth - displayLine.length);
          console.log(
            `${pad}${colors.cyan}${box.vertical}${colors.reset}${displayLine}${" ".repeat(linePad)}${colors.cyan}${box.vertical}${colors.reset}`
          );
        }

        // Footer separator
        console.log(
          `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
        );

        // Footer
        const footerText = " Enter submit | Alt+Enter newline | Ctrl+C cancel ";
        const footerPad = Math.max(
          0,
          innerWidth - stripAnsi(footerText).length
        );
        console.log(
          `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${footerText}${colors.reset}${" ".repeat(footerPad)}${colors.cyan}${box.vertical}${colors.reset}`
        );

        // Bottom border
        console.log(
          `${pad}${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
        );

        // Position cursor inside the input area
        // Row from top: topPadding + top(1) + label(1) + [placeholder(1)] + separator(1) + cursorLine + 1
        const cursorRow =
          topPadding + 4 + (hasPlaceholder ? 1 : 0) + cursorLine;
        // Column: padding + border(1) + space(1) + cursorCol + 1
        const cursorColPos = padding + 2 + cursorCol + 1;

        // Move cursor to absolute position
        screen.moveTo(cursorRow, cursorColPos);
      };

      // Initial render
      render();

      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const state: TextInputState = { inputLines, cursorLine, cursorCol };
      const maxWidth = innerWidth - 2;

      const cleanup = () => {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onKey);
      };

      const handleSubmit = () => {
        cleanup();
        const answer = state.inputLines.join("\n");

        if (question.required && !answer.trim()) {
          console.log(`${colors.red}  Required field${colors.reset}`);
          console.log();
          this.askText(question).then(resolve);
          return;
        }

        if (question.validate) {
          const error = question.validate(answer);
          if (error) {
            console.log(`${colors.red}  ${error}${colors.reset}`);
            console.log();
            this.askText(question).then(resolve);
            return;
          }
        }

        this.answers[question.id] = answer;
        const displayAnswer = answer.includes("\n")
          ? `${answer.split("\n")[0]}...`
          : answer || "(empty)";
        console.log(
          `${colors.green}  ✓${colors.reset} ${colors.dim}${displayAnswer}${colors.reset}`
        );
        console.log();
        resolve();
      };

      const onKey = (key: string) => {
        const action = parseTextKey(key);

        switch (action.type) {
          case "cancel":
            cleanup();
            this.cancelled = true;
            resolve();
            break;
          case "submit":
            handleSubmit();
            break;
          case "newline":
            handleNewline(state);
            cursorLine = state.cursorLine;
            cursorCol = state.cursorCol;
            render();
            break;
          case "backspace":
            handleBackspace(state);
            cursorLine = state.cursorLine;
            cursorCol = state.cursorCol;
            render();
            break;
          case "arrow":
            handleArrow(state, action.direction);
            cursorLine = state.cursorLine;
            cursorCol = state.cursorCol;
            render();
            break;
          case "char":
            handleCharInput(state, action.char, maxWidth);
            cursorLine = state.cursorLine;
            cursorCol = state.cursorCol;
            render();
            break;
          default:
            break;
        }
      };

      process.stdin.on("data", onKey);
    });
  }

  /**
   * Ask a select question
   */
  private askSelect(question: SelectQuestion): Promise<void> {
    return new Promise((resolve) => {
      let selectedIndex = 0;

      const render = () => {
        screen.clear();
        screen.home();

        const boxHeight = question.options.length + 6;
        const { rows } = getTerminalSize();
        const topPadding = Math.max(0, Math.floor((rows - boxHeight) / 2));

        for (let i = 0; i < topPadding; i++) {
          console.log();
        }

        const content = question.options.map((opt, i) => {
          const selected = i === selectedIndex;
          const prefix = selected
            ? `${colors.cyan}▸${colors.reset}`
            : `${colors.dim} ${colors.reset}`;
          const label = selected
            ? `${colors.brightWhite}${opt.label}${colors.reset}`
            : `${colors.dim}${opt.label}${colors.reset}`;
          const hint =
            opt.hint && selected
              ? ` ${colors.dim}${opt.hint}${colors.reset}`
              : "";
          return `${prefix} ${label}${hint}`;
        });

        this.renderQuestionBox(question.label, undefined, {
          content,
          footer: "↑/↓ navigate | Enter select | Ctrl+C cancel",
        });
      };

      // Initial render
      render();

      // Handle keypresses
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onKey = (key: string) => {
        // Ctrl+C
        if (key === "\x03") {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onKey);
          this.cancelled = true;
          console.log();
          resolve();
          return;
        }

        // Arrow keys come as escape sequences
        if (key === "\x1b[A" || key === "k") {
          // Up
          selectedIndex =
            (selectedIndex - 1 + question.options.length) %
            question.options.length;
          render();
        } else if (key === "\x1b[B" || key === "j") {
          // Down
          selectedIndex = (selectedIndex + 1) % question.options.length;
          render();
        } else if (key === "\r" || key === "\n") {
          // Enter
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onKey);

          const selected = question.options[selectedIndex];
          if (selected) {
            this.answers[question.id] = selected.value;
            console.log(
              `${colors.green}  ✓${colors.reset} ${colors.dim}${selected.label}${colors.reset}`
            );
          }
          console.log();
          resolve();
        }
      };

      process.stdin.on("data", onKey);
    });
  }

  /**
   * Clean up stdin after key handling
   */
  private cleanupStdin(onKey: (key: string) => void): void {
    process.stdin.setRawMode?.(false);
    process.stdin.pause();
    process.stdin.removeListener("data", onKey);
  }

  /**
   * Handle key press for confirm question
   */
  private handleConfirmKey(
    key: string,
    currentValue: boolean
  ): { action: "none" | "cancel" | "toggle" | "confirm"; value: boolean } {
    // Ctrl+C
    if (key === "\x03") {
      return { action: "cancel", value: currentValue };
    }
    // Toggle keys (up/down/j/k)
    if (key === "\x1b[A" || key === "\x1b[B" || key === "k" || key === "j") {
      return { action: "toggle", value: !currentValue };
    }
    // Yes shortcut
    if (key === "y" || key === "Y") {
      return { action: "toggle", value: true };
    }
    // No shortcut
    if (key === "n" || key === "N") {
      return { action: "toggle", value: false };
    }
    // Enter
    if (key === "\r" || key === "\n") {
      return { action: "confirm", value: currentValue };
    }
    return { action: "none", value: currentValue };
  }

  /**
   * Ask a confirm question
   */
  private askConfirm(question: ConfirmQuestion): Promise<void> {
    return new Promise((resolve) => {
      const initial = question.initial ?? true;
      let value = initial;

      const render = () => {
        screen.clear();
        screen.home();

        const boxHeight = 7;
        const { rows } = getTerminalSize();
        const topPadding = Math.max(0, Math.floor((rows - boxHeight) / 2));

        for (let i = 0; i < topPadding; i++) {
          console.log();
        }

        const yesStyle = value
          ? `${colors.cyan}▸ ${colors.brightWhite}Yes${colors.reset}`
          : `${colors.dim}  Yes${colors.reset}`;
        const noStyle = value
          ? `${colors.dim}  No${colors.reset}`
          : `${colors.cyan}▸ ${colors.brightWhite}No${colors.reset}`;

        this.renderQuestionBox(question.label, undefined, {
          content: [yesStyle, noStyle],
          footer: "↑/↓ or y/n | Enter confirm | Ctrl+C cancel",
        });
      };

      // Initial render
      render();

      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onKey = (key: string) => {
        const result = this.handleConfirmKey(key, value);

        if (result.action === "cancel") {
          this.cleanupStdin(onKey);
          this.cancelled = true;
          console.log();
          resolve();
        } else if (result.action === "toggle") {
          value = result.value;
          render();
        } else if (result.action === "confirm") {
          this.cleanupStdin(onKey);
          this.answers[question.id] = value;
          console.log(
            `${colors.green}  ✓${colors.reset} ${colors.dim}${value ? "Yes" : "No"}${colors.reset}`
          );
          console.log();
          resolve();
        }
      };

      process.stdin.on("data", onKey);
    });
  }

  /**
   * Show a summary box before confirmation
   */
  showSummary(items: Record<string, string>): void {
    const { cols } = getTerminalSize();
    const boxWidth = Math.min(60, cols - 4);
    const innerWidth = boxWidth - 2;
    const padding = Math.max(0, Math.floor((cols - boxWidth) / 2));
    const pad = " ".repeat(padding);

    console.log(
      `${pad}${colors.brightCyan}${box.doubleTopLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleTopRight}${colors.reset}`
    );

    // Title
    const title = " CONFIGURATION ";
    const titlePad = Math.max(0, Math.floor((innerWidth - title.length) / 2));
    console.log(
      `${pad}${colors.brightCyan}${box.doubleVertical}${colors.reset}${" ".repeat(titlePad)}${colors.bold}${colors.brightWhite}${title}${colors.reset}${" ".repeat(innerWidth - titlePad - title.length)}${colors.brightCyan}${box.doubleVertical}${colors.reset}`
    );

    console.log(
      `${pad}${colors.brightCyan}${box.doubleVertical}${colors.reset}${" ".repeat(innerWidth)}${colors.brightCyan}${box.doubleVertical}${colors.reset}`
    );

    // Items
    for (const [key, value] of Object.entries(items)) {
      const keyStr = `${colors.cyan}${key.padEnd(12)}${colors.reset}`;
      const valStr = `${colors.brightWhite}${value}${colors.reset}`;
      const line = ` ${keyStr} ${valStr}`;
      const stripped = stripAnsi(line);
      const linePad = Math.max(0, innerWidth - stripped.length);
      console.log(
        `${pad}${colors.brightCyan}${box.doubleVertical}${colors.reset}${line}${" ".repeat(linePad)}${colors.brightCyan}${box.doubleVertical}${colors.reset}`
      );
    }

    console.log(
      `${pad}${colors.brightCyan}${box.doubleBottomLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleBottomRight}${colors.reset}`
    );
    console.log();
  }

  /**
   * Show cancelled message
   */
  showCancelled(): void {
    console.log();
    console.log(`${colors.yellow}  ⚠ Cancelled${colors.reset}`);
    console.log();
  }

  /**
   * Show ready to start message
   */
  showStarting(): void {
    const { cols } = getTerminalSize();
    const msg = "▸ Starting Ferix loop...";
    const padding = Math.max(0, Math.floor((cols - msg.length) / 2));
    console.log(
      `${" ".repeat(padding)}${colors.brightGreen}${msg}${colors.reset}`
    );
    console.log();
  }
}
