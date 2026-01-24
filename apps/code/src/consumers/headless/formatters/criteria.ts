import pc from "picocolors";
import type {
  CriteriaDefinedEvent,
  CriterionFailedEvent,
  CriterionPassedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const criteriaDefinedFormatter: EventFormatter<"CriteriaDefined"> = {
  tag: "CriteriaDefined",
  format: (event: CriteriaDefinedEvent) =>
    pc.magenta(
      `[CRITERIA] Task ${event.taskId}: ${event.criteria.length} criteria defined`
    ),
};

const criterionPassedFormatter: EventFormatter<"CriterionPassed"> = {
  tag: "CriterionPassed",
  format: (event: CriterionPassedEvent) =>
    pc.green(`[CHECK] Passed: ${event.criterionId}`),
};

const criterionFailedFormatter: EventFormatter<"CriterionFailed"> = {
  tag: "CriterionFailed",
  format: (event: CriterionFailedEvent) =>
    pc.red(`[CHECK] Failed: ${event.criterionId} - ${event.reason}`),
};

headlessFormatterRegistry.register(criteriaDefinedFormatter);
headlessFormatterRegistry.register(criterionPassedFormatter);
headlessFormatterRegistry.register(criterionFailedFormatter);
