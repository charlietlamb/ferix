import pc from "picocolors";
import { headlessFormatterRegistry } from "./registry.js";

headlessFormatterRegistry.register({
  tag: "PlanCreated",
  format: (event) => pc.magenta(`[PLAN] Created: ${event.plan.id}`),
});

headlessFormatterRegistry.register({
  tag: "PlanUpdated",
  format: (event) => pc.magenta(`[PLAN] Updated: ${event.plan.id}`),
});
