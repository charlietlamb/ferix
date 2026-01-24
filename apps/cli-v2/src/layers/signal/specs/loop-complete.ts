import type { LoopCompleteSignal } from "../../../domain/signals.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const LOOP_COMPLETE = /<ferix:complete>/;

const loopCompleteSpec: SignalSpec<LoopCompleteSignal> = {
  tag: "LoopComplete",
  closingTag: "<ferix:complete>",
  parse: (text) => {
    if (LOOP_COMPLETE.test(text)) {
      return [{ _tag: "LoopComplete" as const }];
    }
    return [];
  },
  keyFields: () => "",
};

signalSpecRegistry.register(loopCompleteSpec);
