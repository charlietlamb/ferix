// Import mappers to register them
import "./llm-to-domain.js";
import "./signal-to-domain.js";

export type {
  EventMappingRegistry,
  LLMEventMapper,
  MappingContext,
  SignalMapper,
} from "./registry.js";
// Re-export registry and types
export { eventMappingRegistry } from "./registry.js";

// Re-export convenience functions
import type { DomainEvent, Signal } from "../../domain/index.js";
import type { LLMEvent } from "../../domain/schemas/llm.js";
import type { MappingContext } from "./registry.js";
import { eventMappingRegistry } from "./registry.js";

/**
 * Maps an LLM event to a domain event.
 */
export function mapLLMEventToDomain(
  event: LLMEvent,
  context: MappingContext
): DomainEvent {
  return eventMappingRegistry.mapLLMEvent(event, context);
}

/**
 * Maps a parsed signal to a domain event.
 */
export function mapSignalToDomain(
  signal: Signal,
  context: MappingContext
): DomainEvent {
  return eventMappingRegistry.mapSignal(signal, context);
}
