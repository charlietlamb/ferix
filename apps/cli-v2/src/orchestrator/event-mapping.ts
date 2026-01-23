import type { DomainEvent } from "../domain/events.js";
import type { Signal } from "../domain/signals.js";
import type { LLMEvent } from "../services/llm.js";

/**
 * Maps an LLM event to a domain event.
 */
export function mapLLMEventToDomain(event: LLMEvent): DomainEvent {
  switch (event._tag) {
    case "Text":
      return { _tag: "LLMText", text: event.text };
    case "ToolStart":
      return { _tag: "LLMToolStart", tool: event.tool };
    case "ToolUse":
      return { _tag: "LLMToolUse", tool: event.tool, input: event.input };
    case "ToolEnd":
      return { _tag: "LLMToolEnd", tool: event.tool };
    case "Done":
      return { _tag: "LLMText", text: "" };
    default:
      return { _tag: "LLMText", text: "" };
  }
}

/**
 * Maps a parsed signal to a domain event.
 * Since Signal and Event types now share base types, most mappings are straightforward.
 */
export function mapSignalToDomain(signal: Signal): DomainEvent {
  switch (signal._tag) {
    // These signals map directly - shared base types mean same structure
    case "TasksDefined":
    case "PhasesDefined":
    case "CriteriaDefined":
    case "PhaseStarted":
    case "PhaseCompleted":
    case "PhaseFailed":
    case "CriterionPassed":
    case "CriterionFailed":
    case "ReviewComplete":
      return signal as DomainEvent;

    case "CheckPassed":
      return { _tag: "CheckPassed" };

    case "CheckFailed":
      return { _tag: "CheckFailed", failedCriteria: [] };

    case "TaskComplete":
      // Signal has extra fields (filesModified, filesCreated) that event doesn't need
      return {
        _tag: "TaskCompleted",
        taskId: signal.taskId,
        summary: signal.summary,
      };

    case "LoopComplete":
      // LoopComplete signal triggers LoopCompleted event with placeholder summary
      // (actual summary is computed by the orchestrator)
      return {
        _tag: "LoopCompleted",
        summary: {
          iterations: 0,
          success: true,
          sessionId: "",
          completedTasks: [],
          durationMs: 0,
        },
      };

    default:
      return { _tag: "LLMText", text: "" };
  }
}
