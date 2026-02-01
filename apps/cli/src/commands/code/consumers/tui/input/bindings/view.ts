import { keyBindingRegistry } from "../registry.js";

// t - switch to tasks view (only from logs)
keyBindingRegistry.register({
  key: "t",
  action: { type: "switch_view", view: "tasks" },
  viewModes: ["logs"],
});

// Escape - back to launcher (only from logs view)
keyBindingRegistry.register({
  key: "\x1b",
  action: { type: "back_to_launcher" },
  viewModes: ["logs"],
});

// Enter - select task (only in tasks view)
keyBindingRegistry.register({
  key: "\r",
  action: { type: "select" },
  viewModes: ["tasks"],
});

// Enter (newline variant)
keyBindingRegistry.register({
  key: "\n",
  action: { type: "select" },
  viewModes: ["tasks"],
});
