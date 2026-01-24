import pc from "picocolors";
import { box, colors, getToolColor, symbols } from "./render/primitives.js";

// Tag renderer type
interface TagRenderer {
  pattern: RegExp;
  render: (match: RegExpMatchArray, width: number) => string;
}

// Tool use line renderer
function toolUseLine(tool: string, detail: string): string {
  const toolColor = getToolColor(tool);
  const arrow = colors.muted(">>");
  const toolName = toolColor(tool);
  const detailText = detail ? ` ${colors.muted(detail)}` : "";
  return `${arrow} ${toolName}${detailText}`;
}

// Helper to create diamond banner
function diamondBanner(
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
  return `${borderColor(symbols.diamond)}${borderColor(line)} ${textColor(text)} ${borderColor(line)}${borderColor(symbols.diamond)}`;
}

// Task list header
function taskListHeader(width: number): string {
  const innerWidth = width - 6;
  // Guard against small widths
  if (innerWidth < 10) {
    return colors.brand("TASKS");
  }
  const label = ` ${symbols.diamond} TASKS ${symbols.diamond} `;
  const sideLen = Math.max(1, Math.floor((innerWidth - label.length) / 2));
  return `${pc.cyan("┌")}${pc.cyan(box.singleHorizontal.repeat(sideLen))}${colors.brand(label)}${pc.cyan(box.singleHorizontal.repeat(sideLen))}`;
}

// Task list footer
function taskListFooter(): string {
  return pc.cyan("└────────────────────────────────┘");
}

// Task line
function taskLine(id: string, description: string): string {
  return `${pc.cyan("│")} ${colors.brightMagenta(`[${id}]`)} ${description}`;
}

// Task done marker
function taskDone(id: string): string {
  return `${colors.success(symbols.checkmark)} ${colors.muted(`Task ${id} complete`)}`;
}

// Phases header
function phasesHeader(taskId: string): string {
  return `${pc.cyan("│")}   ${colors.muted(`Phases for task ${taskId}:`)}`;
}

// Phase line (tree structure)
function phaseLine(id: string, description: string): string {
  return `${pc.cyan("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} ${description}`;
}

// Phase start
function phaseStart(id: string): string {
  return `${pc.cyan("│")}   ${colors.warning(symbols.bulletFilled)} ${colors.muted(`Phase ${id} started`)}`;
}

// Phase done
function phaseDone(id: string): string {
  return `${pc.cyan("│")}   ${colors.success(symbols.checkmark)} ${colors.muted(`Phase ${id} complete`)}`;
}

// Phase failed
function phaseFailed(id: string, reason: string): string {
  return `${pc.cyan("│")}   ${colors.error(symbols.cross)} ${colors.muted(`Phase ${id} failed:`)} ${colors.error(reason)}`;
}

// Criterion passed
function criterionPassed(id: string): string {
  return `${colors.success(symbols.checkmark)} ${colors.muted(`Criterion ${id} passed`)}`;
}

// Criterion failed
function criterionFailed(id: string, reason: string): string {
  return `${colors.error(symbols.cross)} ${colors.muted(`Criterion ${id} failed:`)} ${colors.error(reason)}`;
}

// Complete banner
function completeBanner(width: number): string {
  return diamondBanner(
    `${symbols.checkmark} ALL TASKS COMPLETE`,
    width,
    colors.brightCyan,
    colors.brightGreen
  );
}

// Error line
function errorLine(message: string): string {
  return `${colors.brand(symbols.diamond)} ${colors.error("ERROR")} ${colors.muted(symbols.separator)} ${colors.error(message)}`;
}

// Review passed banner
function reviewPassedBanner(width: number): string {
  return diamondBanner(
    `${symbols.checkmark} REVIEW PASSED`,
    width,
    colors.brightCyan,
    colors.brightGreen
  );
}

// Review failed banner
function reviewFailedBanner(width: number): string {
  return diamondBanner(
    `${symbols.cross} REVIEW FAILED`,
    width,
    colors.brightCyan,
    colors.brightRed
  );
}

// Criteria header
function criteriaHeader(taskId: string): string {
  return `${pc.cyan("│")}   ${colors.muted(`Success criteria for task ${taskId}:`)}`;
}

// Criterion line (tree structure)
function criterionLine(id: string, description: string): string {
  return `${pc.cyan("│")}   ${colors.muted(symbols.treeMiddle)} ${colors.muted(symbols.bulletEmpty)} ${colors.muted(`[${id}]`)} ${description}`;
}

// All tag renderers
const TAG_RENDERERS: TagRenderer[] = [
  // Task list boundaries
  { pattern: /<ferix:tasks>/g, render: (_, w) => taskListHeader(w) },
  { pattern: /<\/ferix:tasks>/g, render: () => taskListFooter() },

  // Individual task
  {
    pattern: /<task id="(\d+)">([^<]+)<\/task>/g,
    render: (m) => taskLine(m[1] ?? "", m[2] ?? ""),
  },
  {
    pattern: /<ferix:task-done id="(\d+)"\/>/g,
    render: (m) => taskDone(m[1] ?? ""),
  },

  // Phases
  {
    pattern: /<ferix:phases task="(\d+)">/g,
    render: (m) => phasesHeader(m[1] ?? ""),
  },
  { pattern: /<\/ferix:phases>/g, render: () => "" },
  {
    pattern: /<phase id="([^"]+)">([^<]+)<\/phase>/g,
    render: (m) => phaseLine(m[1] ?? "", m[2] ?? ""),
  },
  {
    pattern: /<ferix:phase-start id="([^"]+)"\/>/g,
    render: (m) => phaseStart(m[1] ?? ""),
  },
  {
    pattern: /<ferix:phase-done id="([^"]+)"\/>/g,
    render: (m) => phaseDone(m[1] ?? ""),
  },
  {
    pattern: /<ferix:phase-failed id="([^"]+)">([^<]+)<\/ferix:phase-failed>/g,
    render: (m) => phaseFailed(m[1] ?? "", m[2] ?? ""),
  },

  // Criteria
  {
    pattern: /<ferix:criteria task="(\d+)">/g,
    render: (m) => criteriaHeader(m[1] ?? ""),
  },
  { pattern: /<\/ferix:criteria>/g, render: () => "" },
  {
    pattern: /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
    render: (m) => criterionLine(m[1] ?? "", m[2] ?? ""),
  },
  {
    pattern: /<ferix:criterion-passed id="([^"]+)"\/>/g,
    render: (m) => criterionPassed(m[1] ?? ""),
  },
  {
    pattern: /<ferix:criterion-failed id="([^"]+)" reason="([^"]+)"\/>/g,
    render: (m) => criterionFailed(m[1] ?? "", m[2] ?? ""),
  },

  // Completion
  { pattern: /<ferix:complete>/g, render: (_, w) => completeBanner(w) },
  {
    pattern: /<ferix:error>([^<]+)<\/ferix:error>/g,
    render: (m) => errorLine(m[1] ?? ""),
  },

  // Task completion (multi-line tag - hide all parts since signal is processed elsewhere)
  {
    pattern: /<ferix:task-complete id="(\d+)">/g,
    render: () => "",
  },
  {
    pattern: /<summary>([^<]*)<\/summary>/g,
    render: () => "",
  },
  {
    pattern: /<files-modified>([^<]*)<\/files-modified>/g,
    render: () => "",
  },
  {
    pattern: /<files-created>([^<]*)<\/files-created>/g,
    render: () => "",
  },
  {
    pattern: /<\/ferix:task-complete>/g,
    render: () => "",
  },

  // Check signals
  {
    pattern: /<ferix:check-passed\/>/g,
    render: () =>
      `${colors.success(symbols.checkmark)} ${colors.muted("Check passed")}`,
  },
  {
    pattern: /<ferix:check-failed\/>/g,
    render: () =>
      `${colors.error(symbols.cross)} ${colors.muted("Check failed")}`,
  },

  // Review signals
  {
    pattern: /<ferix:review-passed\/>/g,
    render: (_, w) => reviewPassedBanner(w),
  },
  {
    pattern: /<ferix:review-failed\/>/g,
    render: (_, w) => reviewFailedBanner(w),
  },
  {
    pattern: /<ferix:review-complete\/>/g,
    render: () =>
      `${colors.success(symbols.checkmark)} ${colors.muted("Review complete")}`,
  },
  {
    pattern: /<ferix:review-changes-made\/>/g,
    render: () =>
      `${colors.info(symbols.bulletFilled)} ${colors.muted("Review made changes")}`,
  },

  // Tool use line (>> ToolName detail)
  {
    pattern: /^>> (\w+)(?: (.+))?$/g,
    render: (m) => toolUseLine(m[1] ?? "", m[2] ?? ""),
  },
];

export function styleFerixTags(line: string, width: number): string {
  let result = line;
  for (const { pattern, render } of TAG_RENDERERS) {
    result = result.replace(pattern, (...args) => {
      // Args are: match, ...groups, offset, string
      // We pass the full args array as the match
      return render(args as unknown as RegExpMatchArray, width);
    });
  }
  return result;
}
