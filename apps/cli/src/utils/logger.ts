import pc from "picocolors";
import { CLI } from "../constants.js";

/** Diamond character for decorative elements */
const DIAMOND = "◆";
/** Heavy horizontal line for banners */
const HEAVY = "━";
/** Double horizontal line for boxes */
const DOUBLE = "═";

export const logger = {
  /** Ferix branded header */
  header() {
    const brand = `🦊 FERIX v${CLI.VERSION}`;
    const boxWidth = 35;
    const innerWidth = boxWidth - 4; // Account for ◆ and spaces on each side
    const padding = Math.max(0, innerWidth - brand.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;

    const heavyLine = HEAVY.repeat(boxWidth - 2);
    const topLine = `${pc.magenta(DIAMOND)}${pc.cyan(heavyLine)}${pc.magenta(DIAMOND)}`;
    const centerText = `${" ".repeat(leftPad)}${pc.bold(pc.magenta(brand))}${" ".repeat(rightPad)}`;
    const bottomLine = `${pc.magenta(DIAMOND)}${pc.cyan(heavyLine)}${pc.magenta(DIAMOND)}`;

    console.log();
    console.log(`  ${topLine}`);
    console.log(
      `  ${pc.magenta(DIAMOND)} ${centerText} ${pc.magenta(DIAMOND)}`
    );
    console.log(`  ${bottomLine}`);
    console.log();
  },

  /** Info message */
  info(message: string) {
    console.log(pc.magenta(DIAMOND), pc.blue("ℹ"), message);
  },

  /** Success message */
  success(message: string) {
    console.log(pc.magenta(DIAMOND), pc.green("✓"), message);
  },

  /** Warning message */
  warn(message: string) {
    console.log(pc.magenta(DIAMOND), pc.yellow("⚠"), message);
  },

  /** Error message */
  error(message: string) {
    console.log(pc.magenta(DIAMOND), pc.red("✖"), message);
  },

  /** Step in progress */
  step(message: string) {
    console.log(pc.magenta(DIAMOND), pc.cyan("→"), message);
  },

  /** Iteration header */
  iteration(current: number, total: number | "∞") {
    const loopText = `Loop ${current}/${total}`;
    const boxWidth = 35;
    const innerWidth = boxWidth - 4;
    const padding = Math.max(0, innerWidth - loopText.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;

    const heavyLine = HEAVY.repeat(boxWidth - 2);
    const topLine = `${pc.magenta(DIAMOND)}${pc.cyan(heavyLine)}${pc.magenta(DIAMOND)}`;
    const centerText = `${" ".repeat(leftPad)}${pc.bold(pc.magenta(loopText))}${" ".repeat(rightPad)}`;
    const bottomLine = `${pc.magenta(DIAMOND)}${pc.cyan(heavyLine)}${pc.magenta(DIAMOND)}`;

    console.log();
    console.log(`  ${topLine}`);
    console.log(
      `  ${pc.magenta(DIAMOND)} ${centerText} ${pc.magenta(DIAMOND)}`
    );
    console.log(`  ${bottomLine}`);
  },

  /** Dimmed secondary info */
  dim(message: string) {
    console.log(pc.dim(`  ${message}`));
  },

  /** Summary box */
  summary(items: Record<string, string | undefined>) {
    const boxWidth = 35;
    const doubleLine = DOUBLE.repeat(boxWidth - 2);
    const topLine = `${pc.magenta(DIAMOND)}${pc.cyan(doubleLine)}${pc.magenta(DIAMOND)}`;
    const bottomLine = `${pc.magenta(DIAMOND)}${pc.cyan(doubleLine)}${pc.magenta(DIAMOND)}`;

    console.log();
    console.log(`  ${topLine}`);
    for (const [key, value] of Object.entries(items)) {
      if (value !== undefined) {
        const paddedKey = key.padEnd(12);
        console.log(
          `  ${pc.magenta(DIAMOND)}`,
          pc.bold(paddedKey),
          pc.dim(value)
        );
      }
    }
    console.log(`  ${bottomLine}`);
    console.log();
  },

  /** Show the composed prompt */
  prompt(content: string) {
    const headerText = "Composed Prompt";
    const boxWidth = 35;
    const doubleLine = DOUBLE.repeat(boxWidth - 2);
    const headerPadding = boxWidth - 4 - headerText.length;
    const headerLeftPad = Math.floor(headerPadding / 2);
    const headerRightPad = headerPadding - headerLeftPad;

    const topLine = `${pc.magenta(DIAMOND)}${pc.cyan(doubleLine)}${pc.magenta(DIAMOND)}`;
    const headerLine = `${pc.magenta(DIAMOND)} ${" ".repeat(headerLeftPad)}${pc.bold(pc.magenta(headerText))}${" ".repeat(headerRightPad)} ${pc.magenta(DIAMOND)}`;
    const bottomLine = `${pc.magenta(DIAMOND)}${pc.cyan(doubleLine)}${pc.magenta(DIAMOND)}`;

    console.log();
    console.log(`  ${topLine}`);
    console.log(`  ${headerLine}`);
    console.log(`  ${topLine}`);
    for (const line of content.split("\n")) {
      console.log(`  ${pc.magenta(DIAMOND)}`, line);
    }
    console.log(`  ${bottomLine}`);
    console.log();
  },

  /** Show a formatted error box from the agent */
  agentError(errorType: string, message: string) {
    const maxWidth = 60;
    const words = message.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    // Word wrap the message
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    const boxWidth = Math.max(maxWidth, errorType.length + 4);
    const heavyLine = HEAVY.repeat(boxWidth - 2);
    const headerPadding = boxWidth - 4 - errorType.length;
    const headerLeftPad = Math.floor(headerPadding / 2);
    const headerRightPad = headerPadding - headerLeftPad;

    const topLine = `${pc.magenta(DIAMOND)}${pc.red(heavyLine)}${pc.magenta(DIAMOND)}`;
    const headerLine = `${pc.magenta(DIAMOND)} ${" ".repeat(headerLeftPad)}${pc.bold(pc.red(errorType))}${" ".repeat(headerRightPad)} ${pc.magenta(DIAMOND)}`;
    const separatorLine = `${pc.magenta(DIAMOND)}${pc.red(heavyLine)}${pc.magenta(DIAMOND)}`;
    const bottomLine = `${pc.magenta(DIAMOND)}${pc.red(heavyLine)}${pc.magenta(DIAMOND)}`;

    console.log();
    console.log(`  ${topLine}`);
    console.log(`  ${headerLine}`);
    console.log(`  ${separatorLine}`);
    for (const line of lines) {
      console.log(`  ${pc.magenta(DIAMOND)}`, pc.white(line));
    }
    console.log(`  ${bottomLine}`);
    console.log();
  },
};
