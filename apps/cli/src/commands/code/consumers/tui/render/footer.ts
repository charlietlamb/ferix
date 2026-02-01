import pc from "picocolors";
import type { TUIState } from "../../../domain/schemas/tui.js";
import { box, colors, stripAnsi, symbols } from "./primitives.js";

function hint(key: string, description: string): string {
  return `${colors.brand(symbols.diamond)} ${colors.brightWhite(key)} ${colors.muted(description)}`;
}

function scrollPosition(offset: number, total: number, height: number): string {
  if (total <= height) {
    return "";
  }

  const maxOffset = Math.max(0, total - height);
  const percent = maxOffset > 0 ? Math.round((offset / maxOffset) * 100) : 0;
  const display = `[${percent}%]`;

  // Yellow when user has scrolled, dim when auto-scrolling
  return offset > 0 ? colors.warning(display) : colors.muted(display);
}

export function renderFooter(
  state: TUIState,
  width: number,
  outputHeight: number
): string {
  const hints: string[] = [];

  switch (state.viewMode) {
    case "logs": {
      hints.push(hint("j/k", "scroll"));
      const scrollPos = scrollPosition(
        state.scrollOffset,
        state.outputLines.length,
        outputHeight
      );
      if (scrollPos) {
        hints.push(scrollPos);
      }
      hints.push(hint("t", "tasks"));
      hints.push(hint("Esc", "launcher"));
      hints.push(hint("^C", "quit"));
      break;
    }

    case "tasks": {
      hints.push(hint("j/k", "navigate"));
      hints.push(hint("Enter", "details"));
      hints.push(hint("Esc", "back"));
      hints.push(hint("^C", "quit"));
      break;
    }

    case "detail": {
      hints.push(hint("j/k", "scroll"));
      // For detail view, we'd need to calculate scroll position differently
      hints.push(hint("Esc", "back"));
      hints.push(hint("^C", "quit"));
      break;
    }

    default:
      hints.push(hint("^C", "quit"));
  }

  const content = hints.join("  ");
  const stripped = stripAnsi(content);
  const padding = Math.max(0, width - stripped.length - 4);

  return `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${content}${pc.cyan(box.horizontal.repeat(Math.max(1, padding)))}${pc.cyan(box.bottomRight)}`;
}
