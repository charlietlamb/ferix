/**
 * Text input question handler
 */

import type { TextQuestion } from "../../../types/questions.js";
import type { TextInputState } from "../../../types/tui.js";
import {
  disableRawMode,
  enableRawMode,
} from "../../../utils/terminal/index.js";
import { colors, getTerminalSize, screen, symbols } from "../../ansi.js";
import {
  type BoxLayout,
  calculateBoxLayout,
  calculateVerticalPadding,
  drawBottomBorder,
  drawContentLine,
  drawSeparator,
  drawTopBorder,
  printVerticalPadding,
} from "../box-primitives.js";
import {
  handleArrow,
  handleBackspace,
  handleCharInput,
  handleNewline,
  parseTextKey,
} from "./keyboard.js";

/**
 * Calculate total box height for text input
 */
function calculateBoxHeight(
  hasPlaceholder: boolean,
  inputLineCount: number
): number {
  // top + label + separator + separator + footer + bottom = 6
  const baseHeight = 6;
  return baseHeight + (hasPlaceholder ? 1 : 0) + inputLineCount;
}

/** Build footer text with diamond bullets */
function buildFooter(): string {
  const d = `${colors.magenta}${symbols.diamond}${colors.reset}`;
  return `${d} ${colors.dim}Enter submit${colors.reset}  ${d} ${colors.dim}Alt+Enter newline${colors.reset}  ${d} ${colors.dim}Ctrl+C cancel${colors.reset}`;
}

/**
 * Render the text input box
 */
function renderTextBox(
  layout: BoxLayout,
  question: TextQuestion,
  inputLines: string[],
  cursorLine: number,
  cursorCol: number
): { cursorRow: number; cursorColPos: number } {
  const hasPlaceholder = !!question.placeholder;
  const boxHeight = calculateBoxHeight(hasPlaceholder, inputLines.length);
  const { rows } = getTerminalSize();
  const topPadding = calculateVerticalPadding(boxHeight, rows);

  // Clear and reset
  screen.clear();
  screen.home();

  // Vertical centering
  printVerticalPadding(topPadding);

  // Top border
  console.log(drawTopBorder(layout));

  // Label line
  console.log(drawContentLine(layout, question.label, { bright: true }));

  // Hint line (placeholder) - dim magenta
  if (hasPlaceholder) {
    const placeholder = `${colors.dim}${colors.magenta}${question.placeholder ?? ""}${colors.reset}`;
    console.log(drawContentLine(layout, placeholder));
  }

  // Separator
  console.log(drawSeparator(layout));

  // Input lines
  for (const line of inputLines) {
    console.log(drawContentLine(layout, line));
  }

  // Footer separator
  console.log(drawSeparator(layout));

  // Footer with diamond bullets
  console.log(drawContentLine(layout, buildFooter()));

  // Bottom border
  console.log(drawBottomBorder(layout));

  // Calculate cursor position
  // Row: topPadding + top(1) + label(1) + [hint(1)] + separator(1) + cursorLine
  const cursorRow = topPadding + 4 + (hasPlaceholder ? 1 : 0) + cursorLine;
  // Col: padding + border(1) + leftSpace(1) + cursorCol
  const cursorColPos = layout.padding + 2 + cursorCol + 1;

  return { cursorRow, cursorColPos };
}

/**
 * Ask a text question with inline input inside the box
 * Returns the answer value or null if cancelled
 */
export function askText(
  question: TextQuestion,
  onAnswer: (answer: string) => void,
  onCancel: () => void,
  onRetry: () => void
): void {
  const { cols } = getTerminalSize();
  const layout = calculateBoxLayout(cols);
  const maxWidth = layout.innerWidth - 2;

  // Initialize with initial value if provided, split by newlines
  const inputLines: string[] = question.initial
    ? question.initial.split("\n")
    : [""];
  // Position cursor at end of last line
  let cursorLine = inputLines.length - 1;
  let cursorCol = inputLines[cursorLine]?.length ?? 0;

  const render = () => {
    const { cursorRow, cursorColPos } = renderTextBox(
      layout,
      question,
      inputLines,
      cursorLine,
      cursorCol
    );
    screen.moveTo(cursorRow, cursorColPos);
  };

  // Initial render
  render();

  enableRawMode();

  const state: TextInputState = { inputLines, cursorLine, cursorCol };

  const cleanup = () => {
    disableRawMode();
    process.stdin.removeListener("data", onKey);
  };

  const handleSubmit = () => {
    cleanup();
    const answer = state.inputLines.join("\n");

    if (question.required && !answer.trim()) {
      console.log(`${colors.red}  Required field${colors.reset}`);
      console.log();
      onRetry();
      return;
    }

    if (question.validate) {
      const error = question.validate(answer);
      if (error) {
        console.log(`${colors.red}  ${error}${colors.reset}`);
        console.log();
        onRetry();
        return;
      }
    }

    const displayAnswer = answer.includes("\n")
      ? `${answer.split("\n")[0]}...`
      : answer || "(empty)";
    console.log(
      `${colors.green}  [ok]${colors.reset} ${colors.dim}${displayAnswer}${colors.reset}`
    );
    console.log();
    onAnswer(answer);
  };

  const onKey = (key: string) => {
    const action = parseTextKey(key);

    switch (action.type) {
      case "cancel":
        cleanup();
        onCancel();
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
}
