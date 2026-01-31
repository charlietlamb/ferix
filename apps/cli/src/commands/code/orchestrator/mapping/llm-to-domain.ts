import { eventMappingRegistry } from "./registry.js";

// Text event
eventMappingRegistry.registerLLMMapper({
  tag: "Text",
  map: (event, _context) => ({ _tag: "LLMText", text: event.text }),
});

// Tool start event
eventMappingRegistry.registerLLMMapper({
  tag: "ToolStart",
  map: (event, _context) => ({ _tag: "LLMToolStart", tool: event.tool }),
});

// Tool use event
eventMappingRegistry.registerLLMMapper({
  tag: "ToolUse",
  map: (event, _context) => ({
    _tag: "LLMToolUse",
    tool: event.tool,
    input: event.input,
  }),
});

// Tool end event
eventMappingRegistry.registerLLMMapper({
  tag: "ToolEnd",
  map: (event, _context) => ({ _tag: "LLMToolEnd", tool: event.tool }),
});

// Done event
eventMappingRegistry.registerLLMMapper({
  tag: "Done",
  map: (_event, _context) => ({ _tag: "LLMText", text: "" }),
});
