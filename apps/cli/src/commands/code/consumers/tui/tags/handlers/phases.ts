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
 */
tagRendererRegistry.register({
  pattern: /<phase id="([^"]+)">([^<]+)<\/phase>/g,
  render: (m) => phaseLine(m[1] ?? "", m[2] ?? ""),
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
 */
tagRendererRegistry.register({
  pattern: /<ferix:phase-failed id="([^"]+)">([^<]+)<\/ferix:phase-failed>/g,
  render: (m) => phaseFailed(m[1] ?? "", m[2] ?? ""),
});
