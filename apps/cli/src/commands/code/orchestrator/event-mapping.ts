// Re-export from the new registry-based implementation

export type { MappingContext } from "./mapping/index.js";
export {
  mapLLMEventToDomain,
  mapSignalToDomain,
} from "./mapping/index.js";
