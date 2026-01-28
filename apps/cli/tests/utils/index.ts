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
  countEvents,
  expectEffectDefect,
  expectEffectFailure,
  expectEffectSuccess,
  expectEventOrder,
  expectEventSequence,
  expectEventsContain,
  expectEventsExclude,
  findEvent,
  findEvents,
  hasTag,
} from "./assertions.js";
// Layer composition helpers
export {
  createMinimalTestLayers,
  createStoreTestLayers,
  createTestLayers,
  type TestLayerOptions,
} from "./create-test-layers.js";
// LLM event factories
export {
  mockBashSequence,
  mockConversation,
  mockDoneEvent,
  mockReadFileSequence,
  mockTextEvent,
  mockToolEndEvent,
  mockToolSequence,
  mockToolStartEvent,
  mockToolUseEvent,
  mockWriteFileSequence,
} from "./mock-events.js";
// Signal string generators
export {
  combineSignals,
  type MockCriterion,
  type MockPhase,
  type MockTask,
  type MockTaskCompletion,
  mockCheckFailedSignal,
  mockCheckPassedSignal,
  mockCompleteTaskFlow,
  mockCriteriaSignal,
  mockCriterionFailedSignal,
  mockCriterionPassedSignal,
  mockGuardrailSignal,
  mockLearningSignal,
  mockLoopCompleteSignal,
  mockPhaseDoneSignal,
  mockPhaseFailedSignal,
  mockPhaseStartSignal,
  mockPhasesSignal,
  mockReviewChangesMadeSignal,
  mockReviewCompleteSignal,
  mockSessionNameSignal,
  mockTaskCompleteSignal,
  mockTasksSignal,
} from "./mock-signals.js";
