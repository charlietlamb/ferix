import pc from "picocolors";
import type { LLMToolStartEvent } from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const llmTextFormatter: EventFormatter<"LLMText"> = {
  tag: "LLMText",
  format: () => null,
};

const llmToolStartFormatter: EventFormatter<"LLMToolStart"> = {
  tag: "LLMToolStart",
  format: (event: LLMToolStartEvent) => pc.yellow(`[TOOL] ${event.tool}`),
};

const llmToolUseFormatter: EventFormatter<"LLMToolUse"> = {
  tag: "LLMToolUse",
  format: () => null,
};

const llmToolEndFormatter: EventFormatter<"LLMToolEnd"> = {
  tag: "LLMToolEnd",
  format: () => null,
};

headlessFormatterRegistry.register(llmTextFormatter);
headlessFormatterRegistry.register(llmToolStartFormatter);
headlessFormatterRegistry.register(llmToolUseFormatter);
headlessFormatterRegistry.register(llmToolEndFormatter);
