import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { ParseError } from "../../src/commands/code/domain/errors.js";
import { FerixParser } from "../../src/commands/code/layers/signal/ferix-parser.js";
import { SignalParser } from "../../src/commands/code/services/signal-parser.js";

const TestLayer = FerixParser.Live;

describe("Signal Parsing Error Paths", () => {
  describe("ParseError construction", () => {
    it("should create ParseError with message", () => {
      const error = new ParseError({
        message: "Invalid signal format",
      });

      expect(error._tag).toBe("ParseError");
      expect(error.message).toBe("Invalid signal format");
      expect(error.input).toBeUndefined();
    });

    it("should create ParseError with input", () => {
      const input = "<ferix:invalid>malformed</ferix:invalid>";
      const error = new ParseError({
        message: "Unknown signal type",
        input,
      });

      expect(error._tag).toBe("ParseError");
      expect(error.input).toBe(input);
    });
  });

  describe("Malformed signal parsing", () => {
    it("should handle empty input gracefully", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toEqual([]);
    });

    it("should handle input with no signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          "This is just regular text without any ferix signals"
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toEqual([]);
    });

    it("should handle incomplete opening tag", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("<ferix:tasks");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Should not crash, returns empty or partial signals
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle missing closing tag", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse('<ferix:tasks><task id="1">Task 1</task>');
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Should not crash
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle mismatched tags", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse("<ferix:tasks></ferix:phases>");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Should not crash
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle invalid XML characters", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        // Contains invalid control characters
        return yield* parser.parse(
          '<ferix:tasks><task id="1">Task\x00with\x01invalid</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle deeply nested invalid content", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:tasks>
            <task id="1">
              <nested>
                <deeply>
                  This is not valid signal content
                </deeply>
              </nested>
            </task>
          </ferix:tasks>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Invalid attribute values", () => {
    it("should handle missing required id attribute", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          "<ferix:tasks><task>Missing ID</task></ferix:tasks>"
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Parser may or may not include tasks with missing IDs
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty id attribute", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          '<ferix:tasks><task id="">Empty ID</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle special characters in attributes", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          '<ferix:tasks><task id="1&2">Special chars</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle quoted characters in attributes", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          '<ferix:tasks><task id="test&quot;id">Quoted</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Signal accumulator error handling", () => {
    it("should handle partial feed followed by flush", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        // Feed incomplete signal
        yield* accumulator.feed('<ferix:tasks><task id="1">Partial');

        // Flush should handle incomplete gracefully
        const flushed = yield* accumulator.flush();

        return flushed;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle multiple partial feeds", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        // Feed in tiny chunks
        yield* accumulator.feed("<");
        yield* accumulator.feed("ferix");
        yield* accumulator.feed(":tasks>");
        yield* accumulator.feed("<task ");
        yield* accumulator.feed('id="1"');
        yield* accumulator.feed(">Test</task>");
        const signals = yield* accumulator.feed("</ferix:tasks>");

        return signals;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      expect(result[0]?._tag).toBe("TasksDefined");
    });

    it("should handle feed with only whitespace", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        const accumulator = yield* parser.createAccumulator();

        const signals1 = yield* accumulator.feed("   \n\t  ");
        const signals2 = yield* accumulator.feed("   ");

        return { signals1, signals2 };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.signals1).toEqual([]);
      expect(result.signals2).toEqual([]);
    });
  });

  describe("Edge cases in signal content", () => {
    it("should handle very long task titles", async () => {
      const longTitle = "A".repeat(10_000);
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          `<ferix:tasks><task id="1">${longTitle}</task></ferix:tasks>`
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      if (result[0]?._tag === "TasksDefined") {
        expect(result[0].tasks[0]?.title.length).toBe(10_000);
      }
    });

    it("should handle unicode in signal content", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          '<ferix:tasks><task id="1">実装する機能 🚀</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      if (result[0]?._tag === "TasksDefined") {
        expect(result[0].tasks[0]?.title).toContain("🚀");
      }
    });

    it("should handle newlines in signal content", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:tasks>
            <task id="1">Multi
            line
            task</task>
          </ferix:tasks>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
    });

    it("should handle HTML entities in content", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(
          '<ferix:tasks><task id="1">Use &lt;div&gt; element</task></ferix:tasks>'
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
    });
  });

  describe("Mixed valid and invalid signals", () => {
    it("should parse valid signals around invalid content", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:phase-start id="1.1"/>
          <invalid>Not a signal</invalid>
          <ferix:phase-done id="1.1"/>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Should find the valid signals
      const tags = result.map((s) => s._tag);
      expect(tags).toContain("PhaseStarted");
      expect(tags).toContain("PhaseCompleted");
    });

    it("should handle interleaved LLM output and signals", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          I'm starting the first phase now.
          <ferix:phase-start id="1.1"/>
          Let me implement the feature...
          Here's what I did:
          1. Created the component
          2. Added styles
          <ferix:phase-done id="1.1"/>
          Moving on to the next phase.
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Recovery from parsing errors", () => {
    it("should continue parsing after encountering unknown signal type", async () => {
      const program = Effect.gen(function* () {
        const parser = yield* SignalParser;
        return yield* parser.parse(`
          <ferix:unknown-signal/>
          <ferix:phase-start id="1.1"/>
        `);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );

      // Should still parse the valid signal
      const hasPhaseStarted = result.some((s) => s._tag === "PhaseStarted");
      expect(hasPhaseStarted).toBe(true);
    });
  });
});
