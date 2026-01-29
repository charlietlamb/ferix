import type { DomainEvent } from "../../../domain/index.js";

/**
 * Formatter for headless output of domain events.
 */
export interface EventFormatter<T extends DomainEvent["_tag"]> {
  readonly tag: T;
  readonly format: (event: Extract<DomainEvent, { _tag: T }>) => string | null;
}

/**
 * Registry for headless event formatters.
 */
interface HeadlessFormatterRegistry {
  register<T extends DomainEvent["_tag"]>(formatter: EventFormatter<T>): void;
  format(event: DomainEvent): string | null;
}

/**
 * Creates the headless formatter registry.
 */
function createHeadlessFormatterRegistry(): HeadlessFormatterRegistry {
  const formatters = new Map<string, (event: DomainEvent) => string | null>();

  return {
    register<T extends DomainEvent["_tag"]>(formatter: EventFormatter<T>) {
      formatters.set(
        formatter.tag as string,
        formatter.format as (event: DomainEvent) => string | null
      );
    },

    format(event: DomainEvent): string | null {
      const formatter = formatters.get(event._tag);
      return formatter ? formatter(event) : null;
    },
  };
}

// Singleton registry instance
export const headlessFormatterRegistry = createHeadlessFormatterRegistry();
