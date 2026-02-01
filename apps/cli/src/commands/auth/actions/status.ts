import { Effect } from "effect";
import pc from "picocolors";
import { printError } from "../../../shared/ui.js";
import { getCredentialsPath, readCredentials } from "../config.js";

/**
 * Run the status action.
 */
export const runStatus = async (): Promise<void> => {
  const result = await Effect.runPromise(statusEffect().pipe(Effect.either));

  if (result._tag === "Left") {
    printError(String(result.left));
    process.exit(1);
  }
};

const statusEffect = () =>
  Effect.gen(function* () {
    const credentials = yield* readCredentials().pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    console.log();
    console.log(pc.bold(pc.cyan("  Ferix CLI Authentication Status")));
    console.log();

    if (!credentials) {
      console.log(pc.dim("  Status: ") + pc.yellow("Not logged in"));
      console.log();
      console.log(pc.dim("  Run 'ferix auth login' to authenticate"));
      console.log();
      return;
    }

    const isExpired =
      credentials.expiresAt && credentials.expiresAt < Date.now();

    console.log(
      pc.dim("  Status: ") +
        (isExpired ? pc.yellow("Token expired") : pc.green("Authenticated"))
    );
    console.log(pc.dim("  Email:  ") + pc.white(credentials.email));
    console.log(pc.dim("  User ID:") + pc.white(` ${credentials.userId}`));

    if (credentials.expiresAt) {
      const expiresDate = new Date(credentials.expiresAt);
      const expiresStr = expiresDate.toLocaleString();
      console.log(
        pc.dim("  Expires:") +
          (isExpired ? pc.red(` ${expiresStr}`) : pc.white(` ${expiresStr}`))
      );
    }

    console.log();
    console.log(pc.dim(`  Credentials: ${getCredentialsPath()}`));
    console.log();

    if (isExpired) {
      console.log(
        pc.yellow("  Your token has expired. Run 'ferix auth login' to refresh")
      );
      console.log();
    }
  });
