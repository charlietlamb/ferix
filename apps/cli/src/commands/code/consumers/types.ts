import type { Effect, Stream } from "effect";
import type { DaemonClient } from "../daemon/client.js";
import type { DomainEvent } from "../domain/index.js";

/**
 * Result from consuming events.
 * - "completed": Stream finished normally or user pressed Ctrl+C
 * - "back_to_launcher": User pressed Escape to go back to launcher
 */
export type ConsumeResult = "completed" | "back_to_launcher";

/**
 * Context provided to a consumer when connected to a daemon session.
 * This enables the consumer to detach from the session gracefully.
 */
export interface ConsumerContext {
  /**
   * The daemon client instance.
   * Used to unsubscribe when detaching.
   */
  readonly daemonClient: DaemonClient;

  /**
   * The session ID being consumed.
   */
  readonly sessionId: string;
}

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
   * The returned Effect completes when the stream is exhausted.
   * Consumers must handle all errors internally (via catchAllCause)
   * and never fail - they return ConsumeResult instead.
   *
   * When a context is provided, the consumer is connected to a daemon session
   * and can detach gracefully (e.g., on Escape) while the session continues
   * running in the daemon.
   *
   * @param events - Stream of domain events to process
   * @param context - Optional daemon context for detachment support
   * @returns Effect that completes when consumption is done, with result (never fails)
   */
  readonly consume: (
    events: Stream.Stream<DomainEvent, unknown, never>,
    context?: ConsumerContext
  ) => Effect.Effect<ConsumeResult, never, never>;
}
