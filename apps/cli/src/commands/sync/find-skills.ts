import { api } from "@ferix/server/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Effect, Schema as S } from "effect";
import { ConvexError, SchemaValidationError } from "./errors.js";
import {
  getConvexUrl,
  type SkillRepo,
  SkillReposResponseSchema,
} from "./types.js";

/**
 * Finds skill repositories for the given GitHub organizations.
 * Queries the Convex directories table for matching owners.
 *
 * @param orgs - Array of GitHub organization/user names
 * @param dev - Use development Convex URL instead of production
 * @returns Effect that resolves to array of matching SkillRepo objects
 */
export const findSkillRepos = (
  orgs: readonly string[],
  dev?: boolean
): Effect.Effect<readonly SkillRepo[], ConvexError | SchemaValidationError> =>
  Effect.gen(function* () {
    // Step 1: Call Convex query
    const response = yield* Effect.tryPromise({
      try: async () => {
        const client = new ConvexHttpClient(getConvexUrl(dev));
        return await client.query(api.directories.getByOwners, {
          owners: [...orgs],
        });
      },
      catch: (error) =>
        new ConvexError({
          message: `Failed to find skill repositories: ${error instanceof Error ? error.message : String(error)}`,
          operation: "findSkills",
          cause: error,
        }),
    });

    // Step 2: Validate response with Effect Schema
    const validated = yield* S.decodeUnknown(SkillReposResponseSchema)(
      response
    ).pipe(
      Effect.mapError(
        (error) =>
          new SchemaValidationError({
            message: "Invalid response from directories.getByOwners",
            context: "findSkillRepos",
            cause: error,
          })
      )
    );

    return validated;
  });
