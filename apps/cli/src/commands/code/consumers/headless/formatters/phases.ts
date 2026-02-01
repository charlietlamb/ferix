import pc from "picocolors";
import type {
  PhaseCompletedEvent,
  PhaseFailedEvent,
  PhaseStartedEvent,
  PhasesDefinedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const phasesDefinedFormatter: EventFormatter<"PhasesDefined"> = {
  tag: "PhasesDefined",
  format: (event: PhasesDefinedEvent) =>
    pc.white(
      `[PHASES] Task ${event.taskId}: ${event.phases.length} phases defined`
    ),
};

const phaseStartedFormatter: EventFormatter<"PhaseStarted"> = {
  tag: "PhaseStarted",
  format: (event: PhaseStartedEvent) =>
    pc.cyan(`[PHASE] Started: ${event.phaseId}`),
};

const phaseCompletedFormatter: EventFormatter<"PhaseCompleted"> = {
  tag: "PhaseCompleted",
  format: (event: PhaseCompletedEvent) =>
    pc.green(`[PHASE] Completed: ${event.phaseId}`),
};

const phaseFailedFormatter: EventFormatter<"PhaseFailed"> = {
  tag: "PhaseFailed",
  format: (event: PhaseFailedEvent) =>
    pc.red(`[PHASE] Failed: ${event.phaseId} - ${event.reason}`),
};

headlessFormatterRegistry.register(phasesDefinedFormatter);
headlessFormatterRegistry.register(phaseStartedFormatter);
headlessFormatterRegistry.register(phaseCompletedFormatter);
headlessFormatterRegistry.register(phaseFailedFormatter);
