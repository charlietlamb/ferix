import { api } from "@ferix/server/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Effect, Schema as S } from "effect";
import pc from "picocolors";
import { printHint } from "../../shared/ui.js";
import { ConvexError, SchemaValidationError } from "./errors.js";
import {
  getConvexUrl,
  type PackageOrg,
  PackageOrgsResponseSchema,
} from "./types.js";

/**
 * Resolves npm package names to their GitHub organizations.
 * Uses the Convex backend to check cache and query npm registry for misses.
 *
 * @param packageNames - Array of npm package names to resolve
 * @param dev - Use development Convex URL instead of production
 * @returns Effect that resolves to array of PackageOrg with githubOrg (or null if not found)
 */
export const resolvePackageOrgs = (
  packageNames: readonly string[],
  dev?: boolean
): Effect.Effect<readonly PackageOrg[]> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: async () => {
        const client = new ConvexHttpClient(getConvexUrl(dev));
        return await client.action(api.packageOrg.resolve, {
          packageNames,
        });
      },
      catch: (error) =>
        new ConvexError({
          message: `Failed to resolve package organizations: ${error instanceof Error ? error.message : String(error)}`,
          operation: "resolveOrgs",
          cause: error,
        }),
    });

    const validated = yield* S.decodeUnknown(PackageOrgsResponseSchema)(
      response
    ).pipe(
      Effect.mapError(
        (error) =>
          new SchemaValidationError({
            message: "Invalid response from packageOrg.resolve",
            context: "resolvePackageOrgs",
            cause: error,
          })
      )
    );

    for (const entry of validated) {
      if (entry.githubOrg === null) {
        printHint(`Skill could not be found: ${pc.cyan(entry.packageName)}`);
      }
    }

    return validated;
  }).pipe(
    Effect.catchAll((error) => {
      printHint(`Failed to resolve some packages: ${error.message}`);
      return Effect.succeed([] as readonly PackageOrg[]);
    })
  );
