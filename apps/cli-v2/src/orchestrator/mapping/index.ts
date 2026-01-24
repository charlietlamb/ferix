// Import mappers to register them
import "./llm-to-domain.js";
import "./signal-to-domain.js";

export type {
  EventMappingRegistry,
  LLMEventMapper,
  SignalMapper,
} from "./registry.js";
// Re-export registry and types
export { eventMappingRegistry } from "./registry.js";

// Re-export convenience functions
import type { DomainEvent } from "../../domain/events.js";
import type { Signal } from "../../domain/signals.js";
import type { LLMEvent } from "../../services/llm.js";
import { eventMappingRegistry } from "./registry.js";

/**
 * Maps an LLM event to a domain event.
 */
export function mapLLMEventToDomain(event: LLMEvent): DomainEvent {
  return eventMappingRegistry.mapLLMEvent(event);
}

/**
 * Maps a parsed signal to a domain event.
 */
export function mapSignalToDomain(signal: Signal): DomainEvent {
  return eventMappingRegistry.mapSignal(signal);
}
