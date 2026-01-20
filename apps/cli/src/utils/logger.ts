import pc from "picocolors";

export const logger = {
  /** Ferix branded header */
  header() {
    console.log();
    console.log(pc.bold(pc.cyan("  🦊 Ferix")));
    console.log(pc.dim("  ─────────────────────────────"));
    console.log();
  },

  /** Info message */
  info(message: string) {
    console.log(pc.blue("ℹ"), message);
  },

  /** Success message */
  success(message: string) {
    console.log(pc.green("✓"), message);
  },

  /** Warning message */
  warn(message: string) {
    console.log(pc.yellow("⚠"), message);
  },

  /** Error message */
  error(message: string) {
    console.log(pc.red("✖"), message);
  },

  /** Step in progress */
  step(message: string) {
    console.log(pc.cyan("→"), message);
  },

  /** Iteration header */
  iteration(current: number, total: number | "∞") {
    console.log();
    console.log(pc.bold(pc.magenta(`  Loop ${current}/${total}`)));
    console.log(pc.dim("  ─────────────────────────────"));
  },

  /** Dimmed secondary info */
  dim(message: string) {
    console.log(pc.dim(`  ${message}`));
  },

  /** Summary box */
  summary(items: Record<string, string | undefined>) {
    console.log();
    console.log(pc.dim("  ┌─────────────────────────────┐"));
    for (const [key, value] of Object.entries(items)) {
      if (value !== undefined) {
        const paddedKey = key.padEnd(12);
        console.log(pc.dim("  │"), pc.bold(paddedKey), pc.dim(value));
      }
    }
    console.log(pc.dim("  └─────────────────────────────┘"));
    console.log();
  },

  /** Show the composed prompt */
  prompt(content: string) {
    console.log();
    console.log(pc.dim("  ┌─── Composed Prompt ─────────┐"));
    for (const line of content.split("\n")) {
      console.log(pc.dim("  │"), line);
    }
    console.log(pc.dim("  └─────────────────────────────┘"));
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
    const horizontalLine = "─".repeat(boxWidth);

    console.log();
    console.log(pc.red(`  ┌${horizontalLine}┐`));
    console.log(
      pc.red("  │"),
      pc.bold(pc.red(errorType.padEnd(boxWidth - 1))),
      pc.red("│")
    );
    console.log(pc.red(`  ├${horizontalLine}┤`));
    for (const line of lines) {
      console.log(
        pc.red("  │"),
        pc.white(line.padEnd(boxWidth - 1)),
        pc.red("│")
      );
    }
    console.log(pc.red(`  └${horizontalLine}┘`));
    console.log();
  },
};
