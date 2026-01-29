import type { Schema as S } from "effect";
import type { Signal } from "../../../domain/index.js";

/**
 * Specification for parsing a signal type.
 * Each spec fully describes how to parse and identify a signal.
 */
export interface SignalSpec<T extends Signal = Signal> {
  readonly tag: T["_tag"];
  readonly closingTag: string;
  readonly schema?: S.Schema<T>;
  readonly parse: (text: string) => T[];
  readonly keyFields: (signal: T) => string;
}

/**
 * Registry for signal specifications.
 * Allows adding new signal types without modifying the parser.
 */
interface SignalSpecRegistry {
  register<T extends Signal>(spec: SignalSpec<T>): void;
  parseAll(text: string): Signal[];
  getSignalKey(signal: Signal): string;
  findLastCompleteSignalEnd(buffer: string): number;
  getAll(): readonly SignalSpec[];
}

/**
 * Creates the signal spec registry.
 */
function createSignalSpecRegistry(): SignalSpecRegistry {
  const specs: SignalSpec[] = [];

  return {
    register<T extends Signal>(spec: SignalSpec<T>) {
      specs.push(spec as unknown as SignalSpec);
    },

    parseAll(text: string): Signal[] {
      return specs.flatMap((spec) => spec.parse(text));
    },

    getSignalKey(signal: Signal): string {
      const spec = specs.find((s) => s.tag === signal._tag);
      const fields = spec?.keyFields(signal) ?? "";
      return fields ? `${signal._tag}:${fields}` : signal._tag;
    },

    findLastCompleteSignalEnd(buffer: string): number {
      let maxEnd = -1;
      for (const spec of specs) {
        const idx = buffer.lastIndexOf(spec.closingTag);
        if (idx !== -1) {
          const endPos = idx + spec.closingTag.length;
          if (endPos > maxEnd) {
            maxEnd = endPos;
          }
        }
      }
      // Also check for review-changes-made which is a modifier tag
      const reviewChangesIdx = buffer.lastIndexOf(
        "<ferix:review-changes-made/>"
      );
      if (reviewChangesIdx !== -1) {
        const endPos = reviewChangesIdx + "<ferix:review-changes-made/>".length;
        if (endPos > maxEnd) {
          maxEnd = endPos;
        }
      }
      return maxEnd;
    },

    getAll() {
      return specs;
    },
  };
}

// Singleton registry instance
export const signalSpecRegistry = createSignalSpecRegistry();
