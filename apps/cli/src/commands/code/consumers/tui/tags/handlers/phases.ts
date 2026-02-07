import {
  hidden,
  phaseDone,
  phaseFailed,
  phaseLine,
  phaseStart,
  phasesHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Phases header handler.
 * Renders the opening of a phases section.
 */
tagRendererRegistry.register({
  pattern: /<ferix:phases task="(\d+)">/g,
  render: (m) => phasesHeader(m[1] ?? ""),
});

/**
 * Phases closing tag handler.
 * Hidden - the closing tag is not displayed.
 */
tagRendererRegistry.register({
  pattern: /<\/ferix:phases>/g,
  render: () => hidden(),
});

/**
 * Individual phase handler.
 * Renders a phase with its ID and description.
 * Uses [\s\S]*? to match multiline content.
 */
tagRendererRegistry.register({
  pattern: /<phase id="([^"]+)">([\s\S]*?)<\/phase>/g,
  render: (m, w) => phaseLine(m[1] ?? "", (m[2] ?? "").trim(), w),
});

/**
 * Phase start handler.
 * Renders a marker when a phase begins.
 */
tagRendererRegistry.register({
  pattern: /<ferix:phase-start id="([^"]+)"\/>/g,
  render: (m) => phaseStart(m[1] ?? ""),
});

/**
 * Phase done handler.
 * Renders a marker when a phase completes successfully.
 */
tagRendererRegistry.register({
  pattern: /<ferix:phase-done id="([^"]+)"\/>/g,
  render: (m) => phaseDone(m[1] ?? ""),
});

/**
 * Phase failed handler.
 * Renders a failure marker with reason when a phase fails.
 * Uses [\s\S]*? to match multiline content.
 */
tagRendererRegistry.register({
  pattern: /<ferix:phase-failed id="([^"]+)">([\s\S]*?)<\/ferix:phase-failed>/g,
  render: (m, w) => phaseFailed(m[1] ?? "", (m[2] ?? "").trim(), w),
});
