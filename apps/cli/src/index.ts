import { Command } from "commander";
import { Effect } from "effect";
import packageJson from "../package.json" with { type: "json" };
import { registerAuthCommand } from "./commands/auth/index.js";
import { startDaemon } from "./commands/code/daemon/index.js";
import { registerCodeCommand } from "./commands/code/index.js";
import { registerDaemonCommand } from "./commands/daemon/index.js";
import { registerSyncCommand } from "./commands/sync/index.js";

// Handle internal daemon start command (used by auto-start)
// This is a hidden command that runs the daemon directly in this process
if (process.argv[2] === "__daemon") {
  Effect.runPromise(startDaemon()).catch((error) => {
    console.error("Daemon failed:", error);
    process.exit(1);
  });
} else {
  const program = new Command();

  program
    .name("ferix-code")
    .description("Composable RALPH loops for AI coding agents")
    .version(packageJson.version, "-v, --version", "Output the version number")
    .option("--dev", "Use local development server");

  registerAuthCommand(program);
  registerCodeCommand(program);
  registerDaemonCommand(program);
  registerSyncCommand(program);

  program.parse();
}
