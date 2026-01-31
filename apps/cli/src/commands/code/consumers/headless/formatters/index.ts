// Import formatters to register them
import "./check-review.js";
import "./criteria.js";
import "./iteration.js";
import "./llm.js";
import "./loop.js";
import "./phases.js";
import "./plan.js";
import "./tasks.js";
import "./worktree.js";
// Re-export registry and types

// Re-export convenience function
import type { DomainEvent } from "../../../domain/index.js";
import { headlessFormatterRegistry } from "./registry.js";

/**
 * Formats a domain event for console output.
 */
export function formatEvent(event: DomainEvent): string | null {
  return headlessFormatterRegistry.format(event);
}
