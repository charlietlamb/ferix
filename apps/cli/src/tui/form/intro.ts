/**
 * Intro screen with ASCII art logo
 */

import { waitForAnyKey } from "../../utils/terminal/index.js";
import { colors, getTerminalSize, screen } from "../ansi.js";
import { drawHorizontalLine } from "./box-renderer.js";

/** ASCII art FERIX logo */
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

/** Logo color */
const LOGO_COLOR = colors.white;

/**
 * Calculate centered padding for a string
 */
function centerPadding(text: string, cols: number): string {
  const padding = Math.max(0, Math.floor((cols - text.length) / 2));
  return " ".repeat(padding);
}

/**
 * Show the intro screen with logo and wait for keypress
 */
export async function showIntro(): Promise<void> {
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
    const pad = centerPadding(line, cols);
    console.log(`${pad}${LOGO_COLOR}${line}${colors.reset}`);
  }

  console.log();

  // Subtitle
  const subtitle = "Composable RALPH Loops";
  const subtitlePad = centerPadding(subtitle, cols);
  console.log(`${subtitlePad}${colors.brightWhite}${subtitle}${colors.reset}`);

  console.log();

  // Description lines
  const descLines = [
    "An AI-powered coding assistant that breaks down complex tasks",
    "into composable loops, executing them autonomously with",
    "real-time progress tracking and intelligent error recovery.",
  ];

  for (const desc of descLines) {
    const descPad = centerPadding(desc, cols);
    console.log(`${descPad}${colors.dim}${desc}${colors.reset}`);
  }

  console.log();

  // Decorative line
  const lineWidth = Math.min(56, cols - 4);
  drawHorizontalLine(lineWidth, cols);

  console.log();

  // Press any key prompt
  const prompt = "Press any key to continue...";
  const promptPad = centerPadding(prompt, cols);
  console.log(`${promptPad}${colors.dim}${prompt}${colors.reset}`);

  // Wait for keypress
  await waitForAnyKey();
}
