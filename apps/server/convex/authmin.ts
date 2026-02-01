import type { BetterAuthOptions } from "better-auth";
import { admin, deviceAuthorization, username } from "better-auth/plugins";

/**
 * Minimal auth options containing only plugin configuration.
 *
 * This exists because `createApi()` in the adapter calls the options function
 * at **module load time** (not runtime) to introspect the schema via `getAuthTables()`.
 * This happens during Convex's module analysis phase when environment variables
 * are not yet available.
 *
 * The full `createAuthOptions` in `auth.ts` cannot be used here because it
 * accesses `env.FRONTEND_URL`, `env.GITHUB_CLIENT_ID`, etc. which would fail
 * during module analysis.
 *
 * `getAuthTables()` only needs the plugins to determine schema constraints
 * (like unique fields) - it doesn't need `baseURL`, `socialProviders`, `database`, etc.
 *
 * @important This file must NOT import anything that accesses environment variables,
 * even lazily, as the function body is executed during module initialization.
 *
 * @important Keep the plugins here in sync with `createAuthOptions` in `auth.ts`.
 */
export const createAuthOptionsMinimal = (): BetterAuthOptions => {
  return {
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
      }),
      admin(),
      deviceAuthorization({
        verificationUri: "/device",
        expiresIn: "30m",
        interval: "5s",
        validateClient: (clientId) => clientId === "ferix-cli",
      }),
    ],
  };
};
