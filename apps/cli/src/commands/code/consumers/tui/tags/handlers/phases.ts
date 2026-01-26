import {
  phaseDone,
  phaseFailed,
  phaseLine,
  phaseStart,
  phasesHeader,
} from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Phases header
tagRendererRegistry.register({
  pattern: /<ferix:phases task="(\d+)">/g,
  render: (m) => phasesHeader(m[1] ?? ""),
});

tagRendererRegistry.register({
  pattern: /<\/ferix:phases>/g,
  render: () => "",
});

// Phase line
tagRendererRegistry.register({
  pattern: /<phase id="([^"]+)">([^<]+)<\/phase>/g,
  render: (m) => phaseLine(m[1] ?? "", m[2] ?? ""),
});

// Phase start
tagRendererRegistry.register({
  pattern: /<ferix:phase-start id="([^"]+)"\/>/g,
  render: (m) => phaseStart(m[1] ?? ""),
});

// Phase done
tagRendererRegistry.register({
  pattern: /<ferix:phase-done id="([^"]+)"\/>/g,
  render: (m) => phaseDone(m[1] ?? ""),
});

// Phase failed
tagRendererRegistry.register({
  pattern: /<ferix:phase-failed id="([^"]+)">([^<]+)<\/ferix:phase-failed>/g,
  render: (m) => phaseFailed(m[1] ?? "", m[2] ?? ""),
});
