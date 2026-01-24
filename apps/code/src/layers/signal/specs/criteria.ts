import { Schema as S } from "effect";
import {
  type CriteriaDefinedSignal,
  CriteriaDefinedSignalSchema,
  type CriterionFailedSignal,
  CriterionFailedSignalSchema,
  type CriterionPassedSignal,
  CriterionPassedSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const CRITERIA_BLOCK =
  /<ferix:criteria task="(\d+)">([\s\S]*?)<\/ferix:criteria>/g;
const CRITERION = /<criterion id="([^"]+)">([^<]+)<\/criterion>/g;
const CRITERION_PASSED = /<ferix:criterion-passed id="([\d.c]+)"\/>/g;
const CRITERION_FAILED =
  /<ferix:criterion-failed id="([\d.c]+)" reason="([^"]*)"\/>/g;

function resetRegex(pattern: RegExp): RegExp {
  pattern.lastIndex = 0;
  return pattern;
}

const criteriaDefinedSpec: SignalSpec<CriteriaDefinedSignal> = {
  tag: "CriteriaDefined",
  closingTag: "</ferix:criteria>",
  schema: CriteriaDefinedSignalSchema,
  parse: (text) => {
    const signals: CriteriaDefinedSignal[] = [];
    for (const match of text.matchAll(resetRegex(CRITERIA_BLOCK))) {
      if (!(match[1] && match[2])) {
        continue;
      }
      const criteria: Array<{ id: string; description: string }> = [];
      for (const m of match[2].matchAll(resetRegex(CRITERION))) {
        if (m[1] && m[2]) {
          criteria.push({ id: m[1], description: m[2].trim() });
        }
      }
      if (criteria.length > 0) {
        const raw = {
          _tag: "CriteriaDefined" as const,
          taskId: match[1],
          criteria,
        };
        const result = S.decodeUnknownEither(CriteriaDefinedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => `${s.taskId}:${s.criteria.map((c) => c.id).join(",")}`,
};

const criterionPassedSpec: SignalSpec<CriterionPassedSignal> = {
  tag: "CriterionPassed",
  closingTag: "<ferix:criterion-passed",
  schema: CriterionPassedSignalSchema,
  parse: (text) => {
    const signals: CriterionPassedSignal[] = [];
    for (const m of text.matchAll(resetRegex(CRITERION_PASSED))) {
      if (m[1]) {
        const raw = { _tag: "CriterionPassed" as const, criterionId: m[1] };
        const result = S.decodeUnknownEither(CriterionPassedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => s.criterionId,
};

const criterionFailedSpec: SignalSpec<CriterionFailedSignal> = {
  tag: "CriterionFailed",
  closingTag: "<ferix:criterion-failed",
  schema: CriterionFailedSignalSchema,
  parse: (text) => {
    const signals: CriterionFailedSignal[] = [];
    for (const m of text.matchAll(resetRegex(CRITERION_FAILED))) {
      if (m[1]) {
        const raw = {
          _tag: "CriterionFailed" as const,
          criterionId: m[1],
          reason: m[2] || "Unknown reason",
        };
        const result = S.decodeUnknownEither(CriterionFailedSignalSchema)(raw);
        if (result._tag === "Right") {
          signals.push(result.right);
        }
      }
    }
    return signals;
  },
  keyFields: (s) => s.criterionId,
};

signalSpecRegistry.register(criteriaDefinedSpec);
signalSpecRegistry.register(criterionPassedSpec);
signalSpecRegistry.register(criterionFailedSpec);
