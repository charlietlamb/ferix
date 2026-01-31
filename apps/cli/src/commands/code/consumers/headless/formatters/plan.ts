import pc from "picocolors";
import type {
  PlanCreatedEvent,
  PlanUpdatedEvent,
} from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const planCreatedFormatter: EventFormatter<"PlanCreated"> = {
  tag: "PlanCreated",
  format: (event: PlanCreatedEvent) =>
    pc.magenta(`[PLAN] Created: ${event.plan.id}`),
};

const planUpdatedFormatter: EventFormatter<"PlanUpdated"> = {
  tag: "PlanUpdated",
  format: (event: PlanUpdatedEvent) =>
    pc.magenta(`[PLAN] Updated: ${event.plan.id}`),
};

headlessFormatterRegistry.register(planCreatedFormatter);
headlessFormatterRegistry.register(planUpdatedFormatter);
