// Import views to register them
import "./detail.js";
import "./logs.js";
import "./tasks.js";

export type { ViewRenderer, ViewRendererRegistry } from "./registry.js";
// Re-export registry and types
export { viewRendererRegistry } from "./registry.js";
