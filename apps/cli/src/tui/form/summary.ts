/**
 * Summary and completion screens for the form
 */

import { UI } from "../../constants.js";
import { box, colors, getTerminalSize, stripAnsi, symbols } from "../ansi.js";
import { calculatePadding } from "./box-renderer.js";

/**
 * Show a summary box before confirmation
 */
export function showSummary(items: Record<string, string>): void {
  const { cols } = getTerminalSize();
  const boxWidth = Math.min(UI.BOX_MAX_WIDTH, cols - UI.BOX_MARGIN);
  const innerWidth = boxWidth - 2;
  const padding = calculatePadding(boxWidth, cols);
  const pad = " ".repeat(padding);

  console.log(
    `${pad}${colors.brightCyan}${box.doubleTopLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleTopRight}${colors.reset}`
  );

  // Title with magenta diamond decorations
  const title = `${colors.magenta}${symbols.diamond}${colors.reset} ${colors.bold}${colors.brightWhite}CONFIGURATION${colors.reset} ${colors.magenta}${symbols.diamond}${colors.reset}`;
  const titleText = `${symbols.diamond} CONFIGURATION ${symbols.diamond}`;
  const titlePad = Math.max(0, Math.floor((innerWidth - titleText.length) / 2));
  console.log(
    `${pad}${colors.brightCyan}${box.doubleVertical}${colors.reset}${" ".repeat(titlePad)}${title}${" ".repeat(innerWidth - titlePad - titleText.length)}${colors.brightCyan}${box.doubleVertical}${colors.reset}`
  );

  console.log(
    `${pad}${colors.brightCyan}${box.doubleVertical}${colors.reset}${" ".repeat(innerWidth)}${colors.brightCyan}${box.doubleVertical}${colors.reset}`
  );

  // Items
  for (const [key, value] of Object.entries(items)) {
    const keyStr = `${colors.cyan}${key.padEnd(UI.KEY_COLUMN_WIDTH)}${colors.reset}`;
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
export function showCancelled(): void {
  console.log();
  console.log(`${colors.yellow}  Cancelled${colors.reset}`);
  console.log();
}

/**
 * Show ready to start message
 */
export function showStarting(): void {
  const { cols } = getTerminalSize();
  const msg = "Starting Ferix loop...";
  const padding = Math.max(0, Math.floor((cols - msg.length) / 2));
  console.log(
    `${" ".repeat(padding)}${colors.brightGreen}${msg}${colors.reset}`
  );
  console.log();
}
