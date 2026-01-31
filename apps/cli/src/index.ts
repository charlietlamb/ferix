import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" };
import { registerCodeCommand } from "./commands/code/index.js";
import { registerSyncCommand } from "./commands/sync/index.js";

const program = new Command();

program
  .name("ferix-code")
  .description("Composable RALPH loops for AI coding agents")
  .version(packageJson.version, "-v, --version", "Output the version number");

registerCodeCommand(program);
registerSyncCommand(program);

program.parse();
