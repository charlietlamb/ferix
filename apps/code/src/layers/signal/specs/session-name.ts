import { Either } from "effect";
import {
  type SessionNameDefinedSignal,
  SessionNameDefinedSignalSchema,
} from "../../../domain/index.js";
import { createSessionNameDefinedSignal } from "../../../domain/schemas/signal-factories.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

/**
 * Regex to match session name signals.
 * Format: <ferix:session-name>kebab-case-name</ferix:session-name>
 */
const SESSION_NAME = /<ferix:session-name>([\s\S]*?)<\/ferix:session-name>/g;

/**
 * Sanitize a session name to kebab-case format.
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes any non-alphanumeric characters except hyphens
 * - Collapses multiple hyphens into one
 * - Trims leading/trailing hyphens
 */
function sanitizeSessionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric except hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

const sessionNameSpec: SignalSpec<SessionNameDefinedSignal> = {
  tag: "SessionNameDefined",
  closingTag: "</ferix:session-name>",
  schema: SessionNameDefinedSignalSchema,
  parse: (text) => {
    const signals: SessionNameDefinedSignal[] = [];
    const matches = text.matchAll(SESSION_NAME);

    for (const match of matches) {
      const rawName = match[1] || "";
      const name = sanitizeSessionName(rawName);

      if (!name) {
        continue;
      }

      const result = createSessionNameDefinedSignal({ name });
      if (Either.isRight(result)) {
        signals.push(result.right);
      }
    }

    return signals;
  },
  keyFields: (s) => s.name,
};

signalSpecRegistry.register(sessionNameSpec);
