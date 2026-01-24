import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "LLMText",
  format: () => null,
});

headlessFormatterRegistry.register({
  tag: "LLMToolStart",
  format: (event) => pc.yellow(`[TOOL] ${event.tool}`),
});

headlessFormatterRegistry.register({
  tag: "LLMToolUse",
  format: () => null,
});

headlessFormatterRegistry.register({
  tag: "LLMToolEnd",
  format: () => null,
});
