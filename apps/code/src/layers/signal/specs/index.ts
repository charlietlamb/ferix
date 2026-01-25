// Import all specs to register them
import "./check.js";
import "./criteria.js";
import "./guardrail.js";
import "./learning.js";
import "./loop-complete.js";
import "./phases.js";
import "./review.js";
import "./session-name.js";
import "./task-complete.js";
import "./tasks.js";

export type { SignalSpec, SignalSpecRegistry } from "./registry.js";
// Re-export registry
export { signalSpecRegistry } from "./registry.js";
