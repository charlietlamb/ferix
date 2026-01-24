import { Schema as S } from "effect";
import {
  type PhaseCompletedSignal,
  PhaseCompletedSignalSchema,
  type PhaseFailedSignal,
  PhaseFailedSignalSchema,
  type PhaseStartedSignal,
  PhaseStartedSignalSchema,
  type PhasesDefinedSignal,
  PhasesDefinedSignalSchema,
} from "../../../domain/index.js";
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
  schema: PhasesDefinedSignalSchema,
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
    const raw = {
      _tag: "PhasesDefined" as const,
      taskId: match[1],
      phases,
    };
    const result = S.decodeUnknownEither(PhasesDefinedSignalSchema)(raw);
    if (result._tag === "Left") {
      return [];
    }
    return [result.right];
  },
  keyFields: (s) => `${s.taskId}:${s.phases.map((p) => p.id).join(",")}`,
};

const phaseStartedSpec: SignalSpec<PhaseStartedSignal> = {
  tag: "PhaseStarted",
  closingTag: "<ferix:phase-start",
  schema: PhaseStartedSignalSchema,
  parse: (text) => {
    const signals: PhaseStartedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_START))) {
      if (m[1]) {
        const raw = { _tag: "PhaseStarted" as const, phaseId: m[1] };
        const result = S.decodeUnknownEither(PhaseStartedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => s.phaseId,
};

const phaseCompletedSpec: SignalSpec<PhaseCompletedSignal> = {
  tag: "PhaseCompleted",
  closingTag: "<ferix:phase-done",
  schema: PhaseCompletedSignalSchema,
  parse: (text) => {
    const signals: PhaseCompletedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_DONE))) {
      if (m[1]) {
        const raw = { _tag: "PhaseCompleted" as const, phaseId: m[1] };
        const result = S.decodeUnknownEither(PhaseCompletedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => s.phaseId,
};

const phaseFailedSpec: SignalSpec<PhaseFailedSignal> = {
  tag: "PhaseFailed",
  closingTag: "</ferix:phase-failed>",
  schema: PhaseFailedSignalSchema,
  parse: (text) => {
    const signals: PhaseFailedSignal[] = [];
    for (const m of text.matchAll(resetRegex(PHASE_FAILED))) {
      if (m[1]) {
        const raw = {
          _tag: "PhaseFailed" as const,
          phaseId: m[1],
          reason: m[2] || "Unknown reason",
        };
        const result = S.decodeUnknownEither(PhaseFailedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => s.phaseId,
};

signalSpecRegistry.register(phasesDefinedSpec);
signalSpecRegistry.register(phaseStartedSpec);
signalSpecRegistry.register(phaseCompletedSpec);
signalSpecRegistry.register(phaseFailedSpec);
