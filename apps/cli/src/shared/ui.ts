import ora, { type Ora } from "ora";
import pc from "picocolors";

// ============================================================================
// Symbols
// ============================================================================

const SYMBOLS = {
  success: pc.green("✓"),
  error: pc.red("✗"),
};

// ============================================================================
// Print Helpers
// ============================================================================

export const printHeader = (title: string, subtitle?: string): void => {
  console.log();
  console.log(pc.bold(pc.cyan(`  ${title}`)));
  if (subtitle) {
    console.log(pc.dim(`  ${subtitle}`));
  }
  console.log();
};

export const printSection = (title: string): void => {
  console.log();
  console.log(pc.bold(`  ${title}`));
};

export const printRepo = (owner: string, repo: string, index: number): void => {
  const num = pc.dim(`${String(index + 1).padStart(2, " ")}.`);
  console.log(`  ${num} ${pc.cyan(owner)}${pc.dim("/")}${pc.white(repo)}`);
};

export const printSuccess = (message: string): void => {
  console.log(`  ${SYMBOLS.success} ${pc.green(message)}`);
};

export const printError = (message: string): void => {
  console.log(`  ${SYMBOLS.error} ${pc.red(message)}`);
};

export const printHint = (message: string): void => {
  console.log(pc.dim(`  ${message}`));
};

// ============================================================================
// Spinner
// ============================================================================

export const createSpinner = (text: string): Ora => {
  return ora({
    text,
    prefixText: " ",
    spinner: "dots",
  });
};
