import { keyBindingRegistry } from "../registry.js";

// j - scroll down
keyBindingRegistry.register({
  key: "j",
  action: { type: "scroll", direction: "down", lines: 1 },
});

// k - scroll up
keyBindingRegistry.register({
  key: "k",
  action: { type: "scroll", direction: "up", lines: 1 },
});

// g - scroll to top
keyBindingRegistry.register({
  key: "g",
  action: { type: "scroll_to", position: "top" },
});

// G - scroll to bottom
keyBindingRegistry.register({
  key: "G",
  action: { type: "scroll_to", position: "bottom" },
});

// Up arrow
keyBindingRegistry.register({
  key: "\x1b[A",
  action: { type: "scroll", direction: "up", lines: 1 },
});

// Down arrow
keyBindingRegistry.register({
  key: "\x1b[B",
  action: { type: "scroll", direction: "down", lines: 1 },
});

// Page up
keyBindingRegistry.register({
  key: "\x1b[5~",
  action: { type: "scroll", direction: "up", lines: 10 },
});

// Page down
keyBindingRegistry.register({
  key: "\x1b[6~",
  action: { type: "scroll", direction: "down", lines: 10 },
});

// Home
keyBindingRegistry.register({
  key: "\x1b[H",
  action: { type: "scroll_to", position: "top" },
});

// Home alt
keyBindingRegistry.register({
  key: "\x1b[1~",
  action: { type: "scroll_to", position: "top" },
});

// End
keyBindingRegistry.register({
  key: "\x1b[F",
  action: { type: "scroll_to", position: "bottom" },
});

// End alt
keyBindingRegistry.register({
  key: "\x1b[4~",
  action: { type: "scroll_to", position: "bottom" },
});
