/**
 * Select input question handler
 */

import type { SelectQuestion } from "../../../types/questions.js";
import {
  disableRawMode,
  enableRawMode,
} from "../../../utils/terminal/index.js";
import { colors, getTerminalSize, screen } from "../../ansi.js";
import { renderQuestionBox } from "../box-renderer.js";

/**
 * Ask a select question
 */
export function askSelect(
  question: SelectQuestion,
  onAnswer: (value: string | number) => void,
  onCancel: () => void
): void {
  let selectedIndex = 0;

  const render = () => {
    screen.clear();
    screen.home();
    screen.hideCursor();

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
        opt.hint && selected ? ` ${colors.dim}${opt.hint}${colors.reset}` : "";
      return `${prefix} ${label}${hint}`;
    });

    renderQuestionBox(question.label, undefined, {
      content,
      footer: "↑/↓ navigate | Enter select | Ctrl+C cancel",
    });
  };

  // Initial render
  render();

  // Handle keypresses
  enableRawMode();

  const onKey = (key: string) => {
    // Ctrl+C
    if (key === "\x03") {
      disableRawMode();
      process.stdin.removeListener("data", onKey);
      screen.showCursor();
      console.log();
      onCancel();
      return;
    }

    // Arrow keys come as escape sequences
    if (key === "\x1b[A" || key === "k") {
      // Up
      selectedIndex =
        (selectedIndex - 1 + question.options.length) % question.options.length;
      render();
    } else if (key === "\x1b[B" || key === "j") {
      // Down
      selectedIndex = (selectedIndex + 1) % question.options.length;
      render();
    } else if (key === "\r" || key === "\n") {
      // Enter
      disableRawMode();
      process.stdin.removeListener("data", onKey);
      screen.showCursor();

      const selected = question.options[selectedIndex];
      if (selected) {
        console.log(
          `${colors.green}  ✓${colors.reset} ${colors.dim}${selected.label}${colors.reset}`
        );
        console.log();
        onAnswer(selected.value);
      }
    }
  };

  process.stdin.on("data", onKey);
}
