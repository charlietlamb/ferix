import { keyBindingRegistry } from "../registry.js";

// Quit - Ctrl+C
keyBindingRegistry.register({
  key: "\x03",
  action: { type: "quit" },
});

// Escape - go back
keyBindingRegistry.register({
  key: "\x1b",
  action: { type: "back" },
});
