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
 * Parses tasks from a ferix:tasks block.
 */
function parseTasks(text: string): Signal[] {
  const match = text.match(PATTERNS.TASKS_BLOCK);
  if (!match?.[1]) {
    return [];
  }

  const tasks: Array<{ id: string; title: string; description: string }> = [];
  const content = match[1];

  for (const taskMatch of content.matchAll(PATTERNS.TASK)) {
    const id = taskMatch[1];
    const desc = taskMatch[2];
    if (id && desc) {
      tasks.push({
        id,
        title: desc.trim(),
        description: desc.trim(),
      });
    }
  }

  if (tasks.length === 0) {
    return [];
  }

  return [{ _tag: "TasksDefined", tasks }];
}

/**
 * Parses phases from a ferix:phases block.
 */
function parsePhases(text: string): Signal[] {
  const match = text.match(PATTERNS.PHASES_BLOCK);
  if (!(match?.[1] && match?.[2])) {
    return [];
  }

  const taskId = match[1];
  const phases: Array<{ id: string; description: string }> = [];
  const content = match[2];

  for (const phaseMatch of content.matchAll(PATTERNS.PHASE)) {
    const id = phaseMatch[1];
    const desc = phaseMatch[2];
    if (id && desc) {
      phases.push({ id, description: desc.trim() });
    }
  }

  if (phases.length === 0) {
    return [];
  }

  return [{ _tag: "PhasesDefined", taskId, phases }];
}

/**
 * Parses criteria from ferix:criteria blocks.
 */
function parseCriteria(text: string): Signal[] {
  const signals: Signal[] = [];

  for (const match of text.matchAll(PATTERNS.CRITERIA_BLOCK)) {
    const taskId = match[1];
    const content = match[2];
    if (!(taskId && content)) {
      continue;
    }

    const criteria: Array<{ id: string; description: string }> = [];
    for (const criterionMatch of content.matchAll(PATTERNS.CRITERION)) {
      const id = criterionMatch[1];
      const desc = criterionMatch[2];
      if (id && desc) {
        criteria.push({ id, description: desc.trim() });
      }
    }

    if (criteria.length > 0) {
      signals.push({ _tag: "CriteriaDefined", taskId, criteria });
    }
  }

  return signals;
}

/**
 * Parses phase lifecycle signals.
 */
function parsePhaseSignals(text: string): Signal[] {
  const signals: Signal[] = [];

  for (const match of text.matchAll(PATTERNS.PHASE_START)) {
    if (match[1]) {
      signals.push({ _tag: "PhaseStarted", phaseId: match[1] });
    }
  }

  for (const match of text.matchAll(PATTERNS.PHASE_DONE)) {
    if (match[1]) {
      signals.push({ _tag: "PhaseCompleted", phaseId: match[1] });
    }
  }

  for (const match of text.matchAll(PATTERNS.PHASE_FAILED)) {
    if (match[1]) {
      signals.push({
        _tag: "PhaseFailed",
        phaseId: match[1],
        reason: match[2] || "Unknown reason",
      });
    }
  }

  return signals;
}

/**
 * Parses criterion verification signals.
 */
function parseCriterionSignals(text: string): Signal[] {
  const signals: Signal[] = [];

  for (const match of text.matchAll(PATTERNS.CRITERION_PASSED)) {
    if (match[1]) {
      signals.push({ _tag: "CriterionPassed", criterionId: match[1] });
    }
  }

  for (const match of text.matchAll(PATTERNS.CRITERION_FAILED)) {
    if (match[1]) {
      signals.push({
        _tag: "CriterionFailed",
        criterionId: match[1],
        reason: match[2] || "Unknown reason",
      });
    }
  }

  return signals;
}

/**
 * Parses check stage signals.
 */
function parseCheckSignals(text: string): Signal[] {
  const signals: Signal[] = [];

  if (PATTERNS.CHECK_PASSED.test(text)) {
    signals.push({ _tag: "CheckPassed" });
  }

  if (PATTERNS.CHECK_FAILED.test(text)) {
    signals.push({ _tag: "CheckFailed" });
  }

  return signals;
}

/**
 * Parses review stage signals.
 */
function parseReviewSignals(text: string): Signal[] {
  const signals: Signal[] = [];
  const hasComplete = PATTERNS.REVIEW_COMPLETE.test(text);
  const hasChanges = PATTERNS.REVIEW_CHANGES.test(text);

  if (hasComplete) {
    signals.push({ _tag: "ReviewComplete", changesMade: hasChanges });
  }

  return signals;
}

/**
 * Parses task completion signals.
 */
function parseTaskComplete(text: string): Signal[] {
  const match = text.match(PATTERNS.TASK_COMPLETE);
  if (!match?.[1]) {
    return [];
  }

  const taskId = match[1];
  const content = match[2] || "";

  const summaryMatch = content.match(PATTERNS.SUMMARY);
  const summary = summaryMatch?.[1]?.trim() || "";

  const filesModifiedMatch = content.match(PATTERNS.FILES_MODIFIED);
  const filesModified = filesModifiedMatch?.[1]
    ? filesModifiedMatch[1]
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  const filesCreatedMatch = content.match(PATTERNS.FILES_CREATED);
  const filesCreated = filesCreatedMatch?.[1]
    ? filesCreatedMatch[1]
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  return [
    { _tag: "TaskComplete", taskId, summary, filesModified, filesCreated },
  ];
}

/**
 * Parses loop completion signal.
 */
function parseLoopComplete(text: string): Signal[] {
  if (PATTERNS.LOOP_COMPLETE.test(text)) {
    return [{ _tag: "LoopComplete" }];
  }
  return [];
}

/**
 * Parses all signals from a text string.
 */
function parseAllSignals(text: string): Signal[] {
  return [
    ...parseTasks(text),
    ...parsePhases(text),
    ...parseCriteria(text),
    ...parsePhaseSignals(text),
    ...parseCriterionSignals(text),
    ...parseCheckSignals(text),
    ...parseReviewSignals(text),
    ...parseTaskComplete(text),
    ...parseLoopComplete(text),
  ];
}

/**
 * Finds the last complete signal tag closing position in the buffer.
 * Used to prune processed content while keeping incomplete signals.
 */
function findLastCompleteSignalEnd(buffer: string): number {
  const closingTags = [
    "</ferix:tasks>",
    "</ferix:phases>",
    "</ferix:criteria>",
    "</ferix:phase-failed>",
    "</ferix:task-complete>",
    "<ferix:complete>",
    "<ferix:phase-start",
    "<ferix:phase-done",
    "<ferix:criterion-passed",
    "<ferix:criterion-failed",
    "<ferix:check-passed/>",
    "<ferix:check-failed/>",
    "<ferix:review-complete/>",
    "<ferix:review-changes-made/>",
  ];

  let maxEnd = -1;
  for (const tag of closingTags) {
    const idx = buffer.lastIndexOf(tag);
    if (idx !== -1) {
      const endPos = idx + tag.length;
      if (endPos > maxEnd) {
        maxEnd = endPos;
      }
    }
  }
  return maxEnd;
}

/**
 * Generates an efficient deduplication key for a signal.
 * Uses tag + identifying fields instead of JSON.stringify to avoid O(n) serialization.
 */
function getSignalKey(signal: Signal): string {
  switch (signal._tag) {
    case "TasksDefined":
      return `TasksDefined:${signal.tasks.map((t) => t.id).join(",")}`;
    case "PhasesDefined":
      return `PhasesDefined:${signal.taskId}:${signal.phases.map((p) => p.id).join(",")}`;
    case "CriteriaDefined":
      return `CriteriaDefined:${signal.taskId}:${signal.criteria.map((c) => c.id).join(",")}`;
    case "PhaseStarted":
      return `PhaseStarted:${signal.phaseId}`;
    case "PhaseCompleted":
      return `PhaseCompleted:${signal.phaseId}`;
    case "PhaseFailed":
      return `PhaseFailed:${signal.phaseId}`;
    case "CriterionPassed":
      return `CriterionPassed:${signal.criterionId}`;
    case "CriterionFailed":
      return `CriterionFailed:${signal.criterionId}`;
    case "TaskComplete":
      return `TaskComplete:${signal.taskId}`;
    case "CheckPassed":
      return "CheckPassed";
    case "CheckFailed":
      return "CheckFailed";
    case "ReviewComplete":
      return `ReviewComplete:${signal.changesMade}`;
    case "LoopComplete":
      return "LoopComplete";
    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = signal;
      return `Unknown:${(_exhaustive as Signal)._tag}`;
    }
  }
}

/**
 * Creates a signal accumulator for streaming parsing.
 * Uses chunked buffer approach to avoid O(n) string concatenation per chunk.
 * Prunes processed content to prevent unbounded memory growth.
 */
function createAccumulatorImpl(): Effect.Effect<SignalAccumulator> {
  return Effect.gen(function* () {
    // Use array of chunks instead of string concatenation for better perf
    const chunksRef = yield* Ref.make<string[]>([]);
    const emittedRef = yield* Ref.make<Set<string>>(new Set());

    const feed = (text: string): Effect.Effect<readonly Signal[], ParseError> =>
      Effect.gen(function* () {
        const chunks = yield* Ref.get(chunksRef);
        chunks.push(text);

        // Join chunks only when we need to parse
        const buffer = chunks.join("");

        // Enforce max buffer size by truncating from start if needed
        if (buffer.length > MAX_BUFFER_SIZE) {
          const truncatedBuffer = buffer.slice(buffer.length - MAX_BUFFER_SIZE);
          yield* Ref.set(chunksRef, [truncatedBuffer]);
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

        // Prune buffer after extracting signals to prevent unbounded growth
        // Keep only content after the last complete signal
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

        // Clear both chunks and emitted set on flush
        yield* Ref.set(chunksRef, []);
        const emitted = yield* Ref.get(emittedRef);

        const signals = parseAllSignals(buffer);
        const result = signals.filter((signal) => {
          const key = getSignalKey(signal);
          return !emitted.has(key);
        });

        // Clear emitted set on flush to free memory
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
