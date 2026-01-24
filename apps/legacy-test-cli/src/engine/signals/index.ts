/**
 * Signal parsing and detection exports
 */

export { mightContainFerixTagStart } from "./detector.js";
export type { CriterionResult } from "./parser.js";
export {
  extractCheckFailed,
  extractCheckPassed,
  extractCriteriaBlock,
  extractCriterionSignals,
  extractError,
  extractPhases,
  extractReviewChangesMade,
  extractReviewComplete,
  extractReviewFailed,
  extractReviewPassed,
  extractTasks,
  stripSignalTags,
} from "./parser.js";
