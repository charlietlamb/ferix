/**
 * Claude CLI stream-json parser.
 *
 * Re-exports the shared stream-json parser functions.
 * Claude and Cursor use the same stream-json format.
 */
export {
  extractText,
  extractToolInfo,
  isTextContent,
  isToolInputDelta,
  isToolUse,
  parseJsonLine,
  safeParseJson,
  unwrapStreamEvent,
} from "./stream-json.js";
