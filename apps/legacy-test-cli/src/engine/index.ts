/**
 * Engine module exports
 */

import type { Engine, EngineName } from "../types/engine.js";
import { executeWithClaude, isClaudeAvailable } from "./claude.js";

// Re-export Engine type for consumers
export type { Engine, EngineName } from "../types/engine.js";

/**
 * Claude Code engine implementation
 */
const claudeEngine: Engine = {
  name: "claude",
  isAvailable: isClaudeAvailable,
  execute: executeWithClaude,
};

/**
 * Get engine by name
 */
export function getEngine(name: EngineName): Engine {
  switch (name) {
    case "claude":
      return claudeEngine;
    default:
      throw new Error(`Unknown engine: ${name}`);
  }
}

// Re-export types used by consumers
export type { ClaudeEvent } from "../types/events.js";
