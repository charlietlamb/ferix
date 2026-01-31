import { Effect } from "effect";
import pc from "picocolors";
import { FileSystemCredentials } from "../layers/index.js";
import { CredentialsStore } from "../services/index.js";

/**
 * Execute the logout flow.
 */
export async function logoutAction(): Promise<void> {
  const program = Effect.gen(function* () {
    const store = yield* CredentialsStore;

    // Check if logged in
    const status = yield* store.getStatus();
    if (status.status === "unauthenticated") {
      console.log(pc.yellow("Not currently logged in."));
      return;
    }

    // Clear credentials
    yield* store.clear();
    console.log(pc.green("Successfully logged out."));
  });

  const result = await Effect.runPromiseExit(
    program.pipe(Effect.provide(FileSystemCredentials.Live))
  );

  if (result._tag === "Failure") {
    console.error(pc.red("Logout failed"));
    const cause = result.cause;
    if (cause._tag === "Fail") {
      console.error(pc.red(String(cause.error)));
    }
    process.exit(1);
  }
}
