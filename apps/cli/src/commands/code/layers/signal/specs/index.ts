// Import all specs to register them
import "./check.js";
import "./criteria.js";
import "./guardrail.js";
import "./learning.js";
import "./phases.js";
import "./review.js";
import "./session-name.js";
import "./task-complete.js";
import "./tasks.js";

// Re-export registry
export { signalSpecRegistry } from "./registry.js";
