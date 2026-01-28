import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import { MemoryGit } from "../../src/commands/code/layers/git/memory.js";
import { MemoryGuardrails } from "../../src/commands/code/layers/guardrails/memory.js";
import { MemoryPlan } from "../../src/commands/code/layers/plan/memory.js";
import { MemoryProgress } from "../../src/commands/code/layers/progress/memory.js";
import { MemorySession } from "../../src/commands/code/layers/session/memory.js";
import { Git } from "../../src/commands/code/services/git.js";
import { GuardrailsStore } from "../../src/commands/code/services/guardrails-store.js";
import { PlanStore } from "../../src/commands/code/services/plan-store.js";
import { ProgressStore } from "../../src/commands/code/services/progress-store.js";
import { SessionStore } from "../../src/commands/code/services/session-store.js";

const SESSION_ID_PATTERN = /^test-session-\d+$/;

describe("Memory Stores", () => {
  describe("MemorySession", () => {
    it("should create a session with unique ID", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        const session = yield* sessionStore.create("Test task");

        expect(session.id).toMatch(SESSION_ID_PATTERN);
        expect(session.originalTask).toBe("Test task");
        expect(session.status).toBe("active");
        expect(session.completedTasks).toEqual([]);

        return session;
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()))
      );
    });

    it("should generate incremental session IDs", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        const session1 = yield* sessionStore.create("Task 1");
        const session2 = yield* sessionStore.create("Task 2");

        expect(session1.id).toBe("test-session-1");
        expect(session2.id).toBe("test-session-2");
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()))
      );
    });

    it("should retrieve a session by ID", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        const created = yield* sessionStore.create("Test task");
        const retrieved = yield* sessionStore.get(created.id);

        expect(retrieved).toEqual(created);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()))
      );
    });

    it("should fail when getting non-existent session", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.get("non-existent");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should update a session", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        const created = yield* sessionStore.create("Test task");

        const updated = {
          ...created,
          status: "completed" as const,
          completedTasks: ["task-1"],
        };

        yield* sessionStore.update(created.id, updated);
        const retrieved = yield* sessionStore.get(created.id);

        expect(retrieved.status).toBe("completed");
        expect(retrieved.completedTasks).toEqual(["task-1"]);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()))
      );
    });

    it("should fail when updating non-existent session", async () => {
      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.update("non-existent", {
          id: "non-existent",
          createdAt: "2024-01-01T00:00:00.000Z",
          status: "active",
          originalTask: "Test",
          completedTasks: [],
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemorySession.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should provide isolated state per layer() call", async () => {
      const program1 = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.create("Task from layer 1");
        const session = yield* sessionStore.create("Second task");
        return session.id;
      });

      const program2 = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        const session = yield* sessionStore.create("Task from layer 2");
        return session.id;
      });

      const id1 = await Effect.runPromise(
        program1.pipe(Effect.provide(MemorySession.layer()))
      );
      const id2 = await Effect.runPromise(
        program2.pipe(Effect.provide(MemorySession.layer()))
      );

      // Each layer should start counting from 1
      expect(id1).toBe("test-session-2");
      expect(id2).toBe("test-session-1");
    });
  });

  describe("MemoryPlan", () => {
    it("should create a plan with generated ID", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        const planId = yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Test task",
          tasks: [],
        });

        expect(planId).toBe("task-1");
        return planId;
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });

    it("should load a plan by ID", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        const planId = yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Test task",
          tasks: [
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
          ],
        });

        const plan = yield* planStore.load(planId, "session-1");

        expect(plan.id).toBe(planId);
        expect(plan.tasks).toHaveLength(1);
        expect(plan.tasks[0]?.title).toBe("Task 1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });

    it("should load a plan without sessionId (O(n) scan)", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        const planId = yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Test task",
          tasks: [],
        });

        const plan = yield* planStore.load(planId);

        expect(plan.id).toBe(planId);
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });

    it("should fail when loading non-existent plan", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.load(PlanId("non-existent"), "session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryPlan.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should update a plan", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        const planId = yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Test task",
          tasks: [],
        });

        const plan = yield* planStore.load(planId, "session-1");

        yield* planStore.update(planId, {
          ...plan,
          tasks: [
            {
              id: "1",
              title: "New Task",
              description: "Desc",
              status: "in_progress",
              phases: [],
              criteria: [],
              filesToModify: [],
              attempts: 0,
            },
          ],
        });

        const updated = yield* planStore.load(planId, "session-1");
        expect(updated.tasks).toHaveLength(1);
        expect(updated.tasks[0]?.title).toBe("New Task");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });

    it("should fail when updating plan for non-existent session", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.update(PlanId("plan-1"), {
          id: PlanId("plan-1"),
          sessionId: "non-existent",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Test",
          tasks: [],
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryPlan.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should list plans for a session", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;

        yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          originalTask: "Task 1",
          tasks: [],
        });

        yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01T01:00:00.000Z",
          originalTask: "Task 2",
          tasks: [],
        });

        const planIds = yield* planStore.list("session-1");
        expect(planIds).toHaveLength(2);
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });

    it("should return empty list for non-existent session", async () => {
      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        const planIds = yield* planStore.list("non-existent");
        expect(planIds).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryPlan.layer())));
    });
  });

  describe("MemoryProgress", () => {
    it("should append progress entries", async () => {
      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;

        yield* progressStore.append("session-1", {
          iteration: 1,
          timestamp: "2024-01-01T00:00:00.000Z",
          phase: "discovery",
          summary: "Started discovery",
        });

        yield* progressStore.append("session-1", {
          iteration: 2,
          timestamp: "2024-01-01T01:00:00.000Z",
          phase: "planning",
          summary: "Planning complete",
        });

        const progress = yield* progressStore.load("session-1");
        expect(progress.entries).toHaveLength(2);
        expect(progress.entries[0]?.summary).toBe("Started discovery");
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryProgress.layer()))
      );
    });

    it("should create progress file on first append", async () => {
      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;

        yield* progressStore.append("new-session", {
          iteration: 1,
          timestamp: "2024-01-01T00:00:00.000Z",
          phase: "discovery",
          summary: "First entry",
        });

        const progress = yield* progressStore.load("new-session");
        expect(progress.sessionId).toBe("new-session");
        expect(progress.entries).toHaveLength(1);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryProgress.layer()))
      );
    });

    it("should return empty progress file for non-existent session", async () => {
      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;
        const progress = yield* progressStore.load("non-existent");

        expect(progress.sessionId).toBe("non-existent");
        expect(progress.entries).toEqual([]);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryProgress.layer()))
      );
    });

    it("should get recent entries", async () => {
      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;

        for (let i = 1; i <= 10; i++) {
          yield* progressStore.append("session-1", {
            iteration: i,
            timestamp: `2024-01-01T0${i}:00:00.000Z`,
            phase: "execution",
            summary: `Entry ${i}`,
          });
        }

        const recent = yield* progressStore.getRecent("session-1", 3);
        expect(recent).toHaveLength(3);
        expect(recent[0]?.summary).toBe("Entry 8");
        expect(recent[2]?.summary).toBe("Entry 10");
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryProgress.layer()))
      );
    });

    it("should return empty array for getRecent on non-existent session", async () => {
      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;
        const recent = yield* progressStore.getRecent("non-existent", 5);
        expect(recent).toEqual([]);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryProgress.layer()))
      );
    });
  });

  describe("MemoryGuardrails", () => {
    it("should add guardrails", async () => {
      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;

        yield* guardrailsStore.add("session-1", {
          pattern: "Missing null check",
          sign: "TypeError at runtime",
          avoidance: "Always check for null",
          severity: "warning",
        });

        const guardrails = yield* guardrailsStore.load("session-1");
        expect(guardrails.guardrails).toHaveLength(1);
        expect(guardrails.guardrails[0]?.pattern).toBe("Missing null check");
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGuardrails.layer()))
      );
    });

    it("should create guardrails file on first add", async () => {
      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;

        yield* guardrailsStore.add("new-session", {
          pattern: "Test pattern",
          sign: "Test sign",
          avoidance: "Test avoidance",
          severity: "critical",
        });

        const guardrails = yield* guardrailsStore.load("new-session");
        expect(guardrails.sessionId).toBe("new-session");
        expect(guardrails.guardrails).toHaveLength(1);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGuardrails.layer()))
      );
    });

    it("should return empty guardrails file for non-existent session", async () => {
      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;
        const guardrails = yield* guardrailsStore.load("non-existent");

        expect(guardrails.sessionId).toBe("non-existent");
        expect(guardrails.guardrails).toEqual([]);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGuardrails.layer()))
      );
    });

    it("should get active guardrails", async () => {
      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;

        yield* guardrailsStore.add("session-1", {
          pattern: "Pattern 1",
          sign: "Sign 1",
          avoidance: "Avoidance 1",
          severity: "warning",
        });

        yield* guardrailsStore.add("session-1", {
          pattern: "Pattern 2",
          sign: "Sign 2",
          avoidance: "Avoidance 2",
          severity: "critical",
        });

        const active = yield* guardrailsStore.getActive("session-1");
        expect(active).toHaveLength(2);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGuardrails.layer()))
      );
    });

    it("should return empty array for getActive on non-existent session", async () => {
      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;
        const active = yield* guardrailsStore.getActive("non-existent");
        expect(active).toEqual([]);
      });

      await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGuardrails.layer()))
      );
    });
  });

  describe("MemoryGit", () => {
    it("should create a worktree", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        const path = yield* git.createWorktree("session-1");

        expect(path).toBe(".ferix/worktrees/session-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should return existing worktree path on duplicate create", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        const path1 = yield* git.createWorktree("session-1");
        const path2 = yield* git.createWorktree("session-1");

        expect(path1).toBe(path2);
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should get worktree path", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");
        const path = yield* git.getWorktreePath("session-1");

        expect(path).toBe(".ferix/worktrees/session-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should return undefined for non-existent worktree", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        const path = yield* git.getWorktreePath("non-existent");

        expect(path).toBeUndefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should remove a worktree", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");
        yield* git.removeWorktree("session-1");

        const path = yield* git.getWorktreePath("session-1");
        expect(path).toBeUndefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should commit changes with incremental hash", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");

        const hash1 = yield* git.commitChanges("session-1", "First commit");
        const hash2 = yield* git.commitChanges("session-1", "Second commit");

        expect(hash1).toBe("test-commit-1");
        expect(hash2).toBe("test-commit-2");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should fail commit when worktree does not exist", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.commitChanges("non-existent", "Commit");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGit.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should push branch (no-op in memory)", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");
        yield* git.pushBranch("session-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should fail push when worktree does not exist", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.pushBranch("non-existent");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGit.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should create a PR with slug-based URL", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");

        const prUrl = yield* git.createPR(
          "session-1",
          "Add Dark Mode Toggle",
          "This PR adds a dark mode toggle"
        );

        expect(prUrl).toContain("add-dark-mode-toggle");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should fail create PR when worktree does not exist", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createPR("non-existent", "Title", "Body");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGit.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should get current branch", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        const branch = yield* git.getCurrentBranch();

        expect(branch).toBe("main");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should rename branch", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");

        const newBranch = yield* git.renameBranch("session-1", "add-dark-mode");

        expect(newBranch).toBe("ferix/add-dark-mode");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });

    it("should fail rename branch when worktree does not exist", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.renameBranch("non-existent", "new-name");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(MemoryGit.layer()), Effect.either)
      );

      expect(result._tag).toBe("Left");
    });

    it("should get branch name for session", async () => {
      const program = Effect.gen(function* () {
        const git = yield* Git;
        const branchName = git.getBranchName("my-session");

        expect(branchName).toBe("ferix/my-session");
      });

      await Effect.runPromise(program.pipe(Effect.provide(MemoryGit.layer())));
    });
  });
});
