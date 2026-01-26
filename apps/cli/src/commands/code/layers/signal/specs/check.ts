import { Either } from "effect";
import {
  type CheckFailedSignal,
  CheckFailedSignalSchema,
  type CheckPassedSignal,
  CheckPassedSignalSchema,
} from "../../../domain/index.js";
import {
  createCheckFailedSignal,
  createCheckPassedSignal,
} from "../../../domain/schemas/signal-factories.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const CHECK_PASSED = /<ferix:check-passed\/>/;
const CHECK_FAILED = /<ferix:check-failed\/>/;

const checkPassedSpec: SignalSpec<CheckPassedSignal> = {
  tag: "CheckPassed",
  closingTag: "<ferix:check-passed/>",
  schema: CheckPassedSignalSchema,
  parse: (text) => {
    if (CHECK_PASSED.test(text)) {
      const result = createCheckPassedSignal({});
      if (Either.isRight(result)) {
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
      const result = createCheckFailedSignal({});
      if (Either.isRight(result)) {
        return [result.right];
      }
    }
    return [];
  },
  keyFields: () => "",
};

signalSpecRegistry.register(checkPassedSpec);
signalSpecRegistry.register(checkFailedSpec);
