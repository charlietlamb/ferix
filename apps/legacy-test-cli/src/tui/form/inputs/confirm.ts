/**
 * Confirm (yes/no) input question handler
 */

import type { ConfirmQuestion } from "../../../types/questions.js";
import {
  disableRawMode,
  enableRawMode,
} from "../../../utils/terminal/index.js";
import { colors, getTerminalSize, screen, symbols } from "../../ansi.js";
import { renderQuestionBox } from "../box-renderer.js";

/**
 * Handle key press for confirm question
 */
function handleConfirmKey(
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

/** Build footer text with diamond bullets */
function buildFooter(): string {
  const d = `${colors.magenta}${symbols.diamond}${colors.reset}`;
  return `${d} ${colors.dim}↑/↓ or y/n${colors.reset}  ${d} ${colors.dim}Enter confirm${colors.reset}  ${d} ${colors.dim}Ctrl+C cancel${colors.reset}`;
}

/**
 * Ask a confirm question
 */
export function askConfirm(
  question: ConfirmQuestion,
  onAnswer: (value: boolean) => void,
  onCancel: () => void
): void {
  const initial = question.initial ?? true;
  let value = initial;

  const render = () => {
    screen.clear();
    screen.home();
    screen.hideCursor();

    const boxHeight = 7;
    const { rows } = getTerminalSize();
    const topPadding = Math.max(0, Math.floor((rows - boxHeight) / 2));

    for (let i = 0; i < topPadding; i++) {
      console.log();
    }

    const yesStyle = value
      ? `${colors.brightMagenta}${symbols.arrowRight} ${colors.brightWhite}Yes${colors.reset}`
      : `${colors.dim}  Yes${colors.reset}`;
    const noStyle = value
      ? `${colors.dim}  No${colors.reset}`
      : `${colors.brightMagenta}${symbols.arrowRight} ${colors.brightWhite}No${colors.reset}`;

    renderQuestionBox(question.label, undefined, {
      content: [yesStyle, noStyle],
      footer: buildFooter(),
    });
  };

  // Initial render
  render();

  enableRawMode();

  const onKey = (key: string) => {
    const result = handleConfirmKey(key, value);

    if (result.action === "cancel") {
      disableRawMode();
      process.stdin.removeListener("data", onKey);
      screen.showCursor();
      console.log();
      onCancel();
    } else if (result.action === "toggle") {
      value = result.value;
      render();
    } else if (result.action === "confirm") {
      disableRawMode();
      process.stdin.removeListener("data", onKey);
      screen.showCursor();
      console.log(
        `${colors.green}  ${symbols.checkmark}${colors.reset} ${colors.dim}${value ? "Yes" : "No"}${colors.reset}`
      );
      console.log();
      onAnswer(value);
    }
  };

  process.stdin.on("data", onKey);
}
