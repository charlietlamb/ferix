import { describe, expect, it } from "bun:test";
import { darkTheme as theme } from "../../src/commands/code/consumers/tui/context/theme-constants.js";
import { styleFerixTags } from "../../src/commands/code/consumers/tui/tags/index.js";

describe("OpenTUI Tag Parser", () => {
  describe("tool use lines", () => {
    it("parses tool use line with detail", () => {
      const chunks = styleFerixTags("▸ Read file.ts", 80);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.some((c) => c.text.includes("Read"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("file.ts"))).toBe(true);
    });

    it("parses tool use line without detail", () => {
      const chunks = styleFerixTags("▸ Bash", 80);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.some((c) => c.text.includes("Bash"))).toBe(true);
    });

    it("applies correct color for Read tool", () => {
      const chunks = styleFerixTags("▸ Read file.ts", 80);
      const readChunk = chunks.find((c) => c.text === "Read");
      expect(readChunk).toBeDefined();
      expect(readChunk?.fg).toEqual(theme.cyan);
    });

    it("applies correct color for Edit tool", () => {
      const chunks = styleFerixTags("▸ Edit file.ts", 80);
      const editChunk = chunks.find((c) => c.text === "Edit");
      expect(editChunk).toBeDefined();
      expect(editChunk?.fg).toEqual(theme.warning);
    });

    it("applies correct color for Write tool", () => {
      const chunks = styleFerixTags("▸ Write file.ts", 80);
      const writeChunk = chunks.find((c) => c.text === "Write");
      expect(writeChunk).toBeDefined();
      expect(writeChunk?.fg).toEqual(theme.success);
    });
  });

  describe("task tags", () => {
    it("hides task list header (tasks render from state via task-block)", () => {
      const chunks = styleFerixTags("<ferix:tasks>", 80);
      expect(chunks.length).toBe(0);
    });

    it("hides task list footer (tasks render from state via task-block)", () => {
      const chunks = styleFerixTags("</ferix:tasks>", 80);
      expect(chunks.length).toBe(0);
    });

    it("hides individual task (tasks render from state via task-block)", () => {
      const chunks = styleFerixTags(
        '<task id="1">Implement feature</task>',
        80
      );
      expect(chunks.length).toBe(0);
    });

    it("hides multiline task content", () => {
      const chunks = styleFerixTags(
        '<task id="1">Implement feature\nwith multiple lines</task>',
        80
      );
      expect(chunks.length).toBe(0);
    });

    it("parses task-block marker", () => {
      const chunks = styleFerixTags("<ferix:task-block/>", 80);
      expect(chunks.length).toBe(1);
      expect(chunks[0]?.text).toBe("__TASK_BLOCK__");
    });

    it("parses task done signal", () => {
      const chunks = styleFerixTags('<ferix:task-done id="1"/>', 80);
      expect(chunks.some((c) => c.text.includes("✓"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Task 1 complete"))).toBe(true);
    });
  });

  describe("phase tags", () => {
    it("parses phases header", () => {
      const chunks = styleFerixTags('<ferix:phases task="1">', 80);
      expect(chunks.some((c) => c.text.includes("Phases"))).toBe(true);
    });

    it("parses individual phase", () => {
      const chunks = styleFerixTags('<phase id="a">Plan approach</phase>', 80);
      expect(chunks.some((c) => c.text.includes("[a]"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Plan approach"))).toBe(true);
    });

    it("parses phase start signal", () => {
      const chunks = styleFerixTags('<ferix:phase-start id="a"/>', 80);
      expect(chunks.some((c) => c.text.includes("●"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Phase a started"))).toBe(true);
    });

    it("parses phase done signal", () => {
      const chunks = styleFerixTags('<ferix:phase-done id="a"/>', 80);
      expect(chunks.some((c) => c.text.includes("✓"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Phase a complete"))).toBe(
        true
      );
    });

    it("parses phase failed signal", () => {
      const chunks = styleFerixTags(
        '<ferix:phase-failed id="a">Something went wrong</ferix:phase-failed>',
        80
      );
      expect(chunks.some((c) => c.text.includes("✗"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Phase a failed"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Something went wrong"))).toBe(
        true
      );
    });
  });

  describe("criteria tags", () => {
    it("parses criteria header", () => {
      const chunks = styleFerixTags('<ferix:criteria task="1">', 80);
      expect(chunks.some((c) => c.text.includes("Criteria"))).toBe(true);
    });

    it("parses individual criterion", () => {
      const chunks = styleFerixTags(
        '<criterion id="c1">Tests pass</criterion>',
        80
      );
      expect(chunks.some((c) => c.text.includes("[c1]"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Tests pass"))).toBe(true);
    });

    it("parses criterion passed signal", () => {
      const chunks = styleFerixTags('<ferix:criterion-passed id="c1"/>', 80);
      expect(chunks.some((c) => c.text.includes("✓"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Criterion c1 passed"))).toBe(
        true
      );
    });

    it("parses criterion failed signal", () => {
      const chunks = styleFerixTags(
        '<ferix:criterion-failed id="c1" reason="Tests failed"/>',
        80
      );
      expect(chunks.some((c) => c.text.includes("✗"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Criterion c1 failed"))).toBe(
        true
      );
      expect(chunks.some((c) => c.text.includes("Tests failed"))).toBe(true);
    });
  });

  describe("review tags", () => {
    it("parses check passed signal", () => {
      const chunks = styleFerixTags("<ferix:check-passed/>", 80);
      expect(chunks.some((c) => c.text.includes("✓"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Check passed"))).toBe(true);
    });

    it("parses check failed signal", () => {
      const chunks = styleFerixTags("<ferix:check-failed/>", 80);
      expect(chunks.some((c) => c.text.includes("✗"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Check failed"))).toBe(true);
    });

    it("parses review passed banner", () => {
      const chunks = styleFerixTags("<ferix:review-passed/>", 80);
      expect(chunks.some((c) => c.text.includes("REVIEW PASSED"))).toBe(true);
    });

    it("parses review failed banner", () => {
      const chunks = styleFerixTags("<ferix:review-failed/>", 80);
      expect(chunks.some((c) => c.text.includes("REVIEW FAILED"))).toBe(true);
    });

    it("parses review complete signal", () => {
      const chunks = styleFerixTags("<ferix:review-complete/>", 80);
      expect(chunks.some((c) => c.text.includes("✓"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Review complete"))).toBe(true);
    });

    it("parses review changes made signal", () => {
      const chunks = styleFerixTags("<ferix:review-changes-made/>", 80);
      expect(chunks.some((c) => c.text.includes("●"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Review made changes"))).toBe(
        true
      );
    });
  });

  describe("completion tags", () => {
    it("parses error tag", () => {
      const chunks = styleFerixTags(
        "<ferix:error>Something went wrong</ferix:error>",
        80
      );
      expect(chunks.some((c) => c.text.includes("ERROR"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Something went wrong"))).toBe(
        true
      );
    });

    it("hides task-complete opening tag", () => {
      const chunks = styleFerixTags('<ferix:task-complete id="1">', 80);
      const totalText = chunks.map((c) => c.text).join("");
      expect(totalText).toBe("");
    });

    it("hides summary tag", () => {
      const chunks = styleFerixTags(
        "<summary>Task completed successfully</summary>",
        80
      );
      const totalText = chunks.map((c) => c.text).join("");
      expect(totalText).toBe("");
    });

    it("hides files-modified tag", () => {
      const chunks = styleFerixTags(
        "<files-modified>file1.ts, file2.ts</files-modified>",
        80
      );
      const totalText = chunks.map((c) => c.text).join("");
      expect(totalText).toBe("");
    });

    it("hides files-created tag", () => {
      const chunks = styleFerixTags(
        "<files-created>new-file.ts</files-created>",
        80
      );
      const totalText = chunks.map((c) => c.text).join("");
      expect(totalText).toBe("");
    });

    it("hides task-complete closing tag", () => {
      const chunks = styleFerixTags("</ferix:task-complete>", 80);
      const totalText = chunks.map((c) => c.text).join("");
      expect(totalText).toBe("");
    });
  });

  describe("session name tag", () => {
    it("parses session name", () => {
      const chunks = styleFerixTags(
        "<ferix:session-name>My Session</ferix:session-name>",
        80
      );
      expect(chunks.some((c) => c.text.includes("◇"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("My Session"))).toBe(true);
    });
  });

  describe("plain text", () => {
    it("returns plain text unchanged", () => {
      const chunks = styleFerixTags("Just some regular text", 80);
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe("Just some regular text");
    });

    it("handles empty string", () => {
      const chunks = styleFerixTags("", 80);
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe("");
    });

    it("handles single space", () => {
      const chunks = styleFerixTags(" ", 80);
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe(" ");
    });
  });

  describe("learning tags", () => {
    it("parses learning with category", () => {
      const chunks = styleFerixTags(
        '<ferix:learning category="architecture">Use dependency injection</ferix:learning>',
        80
      );
      expect(chunks.some((c) => c.text.includes("●"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("[architecture]"))).toBe(true);
      expect(
        chunks.some((c) => c.text.includes("Use dependency injection"))
      ).toBe(true);
    });

    it("parses learning without category", () => {
      const chunks = styleFerixTags(
        '<ferix:learning category="">Some insight</ferix:learning>',
        80
      );
      expect(chunks.some((c) => c.text.includes("●"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Some insight"))).toBe(true);
    });
  });

  describe("guardrail tags", () => {
    it("parses critical guardrail", () => {
      const chunks = styleFerixTags(
        '<ferix:guardrail severity="critical">no eval()</ferix:guardrail>',
        80
      );
      expect(chunks.some((c) => c.text.includes("✗"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Guardrail:"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("no eval()"))).toBe(true);
    });

    it("parses warn guardrail", () => {
      const chunks = styleFerixTags(
        '<ferix:guardrail severity="warn">avoid console.log</ferix:guardrail>',
        80
      );
      expect(chunks.some((c) => c.text.includes("△"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Guardrail:"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("avoid console.log"))).toBe(
        true
      );
    });
  });

  describe("verify tags", () => {
    it("parses verify started", () => {
      const chunks = styleFerixTags('<ferix:verify-started attempt="1"/>', 80);
      expect(chunks.some((c) => c.text.includes("▸"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Verify"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("attempt 1"))).toBe(true);
    });

    it("parses verify passed", () => {
      const chunks = styleFerixTags("<ferix:verify-passed/>", 80);
      expect(chunks.some((c) => c.text.includes("VERIFY PASSED"))).toBe(true);
    });

    it("parses verify failed", () => {
      const chunks = styleFerixTags('<ferix:verify-failed attempt="2"/>', 80);
      expect(chunks.some((c) => c.text.includes("✗"))).toBe(true);
      expect(
        chunks.some((c) => c.text.includes("Verify failed (attempt 2)"))
      ).toBe(true);
    });
  });

  describe("worktree tags", () => {
    it("parses branch pushed", () => {
      const chunks = styleFerixTags(
        "<ferix:branch-pushed>feature/my-branch</ferix:branch-pushed>",
        80
      );
      expect(chunks.some((c) => c.text.includes("▸"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("feature/my-branch"))).toBe(
        true
      );
    });

    it("parses PR created", () => {
      const chunks = styleFerixTags(
        "<ferix:pr-created>https://github.com/org/repo/pull/42</ferix:pr-created>",
        80
      );
      expect(chunks.some((c) => c.text.includes("◆"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("PR:"))).toBe(true);
      expect(
        chunks.some((c) =>
          c.text.includes("https://github.com/org/repo/pull/42")
        )
      ).toBe(true);
    });
  });

  describe("iteration tags", () => {
    it("parses iteration separator", () => {
      const chunks = styleFerixTags('<ferix:iteration n="3" max="10"/>', 80);
      expect(chunks.some((c) => c.text.includes("Iteration 3/10"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("─"))).toBe(true);
    });

    it("respects width for iteration separator", () => {
      const narrowChunks = styleFerixTags(
        '<ferix:iteration n="1" max="5"/>',
        30
      );
      const wideChunks = styleFerixTags('<ferix:iteration n="1" max="5"/>', 80);
      expect(narrowChunks.some((c) => c.text.includes("Iteration 1/5"))).toBe(
        true
      );
      expect(wideChunks.some((c) => c.text.includes("Iteration 1/5"))).toBe(
        true
      );
    });
  });

  describe("hidden tags produce empty chunks", () => {
    it("hidden tags return zero-length array", () => {
      const chunks = styleFerixTags('<ferix:task-complete id="1">', 80);
      expect(chunks.length).toBe(0);
    });

    it("summary hidden tag returns zero-length array", () => {
      const chunks = styleFerixTags(
        "<summary>Task completed successfully</summary>",
        80
      );
      expect(chunks.length).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles malformed tags as plain text", () => {
      const chunks = styleFerixTags(
        "<ferix:unknown>content</ferix:unknown>",
        80
      );
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe("<ferix:unknown>content</ferix:unknown>");
    });

    it("handles partial tag matches", () => {
      const chunks = styleFerixTags("▸ Read", 80);
      // Should match the tool use pattern
      expect(chunks.some((c) => c.text === "Read")).toBe(true);
    });

    it("respects width parameter for banners", () => {
      const narrowChunks = styleFerixTags("<ferix:review-passed/>", 20);
      const wideChunks = styleFerixTags("<ferix:review-passed/>", 80);
      // Both should contain REVIEW PASSED
      expect(narrowChunks.some((c) => c.text.includes("REVIEW PASSED"))).toBe(
        true
      );
      expect(wideChunks.some((c) => c.text.includes("REVIEW PASSED"))).toBe(
        true
      );
    });
  });
});
