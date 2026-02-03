import { Effect, Stream } from "effect";
import type { SetStoreFunction } from "solid-js/store";
import { produce } from "solid-js/store";
import type { DomainEvent } from "../../../domain/index.js";
import type { TUIState } from "../../../domain/schemas/tui.js";
import { reduce } from "../reducers/index.js";

/** Batch interval for event batching (ms) - targets 60fps */
const BATCH_INTERVAL_MS = 16;

/**
 * Mutable version of TUIState for SolidJS store.
 * TUIState from Effect Schema is readonly, but SolidJS stores need mutable types.
 */
export type MutableTUIState = {
  -readonly [K in keyof TUIState]: TUIState[K] extends ReadonlyArray<infer U>
    ? U[]
    : TUIState[K];
};

/**
 * Apply a reduced state to the SolidJS store draft.
 * Copies primitives and mutates arrays in place for proper reactivity.
 */
function applyStateToDraft(draft: MutableTUIState, next: TUIState): void {
  draft.task = next.task;
  draft.iteration = next.iteration;
  draft.maxIterations = next.maxIterations;
  draft.status = next.status;
  draft.startTime = next.startTime;
  draft.discoveryInProgress = next.discoveryInProgress;
  draft.discoveryCompleted = next.discoveryCompleted;
  draft.executionMode = next.executionMode;
  draft.currentTool = next.currentTool;
  draft.currentTaskId = next.currentTaskId;
  draft.partialLine = next.partialLine;
  draft.viewMode = next.viewMode;
  draft.selectedTaskIndex = next.selectedTaskIndex;
  draft.scrollOffset = next.scrollOffset;
  draft.userScrolled = next.userScrolled;
  draft.gitBranch = next.gitBranch;
  draft.gitPushed = next.gitPushed;
  draft.prUrl = next.prUrl;
  draft.yolo = next.yolo;
  draft.debug = next.debug;
  draft.pr = next.pr;
  draft.provider = next.provider;

  // Mutate arrays in place for proper reactivity
  draft.outputLines.splice(0, draft.outputLines.length, ...next.outputLines);
  draft.tasks.splice(0, draft.tasks.length, ...next.tasks);
}

/**
 * Creates a stream consumer that bridges Effect Stream events to a SolidJS store.
 *
 * Events are batched at 16ms intervals (60fps) to reduce unnecessary re-renders
 * during rapid event bursts. Each batch of events is reduced sequentially and
 * applied to the store in a single produce() call.
 *
 * @param stream - Effect stream of domain events
 * @param setStore - SolidJS store setter function
 * @returns Object with cleanup function to stop the consumer
 */
export function createStreamConsumer(
  stream: Stream.Stream<DomainEvent, unknown, never>,
  setStore: SetStoreFunction<MutableTUIState>
): { cleanup: () => Promise<void> } {
  // Track current state for reducer
  let currentState: TUIState | null = null;

  // Event buffer for batching
  let eventBuffer: DomainEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let shouldStop = false;

  /**
   * Flush buffered events to the store in a single produce() call.
   */
  const flushEvents = () => {
    flushTimer = null;

    if (eventBuffer.length === 0) {
      return;
    }

    // Swap buffer to avoid issues during processing
    const events = eventBuffer;
    eventBuffer = [];

    setStore(
      produce((draft) => {
        // Get initial state on first event
        if (currentState === null) {
          currentState = { ...draft } as TUIState;
        }

        // Reduce all buffered events sequentially
        let state = currentState;
        for (const event of events) {
          state = reduce(state, event);
        }

        // Apply final state to draft
        applyStateToDraft(draft, state);

        // Update tracked state for next batch
        currentState = state;
      })
    );
  };

  /**
   * Schedule a flush if one isn't already pending.
   */
  const scheduleFlush = () => {
    if (flushTimer === null) {
      flushTimer = setTimeout(flushEvents, BATCH_INTERVAL_MS);
    }
  };

  const runningPromise = Effect.runPromise(
    stream.pipe(
      Stream.takeWhile(() => !shouldStop),
      Stream.runForEach((event: DomainEvent) =>
        Effect.sync(() => {
          // Buffer the event
          eventBuffer.push(event);

          // Schedule a flush at the next batch interval
          scheduleFlush();
        })
      )
    )
  ).catch(() => {
    // Stream terminated - expected during cleanup
  });

  return {
    cleanup: async () => {
      shouldStop = true;

      // Clear pending timer
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      // Flush any remaining events
      flushEvents();

      await runningPromise.catch(() => {
        // Intentionally ignore stream errors during cleanup
      });
    },
  };
}
