import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import fc from "fast-check";
import { FerixParser } from "../../src/commands/code/layers/signal/ferix-parser.js";
import { SignalParser } from "../../src/commands/code/services/signal-parser.js";

const TestLayer = FerixParser.Live;

/**
 * Arbitrary for generating valid task signal content.
 */
const safeStringArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .map(
    (s) =>
      s
        .replace(/</g, "")
        .replace(/>/g, "")
        .replace(/&/g, "")
        .replace(/"/g, "")
        .replace(/'/g, "")
        .trim() || "default"
  );

/**
 * Arbitrary for generating task IDs.
 */
const taskIdArb = fc.stringOf(
  fc.constantFrom("1", "2", "3", "4", "5", "6", "7", "8", "9"),
  { minLength: 1, maxLength: 3 }
);

/**
 * Arbitrary for generating phase IDs.
 */
const phaseIdArb = fc
  .tuple(taskIdArb, fc.integer({ min: 1, max: 99 }))
  .map(([taskId, phaseNum]) => `${taskId}.${phaseNum}`);

/**
 * Arbitrary for generating criterion IDs.
 */
const criterionIdArb = fc
  .tuple(taskIdArb, fc.integer({ min: 1, max: 99 }))
  .map(([taskId, num]) => `${taskId}.c${num}`);

describe("Signal Roundtrip Properties", () => {
  describe("TasksDefined signal", () => {
    it("should parse generated tasks signal and recover task data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: taskIdArb,
              title: safeStringArb,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (tasks) => {
            const signal = `<ferix:tasks>${tasks.map((t) => `<task id="${t.id}">${t.title}</task>`).join("")}</ferix:tasks>`;

            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              return yield* parser.parse(signal);
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            expect(result).toHaveLength(1);
            const parsed = result[0];
            expect(parsed?._tag).toBe("TasksDefined");

            if (parsed?._tag === "TasksDefined") {
              expect(parsed.tasks.length).toBe(tasks.length);
              for (let i = 0; i < tasks.length; i++) {
                expect(parsed.tasks[i]?.id).toBe(tasks[i]?.id);
                expect(parsed.tasks[i]?.title).toBe(tasks[i]?.title);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("PhasesDefined signal", () => {
    it("should parse generated phases signal and recover phase data", async () => {
      await fc.assert(
        fc.asyncProperty(
          taskIdArb,
          fc.array(
            fc.record({
              // Phase IDs must be in format "taskId.phaseNum" with digits and dots only
              id: fc
                .tuple(taskIdArb, fc.integer({ min: 1, max: 99 }))
                .map(([tId, num]) => `${tId}.${num}`),
              description: safeStringArb,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (taskId, phases) => {
            const signal = `<ferix:phases task="${taskId}">${phases.map((p) => `<phase id="${p.id}">${p.description}</phase>`).join("")}</ferix:phases>`;

            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              return yield* parser.parse(signal);
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            expect(result).toHaveLength(1);
            const parsed = result[0];
            expect(parsed?._tag).toBe("PhasesDefined");

            if (parsed?._tag === "PhasesDefined") {
              expect(parsed.taskId).toBe(taskId);
              expect(parsed.phases.length).toBe(phases.length);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("CriteriaDefined signal", () => {
    it("should parse generated criteria signal and recover criteria data", async () => {
      await fc.assert(
        fc.asyncProperty(
          taskIdArb,
          fc.array(
            fc.record({
              // Criterion IDs must be in format "taskId.cNum" with digits and dots only
              id: fc
                .tuple(taskIdArb, fc.integer({ min: 1, max: 99 }))
                .map(([tId, num]) => `${tId}.c${num}`),
              description: safeStringArb,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (taskId, criteria) => {
            const signal = `<ferix:criteria task="${taskId}">${criteria.map((c) => `<criterion id="${c.id}">${c.description}</criterion>`).join("")}</ferix:criteria>`;

            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              return yield* parser.parse(signal);
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            expect(result).toHaveLength(1);
            const parsed = result[0];
            expect(parsed?._tag).toBe("CriteriaDefined");

            if (parsed?._tag === "CriteriaDefined") {
              expect(parsed.taskId).toBe(taskId);
              expect(parsed.criteria.length).toBe(criteria.length);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Phase lifecycle signals", () => {
    it("should parse phase-start signal and recover phase ID", async () => {
      await fc.assert(
        fc.asyncProperty(phaseIdArb, async (phaseId) => {
          const signal = `<ferix:phase-start id="${phaseId}"/>`;

          const program = Effect.gen(function* () {
            const parser = yield* SignalParser;
            return yield* parser.parse(signal);
          });

          const result = await Effect.runPromise(
            program.pipe(Effect.provide(TestLayer))
          );

          expect(result).toHaveLength(1);
          const parsed = result[0];
          expect(parsed?._tag).toBe("PhaseStarted");

          if (parsed?._tag === "PhaseStarted") {
            expect(parsed.phaseId).toBe(phaseId);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("should parse phase-done signal and recover phase ID", async () => {
      await fc.assert(
        fc.asyncProperty(phaseIdArb, async (phaseId) => {
          const signal = `<ferix:phase-done id="${phaseId}"/>`;

          const program = Effect.gen(function* () {
            const parser = yield* SignalParser;
            return yield* parser.parse(signal);
          });

          const result = await Effect.runPromise(
            program.pipe(Effect.provide(TestLayer))
          );

          expect(result).toHaveLength(1);
          const parsed = result[0];
          expect(parsed?._tag).toBe("PhaseCompleted");

          if (parsed?._tag === "PhaseCompleted") {
            expect(parsed.phaseId).toBe(phaseId);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("should parse phase-failed signal and recover phase ID and reason", async () => {
      await fc.assert(
        fc.asyncProperty(phaseIdArb, safeStringArb, async (phaseId, reason) => {
          const signal = `<ferix:phase-failed id="${phaseId}">${reason}</ferix:phase-failed>`;

          const program = Effect.gen(function* () {
            const parser = yield* SignalParser;
            return yield* parser.parse(signal);
          });

          const result = await Effect.runPromise(
            program.pipe(Effect.provide(TestLayer))
          );

          expect(result).toHaveLength(1);
          const parsed = result[0];
          expect(parsed?._tag).toBe("PhaseFailed");

          if (parsed?._tag === "PhaseFailed") {
            expect(parsed.phaseId).toBe(phaseId);
            expect(parsed.reason).toBe(reason);
          }
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Criterion lifecycle signals", () => {
    it("should parse criterion-passed signal and recover criterion ID", async () => {
      await fc.assert(
        fc.asyncProperty(criterionIdArb, async (criterionId) => {
          const signal = `<ferix:criterion-passed id="${criterionId}"/>`;

          const program = Effect.gen(function* () {
            const parser = yield* SignalParser;
            return yield* parser.parse(signal);
          });

          const result = await Effect.runPromise(
            program.pipe(Effect.provide(TestLayer))
          );

          expect(result).toHaveLength(1);
          const parsed = result[0];
          expect(parsed?._tag).toBe("CriterionPassed");

          if (parsed?._tag === "CriterionPassed") {
            expect(parsed.criterionId).toBe(criterionId);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("should parse criterion-failed signal and recover criterion ID and reason", async () => {
      await fc.assert(
        fc.asyncProperty(
          criterionIdArb,
          safeStringArb,
          async (criterionId, reason) => {
            const signal = `<ferix:criterion-failed id="${criterionId}" reason="${reason}"/>`;

            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              return yield* parser.parse(signal);
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            expect(result).toHaveLength(1);
            const parsed = result[0];
            expect(parsed?._tag).toBe("CriterionFailed");

            if (parsed?._tag === "CriterionFailed") {
              expect(parsed.criterionId).toBe(criterionId);
              expect(parsed.reason).toBe(reason);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("TaskComplete signal", () => {
    it("should parse task-complete signal and recover all fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          taskIdArb,
          safeStringArb,
          fc.array(safeStringArb, { maxLength: 5 }),
          fc.array(safeStringArb, { maxLength: 5 }),
          async (taskId, summary, filesModified, filesCreated) => {
            const signal = `<ferix:task-complete id="${taskId}">
              <summary>${summary}</summary>
              <files-modified>${filesModified.join(", ")}</files-modified>
              <files-created>${filesCreated.join(", ")}</files-created>
            </ferix:task-complete>`;

            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              return yield* parser.parse(signal);
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            expect(result).toHaveLength(1);
            const parsed = result[0];
            expect(parsed?._tag).toBe("TaskComplete");

            if (parsed?._tag === "TaskComplete") {
              expect(parsed.taskId).toBe(taskId);
              expect(parsed.summary).toBe(summary);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Simple signals", () => {
    it("should parse check-passed signal", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("<ferix:check-passed/>");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      expect(result[0]?._tag).toBe("CheckPassed");
    });

    it("should parse check-failed signal", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("<ferix:check-failed/>");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      expect(result[0]?._tag).toBe("CheckFailed");
    });
  });

  describe("Signal accumulation properties", () => {
    it("should accumulate signals correctly across multiple feeds", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(phaseIdArb, { minLength: 1, maxLength: 5 }),
          async (phaseIds) => {
            const program = Effect.gen(function* () {
              const parser = yield* SignalParser;
              const accumulator = yield* parser.createAccumulator();

              const allSignals: Array<{ _tag: string }> = [];

              for (const phaseId of phaseIds) {
                const signals = yield* accumulator.feed(
                  `<ferix:phase-start id="${phaseId}"/>`
                );
                allSignals.push(...signals);
              }

              return allSignals;
            });

            const result = await Effect.runPromise(
              program.pipe(Effect.provide(TestLayer))
            );

            // Should have one signal per phase ID
            expect(result.length).toBe(phaseIds.length);
            for (const signal of result) {
              expect(signal._tag).toBe("PhaseStarted");
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("should not emit duplicate signals", async () => {
      await fc.assert(
        fc.asyncProperty(phaseIdArb, async (phaseId) => {
          const signal = `<ferix:phase-start id="${phaseId}"/>`;

          const program = Effect.gen(function* () {
            const parser = yield* SignalParser;
            const accumulator = yield* parser.createAccumulator();

            const first = yield* accumulator.feed(signal);
            // Feed more content but the same signal
            const second = yield* accumulator.feed(" some text");

            return { first, second };
          });

          const result = await Effect.runPromise(
            program.pipe(Effect.provide(TestLayer))
          );

          // First feed should emit the signal
          expect(result.first).toHaveLength(1);
          // Second feed should not re-emit
          expect(result.second).toHaveLength(0);
        }),
        { numRuns: 30 }
      );
    });
  });
});
