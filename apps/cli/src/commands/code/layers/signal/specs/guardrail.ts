import { Either } from "effect";
import {
  type GuardrailSignal,
  GuardrailSignalSchema,
} from "../../../domain/index.js";
import { createGuardrailSignal } from "../../../domain/schemas/signal-factories.js";
import { type SignalSpec, signalSpecRegistry } from "./registry.js";

/**
 * Regex to match guardrail signals.
 * Format:
 * <ferix:guardrail severity="warning|critical">
 *   <pattern>What went wrong</pattern>
 *   <sign>How to recognize this situation</sign>
 *   <avoidance>How to avoid it in the future</avoidance>
 * </ferix:guardrail>
 */
const GUARDRAIL =
  /<ferix:guardrail\s+severity="(warning|critical)"\s*>([\s\S]*?)<\/ferix:guardrail>/g;

const PATTERN = /<pattern>([\s\S]*?)<\/pattern>/;
const SIGN = /<sign>([\s\S]*?)<\/sign>/;
const AVOIDANCE = /<avoidance>([\s\S]*?)<\/avoidance>/;

const guardrailSpec: SignalSpec<GuardrailSignal> = {
  tag: "Guardrail",
  closingTag: "</ferix:guardrail>",
  schema: GuardrailSignalSchema,
  parse: (text) => {
    const signals: GuardrailSignal[] = [];
    const matches = text.matchAll(GUARDRAIL);

    for (const match of matches) {
      const severity = match[1] as "warning" | "critical";
      const content = match[2] || "";

      const patternMatch = content.match(PATTERN);
      const signMatch = content.match(SIGN);
      const avoidanceMatch = content.match(AVOIDANCE);

      const pattern = patternMatch?.[1]?.trim() || "";
      const sign = signMatch?.[1]?.trim() || "";
      const avoidance = avoidanceMatch?.[1]?.trim() || "";

      // All fields are required
      if (!(pattern && sign && avoidance)) {
        continue;
      }

      const result = createGuardrailSignal({
        pattern,
        sign,
        avoidance,
        severity,
      });
      if (Either.isRight(result)) {
        signals.push(result.right);
      }
    }

    return signals;
  },
  keyFields: (s) => s.pattern.slice(0, 50),
};

signalSpecRegistry.register(guardrailSpec);
