import { Either } from "effect";
import {
  type LearningSignal,
  LearningSignalSchema,
} from "../../../domain/index.js";
import { createLearningSignal } from "../../../domain/schemas/signal-factories.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

/**
 * Regex to match learning signals.
 * Format: <ferix:learning category="success|failure|optimization">content</ferix:learning>
 * The category attribute is optional.
 */
const LEARNING =
  /<ferix:learning(?:\s+category="(success|failure|optimization)")?\s*>([\s\S]*?)<\/ferix:learning>/g;

const learningSpec: SignalSpec<LearningSignal> = {
  tag: "Learning",
  closingTag: "</ferix:learning>",
  schema: LearningSignalSchema,
  parse: (text) => {
    const signals: LearningSignal[] = [];
    const matches = text.matchAll(LEARNING);

    for (const match of matches) {
      const category = match[1] as
        | "success"
        | "failure"
        | "optimization"
        | undefined;
      const content = match[2]?.trim() || "";

      if (!content) {
        continue;
      }

      const result = createLearningSignal({ content, category });
      if (Either.isRight(result)) {
        signals.push(result.right);
      }
    }

    return signals;
  },
  keyFields: (s) => s.content.slice(0, 50),
};

signalSpecRegistry.register(learningSpec);
