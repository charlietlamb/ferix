import { Effect, Option } from "effect";
import pc from "picocolors";
import { FileSystemCredentials } from "../layers/index.js";
import { CredentialsStore } from "../services/index.js";

/**
 * Display the current authentication status.
 */
export async function statusAction(): Promise<void> {
  const program = Effect.gen(function* () {
    const store = yield* CredentialsStore;
    const status = yield* store.getStatus();

    console.log();
    console.log(pc.bold("Authentication Status"));
    console.log();

    switch (status.status) {
      case "authenticated": {
        console.log(pc.green("Logged in"));
        console.log();

        const email = Option.getOrElse(
          status.credentials.email,
          () => "Not available"
        );
        const name = Option.getOrElse(
          status.credentials.name,
          () => "Not available"
        );
        const expiresAt = Option.getOrUndefined(status.credentials.expiresAt);

        console.log(`  Email: ${pc.cyan(email)}`);
        console.log(`  Name:  ${pc.cyan(name)}`);

        if (expiresAt) {
          const expiresDate = new Date(expiresAt);
          const now = Date.now();
          const remainingMs = expiresAt - now;
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMinutes = Math.floor(
            (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (remainingMs > 0) {
            console.log(
              `  Token: Expires in ${remainingHours}h ${remainingMinutes}m`
            );
          } else {
            console.log(`  Token: ${pc.yellow("Expired")}`);
          }
          console.log(`         (${expiresDate.toLocaleString()})`);
        } else {
          console.log(`  Token: ${pc.dim("No expiration")}`);
        }
        break;
      }

      case "expired":
        console.log(pc.yellow("Session expired"));
        console.log();
        console.log("  Your session has expired. Please log in again.");
        console.log(`  Run: ${pc.cyan("ferix auth login")}`);
        break;

      case "unauthenticated":
        console.log(pc.dim("Not logged in"));
        console.log();
        console.log("  To authenticate, run:");
        console.log(`  ${pc.cyan("ferix auth login")}`);
        break;

      default: {
        const _exhaustiveCheck: never = status;
        console.error("Unknown status:", _exhaustiveCheck);
      }
    }

    console.log();
  });

  const result = await Effect.runPromiseExit(
    program.pipe(Effect.provide(FileSystemCredentials.Live))
  );

  if (result._tag === "Failure") {
    console.error(pc.red("Failed to get auth status"));
    const cause = result.cause;
    if (cause._tag === "Fail") {
      console.error(pc.red(String(cause.error)));
    }
    process.exit(1);
  }
}
