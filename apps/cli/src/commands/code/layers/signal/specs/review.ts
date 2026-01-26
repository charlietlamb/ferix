import { Schema as S } from "effect";
import {
  type ReviewCompleteSignal,
  ReviewCompleteSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const REVIEW_COMPLETE = /<ferix:review-complete\/>/;
const REVIEW_CHANGES = /<ferix:review-changes-made\/>/;

const reviewCompleteSpec: SignalSpec<ReviewCompleteSignal> = {
  tag: "ReviewComplete",
  closingTag: "<ferix:review-complete/>",
  schema: ReviewCompleteSignalSchema,
  parse: (text) => {
    if (!REVIEW_COMPLETE.test(text)) {
      return [];
    }
    const changesMade = REVIEW_CHANGES.test(text);
    const raw = { _tag: "ReviewComplete" as const, changesMade };
    const result = S.decodeUnknownEither(ReviewCompleteSignalSchema)(raw);
    if (result._tag === "Right") {
      return [result.right];
    }
    return [];
  },
  keyFields: (s) => String(s.changesMade),
};

signalSpecRegistry.register(reviewCompleteSpec);
