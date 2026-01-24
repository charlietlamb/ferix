import { Effect, Layer, Ref } from "effect";
import type { ParseError } from "../../domain/errors.js";
import type { Signal } from "../../domain/signals.js";
import {
  type SignalAccumulator,
  SignalParser,
  type SignalParserService,
} from "../../services/signal-parser.js";

/**
 * Maximum buffer size in characters (1MB assuming ~1 byte per char).
 * If exceeded, the buffer will be truncated from the beginning.
 */
const MAX_BUFFER_SIZE = 1024 * 1024;

/**
 * Regex patterns for parsing ferix signals.
 * Defined at module level for performance.
 */
const PATTERNS = {
  TASKS_BLOCK: /<ferix:tasks>([\s\S]*?)<\/ferix:tasks>/,
  TASK: /<task id="(\d+)">([^<]+)<\/task>/g,
  PHASES_BLOCK: /<ferix:phases task="(\d+)">([\s\S]*?)<\/ferix:phases>/,
  PHASE: /<phase id="([\d.]+)">([^<]+)<\/phase>/g,
  CRITERIA_BLOCK: /<ferix:criteria task="(\d+)">([\s\S]*?)<\/ferix:criteria>/g,
  CRITERION: /<criterion id="([^"]+)">([^<]+)<\/criterion>/g,
  PHASE_START: /<ferix:phase-start id="([\d.]+)"\/>/g,
  PHASE_DONE: /<ferix:phase-done id="([\d.]+)"\/>/g,
  PHASE_FAILED:
    /<ferix:phase-failed id="([\d.]+)">([^<]*)<\/ferix:phase-failed>/g,
  CRITERION_PASSED: /<ferix:criterion-passed id="([\d.c]+)"\/>/g,
  CRITERION_FAILED:
    /<ferix:criterion-failed id="([\d.c]+)" reason="([^"]*)"\/>/g,
  CHECK_PASSED: /<ferix:check-passed\/>/,
  CHECK_FAILED: /<ferix:check-failed\/>/,
  REVIEW_COMPLETE: /<ferix:review-complete\/>/,
  REVIEW_CHANGES: /<ferix:review-changes-made\/>/,
  TASK_COMPLETE:
    /<ferix:task-complete id="(\d+)">([\s\S]*?)<\/ferix:task-complete>/,
  SUMMARY: /<summary>([\s\S]*?)<\/summary>/,
  FILES_MODIFIED: /<files-modified>([\s\S]*?)<\/files-modified>/,
  FILES_CREATED: /<files-created>([\s\S]*?)<\/files-created>/,
  LOOP_COMPLETE: /<ferix:complete>/,
} as const;

/**
 * Specification for parsing a signal type.
 * Each spec fully describes how to parse and identify a signal.
 */
interface SignalSpec<T extends Signal = Signal> {
  readonly tag: T["_tag"];
  readonly closingTag: string;
  readonly parse: (text: string) => T[];
  readonly keyFields: (signal: T) => string;
}

/**
 * Helper to parse comma-separated file lists.
 */
function parseFileList(content: string | undefined): string[] {
  if (!content) {
    return [];
  }
  return content
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * Resets a global regex to ensure consistent matching behavior.
 */
function resetRegex(pattern: RegExp): RegExp {
  pattern.lastIndex = 0;
  return pattern;
}

/**
 * Signal specifications array - the single source of truth for parsing.
 * To add a new signal type, simply add a new spec entry.
 */
const SIGNAL_SPECS: SignalSpec[] = [
  // Tasks definition
  {
    tag: "TasksDefined",
    closingTag: "</ferix:tasks>",
    parse: (text) => {
      const match = text.match(PATTERNS.TASKS_BLOCK);
      if (!match?.[1]) {
        return [];
      }
      const tasks: Array<{ id: string; title: string; description: string }> =
        [];
      for (const m of match[1].matchAll(resetRegex(PATTERNS.TASK))) {
        if (m[1] && m[2]) {
          tasks.push({
            id: m[1],
            title: m[2].trim(),
            description: m[2].trim(),
          });
        }
      }
      if (tasks.length === 0) {
        return [];
      }
      return [{ _tag: "TasksDefined" as const, tasks }];
    },
    keyFields: (s) =>
      (s as Signal & { tasks: { id: string }[] }).tasks
        .map((t) => t.id)
        .join(","),
  },

  // Phases definition
  {
    tag: "PhasesDefined",
    closingTag: "</ferix:phases>",
    parse: (text) => {
      const match = text.match(PATTERNS.PHASES_BLOCK);
      if (!(match?.[1] && match?.[2])) {
        return [];
      }
      const phases: Array<{ id: string; description: string }> = [];
      for (const m of match[2].matchAll(resetRegex(PATTERNS.PHASE))) {
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
  },

  // Criteria definition
  {
    tag: "CriteriaDefined",
    closingTag: "</ferix:criteria>",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const match of text.matchAll(resetRegex(PATTERNS.CRITERIA_BLOCK))) {
        if (!(match[1] && match[2])) {
          continue;
        }
        const criteria: Array<{ id: string; description: string }> = [];
        for (const m of match[2].matchAll(resetRegex(PATTERNS.CRITERION))) {
          if (m[1] && m[2]) {
            criteria.push({ id: m[1], description: m[2].trim() });
          }
        }
        if (criteria.length > 0) {
          signals.push({
            _tag: "CriteriaDefined" as const,
            taskId: match[1],
            criteria,
          });
        }
      }
      return signals;
    },
    keyFields: (s) => {
      const sig = s as Signal & { taskId: string; criteria: { id: string }[] };
      return `${sig.taskId}:${sig.criteria.map((c) => c.id).join(",")}`;
    },
  },

  // Phase started
  {
    tag: "PhaseStarted",
    closingTag: "<ferix:phase-start",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const m of text.matchAll(resetRegex(PATTERNS.PHASE_START))) {
        if (m[1]) {
          signals.push({ _tag: "PhaseStarted" as const, phaseId: m[1] });
        }
      }
      return signals;
    },
    keyFields: (s) => (s as Signal & { phaseId: string }).phaseId,
  },

  // Phase completed
  {
    tag: "PhaseCompleted",
    closingTag: "<ferix:phase-done",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const m of text.matchAll(resetRegex(PATTERNS.PHASE_DONE))) {
        if (m[1]) {
          signals.push({ _tag: "PhaseCompleted" as const, phaseId: m[1] });
        }
      }
      return signals;
    },
    keyFields: (s) => (s as Signal & { phaseId: string }).phaseId,
  },

  // Phase failed
  {
    tag: "PhaseFailed",
    closingTag: "</ferix:phase-failed>",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const m of text.matchAll(resetRegex(PATTERNS.PHASE_FAILED))) {
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
  },

  // Criterion passed
  {
    tag: "CriterionPassed",
    closingTag: "<ferix:criterion-passed",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const m of text.matchAll(resetRegex(PATTERNS.CRITERION_PASSED))) {
        if (m[1]) {
          signals.push({ _tag: "CriterionPassed" as const, criterionId: m[1] });
        }
      }
      return signals;
    },
    keyFields: (s) => (s as Signal & { criterionId: string }).criterionId,
  },

  // Criterion failed
  {
    tag: "CriterionFailed",
    closingTag: "<ferix:criterion-failed",
    parse: (text) => {
      const signals: Signal[] = [];
      for (const m of text.matchAll(resetRegex(PATTERNS.CRITERION_FAILED))) {
        if (m[1]) {
          signals.push({
            _tag: "CriterionFailed" as const,
            criterionId: m[1],
            reason: m[2] || "Unknown reason",
          });
        }
      }
      return signals;
    },
    keyFields: (s) => (s as Signal & { criterionId: string }).criterionId,
  },

  // Check passed
  {
    tag: "CheckPassed",
    closingTag: "<ferix:check-passed/>",
    parse: (text) => {
      if (PATTERNS.CHECK_PASSED.test(text)) {
        return [{ _tag: "CheckPassed" as const }];
      }
      return [];
    },
    keyFields: () => "",
  },

  // Check failed
  {
    tag: "CheckFailed",
    closingTag: "<ferix:check-failed/>",
    parse: (text) => {
      if (PATTERNS.CHECK_FAILED.test(text)) {
        return [{ _tag: "CheckFailed" as const }];
      }
      return [];
    },
    keyFields: () => "",
  },

  // Review complete
  {
    tag: "ReviewComplete",
    closingTag: "<ferix:review-complete/>",
    parse: (text) => {
      if (!PATTERNS.REVIEW_COMPLETE.test(text)) {
        return [];
      }
      const changesMade = PATTERNS.REVIEW_CHANGES.test(text);
      return [{ _tag: "ReviewComplete" as const, changesMade }];
    },
    keyFields: (s) =>
      String((s as Signal & { changesMade: boolean }).changesMade),
  },

  // Task complete
  {
    tag: "TaskComplete",
    closingTag: "</ferix:task-complete>",
    parse: (text) => {
      const match = text.match(PATTERNS.TASK_COMPLETE);
      if (!match?.[1]) {
        return [];
      }
      const content = match[2] || "";
      const summaryMatch = content.match(PATTERNS.SUMMARY);
      const filesModifiedMatch = content.match(PATTERNS.FILES_MODIFIED);
      const filesCreatedMatch = content.match(PATTERNS.FILES_CREATED);
      return [
        {
          _tag: "TaskComplete" as const,
          taskId: match[1],
          summary: summaryMatch?.[1]?.trim() || "",
          filesModified: parseFileList(filesModifiedMatch?.[1]),
          filesCreated: parseFileList(filesCreatedMatch?.[1]),
        },
      ];
    },
    keyFields: (s) => (s as Signal & { taskId: string }).taskId,
  },

  // Loop complete
  {
    tag: "LoopComplete",
    closingTag: "<ferix:complete>",
    parse: (text) => {
      if (PATTERNS.LOOP_COMPLETE.test(text)) {
        return [{ _tag: "LoopComplete" as const }];
      }
      return [];
    },
    keyFields: () => "",
  },
];

/**
 * Parses all signals from a text string using the signal specifications.
 */
function parseAllSignals(text: string): Signal[] {
  return SIGNAL_SPECS.flatMap((spec) => spec.parse(text));
}

/**
 * Generates a deduplication key for a signal using its spec.
 */
function getSignalKey(signal: Signal): string {
  const spec = SIGNAL_SPECS.find((s) => s.tag === signal._tag);
  const fields = spec?.keyFields(signal) ?? "";
  return fields ? `${signal._tag}:${fields}` : signal._tag;
}

/**
 * Finds the last complete signal tag closing position in the buffer.
 * Used to prune processed content while keeping incomplete signals.
 */
function findLastCompleteSignalEnd(buffer: string): number {
  let maxEnd = -1;
  for (const spec of SIGNAL_SPECS) {
    const idx = buffer.lastIndexOf(spec.closingTag);
    if (idx !== -1) {
      const endPos = idx + spec.closingTag.length;
      if (endPos > maxEnd) {
        maxEnd = endPos;
      }
    }
  }
  // Also check for review-changes-made which is a modifier tag
  const reviewChangesIdx = buffer.lastIndexOf("<ferix:review-changes-made/>");
  if (reviewChangesIdx !== -1) {
    const endPos = reviewChangesIdx + "<ferix:review-changes-made/>".length;
    if (endPos > maxEnd) {
      maxEnd = endPos;
    }
  }
  return maxEnd;
}

/**
 * Creates a signal accumulator for streaming parsing.
 * Uses chunked buffer approach to avoid O(n) string concatenation per chunk.
 * Prunes processed content to prevent unbounded memory growth.
 */
function createAccumulatorImpl(): Effect.Effect<SignalAccumulator> {
  return Effect.gen(function* () {
    const chunksRef = yield* Ref.make<string[]>([]);
    const emittedRef = yield* Ref.make<Set<string>>(new Set());

    const feed = (text: string): Effect.Effect<readonly Signal[], ParseError> =>
      Effect.gen(function* () {
        const chunks = yield* Ref.get(chunksRef);
        chunks.push(text);
        const buffer = chunks.join("");
        if (buffer.length > MAX_BUFFER_SIZE) {
          yield* Ref.set(chunksRef, [
            buffer.slice(buffer.length - MAX_BUFFER_SIZE),
          ]);
        }
        const signals = parseAllSignals(buffer);
        const emitted = yield* Ref.get(emittedRef);
        const newSignals = signals.filter((signal) => {
          const key = getSignalKey(signal);
          if (emitted.has(key)) {
            return false;
          }
          emitted.add(key);
          return true;
        });
        if (newSignals.length > 0) {
          const lastEndPos = findLastCompleteSignalEnd(buffer);
          if (lastEndPos > 0 && lastEndPos < buffer.length) {
            yield* Ref.set(chunksRef, [buffer.slice(lastEndPos)]);
          }
        }
        yield* Ref.set(emittedRef, emitted);
        return newSignals;
      });

    const flush = (): Effect.Effect<readonly Signal[], ParseError> =>
      Effect.gen(function* () {
        const chunks = yield* Ref.get(chunksRef);
        const buffer = chunks.join("");
        yield* Ref.set(chunksRef, []);
        const emitted = yield* Ref.get(emittedRef);
        const signals = parseAllSignals(buffer);
        const result = signals.filter(
          (signal) => !emitted.has(getSignalKey(signal))
        );
        yield* Ref.set(emittedRef, new Set());
        return result;
      });

    return { feed, flush };
  });
}

/**
 * Ferix signal parser service implementation.
 */
const make: SignalParserService = {
  parse: (text: string): Effect.Effect<readonly Signal[], ParseError> =>
    Effect.succeed(parseAllSignals(text)),
  createAccumulator: createAccumulatorImpl,
};

/**
 * Live Layer for the Ferix signal parser.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const parser = yield* SignalParser;
 *   const signals = yield* parser.parse(llmOutput);
 *   return signals;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FerixParser.Live)));
 * ```
 */
export const Live = Layer.succeed(SignalParser, make);

/**
 * FerixParser namespace containing the Live layer.
 */
export const FerixParser = {
  Live,
} as const;
