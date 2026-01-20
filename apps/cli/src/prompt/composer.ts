import type { FerixConfig, PromptFragment } from "../types.js";
import {
  createErrorFragment,
  createGitFragment,
  createLoopFragment,
  createProgressFragment,
  createTaskFragment,
  createValidationFragment,
  createVerifyFragment,
} from "./fragments.js";

/**
 * Compose a complete prompt from configuration
 */
export function composePrompt(config: FerixConfig): string {
  const fragments: PromptFragment[] = [];

  // 1. Task (always present)
  fragments.push(createTaskFragment(config.task));

  // 2. Task validation (always present - tells LLM to reject bad tasks)
  fragments.push(createValidationFragment());

  // 3. Verification (if commands provided)
  const verifyFragment = createVerifyFragment(config.verify);
  if (verifyFragment) {
    fragments.push(verifyFragment);
  }

  // 4. Git (if branch specified)
  const gitFragment = createGitFragment(config.branch);
  if (gitFragment) {
    fragments.push(gitFragment);
  }

  // 5. Progress tracking (if enabled)
  if (config.progress) {
    fragments.push(createProgressFragment(config.progress));
  }

  // 6. Loop execution (if multiple iterations)
  if (config.iterations > 1 || config.untilComplete) {
    fragments.push(
      createLoopFragment(config.untilComplete ? "unlimited" : config.iterations)
    );
  }

  // 7. Error handling (always present)
  fragments.push(createErrorFragment());

  // Sort by order and join
  const sorted = fragments.sort((a, b) => a.order - b.order);
  return sorted.map((f) => f.content).join("\n\n---\n\n");
}
