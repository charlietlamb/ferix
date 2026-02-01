import { box, colors, getToolColor, symbols } from "../render/primitives.js";

/**
 * Tool use line renderer.
 */
export function toolUseLine(tool: string, detail: string): string {
  const toolColor = getToolColor(tool);
  const arrow = colors.muted(symbols.prompt);
  const toolName = toolColor(tool);
  const detailText = detail ? ` ${colors.muted(detail)}` : "";
  return `${arrow} ${toolName}${detailText}`;
}

/**
 * Helper to create a header banner with lines.
 */
function headerBanner(
  text: string,
  width: number,
  borderColor: (s: string) => string,
  textColor: (s: string) => string
): string {
  const innerWidth = width - 8;
  // Guard against small widths - just return styled text
  if (innerWidth < 10) {
    return textColor(text);
  }
  const textLen = text.length;
  const sideLen = Math.max(1, Math.floor((innerWidth - textLen - 2) / 2));
  const line = box.singleHorizontal.repeat(sideLen);
  return `${borderColor(line)} ${textColor(text)} ${borderColor(line)}`;
}

/**
 * Task list header.
 */
export function taskListHeader(width: number): string {
  const innerWidth = width - 6;
  // Guard against small widths
  if (innerWidth < 10) {
    return colors.brand("TASKS");
  }
  const label = " TASKS ";
  const sideLen = Math.max(1, Math.floor((innerWidth - label.length) / 2));
  return `${colors.border("┌")}${colors.border(box.singleHorizontal.repeat(sideLen))}${colors.brand(label)}${colors.border(box.singleHorizontal.repeat(sideLen))}`;
}

/**
 * Task list footer.
 */
export function taskListFooter(): string {
  return colors.border("└────────────────────────────────┘");
}

/**
 * Task line.
 */
export function taskLine(id: string, description: string): string {
  return `${colors.border("│")} ${colors.brightWhite(`[${id}]`)} ${description}`;
}

/**
 * Task done marker.
 */
export function taskDone(id: string): string {
  return `${colors.success(symbols.checkmark)} ${colors.muted(`Task ${id} complete`)}`;
}

/**
 * Phases header.
 */
export function phasesHeader(taskId: string): string {
  return `${colors.border("│")}   ${colors.muted(`Phases for task ${taskId}:`)}`;
}

/**
 * Phase line (tree structure).
 */
export function phaseLine(id: string, description: string): string {
  return `${colors.border("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} ${description}`;
}

/**
 * Phase start.
 */
export function phaseStart(id: string): string {
  return `${colors.border("│")}   ${colors.warning(symbols.bulletFilled)} ${colors.muted(`Phase ${id} started`)}`;
}

/**
 * Phase done.
 */
export function phaseDone(id: string): string {
  return `${colors.border("│")}   ${colors.success(symbols.checkmark)} ${colors.muted(`Phase ${id} complete`)}`;
}

/**
 * Phase failed.
 */
export function phaseFailed(id: string, reason: string): string {
  return `${colors.border("│")}   ${colors.error(symbols.cross)} ${colors.muted(`Phase ${id} failed:`)} ${colors.error(reason)}`;
}

/**
 * Criterion passed.
 */
export function criterionPassed(id: string): string {
  return `${colors.success(symbols.checkmark)} ${colors.muted(`Criterion ${id} passed`)}`;
}

/**
 * Criterion failed.
 */
export function criterionFailed(id: string, reason: string): string {
  return `${colors.error(symbols.cross)} ${colors.muted(`Criterion ${id} failed:`)} ${colors.error(reason)}`;
}

/**
 * Complete banner.
 */
export function completeBanner(width: number): string {
  return headerBanner(
    `${symbols.checkmark} ALL TASKS COMPLETE`,
    width,
    colors.brightCyan,
    colors.brightGreen
  );
}

/**
 * Error line.
 */
export function errorLine(message: string): string {
  return `${colors.brand(symbols.arrow)} ${colors.error("ERROR")} ${colors.muted(symbols.separator)} ${colors.error(message)}`;
}

/**
 * Review passed banner.
 */
export function reviewPassedBanner(width: number): string {
  return headerBanner(
    `${symbols.checkmark} REVIEW PASSED`,
    width,
    colors.brightCyan,
    colors.brightGreen
  );
}

/**
 * Review failed banner.
 */
export function reviewFailedBanner(width: number): string {
  return headerBanner(
    `${symbols.cross} REVIEW FAILED`,
    width,
    colors.brightCyan,
    colors.brightRed
  );
}

/**
 * Criteria header.
 */
export function criteriaHeader(taskId: string): string {
  return `${colors.border("│")}   ${colors.muted(`Success criteria for task ${taskId}:`)}`;
}

/**
 * Criterion line (tree structure).
 */
export function criterionLine(id: string, description: string): string {
  return `${colors.border("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} ${description}`;
}
