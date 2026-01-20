import type { ExecuteResult } from "../types.js";
import {
  type ClaudeOptions,
  executeWithClaude,
  isClaudeAvailable,
} from "./claude.js";

export type EngineName = "claude";

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

/**
 * Get all available engines
 */
export async function getAvailableEngines(): Promise<EngineName[]> {
  const engines: EngineName[] = [];

  if (await claudeEngine.isAvailable()) {
    engines.push("claude");
  }

  return engines;
}

export {
  type ClaudeEvent,
  type ClaudeEventHandler,
  type ClaudeOptions,
  executeWithClaude,
  isClaudeAvailable,
} from "./claude.js";
