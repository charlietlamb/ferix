import {
  borderedLine,
  colors,
  stripAnsi,
  symbols,
  truncate,
} from "./primitives.js";

export function renderTaskBar(task: string, width: number): string {
  const label = `${colors.brand(symbols.arrow)} ${colors.brightWhite("TASK")} ${colors.muted(symbols.separator)}`;
  const labelLen = stripAnsi(label).length;
  const maxTaskLen = width - labelLen - 6; // Account for borders and spacing

  const taskDisplay = task.replace(/\n/g, " "); // Replace newlines with spaces
  const truncated = truncate(taskDisplay, maxTaskLen);

  return borderedLine(`${label} ${truncated}`, width);
}
