/**
 * Output area component for dev mode TUI
 */

import { box, colors, stripAnsi, symbols, truncate } from "../../ansi.js";

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
 * Create diamond-bordered banner for completion messages
 */
function createDiamondBanner(
  text: string,
  width: number,
  borderColor: string,
  textColor: string
): string {
  // Pattern: ◆━━━...━━━◆ TEXT ◆━━━...━━━◆
  const paddedText = ` ${text} `;
  const totalBorderWidth = width - paddedText.length - 4; // 4 for diamonds at ends
  const sideWidth = Math.max(0, Math.floor(totalBorderWidth / 2));
  const leftBorder = "━".repeat(sideWidth);
  const rightBorder = "━".repeat(totalBorderWidth - sideWidth);

  return `${colors.brightMagenta}${symbols.diamond}${borderColor}${leftBorder}${colors.brightMagenta}${symbols.diamond}${textColor}${paddedText}${colors.brightMagenta}${symbols.diamond}${borderColor}${rightBorder}${colors.brightMagenta}${symbols.diamond}${colors.reset}`;
}

/**
 * Style ferix tags in a line for beautiful display
 */
function styleFerixTags(line: string, width: number): string {
  // Style <ferix:tasks> - ┌─◆ TASKS ◆ (cyan border, magenta diamonds, brightWhite text)
  if (line.includes("<ferix:tasks>")) {
    const label = "TASKS";
    const remainingWidth = width - 7 - label.length; // 7 for "┌─◆ " + " ◆"
    const border = box.horizontal.repeat(Math.max(0, remainingWidth));
    return line.replace(
      /<ferix:tasks>/g,
      `${colors.cyan}┌${box.horizontal}${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}${label}${colors.reset} ${colors.brightMagenta}${symbols.diamond}${colors.cyan}${border}${colors.reset}`
    );
  }

  // Style </ferix:tasks> - full width bottom border
  if (line.includes("</ferix:tasks>")) {
    const border = box.horizontal.repeat(Math.max(0, width - 2));
    return line.replace(
      /<\/ferix:tasks>/g,
      `${colors.cyan}└${border}┘${colors.reset}`
    );
  }

  // Style <task id="N">...</task> with left border - brightMagenta for task IDs
  let styled = line.replace(
    /<task id="(\d+)">([^<]+)<\/task>/g,
    `${colors.cyan}${box.vertical}${colors.reset} ${colors.brightMagenta}[$1]${colors.reset} $2`
  );

  // Style <ferix:task-done id="N"/>
  styled = styled.replace(
    /<ferix:task-done id="(\d+)"\/>/g,
    `${colors.green}${symbols.checkmark}${colors.reset} ${colors.dim}Task $1 complete${colors.reset}`
  );

  // Style <ferix:complete> - diamond-bordered full width
  if (styled.includes("<ferix:complete>")) {
    const banner = createDiamondBanner(
      `${colors.green}${symbols.checkmark}${colors.brightGreen} ALL TASKS COMPLETE`,
      width,
      colors.brightGreen,
      colors.brightGreen
    );
    styled = styled.replace(/<ferix:complete>/g, banner);
  }

  // Style <ferix:error>...</ferix:error> - ◆ ERROR │ message
  styled = styled.replace(
    /<ferix:error>([^<]*)<\/ferix:error>/g,
    `${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightRed}ERROR${colors.reset} ${colors.dim}${box.vertical}${colors.reset} ${colors.red}$1${colors.reset}`
  );

  // Style <ferix:phases task="N"> - phases header
  if (styled.includes("<ferix:phases")) {
    styled = styled.replace(
      /<ferix:phases task="(\d+)">/g,
      `${colors.cyan}${box.vertical}${colors.reset}   ${colors.dim}Phases for task $1:${colors.reset}`
    );
  }

  // Style </ferix:phases>
  styled = styled.replace(/<\/ferix:phases>/g, "");

  // Style <ferix:criteria task="N"> - criteria header
  if (styled.includes("<ferix:criteria")) {
    styled = styled.replace(
      /<ferix:criteria task="(\d+)">/g,
      `${colors.cyan}${box.vertical}${colors.reset}   ${colors.dim}Success criteria for task $1:${colors.reset}`
    );
  }

  // Style </ferix:criteria>
  styled = styled.replace(/<\/ferix:criteria>/g, "");

  // Style <criterion id="N.cM">...</criterion> with tree structure
  styled = styled.replace(
    /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
    `${colors.cyan}${box.vertical}${colors.reset}   ${colors.dim}${box.teeRight}${box.horizontal}${colors.reset} ${colors.dim}${symbols.bulletEmpty}${colors.reset} ${colors.dim}[$1]${colors.reset} $2`
  );

  // Style <phase id="N.M">...</phase> with tree structure
  styled = styled.replace(
    /<phase id="([^"]+)">([^<]+)<\/phase>/g,
    `${colors.cyan}${box.vertical}${colors.reset}   ${colors.dim}${box.teeRight}${box.horizontal}${colors.reset} ${colors.dim}${symbols.bulletEmpty}${colors.reset} ${colors.dim}[$1]${colors.reset} $2`
  );

  // Style <ferix:phase-start id="N.M"/>
  styled = styled.replace(
    /<ferix:phase-start id="([^"]+)"\/>/g,
    `${colors.cyan}${box.vertical}${colors.reset}   ${colors.yellow}${symbols.bulletFilled}${colors.reset} ${colors.dim}Phase $1 started${colors.reset}`
  );

  // Style <ferix:phase-done id="N.M"/>
  styled = styled.replace(
    /<ferix:phase-done id="([^"]+)"\/>/g,
    `${colors.cyan}${box.vertical}${colors.reset}   ${colors.green}${symbols.checkmark}${colors.reset} ${colors.dim}Phase $1 complete${colors.reset}`
  );

  // Style <ferix:phase-failed id="N.M">reason</ferix:phase-failed>
  styled = styled.replace(
    /<ferix:phase-failed id="([^"]+)">([^<]*)<\/ferix:phase-failed>/g,
    `${colors.cyan}${box.vertical}${colors.reset}   ${colors.red}${symbols.cross}${colors.reset} ${colors.dim}Phase $1 failed:${colors.reset} ${colors.red}$2${colors.reset}`
  );

  // Style <ferix:criterion-passed id="N.cM"/>
  styled = styled.replace(
    /<ferix:criterion-passed id="([^"]+)"\/>/g,
    `${colors.green}${symbols.checkmark}${colors.reset} ${colors.dim}Criterion $1 passed${colors.reset}`
  );

  // Style <ferix:criterion-failed id="N.cM" reason="..."/>
  styled = styled.replace(
    /<ferix:criterion-failed id="([^"]+)" reason="([^"]*)"\/>/g,
    `${colors.red}${symbols.cross}${colors.reset} ${colors.dim}Criterion $1 failed:${colors.reset} ${colors.red}$2${colors.reset}`
  );

  // Style <ferix:review-passed/> - diamond-bordered full width
  if (styled.includes("<ferix:review-passed/>")) {
    const banner = createDiamondBanner(
      `${colors.green}${symbols.checkmark}${colors.brightGreen} REVIEW PASSED`,
      width,
      colors.brightGreen,
      colors.brightGreen
    );
    styled = styled.replace(/<ferix:review-passed\/>/g, banner);
  }

  // Style <ferix:review-failed/> - diamond-bordered full width
  if (styled.includes("<ferix:review-failed/>")) {
    const banner = createDiamondBanner(
      `${colors.red}${symbols.cross}${colors.brightRed} REVIEW FAILED`,
      width,
      colors.brightRed,
      colors.brightRed
    );
    styled = styled.replace(/<ferix:review-failed\/>/g, banner);
  }

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
