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
 * Renders a tool use line (e.g., ">> Read file.ts").
 * @param tool - The tool name
 * @param detail - Optional detail text
 * @returns Array of styled chunks
 */
export function toolUseLine(tool: string, detail: string): StyledChunk[] {
  const chunks: StyledChunk[] = [
    chunk(`${symbols.prompt} `, { fg: theme.textMuted }),
    chunk(tool, { fg: getToolColor(tool) }),
  ];
  if (detail) {
    chunks.push(chunk(` ${detail}`, { fg: theme.textMuted }));
  }
  return chunks;
}

/**
 * Renders a task list header banner.
 * @param width - Terminal width for centering
 * @returns Array of styled chunks
 */
export function taskListHeader(width: number): StyledChunk[] {
  const innerWidth = width - 6;
  if (innerWidth < 10) {
    return [chunk("TASKS", { fg: theme.brand, bold: true })];
  }
  const label = " TASKS ";
  const sideLen = Math.max(1, Math.floor((innerWidth - label.length) / 2));
  return [
    chunk(box.singleTopLeft, { fg: theme.border }),
    chunk(box.singleHorizontal.repeat(sideLen), { fg: theme.border }),
    chunk(label, { fg: theme.brand, bold: true }),
    chunk(box.singleHorizontal.repeat(sideLen), { fg: theme.border }),
  ];
}

/**
 * Renders a task list footer.
 * @returns Array of styled chunks
 */
export function taskListFooter(): StyledChunk[] {
  return [
    chunk(
      `${box.singleBottomLeft}${box.singleHorizontal.repeat(32)}${box.singleBottomRight}`,
      {
        fg: theme.border,
      }
    ),
  ];
}

/**
 * Renders a task line with ID and description.
 * @param id - Task ID
 * @param description - Task description
 * @returns Array of styled chunks
 */
export function taskLine(id: string, description: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator} `, { fg: theme.border }),
    chunk(`[${id}]`, { fg: theme.text, bold: true }),
    chunk(` ${description}`, { fg: theme.text }),
  ];
}

/**
 * Renders a task done marker.
 * @param id - Task ID
 * @returns Array of styled chunks
 */
export function taskDone(id: string): StyledChunk[] {
  return [
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(` Task ${id} complete`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders phases section header.
 * @param taskId - Task ID
 * @returns Array of styled chunks
 */
export function phasesHeader(taskId: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(`Phases for task ${taskId}:`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders a phase line in tree structure.
 * @param id - Phase ID
 * @param description - Phase description
 * @returns Array of styled chunks
 */
export function phaseLine(id: string, description: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(`${symbols.treeMiddle} `, { fg: theme.textMuted }),
    chunk(symbols.bulletEmpty, { fg: theme.textMuted }),
    chunk(` [${id}]`, { fg: theme.textMuted }),
    chunk(` ${description}`, { fg: theme.text }),
  ];
}

/**
 * Renders a phase start marker.
 * @param id - Phase ID
 * @returns Array of styled chunks
 */
export function phaseStart(id: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(symbols.bulletFilled, { fg: theme.warning }),
    chunk(` Phase ${id} started`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders a phase done marker.
 * @param id - Phase ID
 * @returns Array of styled chunks
 */
export function phaseDone(id: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(` Phase ${id} complete`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders a phase failed marker with reason.
 * @param id - Phase ID
 * @param reason - Failure reason
 * @returns Array of styled chunks
 */
export function phaseFailed(id: string, reason: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(symbols.cross, { fg: theme.error }),
    chunk(` Phase ${id} failed: `, { fg: theme.textMuted }),
    chunk(reason, { fg: theme.error }),
  ];
}

/**
 * Renders criteria section header.
 * @param taskId - Task ID
 * @returns Array of styled chunks
 */
export function criteriaHeader(taskId: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(`Success criteria for task ${taskId}:`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders a criterion line in tree structure.
 * @param id - Criterion ID
 * @param description - Criterion description
 * @returns Array of styled chunks
 */
export function criterionLine(id: string, description: string): StyledChunk[] {
  return [
    chunk(`${symbols.separator}   `, { fg: theme.border }),
    chunk(`${symbols.treeMiddle} `, { fg: theme.textMuted }),
    chunk(symbols.bulletEmpty, { fg: theme.textMuted }),
    chunk(` [${id}]`, { fg: theme.textMuted }),
    chunk(` ${description}`, { fg: theme.text }),
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
    chunk(` Criterion ${id} passed`, { fg: theme.textMuted }),
  ];
}

/**
 * Renders a criterion failed marker with reason.
 * @param id - Criterion ID
 * @param reason - Failure reason
 * @returns Array of styled chunks
 */
export function criterionFailed(id: string, reason: string): StyledChunk[] {
  return [
    chunk(symbols.cross, { fg: theme.error }),
    chunk(` Criterion ${id} failed: `, { fg: theme.textMuted }),
    chunk(reason, { fg: theme.error }),
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
export function errorLine(message: string): StyledChunk[] {
  return [
    chunk(`${symbols.arrow} `, { fg: theme.brand }),
    chunk("ERROR", { fg: theme.error }),
    chunk(` ${symbols.separator} `, { fg: theme.textMuted }),
    chunk(message, { fg: theme.error }),
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
    theme.brightCyan,
    theme.brightGreen,
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
    theme.brightCyan,
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
    chunk(" Check passed", { fg: theme.textMuted }),
  ];
}

/**
 * Renders a check failed marker.
 * @returns Array of styled chunks
 */
export function checkFailed(): StyledChunk[] {
  return [
    chunk(symbols.cross, { fg: theme.error }),
    chunk(" Check failed", { fg: theme.textMuted }),
  ];
}

/**
 * Renders a review complete marker.
 * @returns Array of styled chunks
 */
export function reviewComplete(): StyledChunk[] {
  return [
    chunk(symbols.checkmark, { fg: theme.success }),
    chunk(" Review complete", { fg: theme.textMuted }),
  ];
}

/**
 * Renders a review changes made marker.
 * @returns Array of styled chunks
 */
export function reviewChangesMade(): StyledChunk[] {
  return [
    chunk(symbols.bulletFilled, { fg: theme.info }),
    chunk(" Review made changes", { fg: theme.textMuted }),
  ];
}

/**
 * Renders a session name marker.
 * @param name - Session name
 * @returns Array of styled chunks
 */
export function sessionName(name: string): StyledChunk[] {
  return [
    chunk(symbols.arrow, { fg: theme.brand }),
    chunk(` ${name}`, { fg: theme.textMuted }),
  ];
}

/**
 * Returns empty chunks (for hidden tags).
 * @returns Empty array of styled chunks
 */
export function hidden(): StyledChunk[] {
  return [];
}
