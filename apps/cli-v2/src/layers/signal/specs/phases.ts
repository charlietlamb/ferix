import type {
  PhaseCompletedSignal,
  PhaseFailedSignal,
  PhaseStartedSignal,
  PhasesDefinedSignal,
  Signal,
} from "../../../domain/signals.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const PHASES_BLOCK = /<ferix:phases task="(\d+)">([\s\S]*?)<\/ferix:phases>/;
const PHASE = /<phase id="([\d.]+)">([^<]+)<\/phase>/g;
const PHASE_START = /<ferix:phase-start id="([\d.]+)"\/>/g;
const PHASE_DONE = /<ferix:phase-done id="([\d.]+)"\/>/g;
const PHASE_FAILED =
  /<ferix:phase-failed id="([\d.]+)">([^<]*)<\/ferix:phase-failed>/g;

function resetRegex(pattern: RegExp): RegExp {
  pattern.lastIndex = 0;
  return pattern;
}

const phasesDefinedSpec: SignalSpec<PhasesDefinedSignal> = {
  tag: "PhasesDefined",
  closingTag: "</ferix:phases>",
  parse: (text) => {
    const match = text.match(PHASES_BLOCK);
    if (!(match?.[1] && match?.[2])) {
      return [];
    }
    const phases: Array<{ id: string; description: string }> = [];
    for (const m of match[2].matchAll(resetRegex(PHASE))) {
      if (m[1] && m[2]) {
        phases.push({ id: m[1], description: m[2].trim() });
      }
    }
    if (phases.length === 0) {
      return [];
    }
    return [{ _tag: "PhasesDefined" as const, taskId: match[1], phases }];
  },
  keyFields: (s) => {
    const sig = s as Signal & { taskId: string; phases: { id: string }[] };
    return `${sig.taskId}:${sig.phases.map((p) => p.id).join(",")}`;
  },
};

const phaseStartedSpec: SignalSpec<PhaseStartedSignal> = {
  tag: "PhaseStarted",
  closingTag: "<ferix:phase-start",
  parse: (text) => {
    const signals: PhaseStartedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_START))) {
      if (m[1]) {
        signals.push({ _tag: "PhaseStarted" as const, phaseId: m[1] });
      }
    }
    return signals;
  },
  keyFields: (s) => (s as Signal & { phaseId: string }).phaseId,
};

const phaseCompletedSpec: SignalSpec<PhaseCompletedSignal> = {
  tag: "PhaseCompleted",
  closingTag: "<ferix:phase-done",
  parse: (text) => {
    const signals: PhaseCompletedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_DONE))) {
      if (m[1]) {
        signals.push({ _tag: "PhaseCompleted" as const, phaseId: m[1] });
      }
    }
    return signals;
  },
  keyFields: (s) => (s as Signal & { phaseId: string }).phaseId,
};

const phaseFailedSpec: SignalSpec<PhaseFailedSignal> = {
  tag: "PhaseFailed",
  closingTag: "</ferix:phase-failed>",
  parse: (text) => {
    const signals: PhaseFailedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_FAILED))) {
      if (m[1]) {
        signals.push({
          _tag: "PhaseFailed" as const,
          phaseId: m[1],
          reason: m[2] || "Unknown reason",
        });
      }
    }
    return signals;
  },
  keyFields: (s) => (s as Signal & { phaseId: string }).phaseId,
};

signalSpecRegistry.register(phasesDefinedSpec);
signalSpecRegistry.register(phaseStartedSpec);
signalSpecRegistry.register(phaseCompletedSpec);
signalSpecRegistry.register(phaseFailedSpec);
