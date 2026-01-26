// Re-export from the new registry-based implementation

export type {
  KeyAction,
  KeyBinding,
  KeyBindingRegistry,
} from "./input/index.js";
export {
  applyAction,
  keyBindingRegistry,
  parseKey,
  runInputLoop,
} from "./input/index.js";
