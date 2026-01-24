import type { ReviewCompleteSignal, Signal } from "../../../domain/signals.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const REVIEW_COMPLETE = /<ferix:review-complete\/>/;
const REVIEW_CHANGES = /<ferix:review-changes-made\/>/;

const reviewCompleteSpec: SignalSpec<ReviewCompleteSignal> = {
  tag: "ReviewComplete",
  closingTag: "<ferix:review-complete/>",
  parse: (text) => {
    if (!REVIEW_COMPLETE.test(text)) {
      return [];
    }
    const changesMade = REVIEW_CHANGES.test(text);
    return [{ _tag: "ReviewComplete" as const, changesMade }];
  },
  keyFields: (s) =>
    String((s as Signal & { changesMade: boolean }).changesMade),
};

signalSpecRegistry.register(reviewCompleteSpec);
