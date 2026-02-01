import { spawn } from "node:child_process";
import type { Command } from "commander";
import { Effect } from "effect";
import {
  createDaemonClient,
  getDaemonPid,
  getSocketPath,
  isDaemonRunning,
  startDaemon,
  stopDaemon,
} from "../code/daemon/index.js";

/**
 * Register the daemon command.
 */
export const registerDaemonCommand = (program: Command): void => {
  const daemon = program
    .command("daemon")
    .description("Manage the ferix daemon process");

  daemon
    .command("start")
    .description("Start the daemon in the background")
    .option("-f, --foreground", "Run in foreground (for debugging)")
    .action(async (options) => {
      if (isDaemonRunning()) {
        const pid = getDaemonPid();
        console.log(`Daemon is already running (PID: ${pid})`);
        console.log(`Socket: ${getSocketPath()}`);
        return;
      }

      if (options.foreground) {
        console.log("Starting daemon in foreground...");
        await Effect.runPromise(startDaemon());
      } else {
        // Spawn the CLI with the hidden __daemon command
        const cliPath = process.argv[1];
        if (!cliPath) {
          console.error("Failed to determine CLI path");
          process.exit(1);
        }

        const child = spawn(process.execPath, [cliPath, "__daemon"], {
          detached: true,
          stdio: "ignore",
        });

        child.unref();

        // Wait a moment for daemon to start
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isDaemonRunning()) {
          const pid = getDaemonPid();
          console.log(`Daemon started (PID: ${pid})`);
          console.log(`Socket: ${getSocketPath()}`);
        } else {
          console.error("Failed to start daemon");
          process.exit(1);
        }
      }
    });

  daemon
    .command("stop")
    .description("Stop the daemon")
    .action(async () => {
      if (!isDaemonRunning()) {
        console.log("Daemon is not running");
        return;
      }

      const pid = getDaemonPid();

      // Try graceful shutdown via socket first
      try {
        const client = createDaemonClient();
        await Effect.runPromise(client.connect());
        await Effect.runPromise(client.shutdown());
        console.log(`Daemon stopped (PID: ${pid})`);
      } catch {
        // Fall back to SIGTERM
        if (stopDaemon()) {
          console.log(`Daemon stopped (PID: ${pid})`);
        } else {
          console.error("Failed to stop daemon");
          process.exit(1);
        }
      }
    });

  daemon
    .command("status")
    .description("Show daemon status and running sessions")
    .action(async () => {
      if (!isDaemonRunning()) {
        console.log("Daemon is not running");
        console.log("\nStart daemon with: ferix daemon start");
        return;
      }

      const pid = getDaemonPid();
      console.log(`Daemon running (PID: ${pid})`);
      console.log(`Socket: ${getSocketPath()}`);
      console.log("");

      try {
        const client = createDaemonClient();
        await Effect.runPromise(client.connect());
        const sessions = await Effect.runPromise(client.listSessions());
        await Effect.runPromise(client.disconnect());

        if (sessions.length === 0) {
          console.log("No active sessions");
        } else {
          console.log("Active sessions:");
          console.log("");

          for (const session of sessions) {
            const status = session.status.toUpperCase();
            const started = new Date(session.startedAt).toLocaleTimeString();
            const completed = session.completedAt
              ? new Date(session.completedAt).toLocaleTimeString()
              : "-";

            console.log(`  ${session.sessionId}`);
            console.log(`    Task: ${session.task.slice(0, 60)}...`);
            console.log(`    Status: ${status}`);
            console.log(`    Started: ${started}`);
            if (session.completedAt) {
              console.log(`    Completed: ${completed}`);
            }
            console.log("");
          }
        }
      } catch (error) {
        console.error(
          "Failed to get sessions:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    });

  daemon
    .command("logs")
    .description("Tail daemon logs (not implemented)")
    .action(() => {
      console.log(
        "Daemon logs are written to the session logs in .ferix/logs/"
      );
      console.log("Use: tail -f ~/.ferix/logs/<session-id>.log");
    });
};
