import { Effect, Stream } from "effect";
import {
  createHeadlessConsumer,
  createTUIConsumer,
} from "./consumers/index.js";
import type { LoopConfig } from "./domain/config.js";
import type { DomainEvent } from "./domain/events.js";
import {
  createTestLayers,
  ProductionLayers,
  TestLayers,
} from "./layers/index.js";
import { runLoop } from "./orchestrator/index.js";
import type { LLMEvent } from "./services/llm.js";

/**
 * Consumer type selection.
 */
export type ConsumerType = "tui" | "headless" | "none";

/**
 * Options for running the ralph loop program.
 */
export interface RunOptions {
  /**
   * Loop configuration.
   */
  readonly config: LoopConfig;

  /**
   * Consumer type for output.
   * - "tui": Full-screen terminal UI
   * - "headless": Simple console logging
   * - "none": No output (for programmatic use)
   *
   * @default "headless"
   */
  readonly consumer?: ConsumerType;

  /**
   * Optional callback for each domain event.
   * Called in addition to the selected consumer.
   */
  readonly onEvent?: (event: DomainEvent) => void;
}

/**
 * Run the ralph loop with production layers.
 *
 * This is the main entry point for running a ralph loop.
 * It composes all services and consumers into a single Effect program.
 *
 * @param options - Run options including config and consumer type
 * @returns Effect that completes when the loop finishes
 *
 * @example Basic usage
 * ```typescript
 * await run({
 *   config: {
 *     task: "Implement the feature",
 *     maxIterations: 3,
 *     verifyCommands: ["bun test"],
 *   },
 *   consumer: "tui",
 * }).pipe(Effect.runPromise);
 * ```
 *
 * @example With event callback
 * ```typescript
 * await run({
 *   config: { task: "Fix the bug", maxIterations: 1, verifyCommands: [] },
 *   consumer: "headless",
 *   onEvent: (event) => {
 *     if (event._tag === "TaskCompleted") {
 *       console.log("Task done:", event.taskId);
 *     }
 *   },
 * }).pipe(Effect.runPromise);
 * ```
 */
export function run(options: RunOptions): Effect.Effect<void, unknown, never> {
  const { config, consumer: consumerType = "headless", onEvent } = options;

  const events = runLoop(config);

  const eventsWithCallback = onEvent
    ? events.pipe(Stream.tap((event) => Effect.sync(() => onEvent(event))))
    : events;

  const eventsWithLayers = eventsWithCallback.pipe(
    Stream.provideLayer(ProductionLayers)
  );

  if (consumerType === "none") {
    return eventsWithLayers.pipe(Stream.runDrain);
  }

  const consumer =
    consumerType === "tui" ? createTUIConsumer() : createHeadlessConsumer();

  return consumer.consume(eventsWithLayers);
}

/**
 * Run the ralph loop with test layers.
 *
 * Uses mock LLM and in-memory storage for testing.
 *
 * @param options - Run options including config
 * @param mockEvents - Optional custom mock events
 * @returns Effect that completes when the loop finishes
 *
 * @example
 * ```typescript
 * const mockEvents: LLMEvent[] = [
 *   { _tag: "Text", text: "<ferix:tasks><task id=\"1\">Test</task></ferix:tasks>" },
 *   { _tag: "Done", output: "..." },
 * ];
 *
 * await runTest(
 *   { config: { task: "test", maxIterations: 1, verifyCommands: [] } },
 *   mockEvents
 * ).pipe(Effect.runPromise);
 * ```
 */
export function runTest(
  options: Omit<RunOptions, "consumer">,
  mockEvents?: readonly LLMEvent[]
): Effect.Effect<void, unknown, never> {
  const { config, onEvent } = options;

  const events = runLoop(config);

  const eventsWithCallback = onEvent
    ? events.pipe(Stream.tap((event) => Effect.sync(() => onEvent(event))))
    : events;

  const layers = mockEvents ? createTestLayers(mockEvents) : TestLayers;

  const eventsWithLayers = eventsWithCallback.pipe(Stream.provideLayer(layers));

  return eventsWithLayers.pipe(Stream.runDrain);
}

/**
 * Collect all events from a ralph loop run.
 *
 * Useful for testing to get all emitted events.
 *
 * @param config - Loop configuration
 * @param mockEvents - Optional custom mock events
 * @returns Array of all domain events emitted
 *
 * @example
 * ```typescript
 * const events = await collectEvents(config, mockEvents).pipe(Effect.runPromise);
 * expect(events).toContainEqual({ _tag: "LoopStarted", ... });
 * ```
 */
export function collectEvents(
  config: LoopConfig,
  mockEvents?: readonly LLMEvent[]
): Effect.Effect<readonly DomainEvent[], unknown, never> {
  const events = runLoop(config);
  const layers = mockEvents ? createTestLayers(mockEvents) : TestLayers;

  return events
    .pipe(Stream.provideLayer(layers), Stream.runCollect)
    .pipe(Effect.map((chunk) => Array.from(chunk)));
}

/**
 * Main CLI entry point.
 *
 * Automatically selects TUI for TTY, headless otherwise.
 *
 * @param config - Loop configuration
 * @returns Promise that resolves when the loop completes
 */
export function main(config: LoopConfig): Promise<void> {
  const consumerType: ConsumerType = process.stdout.isTTY ? "tui" : "headless";

  return run({ config, consumer: consumerType }).pipe(Effect.runPromise);
}
