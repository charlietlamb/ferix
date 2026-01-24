import type {
  CheckFailedSignal,
  CheckPassedSignal,
} from "../../../domain/signals.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const CHECK_PASSED = /<ferix:check-passed\/>/;
const CHECK_FAILED = /<ferix:check-failed\/>/;

const checkPassedSpec: SignalSpec<CheckPassedSignal> = {
  tag: "CheckPassed",
  closingTag: "<ferix:check-passed/>",
  parse: (text) => {
    if (CHECK_PASSED.test(text)) {
      return [{ _tag: "CheckPassed" as const }];
    }
    return [];
  },
  keyFields: () => "",
};

const checkFailedSpec: SignalSpec<CheckFailedSignal> = {
  tag: "CheckFailed",
  closingTag: "<ferix:check-failed/>",
  parse: (text) => {
    if (CHECK_FAILED.test(text)) {
      return [{ _tag: "CheckFailed" as const }];
    }
    return [];
  },
  keyFields: () => "",
};

signalSpecRegistry.register(checkPassedSpec);
signalSpecRegistry.register(checkFailedSpec);
