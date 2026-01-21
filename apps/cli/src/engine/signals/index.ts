/**
 * Signal parsing and detection exports
 */

export { mightContainFerixTagStart } from "./detector.js";
export type { CriterionResult } from "./parser.js";
export {
  extractCriterionSignals,
  extractError,
  extractPhases,
  extractReviewFailed,
  extractReviewPassed,
  extractTasks,
  stripSignalTags,
} from "./parser.js";
