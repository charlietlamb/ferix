import { Effect } from "effect";
import pc from "picocolors";
import { printError, printSuccess } from "../../../shared/ui.js";
import { deleteCredentials, readCredentials } from "../config.js";

/**
 * Run the logout action.
 */
export const runLogout = async (): Promise<void> => {
  const result = await Effect.runPromise(logoutEffect().pipe(Effect.either));

  if (result._tag === "Left") {
    printError(String(result.left));
    process.exit(1);
  }
};

const logoutEffect = () =>
  Effect.gen(function* () {
    const credentials = yield* readCredentials().pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    if (!credentials) {
      console.log();
      console.log(pc.dim("  You are not logged in."));
      console.log();
      return;
    }

    yield* deleteCredentials();

    console.log();
    printSuccess(`Logged out from ${pc.bold(credentials.email)}`);
    console.log();
  });
