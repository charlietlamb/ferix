import { createApi } from "@convex-dev/better-auth";
import { createAuthOptionsMinimal } from "../authmin";
import schema from "./schema";

/**
 * Adapter functions for the Better Auth component.
 *
 * Uses `createAuthOptionsMinimal` instead of the full `createAuthOptions` because
 * `createApi` calls the options function at module load time to introspect the schema.
 * At that point, environment variables are not available in Convex.
 *
 * @see ../authOptionsMinimal.ts for details on why this separation is necessary.
 */
export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptionsMinimal);
