import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { PlanStoreError } from "../../domain/errors.js";
import { decodePlanData, type Plan, PlanId } from "../../domain/index.js";
import { PlanStore, type PlanStoreService } from "../../services/plan-store.js";

/**
 * Base directory for plan storage.
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, PlanStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new PlanStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "create",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session's plans.
 */
function getSessionDir(sessionId: string): string {
  return join(process.cwd(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for a plan.
 */
function getPlanPath(sessionId: string, planId: PlanId): string {
  return join(getSessionDir(sessionId), `${planId}.json`);
}

/**
 * Generates a plan ID from a plan's task number.
 */
function generatePlanId(taskNumber: number): PlanId {
  return PlanId(`task-${taskNumber}`);
}

/**
 * Serializes a plan to JSON string.
 */
function serializePlan(plan: Plan): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Deserializes and validates a plan from JSON string.
 * Uses Effect Schema for runtime validation.
 */
function deserializePlan(
  json: string,
  planId: PlanId
): Effect.Effect<Plan, PlanStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new PlanStoreError({
          message: `Invalid JSON in plan file: ${String(error)}`,
          operation: "load",
          cause: error,
        }),
    });

    const validated = yield* decodePlanData(parsed).pipe(
      Effect.mapError(
        (error) =>
          new PlanStoreError({
            message: `Plan validation failed: ${String(error)}`,
            operation: "load",
            cause: error,
          })
      )
    );

    return {
      ...validated,
      id: planId,
    } as Plan;
  });
}

/**
 * File system plan store service implementation.
 *
 * Stores plans as JSON files in `.ferix/plans/:sessionId/`.
 */
const make: PlanStoreService = {
  create: (
    sessionId: string,
    plan: Omit<Plan, "id">
  ): Effect.Effect<PlanId, PlanStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      const existingPlans = yield* Effect.tryPromise({
        try: async () => {
          try {
            const files = await readdir(sessionDir);
            return files.filter((f) => f.endsWith(".json")).length;
          } catch {
            return 0;
          }
        },
        catch: () =>
          new PlanStoreError({
            message: "Failed to read plans directory",
            operation: "create",
          }),
      });

      const planId = generatePlanId(existingPlans + 1);
      const planPath = getPlanPath(sessionId, planId);
      const fullPlan: Plan = { ...plan, id: planId };

      yield* Effect.tryPromise({
        try: () => writeFile(planPath, serializePlan(fullPlan), "utf-8"),
        catch: (error) =>
          new PlanStoreError({
            message: `Failed to write plan file: ${planPath}`,
            operation: "create",
            cause: error,
          }),
      });

      return planId;
    }),

  load: (
    planId: PlanId,
    sessionId?: string
  ): Effect.Effect<Plan, PlanStoreError> =>
    Effect.gen(function* () {
      // O(1) lookup if sessionId is provided
      if (sessionId) {
        const planPath = getPlanPath(sessionId, planId);
        const content = yield* Effect.tryPromise({
          try: () => readFile(planPath, "utf-8"),
          catch: (error) =>
            new PlanStoreError({
              message: `Failed to read plan file: ${planPath}`,
              operation: "load",
              cause: error,
            }),
        });
        return yield* deserializePlan(content, planId);
      }

      // Fallback to O(n) scan if sessionId not provided
      const sessionDirs = yield* Effect.tryPromise({
        try: async () => {
          const plansDir = join(process.cwd(), PLANS_DIR);
          const dirs = await readdir(plansDir);
          return dirs;
        },
        catch: (error) =>
          new PlanStoreError({
            message: "Failed to read plans directory",
            operation: "load",
            cause: error,
          }),
      });

      for (const sid of sessionDirs) {
        const planPath = getPlanPath(sid, planId);
        const exists = yield* Effect.tryPromise({
          try: async () => {
            await access(planPath);
            return true;
          },
          catch: () =>
            new PlanStoreError({
              message: "File not found",
              operation: "load",
            }),
        }).pipe(Effect.orElseSucceed(() => false));

        if (exists) {
          const content = yield* Effect.tryPromise({
            try: () => readFile(planPath, "utf-8"),
            catch: (error) =>
              new PlanStoreError({
                message: `Failed to read plan file: ${planPath}`,
                operation: "load",
                cause: error,
              }),
          });

          return yield* deserializePlan(content, planId);
        }
      }

      return yield* Effect.fail(
        new PlanStoreError({
          message: `Plan not found: ${planId}`,
          operation: "load",
        })
      );
    }),

  update: (planId: PlanId, plan: Plan): Effect.Effect<void, PlanStoreError> =>
    Effect.gen(function* () {
      const planPath = getPlanPath(plan.sessionId, planId);

      yield* Effect.tryPromise({
        try: () => writeFile(planPath, serializePlan(plan), "utf-8"),
        catch: (error) =>
          new PlanStoreError({
            message: `Failed to update plan file: ${planPath}`,
            operation: "update",
            cause: error,
          }),
      });
    }),

  list: (sessionId: string): Effect.Effect<readonly PlanId[], PlanStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);

      const files = yield* Effect.tryPromise({
        try: async () => {
          try {
            return await readdir(sessionDir);
          } catch {
            return [];
          }
        },
        catch: (error) =>
          new PlanStoreError({
            message: `Failed to list plans for session: ${sessionId}`,
            operation: "list",
            cause: error,
          }),
      });

      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => PlanId(f.replace(".json", "")));
    }),
};

/**
 * Live Layer for the file system plan store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const planStore = yield* PlanStore;
 *   const planId = yield* planStore.create(sessionId, plan);
 *   return planId;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemPlan.Live)));
 * ```
 */
const Live = Layer.succeed(PlanStore, make);

/**
 * FileSystemPlan namespace containing the Live layer.
 */
export const FileSystemPlan = {
  Live,
} as const;
