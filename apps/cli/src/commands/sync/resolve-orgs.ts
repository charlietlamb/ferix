import { api } from "@ferix/server/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Effect, Schema as S } from "effect";
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
): Effect.Effect<readonly PackageOrg[], ConvexError | SchemaValidationError> =>
  Effect.gen(function* () {
    // Step 1: Call Convex action
    const response = yield* Effect.tryPromise({
      try: async () => {
        const client = new ConvexHttpClient(getConvexUrl(dev));
        return await client.action(api.packageOrg.resolve, {
          packageNames: [...packageNames],
        });
      },
      catch: (error) =>
        new ConvexError({
          message: `Failed to resolve package organizations: ${error instanceof Error ? error.message : String(error)}`,
          operation: "resolveOrgs",
          cause: error,
        }),
    });

    // Step 2: Validate response with Effect Schema
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

    return validated;
  });
