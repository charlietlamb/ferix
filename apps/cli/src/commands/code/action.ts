import { Effect, Layer, Stream } from "effect";
import { humanId } from "human-id";
import {
  createHeadlessConsumer,
  createTUIConsumer,
} from "./consumers/index.js";
import type { DomainEvent, LoopConfig } from "./domain/index.js";
import type { ConsumerType } from "./domain/schemas/program.js";
import {
  createLoggerLayer,
  createProductionLayers,
  ProductionLayers,
} from "./layers/index.js";
import { runLoop } from "./orchestrator/index.js";

/**
 * Generates a human-readable session ID with timestamp for uniqueness.
 * Same format as the session store uses.
 */
function generateSessionId(): string {
  const id = humanId({ separator: "-", capitalize: false });
  return `${id}-${Date.now()}`;
}

/**
 * Options for running the ralph loop program.
 */
interface RunOptions {
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
function run(options: RunOptions): Effect.Effect<void, unknown, never> {
  const { config, consumer: consumerType = "headless", onEvent } = options;

  // Generate session ID if not provided - used for both logging and the loop
  const sessionId = config.sessionId ?? generateSessionId();
  const configWithSession = { ...config, sessionId };

  const events = runLoop(configWithSession);

  const eventsWithCallback = onEvent
    ? events.pipe(Stream.tap((event) => Effect.sync(() => onEvent(event))))
    : events;

  // Use provider-specific layers if a provider is specified in config
  const baseLayers = config.provider
    ? createProductionLayers(config.provider)
    : ProductionLayers;

  // Add logger layer if debug is enabled - uses same session ID as the loop
  const loggerLayer = createLoggerLayer(config.debug ?? false, sessionId);
  const layers = Layer.merge(baseLayers, loggerLayer);

  const eventsWithLayers = eventsWithCallback.pipe(Stream.provideLayer(layers));

  if (consumerType === "none") {
    return eventsWithLayers.pipe(Stream.runDrain);
  }

  const consumer =
    consumerType === "tui" ? createTUIConsumer() : createHeadlessConsumer();

  return consumer.consume(eventsWithLayers);
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
