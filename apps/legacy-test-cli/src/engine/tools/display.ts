/**
 * Tool display utilities for formatting tool use information
 */

import { UI } from "../../constants.js";

/**
 * Get tool detail string from input
 */
export function getToolDetail(
  tool: string,
  input: Record<string, unknown>
): string {
  switch (tool) {
    case "Read":
    case "Edit":
    case "Write":
      return (
        (input.file_path as string) || (input.filePath as string) || "file"
      );
    case "Bash": {
      const cmd = (input.command as string) || "command";
      const maxLen = UI.COMMAND_DISPLAY_MAX_LENGTH;
      return cmd.length > maxLen ? `${cmd.substring(0, maxLen)}...` : cmd;
    }
    case "Glob":
    case "Grep":
      return (input.pattern as string) || "pattern";
    case "Task":
      return (input.description as string) || "subagent";
    case "WebFetch":
      return (input.url as string) || "url";
    case "WebSearch":
      return (input.query as string) || "search";
    default:
      return "";
  }
}
