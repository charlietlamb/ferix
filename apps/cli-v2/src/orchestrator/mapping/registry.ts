import type { DomainEvent, Signal } from "../../domain/index.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";

/**
 * Context passed to event mappers.
 */
export interface MappingContext {
  readonly timestamp: number;
}

/**
 * Mapper for LLM events to domain events.
 */
export interface LLMEventMapper<T extends LLMEvent["_tag"]> {
  readonly tag: T;
  readonly map: (
    event: Extract<LLMEvent, { _tag: T }>,
    context: MappingContext
  ) => DomainEvent;
}

/**
 * Mapper for signals to domain events.
 */
export interface SignalMapper<T extends Signal["_tag"]> {
  readonly tag: T;
  readonly map: (
    signal: Extract<Signal, { _tag: T }>,
    context: MappingContext
  ) => DomainEvent;
}

/**
 * Registry for event mappers.
 */
export interface EventMappingRegistry {
  registerLLMMapper<T extends LLMEvent["_tag"]>(
    mapper: LLMEventMapper<T>
  ): void;
  registerSignalMapper<T extends Signal["_tag"]>(mapper: SignalMapper<T>): void;
  mapLLMEvent(event: LLMEvent, context: MappingContext): DomainEvent;
  mapSignal(signal: Signal, context: MappingContext): DomainEvent;
}

/**
 * Creates the event mapping registry.
 */
export function createEventMappingRegistry(): EventMappingRegistry {
  const llmMappers = new Map<
    string,
    (event: LLMEvent, context: MappingContext) => DomainEvent
  >();
  const signalMappers = new Map<
    string,
    (signal: Signal, context: MappingContext) => DomainEvent
  >();

  // Default fallback for unmapped events
  const defaultDomainEvent: DomainEvent = { _tag: "LLMText", text: "" };

  return {
    registerLLMMapper<T extends LLMEvent["_tag"]>(mapper: LLMEventMapper<T>) {
      llmMappers.set(
        mapper.tag,
        mapper.map as (event: LLMEvent, context: MappingContext) => DomainEvent
      );
    },

    registerSignalMapper<T extends Signal["_tag"]>(mapper: SignalMapper<T>) {
      signalMappers.set(
        mapper.tag,
        mapper.map as (signal: Signal, context: MappingContext) => DomainEvent
      );
    },

    mapLLMEvent(event: LLMEvent, context: MappingContext): DomainEvent {
      const mapper = llmMappers.get(event._tag);
      return mapper ? mapper(event, context) : defaultDomainEvent;
    },

    mapSignal(signal: Signal, context: MappingContext): DomainEvent {
      const mapper = signalMappers.get(signal._tag);
      return mapper ? mapper(signal, context) : defaultDomainEvent;
    },
  };
}

// Singleton registry instance
export const eventMappingRegistry = createEventMappingRegistry();
