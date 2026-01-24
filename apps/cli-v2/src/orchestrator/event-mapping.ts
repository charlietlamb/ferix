// Re-export from the new registry-based implementation

export type {
  EventMappingRegistry,
  LLMEventMapper,
  MappingContext,
  SignalMapper,
} from "./mapping/index.js";
export {
  eventMappingRegistry,
  mapLLMEventToDomain,
  mapSignalToDomain,
} from "./mapping/index.js";
