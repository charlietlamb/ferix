import { keyBindingRegistry } from "../registry.js";

// Quit - Ctrl+C
keyBindingRegistry.register({
  key: "\x03",
  action: { type: "quit" },
});

// Escape - go back (detail -> tasks, tasks -> logs)
// Note: logs view escape is handled by view.js (back_to_launcher)
keyBindingRegistry.register({
  key: "\x1b",
  action: { type: "back" },
  viewModes: ["detail", "tasks"],
});
