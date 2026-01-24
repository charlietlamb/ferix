import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { FerixParser } from "../layers/signal/ferix-parser.js";
import { SignalParser } from "../services/signal-parser.js";

const TestLayer = FerixParser.Live;

describe("FerixParser", () => {
  describe("parse", () => {
    it("should parse tasks block", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:tasks>
            <task id="1">Implement feature</task>
            <task id="2">Write tests</task>
          </ferix:tasks>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first).toBeDefined();
      expect(first?._tag).toBe("TasksDefined");
      if (first?._tag === "TasksDefined") {
        expect(first.tasks).toHaveLength(2);
        expect(first.tasks[0]?.id).toBe("1");
        expect(first.tasks[1]?.id).toBe("2");
      }
    });

    it("should parse phases block", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:phases task="1">
            <phase id="1.1">Setup environment</phase>
            <phase id="1.2">Implement core logic</phase>
          </ferix:phases>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first).toBeDefined();
      expect(first?._tag).toBe("PhasesDefined");
      if (first?._tag === "PhasesDefined") {
        expect(first.taskId).toBe("1");
        expect(first.phases).toHaveLength(2);
      }
    });

    it("should parse criteria block", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:criteria task="1">
            <criterion id="1.c1">Code compiles</criterion>
            <criterion id="1.c2">Tests pass</criterion>
          </ferix:criteria>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first).toBeDefined();
      expect(first?._tag).toBe("CriteriaDefined");
      if (first?._tag === "CriteriaDefined") {
        expect(first.taskId).toBe("1");
        expect(first.criteria).toHaveLength(2);
      }
    });

    it("should parse phase lifecycle signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:phase-start id="1.1"/>
          <ferix:phase-done id="1.1"/>
          <ferix:phase-failed id="1.2">Network error</ferix:phase-failed>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(3);
      expect(result[0]?._tag).toBe("PhaseStarted");
      expect(result[1]?._tag).toBe("PhaseCompleted");
      expect(result[2]?._tag).toBe("PhaseFailed");
      const third = result[2];
      if (third?._tag === "PhaseFailed") {
        expect(third.reason).toBe("Network error");
      }
    });

    it("should parse criterion signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:criterion-passed id="1.c1"/>
          <ferix:criterion-failed id="1.c2" reason="Assertion failed"/>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(2);
      expect(result[0]?._tag).toBe("CriterionPassed");
      expect(result[1]?._tag).toBe("CriterionFailed");
      const second = result[1];
      if (second?._tag === "CriterionFailed") {
        expect(second.reason).toBe("Assertion failed");
      }
    });

    it("should parse check signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const passed = yield* parser.parse("<ferix:check-passed/>");
        const failed = yield* parser.parse("<ferix:check-failed/>");
        return { passed, failed };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.passed[0]?._tag).toBe("CheckPassed");
      expect(result.failed[0]?._tag).toBe("CheckFailed");
    });

    it("should parse review signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const complete = yield* parser.parse("<ferix:review-complete/>");
        const changes = yield* parser.parse(
          "<ferix:review-complete/><ferix:review-changes-made/>"
        );
        return { complete, changes };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.complete[0]?._tag).toBe("ReviewComplete");
      const first = result.complete[0];
      if (first?._tag === "ReviewComplete") {
        expect(first.changesMade).toBe(false);
      }

      const changesFirst = result.changes[0];
      if (changesFirst?._tag === "ReviewComplete") {
        expect(changesFirst.changesMade).toBe(true);
      }
    });

    it("should parse task complete signal", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:task-complete id="1">
            <summary>Implemented feature successfully</summary>
            <files-modified>src/index.ts, src/utils.ts</files-modified>
            <files-created>src/new-file.ts</files-created>
          </ferix:task-complete>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first?._tag).toBe("TaskComplete");
      if (first?._tag === "TaskComplete") {
        expect(first.taskId).toBe("1");
        expect(first.summary).toBe("Implemented feature successfully");
        expect(first.filesModified).toEqual(["src/index.ts", "src/utils.ts"]);
        expect(first.filesCreated).toEqual(["src/new-file.ts"]);
      }
    });

    it("should parse loop complete signal", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("<ferix:complete>");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      expect(result[0]?._tag).toBe("LoopComplete");
    });

    it("should return empty array for text without signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          "Just some regular text without any signals"
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(0);
    });

    it("should parse multiple signal types in one text", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:phase-start id="1.1"/>
          Some LLM output here...
          <ferix:phase-done id="1.1"/>
          <ferix:criterion-passed id="1.c1"/>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(3);
      // Order depends on spec registration order, not text position
      const tags = result.map((s) => s._tag).sort();
      expect(tags).toEqual(
        ["CriterionPassed", "PhaseCompleted", "PhaseStarted"].sort()
      );
    });
  });

  describe("accumulator", () => {
    it("should accumulate signals across multiple feeds", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        // Feed partial content
        const signals1 = yield* accumulator.feed("<ferix:ta");
        const signals2 = yield* accumulator.feed(
          'sks><task id="1">Test</task></ferix:tasks>'
        );

        return { signals1, signals2 };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Signal should be emitted when complete
      expect(result.signals1).toHaveLength(0);
      expect(result.signals2).toHaveLength(1);
      expect(result.signals2[0]?._tag).toBe("TasksDefined");
    });

    it("should not emit duplicate signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        const signals1 = yield* accumulator.feed(
          '<ferix:tasks><task id="1">Test</task></ferix:tasks>'
        );
        // Feed same content again
        const signals2 = yield* accumulator.feed(" more text");

        return { signals1, signals2 };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.signals1).toHaveLength(1);
      expect(result.signals2).toHaveLength(0);
    });

    it("should flush remaining signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        yield* accumulator.feed(
          '<ferix:tasks><task id="1">Test</task></ferix:tasks>'
        );
        const flushed = yield* accumulator.flush();

        return flushed;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Already emitted, so flush should be empty
      expect(result).toHaveLength(0);
    });

    it("should clear emitted set on flush", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        yield* accumulator.feed(
          '<ferix:tasks><task id="1">Test</task></ferix:tasks>'
        );
        yield* accumulator.flush();

        // Feed same content after flush - should emit again since set was cleared
        const signals = yield* accumulator.feed(
          '<ferix:tasks><task id="1">Test</task></ferix:tasks>'
        );

        return signals;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
    });
  });
});
