import type { Effect, Stream } from "effect";
import type { DomainEvent } from "../domain/events.js";

/**
 * A consumer processes a stream of domain events.
 *
 * This is the ONLY interface between orchestrator and presentation.
 * Consumers are completely decoupled from the orchestrator.
 *
 * @example Creating a custom consumer
 * ```typescript
 * const myConsumer: Consumer = {
 *   consume: (events) =>
 *     events.pipe(
 *       Stream.runForEach((event) =>
 *         Effect.sync(() => console.log(event._tag))
 *       )
 *     ),
 * };
 * ```
 *
 * @example WebSocket consumer
 * ```typescript
 * const wsConsumer: Consumer = {
 *   consume: (events) =>
 *     events.pipe(
 *       Stream.runForEach((event) =>
 *         Effect.sync(() => ws.send(JSON.stringify(event)))
 *       )
 *     ),
 * };
 * ```
 */
export interface Consumer {
  /**
   * Consume a stream of events.
   *
   * The consumer handles its own lifecycle (setup, teardown).
   * The returned Effect completes when the stream is exhausted
   * or an error occurs.
   *
   * @param events - Stream of domain events to process
   * @returns Effect that completes when consumption is done
   */
  readonly consume: (
    events: Stream.Stream<DomainEvent, unknown, never>
  ) => Effect.Effect<void, unknown>;
}
