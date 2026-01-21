/**
 * Engine types for Ferix CLI
 */

import type { ExecuteResult } from "./config.js";
import type { ClaudeOptions } from "./events.js";

/**
 * Supported engine names
 */
export type EngineName = "claude";

/**
 * Engine interface for AI execution backends
 */
export interface Engine {
  name: EngineName;
  isAvailable(): Promise<boolean>;
  execute(prompt: string, options?: ClaudeOptions): Promise<ExecuteResult>;
}
