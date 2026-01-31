import { describe, expect, it } from "bun:test";
import type { LoopConfig, Plan } from "../../src/commands/code/domain/index.js";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import {
  areAllTasksComplete,
  buildDiscoveryPrompt,
  buildPrompt,
} from "../../src/commands/code/orchestrator/prompt.js";

/**
 * Helper to create a minimal loop config for testing.
 */
function createTestConfig(overrides: Partial<LoopConfig> = {}): LoopConfig {
  return {
    task: "Test task description",
    maxIterations: 5,
    verbose: false,
    verifyCommands: [],
    ...overrides,
  };
}

/**
 * Helper to create a test plan with minimal required fields.
 */
function createTestPlan(tasks: Plan["tasks"] = []): Plan {
  return {
    id: PlanId("test-session-plan"),
    sessionId: "test-session",
    createdAt: "2024-01-01T00:00:00.000Z",
    originalTask: "Test task",
    tasks,
  };
}

describe("Prompt Building", () => {
  describe("buildDiscoveryPrompt", () => {
    it("should include task description", () => {
      const config = createTestConfig({ task: "Implement dark mode toggle" });
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("Implement dark mode toggle");
    });

    it("should include discovery system prompt", () => {
      const config = createTestConfig();
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("DISCOVERY phase");
      expect(prompt).toContain("<ferix:session-name>");
      expect(prompt).toContain("<ferix:tasks>");
    });

    it("should include session name instructions", () => {
      const config = createTestConfig();
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("kebab-case");
      expect(prompt).toContain("2-5 words");
    });

    it("should include task exclusion warnings", () => {
      const config = createTestConfig();
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("Do NOT create tasks for");
      expect(prompt).toContain("verification");
      expect(prompt).toContain("handled automatically");
    });

    it("should include additional context when provided", () => {
      const config = createTestConfig({
        prompts: {
          additionalContext: "This is a React project using TypeScript",
        },
      });
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("Additional Context");
      expect(prompt).toContain("React project using TypeScript");
    });

    it("should include analysis instructions", () => {
      const config = createTestConfig();
      const prompt = buildDiscoveryPrompt(config);

      expect(prompt).toContain("Analyze the task");
      expect(prompt).toContain("Break the task into logical subtasks");
    });
  });

  describe("buildPrompt", () => {
    describe("without plan", () => {
      it("should include task description", () => {
        const config = createTestConfig({ task: "Build API endpoint" });
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Build API endpoint");
      });

      it("should include iteration information", () => {
        const config = createTestConfig({ maxIterations: 10 });
        const prompt = buildPrompt(config, 3);

        expect(prompt).toContain("Iteration 3 of 10");
      });

      it("should include system prompt with signal format", () => {
        const config = createTestConfig();
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Signal Format");
        expect(prompt).toContain("<ferix:tasks>");
        expect(prompt).toContain("<ferix:phases");
        expect(prompt).toContain("<ferix:complete>");
      });

      it("should include all phase prompts", () => {
        const config = createTestConfig();
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Phase 2: PLANNING");
        expect(prompt).toContain("Phase 3: EXECUTION");
        expect(prompt).toContain("Phase 4: CHECK");
        expect(prompt).toContain("Phase 6: REVIEW");
      });

      it("should not include verify phase without verify commands", () => {
        const config = createTestConfig({ verifyCommands: [] });
        const prompt = buildPrompt(config, 1);

        expect(prompt).not.toContain("Phase 5: VERIFY");
      });
    });

    describe("with plan", () => {
      it("should include task progress section", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc 1",
            status: "done",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
          {
            id: "2",
            title: "Task 2",
            description: "Desc 2",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("Task Progress");
        expect(prompt).toContain("1/2 complete");
      });

      it("should mark current task", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc 1",
            status: "done",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
          {
            id: "2",
            title: "Task 2",
            description: "Desc 2",
            status: "in_progress",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("← current");
      });

      it("should include current task section", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Implement feature",
            description: "Add new feature X",
            status: "in_progress",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("Current Task");
        expect(prompt).toContain("Implement feature");
        expect(prompt).toContain("Add new feature X");
      });

      it("should show phases when defined", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "in_progress",
            phases: [
              { id: "1.1", description: "Setup", status: "done" },
              { id: "1.2", description: "Implement", status: "in_progress" },
            ],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("Phases");
        expect(prompt).toContain("1.1: Setup (done)");
        expect(prompt).toContain("1.2: Implement (in_progress)");
      });

      it("should show criteria when defined", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "in_progress",
            phases: [],
            criteria: [
              { id: "1.c1", description: "Tests pass", status: "pending" },
            ],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("Success Criteria");
        expect(prompt).toContain("1.c1: Tests pass (pending)");
      });

      it("should indicate when no phases are defined", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "pending",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig();
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("No phases defined yet");
      });
    });

    describe("with verify commands", () => {
      it("should include verify phase when commands are configured", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "in_progress",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig({
          verifyCommands: ["bun lint", "bun test"],
        });
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).toContain("Phase 5: VERIFY");
        expect(prompt).toContain("bun lint");
        expect(prompt).toContain("bun test");
      });

      it("should not include verify phase when all tasks complete", () => {
        const plan = createTestPlan([
          {
            id: "1",
            title: "Task 1",
            description: "Desc",
            status: "done",
            phases: [],
            criteria: [],
            filesToModify: [],
            attempts: 0,
          },
        ]);

        const config = createTestConfig({
          verifyCommands: ["bun lint"],
        });
        const prompt = buildPrompt(config, 1, plan);

        expect(prompt).not.toContain("Phase 5: VERIFY");
      });
    });

    describe("with custom prompts", () => {
      it("should use custom system prompt when provided", () => {
        const config = createTestConfig({
          prompts: {
            systemPrompt: "Custom system prompt here",
          },
        });
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Custom system prompt here");
        expect(prompt).not.toContain("ralph loop");
      });

      it("should use custom phase prompts when provided", () => {
        const config = createTestConfig({
          prompts: {
            phases: {
              planning: "Custom planning phase",
              execution: "Custom execution phase",
            },
          },
        });
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Custom planning phase");
        expect(prompt).toContain("Custom execution phase");
      });

      it("should include additional context when provided", () => {
        const config = createTestConfig({
          prompts: {
            additionalContext: "Project uses Effect for functional programming",
          },
        });
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("Additional Context");
        expect(prompt).toContain("Effect for functional programming");
      });
    });

    describe("completion instructions", () => {
      it("should include task completion signal format", () => {
        const config = createTestConfig();
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("<ferix:task-complete id=");
        expect(prompt).toContain("<summary>");
        expect(prompt).toContain("<files-modified>");
      });

      it("should warn about loop complete signal usage", () => {
        const config = createTestConfig();
        const prompt = buildPrompt(config, 1);

        expect(prompt).toContain("ONLY emit <ferix:complete> when ALL tasks");
        expect(prompt).toContain("continue to the next task");
      });
    });
  });

  describe("areAllTasksComplete", () => {
    it("should return false for undefined plan", () => {
      expect(areAllTasksComplete(undefined)).toBe(false);
    });

    it("should return false for plan with no tasks", () => {
      const plan = createTestPlan([]);
      expect(areAllTasksComplete(plan)).toBe(false);
    });

    it("should return false when some tasks are pending", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc",
          status: "pending",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(false);
    });

    it("should return false when some tasks are in_progress", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc",
          status: "in_progress",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(false);
    });

    it("should return true when all tasks are done", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(true);
    });

    it("should return true when all tasks are skipped", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "skipped",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(true);
    });

    it("should return true when tasks are mix of done and skipped", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc",
          status: "skipped",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(true);
    });

    it("should return false when some tasks are failed", () => {
      const plan = createTestPlan([
        {
          id: "1",
          title: "Task 1",
          description: "Desc",
          status: "done",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
        {
          id: "2",
          title: "Task 2",
          description: "Desc",
          status: "failed",
          phases: [],
          criteria: [],
          filesToModify: [],
          attempts: 0,
        },
      ]);

      expect(areAllTasksComplete(plan)).toBe(false);
    });
  });
});
