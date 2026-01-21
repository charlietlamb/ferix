/**
 * Text input question handler
 */

import { UI } from "../../../constants.js";
import type { TextQuestion } from "../../../types/questions.js";
import type { TextInputState } from "../../../types/tui.js";
import {
  disableRawMode,
  enableRawMode,
} from "../../../utils/terminal/index.js";
import { box, colors, getTerminalSize, screen, stripAnsi } from "../../ansi.js";
import {
  handleArrow,
  handleBackspace,
  handleCharInput,
  handleNewline,
  parseTextKey,
} from "./keyboard.js";

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
  const boxWidth = Math.min(UI.BOX_MAX_WIDTH, cols - UI.BOX_MARGIN);
  const innerWidth = boxWidth - 2;
  const padding = Math.max(0, Math.floor((cols - boxWidth) / 2));
  const pad = " ".repeat(padding);
  const hasPlaceholder = !!question.placeholder;

  const inputLines: string[] = [""];
  let cursorLine = 0;
  let cursorCol = 0;

  // Calculate total box height
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
    const footerPad = Math.max(0, innerWidth - stripAnsi(footerText).length);
    console.log(
      `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${footerText}${colors.reset}${" ".repeat(footerPad)}${colors.cyan}${box.vertical}${colors.reset}`
    );

    // Bottom border
    console.log(
      `${pad}${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
    );

    // Position cursor inside the input area
    const cursorRow = topPadding + 4 + (hasPlaceholder ? 1 : 0) + cursorLine;
    const cursorColPos = padding + 2 + cursorCol + 1;

    // Move cursor to absolute position
    screen.moveTo(cursorRow, cursorColPos);
  };

  // Initial render
  render();

  enableRawMode();

  const state: TextInputState = { inputLines, cursorLine, cursorCol };
  const maxWidth = innerWidth - 2;

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
      `${colors.green}  ✓${colors.reset} ${colors.dim}${displayAnswer}${colors.reset}`
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
