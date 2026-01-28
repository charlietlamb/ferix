import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import {
  GuardrailsStoreError,
  PlanStoreError,
  ProgressStoreError,
  SessionStoreError,
} from "../../src/commands/code/domain/errors.js";
import { PlanId } from "../../src/commands/code/domain/schemas/plan.js";
import { GuardrailsStore } from "../../src/commands/code/services/guardrails-store.js";
import { PlanStore } from "../../src/commands/code/services/plan-store.js";
import { ProgressStore } from "../../src/commands/code/services/progress-store.js";
import { SessionStore } from "../../src/commands/code/services/session-store.js";

/**
 * Creates a failing session store layer.
 */
function createFailingSessionStoreLayer(
  operation: "create" | "get" | "update",
  message: string
): Layer.Layer<SessionStore> {
  return Layer.succeed(SessionStore, {
    create: () =>
      operation === "create"
        ? Effect.fail(new SessionStoreError({ message, operation }))
        : Effect.succeed({
            id: "test",
            createdAt: "2024-01-01",
            status: "active",
            originalTask: "test",
            completedTasks: [],
          }),
    get: () =>
      operation === "get"
        ? Effect.fail(new SessionStoreError({ message, operation }))
        : Effect.succeed({
            id: "test",
            createdAt: "2024-01-01",
            status: "active",
            originalTask: "test",
            completedTasks: [],
          }),
    update: () =>
      operation === "update"
        ? Effect.fail(new SessionStoreError({ message, operation }))
        : Effect.succeed(undefined),
  });
}

/**
 * Creates a failing plan store layer.
 */
function createFailingPlanStoreLayer(
  operation: "create" | "load" | "update" | "list",
  message: string
): Layer.Layer<PlanStore> {
  return Layer.succeed(PlanStore, {
    create: () =>
      operation === "create"
        ? Effect.fail(new PlanStoreError({ message, operation }))
        : Effect.succeed(PlanId("test")),
    load: () =>
      operation === "load"
        ? Effect.fail(new PlanStoreError({ message, operation }))
        : Effect.succeed({
            id: PlanId("test"),
            sessionId: "test",
            createdAt: "2024-01-01",
            originalTask: "test",
            tasks: [],
          }),
    update: () =>
      operation === "update"
        ? Effect.fail(new PlanStoreError({ message, operation }))
        : Effect.succeed(undefined),
    list: () =>
      operation === "list"
        ? Effect.fail(new PlanStoreError({ message, operation }))
        : Effect.succeed([]),
  });
}

/**
 * Creates a failing progress store layer.
 */
function createFailingProgressStoreLayer(
  operation: "append" | "load" | "getRecent",
  message: string
): Layer.Layer<ProgressStore> {
  return Layer.succeed(ProgressStore, {
    append: () =>
      operation === "append"
        ? Effect.fail(new ProgressStoreError({ message, operation }))
        : Effect.succeed(undefined),
    load: () =>
      operation === "load"
        ? Effect.fail(new ProgressStoreError({ message, operation }))
        : Effect.succeed({
            sessionId: "test",
            createdAt: "2024-01-01",
            entries: [],
          }),
    getRecent: () =>
      operation === "getRecent"
        ? Effect.fail(new ProgressStoreError({ message, operation }))
        : Effect.succeed([]),
  });
}

/**
 * Creates a failing guardrails store layer.
 */
function createFailingGuardrailsStoreLayer(
  operation: "add" | "load" | "getActive",
  message: string
): Layer.Layer<GuardrailsStore> {
  return Layer.succeed(GuardrailsStore, {
    add: () =>
      operation === "add"
        ? Effect.fail(new GuardrailsStoreError({ message, operation }))
        : Effect.succeed(undefined),
    load: () =>
      operation === "load"
        ? Effect.fail(new GuardrailsStoreError({ message, operation }))
        : Effect.succeed({
            sessionId: "test",
            createdAt: "2024-01-01",
            guardrails: [],
          }),
    getActive: () =>
      operation === "getActive"
        ? Effect.fail(new GuardrailsStoreError({ message, operation }))
        : Effect.succeed([]),
  });
}

describe("Store Error Paths", () => {
  describe("SessionStoreError", () => {
    it("should create error with correct tag", () => {
      const error = new SessionStoreError({
        message: "Session not found",
        operation: "get",
      });

      expect(error._tag).toBe("SessionStoreError");
      expect(error.message).toBe("Session not found");
      expect(error.operation).toBe("get");
    });

    it("should fail on create operation", async () => {
      const layer = createFailingSessionStoreLayer(
        "create",
        "Failed to create session"
      );

      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.create("Test task");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionStoreError);
        expect((result.left as SessionStoreError).operation).toBe("create");
      }
    });

    it("should fail on get operation", async () => {
      const layer = createFailingSessionStoreLayer("get", "Session not found");

      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.get("non-existent");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as SessionStoreError).operation).toBe("get");
      }
    });

    it("should fail on update operation", async () => {
      const layer = createFailingSessionStoreLayer(
        "update",
        "Session locked for update"
      );

      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        yield* sessionStore.update("test", {
          id: "test",
          createdAt: "2024-01-01",
          status: "active",
          originalTask: "test",
          completedTasks: [],
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as SessionStoreError).operation).toBe("update");
      }
    });

    it("should preserve cause in error", () => {
      const cause = new Error("Disk full");
      const error = new SessionStoreError({
        message: "Failed to write session",
        operation: "create",
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe("PlanStoreError", () => {
    it("should create error with correct tag", () => {
      const error = new PlanStoreError({
        message: "Plan not found",
        operation: "load",
      });

      expect(error._tag).toBe("PlanStoreError");
      expect(error.message).toBe("Plan not found");
      expect(error.operation).toBe("load");
    });

    it("should fail on create operation", async () => {
      const layer = createFailingPlanStoreLayer(
        "create",
        "Failed to create plan"
      );

      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.create("session-1", {
          sessionId: "session-1",
          createdAt: "2024-01-01",
          originalTask: "test",
          tasks: [],
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as PlanStoreError).operation).toBe("create");
      }
    });

    it("should fail on load operation", async () => {
      const layer = createFailingPlanStoreLayer("load", "Plan not found");

      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.load(PlanId("non-existent"));
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as PlanStoreError).operation).toBe("load");
      }
    });

    it("should fail on update operation", async () => {
      const layer = createFailingPlanStoreLayer("update", "Plan is read-only");

      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.update(PlanId("test"), {
          id: PlanId("test"),
          sessionId: "test",
          createdAt: "2024-01-01",
          originalTask: "test",
          tasks: [],
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as PlanStoreError).operation).toBe("update");
      }
    });

    it("should fail on list operation", async () => {
      const layer = createFailingPlanStoreLayer("list", "Cannot list plans");

      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        yield* planStore.list("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as PlanStoreError).operation).toBe("list");
      }
    });
  });

  describe("ProgressStoreError", () => {
    it("should create error with correct tag", () => {
      const error = new ProgressStoreError({
        message: "Cannot append to progress",
        operation: "append",
      });

      expect(error._tag).toBe("ProgressStoreError");
      expect(error.operation).toBe("append");
    });

    it("should fail on append operation", async () => {
      const layer = createFailingProgressStoreLayer(
        "append",
        "Failed to append"
      );

      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;
        yield* progressStore.append("session-1", {
          iteration: 1,
          timestamp: "2024-01-01",
          phase: "discovery",
          summary: "Test",
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as ProgressStoreError).operation).toBe("append");
      }
    });

    it("should fail on load operation", async () => {
      const layer = createFailingProgressStoreLayer("load", "Cannot load");

      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;
        yield* progressStore.load("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as ProgressStoreError).operation).toBe("load");
      }
    });

    it("should fail on getRecent operation", async () => {
      const layer = createFailingProgressStoreLayer(
        "getRecent",
        "Cannot get recent"
      );

      const program = Effect.gen(function* () {
        const progressStore = yield* ProgressStore;
        yield* progressStore.getRecent("session-1", 5);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as ProgressStoreError).operation).toBe("getRecent");
      }
    });
  });

  describe("GuardrailsStoreError", () => {
    it("should create error with correct tag", () => {
      const error = new GuardrailsStoreError({
        message: "Cannot add guardrail",
        operation: "add",
      });

      expect(error._tag).toBe("GuardrailsStoreError");
      expect(error.operation).toBe("add");
    });

    it("should fail on add operation", async () => {
      const layer = createFailingGuardrailsStoreLayer("add", "Failed to add");

      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;
        yield* guardrailsStore.add("session-1", {
          pattern: "test",
          sign: "test",
          avoidance: "test",
          severity: "warning",
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GuardrailsStoreError).operation).toBe("add");
      }
    });

    it("should fail on load operation", async () => {
      const layer = createFailingGuardrailsStoreLayer("load", "Cannot load");

      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;
        yield* guardrailsStore.load("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GuardrailsStoreError).operation).toBe("load");
      }
    });

    it("should fail on getActive operation", async () => {
      const layer = createFailingGuardrailsStoreLayer(
        "getActive",
        "Cannot get active"
      );

      const program = Effect.gen(function* () {
        const guardrailsStore = yield* GuardrailsStore;
        yield* guardrailsStore.getActive("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GuardrailsStoreError).operation).toBe(
          "getActive"
        );
      }
    });
  });

  describe("Error recovery patterns", () => {
    it("should recover from SessionStoreError with default", async () => {
      const layer = createFailingSessionStoreLayer("get", "Session not found");

      const program = Effect.gen(function* () {
        const sessionStore = yield* SessionStore;
        return yield* sessionStore.get("test");
      }).pipe(
        Effect.catchTag("SessionStoreError", () =>
          Effect.succeed({
            id: "default",
            createdAt: "2024-01-01",
            status: "active" as const,
            originalTask: "default",
            completedTasks: [],
          })
        )
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result.id).toBe("default");
    });

    it("should map specific store errors to domain errors", async () => {
      const layer = createFailingPlanStoreLayer("load", "Plan not found");

      const program = Effect.gen(function* () {
        const planStore = yield* PlanStore;
        return yield* planStore.load(PlanId("test"));
      }).pipe(
        Effect.mapError((error) => ({
          type: "DomainError",
          original: error,
          userMessage: `Could not load plan: ${error.message}`,
        }))
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.type).toBe("DomainError");
        expect(result.left.userMessage).toContain("Could not load plan");
      }
    });
  });
});
