import { existsSync, readFileSync } from "node:fs";
import { getSessionOutputPath } from "../../../daemon/server.js";

/**
 * Load historical output lines from a session's output.log file.
 * Returns empty array if file doesn't exist or can't be read.
 */
export function loadSessionHistory(sessionId: string): string[] {
  const outputPath = getSessionOutputPath(sessionId);
  if (!existsSync(outputPath)) {
    return [];
  }
  try {
    const content = readFileSync(outputPath, "utf-8");
    if (!content) {
      return [];
    }
    const lines = content.split("\n");
    // Remove trailing empty string from final newline
    if (lines.length > 0 && lines.at(-1) === "") {
      lines.pop();
    }
    return lines;
  } catch {
    return [];
  }
}
