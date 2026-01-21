/**
 * Engine module exports
 */

import type { ExecuteResult } from "../types/config.js";
import type { ClaudeOptions } from "../types/events.js";
import { executeWithClaude, isClaudeAvailable } from "./claude.js";

type EngineName = "claude";

export interface Engine {
  name: EngineName;
  isAvailable(): Promise<boolean>;
  execute(prompt: string, options?: ClaudeOptions): Promise<ExecuteResult>;
}

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
