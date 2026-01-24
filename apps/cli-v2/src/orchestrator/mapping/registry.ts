import type { DomainEvent } from "../../domain/events.js";
import type { Signal } from "../../domain/signals.js";
import type { LLMEvent } from "../../services/llm.js";

/**
 * Mapper for LLM events to domain events.
 */
export interface LLMEventMapper<T extends LLMEvent["_tag"]> {
  readonly tag: T;
  readonly map: (event: Extract<LLMEvent, { _tag: T }>) => DomainEvent;
}

/**
 * Mapper for signals to domain events.
 */
export interface SignalMapper<T extends Signal["_tag"]> {
  readonly tag: T;
  readonly map: (signal: Extract<Signal, { _tag: T }>) => DomainEvent;
}

/**
 * Registry for event mappers.
 */
export interface EventMappingRegistry {
  registerLLMMapper<T extends LLMEvent["_tag"]>(
    mapper: LLMEventMapper<T>
  ): void;
  registerSignalMapper<T extends Signal["_tag"]>(mapper: SignalMapper<T>): void;
  mapLLMEvent(event: LLMEvent): DomainEvent;
  mapSignal(signal: Signal): DomainEvent;
}

/**
 * Creates the event mapping registry.
 */
export function createEventMappingRegistry(): EventMappingRegistry {
  const llmMappers = new Map<string, (event: LLMEvent) => DomainEvent>();
  const signalMappers = new Map<string, (signal: Signal) => DomainEvent>();

  // Default fallback for unmapped events
  const defaultDomainEvent: DomainEvent = { _tag: "LLMText", text: "" };

  return {
    registerLLMMapper<T extends LLMEvent["_tag"]>(mapper: LLMEventMapper<T>) {
      llmMappers.set(
        mapper.tag,
        mapper.map as (event: LLMEvent) => DomainEvent
      );
    },

    registerSignalMapper<T extends Signal["_tag"]>(mapper: SignalMapper<T>) {
      signalMappers.set(
        mapper.tag,
        mapper.map as (signal: Signal) => DomainEvent
      );
    },

    mapLLMEvent(event: LLMEvent): DomainEvent {
      const mapper = llmMappers.get(event._tag);
      return mapper ? mapper(event) : defaultDomainEvent;
    },

    mapSignal(signal: Signal): DomainEvent {
      const mapper = signalMappers.get(signal._tag);
      return mapper ? mapper(signal) : defaultDomainEvent;
    },
  };
}

// Singleton registry instance
export const eventMappingRegistry = createEventMappingRegistry();
