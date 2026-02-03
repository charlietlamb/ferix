import { exec } from "node:child_process";
import { platform } from "node:os";

/**
 * Open a URL in the user's default browser.
 * Uses platform-specific commands.
 */
export function openUrl(url: string): void {
  const os = platform();
  let command: string;

  switch (os) {
    case "darwin":
      command = `open "${url}"`;
      break;
    case "win32":
      command = `start "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
      break;
  }

  exec(command, (error) => {
    if (error) {
      // Silently fail - the TUI will show toast if needed
      console.error(`Failed to open URL: ${error.message}`);
    }
  });
}
