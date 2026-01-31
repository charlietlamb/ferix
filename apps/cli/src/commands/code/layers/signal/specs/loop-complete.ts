import { Schema as S } from "effect";
import {
  type LoopCompleteSignal,
  LoopCompleteSignalSchema,
} from "../../../domain/index.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

const LOOP_COMPLETE = /<ferix:complete>/;

const loopCompleteSpec: SignalSpec<LoopCompleteSignal> = {
  tag: "LoopComplete",
  closingTag: "<ferix:complete>",
  schema: LoopCompleteSignalSchema,
  parse: (text) => {
    if (LOOP_COMPLETE.test(text)) {
      const raw = { _tag: "LoopComplete" as const };
      const result = S.decodeUnknownEither(LoopCompleteSignalSchema)(raw);
      if (result._tag === "Right") {
        return [result.right];
      }
    }
    return [];
  },
  keyFields: () => "",
};

signalSpecRegistry.register(loopCompleteSpec);
