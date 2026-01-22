/**
 * Output area component for dev mode TUI
 */

import { colors, stripAnsi, truncate } from "../../ansi.js";

/**
 * Get visible output lines for display
 */
export function getVisibleLines(
  outputLines: string[],
  scrollOffset: number,
  height: number
): string[] {
  return outputLines.slice(scrollOffset, scrollOffset + height);
}

/**
 * Style ferix tags in a line for beautiful display
 */
function styleFerixTags(line: string, width: number): string {
  // Style <ferix:tasks> - full width top border with TASKS label
  if (line.includes("<ferix:tasks>")) {
    const label = " TASKS ";
    const remainingWidth = width - 3 - label.length; // 3 for "┌─" and spacing
    const border = "─".repeat(Math.max(0, remainingWidth));
    return line.replace(
      /<ferix:tasks>/g,
      `${colors.cyan}┌─${colors.brightCyan}${label}${colors.cyan}${border}${colors.reset}`
    );
  }

  // Style </ferix:tasks> - full width bottom border
  if (line.includes("</ferix:tasks>")) {
    const border = "─".repeat(Math.max(0, width - 2));
    return line.replace(
      /<\/ferix:tasks>/g,
      `${colors.cyan}└${border}┘${colors.reset}`
    );
  }

  // Style <task id="N">...</task> with left border
  let styled = line.replace(
    /<task id="(\d+)">([^<]+)<\/task>/g,
    `${colors.cyan}│${colors.reset} ${colors.yellow}[$1]${colors.reset} $2`
  );

  // Style <ferix:task-done id="N"/>
  styled = styled.replace(
    /<ferix:task-done id="(\d+)"\/>/g,
    `${colors.green}✓${colors.reset} ${colors.dim}Task $1 complete${colors.reset}`
  );

  // Style <ferix:complete> - full width
  if (styled.includes("<ferix:complete>")) {
    const label = " ALL TASKS COMPLETE ";
    const sideWidth = Math.max(0, Math.floor((width - label.length) / 2));
    const leftBorder = "━".repeat(sideWidth);
    const rightBorder = "━".repeat(width - sideWidth - label.length);
    styled = styled.replace(
      /<ferix:complete>/g,
      `${colors.brightGreen}${leftBorder}${label}${rightBorder}${colors.reset}`
    );
  }

  // Style <ferix:error>...</ferix:error>
  styled = styled.replace(
    /<ferix:error>([^<]*)<\/ferix:error>/g,
    `${colors.brightRed}ERROR:${colors.reset} ${colors.red}$1${colors.reset}`
  );

  // Style <ferix:phases task="N"> - phases header
  if (styled.includes("<ferix:phases")) {
    styled = styled.replace(
      /<ferix:phases task="(\d+)">/g,
      `${colors.cyan}│${colors.reset}   ${colors.dim}Phases for task $1:${colors.reset}`
    );
  }

  // Style </ferix:phases>
  styled = styled.replace(/<\/ferix:phases>/g, "");

  // Style <ferix:criteria task="N"> - criteria header
  if (styled.includes("<ferix:criteria")) {
    styled = styled.replace(
      /<ferix:criteria task="(\d+)">/g,
      `${colors.cyan}│${colors.reset}   ${colors.dim}Success criteria for task $1:${colors.reset}`
    );
  }

  // Style </ferix:criteria>
  styled = styled.replace(/<\/ferix:criteria>/g, "");

  // Style <criterion id="N.cM">...</criterion> with tree structure
  styled = styled.replace(
    /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
    `${colors.cyan}│${colors.reset}   ${colors.dim}├─${colors.reset} ${colors.dim}○${colors.reset} ${colors.dim}[$1]${colors.reset} $2`
  );

  // Style <phase id="N.M">...</phase> with tree structure
  styled = styled.replace(
    /<phase id="([^"]+)">([^<]+)<\/phase>/g,
    `${colors.cyan}│${colors.reset}   ${colors.dim}├─${colors.reset} ${colors.dim}○${colors.reset} ${colors.dim}[$1]${colors.reset} $2`
  );

  // Style <ferix:phase-start id="N.M"/>
  styled = styled.replace(
    /<ferix:phase-start id="([^"]+)"\/>/g,
    `${colors.cyan}│${colors.reset}   ${colors.yellow}●${colors.reset} ${colors.dim}Phase $1 started${colors.reset}`
  );

  // Style <ferix:phase-done id="N.M"/>
  styled = styled.replace(
    /<ferix:phase-done id="([^"]+)"\/>/g,
    `${colors.cyan}│${colors.reset}   ${colors.green}✓${colors.reset} ${colors.dim}Phase $1 complete${colors.reset}`
  );

  // Style <ferix:phase-failed id="N.M">reason</ferix:phase-failed>
  styled = styled.replace(
    /<ferix:phase-failed id="([^"]+)">([^<]*)<\/ferix:phase-failed>/g,
    `${colors.cyan}│${colors.reset}   ${colors.red}✗${colors.reset} ${colors.dim}Phase $1 failed:${colors.reset} ${colors.red}$2${colors.reset}`
  );

  // Style <ferix:criterion-passed id="N.cM"/>
  styled = styled.replace(
    /<ferix:criterion-passed id="([^"]+)"\/>/g,
    `${colors.green}✓${colors.reset} ${colors.dim}Criterion $1 passed${colors.reset}`
  );

  // Style <ferix:criterion-failed id="N.cM" reason="..."/>
  styled = styled.replace(
    /<ferix:criterion-failed id="([^"]+)" reason="([^"]*)"\/>/g,
    `${colors.red}✗${colors.reset} ${colors.dim}Criterion $1 failed:${colors.reset} ${colors.red}$2${colors.reset}`
  );

  // Style <ferix:review-passed/>
  styled = styled.replace(
    /<ferix:review-passed\/>/g,
    `${colors.brightGreen}━━━ REVIEW PASSED ━━━${colors.reset}`
  );

  // Style <ferix:review-failed/>
  styled = styled.replace(
    /<ferix:review-failed\/>/g,
    `${colors.brightRed}━━━ REVIEW FAILED ━━━${colors.reset}`
  );

  return styled;
}

/**
 * Format a single output line for display
 */
export function formatOutputLine(line: string, innerWidth: number): string {
  const contentWidth = innerWidth - 2; // Account for padding spaces
  const styled = styleFerixTags(line, contentWidth);
  const strippedLen = stripAnsi(styled).length;

  // If the styled content is shorter than content width, we just pad
  // If longer, we truncate
  if (strippedLen <= contentWidth) {
    return ` ${styled} `;
  }
  return ` ${truncate(styled, contentWidth)} `;
}

/**
 * Calculate scroll offset to keep latest content visible
 */
export function calculateScrollOffset(
  outputLines: string[],
  outputHeight: number,
  currentOffset: number
): number {
  if (outputLines.length > outputHeight) {
    return outputLines.length - outputHeight;
  }
  return currentOffset;
}
