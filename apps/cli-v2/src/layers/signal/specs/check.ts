import { Schema as S } from "effect";
import {
  type CheckFailedSignal,
  CheckFailedSignalSchema,
  type CheckPassedSignal,
  CheckPassedSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const CHECK_PASSED = /<ferix:check-passed\/>/;
const CHECK_FAILED = /<ferix:check-failed\/>/;

const checkPassedSpec: SignalSpec<CheckPassedSignal> = {
  tag: "CheckPassed",
  closingTag: "<ferix:check-passed/>",
  schema: CheckPassedSignalSchema,
  parse: (text) => {
    if (CHECK_PASSED.test(text)) {
      const raw = { _tag: "CheckPassed" as const };
      const result = S.decodeUnknownEither(CheckPassedSignalSchema)(raw);
      if (result._tag === "Right") {
        return [result.right];
      }
    }
    return [];
  },
  keyFields: () => "",
};

const checkFailedSpec: SignalSpec<CheckFailedSignal> = {
  tag: "CheckFailed",
  closingTag: "<ferix:check-failed/>",
  schema: CheckFailedSignalSchema,
  parse: (text) => {
    if (CHECK_FAILED.test(text)) {
      const raw = { _tag: "CheckFailed" as const };
      const result = S.decodeUnknownEither(CheckFailedSignalSchema)(raw);
      if (result._tag === "Right") {
        return [result.right];
      }
    }
    return [];
  },
  keyFields: () => "",
};

signalSpecRegistry.register(checkPassedSpec);
signalSpecRegistry.register(checkFailedSpec);
