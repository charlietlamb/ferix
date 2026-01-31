import { planUpdateRegistry } from "../registry.js";

/**
 * Learning signals don't modify the plan directly.
 * They are handled by the iteration stream and persisted to progress.md.
 *
 * Registering this handler ensures the signal is recognized but returns
 * undefined to indicate no plan modification is needed.
 */
planUpdateRegistry.register({
  tag: "Learning",
  handle: (_signal, _currentPlan, _context) => undefined,
});
