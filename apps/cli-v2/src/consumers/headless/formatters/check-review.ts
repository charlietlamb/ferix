import pc from "picocolors";
import type {
  CheckFailedEvent,
  ReviewCompleteEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const checkPassedFormatter: EventFormatter<"CheckPassed"> = {
  tag: "CheckPassed",
  format: () => pc.green("[CHECK] All criteria passed"),
};

const checkFailedFormatter: EventFormatter<"CheckFailed"> = {
  tag: "CheckFailed",
  format: (event: CheckFailedEvent) =>
    pc.red(`[CHECK] Failed criteria: ${event.failedCriteria.join(", ")}`),
};

const reviewCompleteFormatter: EventFormatter<"ReviewComplete"> = {
  tag: "ReviewComplete",
  format: (event: ReviewCompleteEvent) =>
    pc.green(`[REVIEW] Complete${event.changesMade ? " (changes made)" : ""}`),
};

headlessFormatterRegistry.register(checkPassedFormatter);
headlessFormatterRegistry.register(checkFailedFormatter);
headlessFormatterRegistry.register(reviewCompleteFormatter);
