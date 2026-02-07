import {
  box,
  getToolColor,
  symbols,
  darkTheme as theme,
} from "../context/theme-constants.js";
import type { StyledChunk } from "../types.js";

/**
 * Creates a styled chunk with the given text and optional styling.
 * @param text - The text content
 * @param style - Optional styling properties
 * @returns A StyledChunk object
 */
function chunk(
  text: string,
  style?: Partial<Omit<StyledChunk, "text">>
): StyledChunk {
  return { text, ...style };
}

/**
 * Truncates text to fit within a maximum length, adding ellipsis if truncated.
 */
function truncate(text: string, maxLen: number): string {
  if (maxLen <= 0) {
    return "";
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
}

/**
 * Renders a tool use line (e.g., "▸ Read file.ts").
 * @param tool - The tool name
 * @param detail - Optional detail text
 * @returns Array of styled chunks
 */
export function toolUseLine(
  tool: string,
  detail: string,
  width: number
): StyledChunk[] {
  // prefix: "▸ " (2) + tool + " " (1)
  const prefixLen = 2 + tool.length + 1;
  const chunks: StyledChunk[] = [
    chunk(`${symbols.arrowFilled} `, { fg: theme.accent }),
    chunk(tool, { fg: getToolColor(tool), bold: true }),
  ];
  if (detail) {
    const maxDetail = width - prefixLen;
    chunks.push(
      chunk(` ${truncate(detail, maxDetail)}`, { fg: theme.textDim })
    );
  }
  return chunks;
}

/**
 * Renders a task line with ID and description.
 * @param id - Task ID
 * @param description - Task description
 * @returns Array of styled chunks
 */
export function taskLine(
  id: string,
  description: string,
  width: number
): StyledChunk[] {
  // prefix: "◆ " (2) + "[id]" (id.length + 2) + " " (1)
  const prefixLen = 2 + id.length + 2 + 1;
  const maxDesc = width - prefixLen;
  return [
    chunk(`${symbols.diamond} `, { fg: theme.accent }),
    chunk(`[${id}]`, { fg: theme.textMuted }),
    chunk(` ${truncate(description, maxDesc)}`, { fg: theme.text }),
  ];
}

/**
 * Renders a task done marker.
 * @param id - Task ID
 * @returns Array of styled chunks
 */
export function taskDone(id: string): StyledChunk[] {
  return [
    chunk(`${symbols.diamond} `, { fg: theme.brandGlow }),
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(` Task ${id} complete`, { fg: theme.textDim }),
  ];
}

/**
 * Renders phases section header.
 * @param _taskId - Task ID
 * @returns Array of styled chunks
 */
export function phasesHeader(_taskId: string): StyledChunk[] {
  return [
    chunk(`${symbols.arrowFilled} `, { fg: theme.accent }),
    chunk("Phases", { fg: theme.accent, bold: true }),
  ];
}

/**
 * Renders a phase line in tree structure.
 * @param id - Phase ID
 * @param description - Phase description
 * @returns Array of styled chunks
 */
export function phaseLine(
  id: string,
  description: string,
  width: number
): StyledChunk[] {
  // prefix: "  " (2) + "├ " (2) + "○" (1) + " [id]" (id.length + 3) + " " (1)
  const prefixLen = 2 + 2 + 1 + id.length + 3 + 1;
  const maxDesc = width - prefixLen;
  return [
    chunk("  ", {}),
    chunk(`${symbols.treeMiddle} `, { fg: theme.textGhost }),
    chunk(symbols.bulletEmpty, { fg: theme.textMuted }),
    chunk(` [${id}]`, { fg: theme.textGhost }),
    chunk(` ${truncate(description, maxDesc)}`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a phase start marker.
 * @param id - Phase ID
 * @returns Array of styled chunks
 */
export function phaseStart(id: string): StyledChunk[] {
  return [
    chunk("  ", {}),
    chunk(symbols.bulletFilled, { fg: theme.warning }),
    chunk(` Phase ${id} started`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a phase done marker.
 * @param id - Phase ID
 * @returns Array of styled chunks
 */
export function phaseDone(id: string): StyledChunk[] {
  return [
    chunk("  ", {}),
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(` Phase ${id} complete`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a phase failed marker with reason.
 * @param id - Phase ID
 * @param reason - Failure reason
 * @returns Array of styled chunks
 */
export function phaseFailed(
  id: string,
  reason: string,
  width: number
): StyledChunk[] {
  // prefix: "  " (2) + "✕" (1) + " Phase id failed: " (9 + id.length + 9)
  const prefixLen = 2 + 1 + 9 + id.length + 9;
  const maxReason = width - prefixLen;
  return [
    chunk("  ", {}),
    chunk(symbols.cross, { fg: theme.error }),
    chunk(` Phase ${id} failed: `, { fg: theme.textDim }),
    chunk(truncate(reason, maxReason), { fg: theme.error }),
  ];
}

/**
 * Renders criteria section header.
 * @param _taskId - Task ID
 * @returns Array of styled chunks
 */
export function criteriaHeader(_taskId: string): StyledChunk[] {
  return [
    chunk(`${symbols.arrowFilled} `, { fg: theme.accent }),
    chunk("Criteria", { fg: theme.accent, bold: true }),
  ];
}

/**
 * Renders a criterion line in tree structure.
 * @param id - Criterion ID
 * @param description - Criterion description
 * @returns Array of styled chunks
 */
export function criterionLine(
  id: string,
  description: string,
  width: number
): StyledChunk[] {
  // prefix: "  " (2) + "├ " (2) + "○" (1) + " [id]" (id.length + 3) + " " (1)
  const prefixLen = 2 + 2 + 1 + id.length + 3 + 1;
  const maxDesc = width - prefixLen;
  return [
    chunk("  ", {}),
    chunk(`${symbols.treeMiddle} `, { fg: theme.textGhost }),
    chunk(symbols.bulletEmpty, { fg: theme.textMuted }),
    chunk(` [${id}]`, { fg: theme.textGhost }),
    chunk(` ${truncate(description, maxDesc)}`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a criterion passed marker.
 * @param id - Criterion ID
 * @returns Array of styled chunks
 */
export function criterionPassed(id: string): StyledChunk[] {
  return [
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(` Criterion ${id} passed`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a criterion failed marker with reason.
 * @param id - Criterion ID
 * @param reason - Failure reason
 * @returns Array of styled chunks
 */
export function criterionFailed(
  id: string,
  reason: string,
  width: number
): StyledChunk[] {
  // prefix: "✕" (1) + " Criterion id failed: " (12 + id.length + 9)
  const prefixLen = 1 + 12 + id.length + 9;
  const maxReason = width - prefixLen;
  return [
    chunk(symbols.cross, { fg: theme.error }),
    chunk(` Criterion ${id} failed: `, { fg: theme.textDim }),
    chunk(truncate(reason, maxReason), { fg: theme.error }),
  ];
}

/**
 * Creates a header banner with decorative lines.
 * @param text - Banner text
 * @param width - Terminal width
 * @param borderColor - Color for border lines
 * @param textColor - Color for text
 * @param textBold - Whether text should be bold
 * @returns Array of styled chunks
 */
function headerBanner(
  text: string,
  width: number,
  borderColor: typeof theme.text,
  textColor: typeof theme.text,
  textBold = false
): StyledChunk[] {
  const innerWidth = width - 8;
  if (innerWidth < 10) {
    return [chunk(text, { fg: textColor, bold: textBold })];
  }
  const textLen = text.length;
  const sideLen = Math.max(1, Math.floor((innerWidth - textLen - 2) / 2));
  const line = box.singleHorizontal.repeat(sideLen);
  return [
    chunk(line, { fg: borderColor }),
    chunk(` ${text} `, { fg: textColor, bold: textBold }),
    chunk(line, { fg: borderColor }),
  ];
}

/**
 * Renders an error line.
 * @param message - Error message
 * @returns Array of styled chunks
 */
export function errorLine(message: string, width: number): StyledChunk[] {
  // prefix: "▸ " (2) + "ERROR" (5) + " │ " (3)
  const prefixLen = 10;
  const maxMsg = width - prefixLen;
  return [
    chunk(`${symbols.arrowFilled} `, { fg: theme.error }),
    chunk("ERROR", { fg: theme.error, bold: true }),
    chunk(` ${symbols.separator} `, { fg: theme.textMuted }),
    chunk(truncate(message, maxMsg), { fg: theme.error }),
  ];
}

/**
 * Renders a review passed banner.
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function reviewPassedBanner(width: number): StyledChunk[] {
  return headerBanner(
    `${symbols.checkmark} REVIEW PASSED`,
    width,
    theme.borderSubtle,
    theme.brandGlow,
    true
  );
}

/**
 * Renders a review failed banner.
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function reviewFailedBanner(width: number): StyledChunk[] {
  return headerBanner(
    `${symbols.cross} REVIEW FAILED`,
    width,
    theme.borderSubtle,
    theme.brightRed,
    true
  );
}

/**
 * Renders a check passed marker.
 * @returns Array of styled chunks
 */
export function checkPassed(): StyledChunk[] {
  return [
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(" Check passed", { fg: theme.textDim }),
  ];
}

/**
 * Renders a check failed marker.
 * @returns Array of styled chunks
 */
export function checkFailed(): StyledChunk[] {
  return [
    chunk(symbols.cross, { fg: theme.error }),
    chunk(" Check failed", { fg: theme.textDim }),
  ];
}

/**
 * Renders a review complete marker.
 * @returns Array of styled chunks
 */
export function reviewComplete(): StyledChunk[] {
  return [
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(" Review complete", { fg: theme.textDim }),
  ];
}

/**
 * Renders a review changes made marker.
 * @returns Array of styled chunks
 */
export function reviewChangesMade(): StyledChunk[] {
  return [
    chunk(symbols.bulletFilled, { fg: theme.info }),
    chunk(" Review made changes", { fg: theme.textDim }),
  ];
}

/**
 * Renders a session name marker.
 * @param name - Session name
 * @returns Array of styled chunks
 */
export function sessionName(name: string, width: number): StyledChunk[] {
  // prefix: "◇" (1) + " " (1)
  const prefixLen = 2;
  const maxName = width - prefixLen;
  return [
    chunk(symbols.diamondEmpty, { fg: theme.accent }),
    chunk(` ${truncate(name, maxName)}`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a learning line with category and content.
 * @param category - Learning category
 * @param content - Learning content
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function learningLine(
  category: string,
  content: string,
  width: number
): StyledChunk[] {
  const prefix = category ? `[${category}] ` : "";
  const prefixLen = 2 + prefix.length;
  const maxContent = width - prefixLen;
  return [
    chunk(`${symbols.bulletFilled} `, { fg: theme.info }),
    ...(category ? [chunk(prefix, { fg: theme.textMuted })] : []),
    chunk(truncate(content, maxContent), { fg: theme.textDim }),
  ];
}

/**
 * Renders a guardrail line with severity and pattern.
 * @param severity - Guardrail severity (critical or warn)
 * @param pattern - Guardrail pattern
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function guardrailLine(
  severity: string,
  pattern: string,
  width: number
): StyledChunk[] {
  const isCritical = severity === "critical";
  const icon = isCritical ? symbols.cross : symbols.triangle;
  const color = isCritical ? theme.error : theme.warning;
  const prefixLen = 14;
  const maxPattern = width - prefixLen;
  return [
    chunk(`${icon} `, { fg: color }),
    chunk("Guardrail: ", { fg: theme.textDim }),
    chunk(truncate(pattern, maxPattern), { fg: color }),
  ];
}

/**
 * Renders a verify started marker.
 * @param attempt - Verify attempt number
 * @returns Array of styled chunks
 */
export function verifyStartedLine(attempt: string): StyledChunk[] {
  return [
    chunk(`${symbols.arrowFilled} `, { fg: theme.accent }),
    chunk("Verify", { fg: theme.accent, bold: true }),
    chunk(` attempt ${attempt}`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a verify passed banner.
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function verifyPassedLine(width: number): StyledChunk[] {
  return headerBanner(
    `${symbols.checkmark} VERIFY PASSED`,
    width,
    theme.borderSubtle,
    theme.success,
    true
  );
}

/**
 * Renders a verify failed marker.
 * @param attempt - Verify attempt number
 * @returns Array of styled chunks
 */
export function verifyFailedLine(attempt: string): StyledChunk[] {
  return [
    chunk(symbols.cross, { fg: theme.error }),
    chunk(` Verify failed (attempt ${attempt})`, { fg: theme.textDim }),
  ];
}

/**
 * Renders a branch pushed line.
 * @param branch - Branch name
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function branchPushedLine(branch: string, width: number): StyledChunk[] {
  const prefixLen = 4;
  const maxBranch = width - prefixLen;
  return [
    chunk(`${symbols.arrowFilled} `, { fg: theme.success }),
    chunk(truncate(branch, maxBranch), { fg: theme.success }),
  ];
}

/**
 * Renders a PR created line.
 * @param url - PR URL
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function prCreatedLine(url: string, width: number): StyledChunk[] {
  const prefixLen = 7;
  const maxUrl = width - prefixLen;
  return [
    chunk(`${symbols.diamond} `, { fg: theme.brandGlow }),
    chunk("PR: ", { fg: theme.textDim }),
    chunk(truncate(url, maxUrl), { fg: theme.brandGlow, underline: true }),
  ];
}

/**
 * Renders an iteration separator line.
 * @param iteration - Current iteration number
 * @param maxIterations - Maximum iterations
 * @param width - Terminal width
 * @returns Array of styled chunks
 */
export function iterationSeparator(
  iteration: string,
  maxIterations: string,
  width: number
): StyledChunk[] {
  const label = ` Iteration ${iteration}/${maxIterations} `;
  const innerWidth = width - 4;
  const sideLen = Math.max(1, Math.floor((innerWidth - label.length) / 2));
  const line = box.singleHorizontal.repeat(sideLen);
  return [
    chunk(line, { fg: theme.borderSubtle }),
    chunk(label, { fg: theme.textMuted }),
    chunk(line, { fg: theme.borderSubtle }),
  ];
}

/**
 * Returns empty chunks (for hidden tags).
 * @returns Empty array of styled chunks
 */
export function hidden(): StyledChunk[] {
  return [];
}
