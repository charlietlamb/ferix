/**
 * Test utilities for apps/cli tests.
 *
 * This module provides common utilities for testing Effect-based code:
 * - Layer composition helpers for creating test environments
 * - Mock event factories for simulating LLM responses
 * - Signal string generators for testing signal parsing
 * - Custom assertions for Effect-based tests
 *
 * @example
 * ```typescript
 * import {
 *   createTestLayers,
 *   mockTextEvent,
 *   mockDoneEvent,
 *   mockTasksSignal,
 *   expectEffectSuccess,
 *   findEvent,
 * } from "../utils";
 *
 * describe("MyTest", () => {
 *   it("should work", async () => {
 *     const layers = createTestLayers({
 *       events: [
 *         mockTextEvent(mockTasksSignal([{ id: "1", description: "Test" }])),
 *         mockDoneEvent(),
 *       ],
 *     });
 *
 *     const result = await expectEffectSuccess(
 *       myEffect.pipe(Effect.provide(layers))
 *     );
 *
 *     const planCreated = findEvent(result, "PlanCreated");
 *     expect(planCreated).toBeDefined();
 *   });
 * });
 * ```
 */

// Custom Effect assertions
export {
  findEvent,
  findEvents,
} from "./assertions.js";
// Layer composition helpers
export { createTestLayers } from "./create-test-layers.js";
// LLM event factories
export {
  mockDoneEvent,
  mockTextEvent,
  mockToolEndEvent,
  mockToolStartEvent,
  mockToolUseEvent,
} from "./mock-events.js";
// Signal string generators
export {
  combineSignals,
  mockPhaseDoneSignal,
  mockPhaseStartSignal,
  mockPhasesSignal,
  mockTaskCompleteSignal,
  mockTasksSignal,
} from "./mock-signals.js";
