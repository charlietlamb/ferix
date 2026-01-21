/**
 * @fileoverview Plan module - core exports for plan file operations.
 *
 * Only exports functions that are actively used by the planner/worker loop.
 * Additional utility functions exist in utils.ts for programmatic plan
 * manipulation (useful for testing or future features).
 */

// Parser
export { parsePlanFile } from "./parser.js";
// Re-export types
export type { ArchiveResult, PlanValidationError } from "./utils.js";
// Core utilities (actively used)
export {
  archivePlan,
  getNextTask,
  getPlanPath,
  isPlanValid,
  loadPlan,
  loadPlanIfExists,
  validatePlan,
} from "./utils.js";

// Writer
export { writePlanFile } from "./writer.js";
