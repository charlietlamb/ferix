import { Effect, Stream } from "effect";
import type { DomainEvent } from "../../domain/events.js";
import type { Consumer } from "../types.js";
import { TUIRenderer } from "./renderer.js";

/**
 * Creates a TUI consumer that renders events to a full-screen terminal interface.
 *
 * The TUI provides:
 * - Header with task and iteration info
 * - Status bar with current phase and tool
 * - Scrollable output area
 * - Footer with help text
 *
 * Uses ANSI escape codes for terminal control (alternate buffer, cursor hiding, etc).
 *
 * @returns A Consumer that renders to the terminal
 *
 * @example
 * ```typescript
 * const consumer = createTUIConsumer();
 * const events = runLoop(config).pipe(Stream.provideLayer(layers));
 * await consumer.consume(events).pipe(Effect.runPromise);
 * ```
 */
export function createTUIConsumer(): Consumer {
  return {
    consume: (events: Stream.Stream<DomainEvent, unknown, never>) =>
      Effect.acquireUseRelease(
        Effect.sync(() => {
          const renderer = new TUIRenderer();
          renderer.enterAlternateBuffer();
          renderer.hideCursor();
          return renderer;
        }),

        (renderer) =>
          events.pipe(
            Stream.runForEach((event) =>
              Effect.sync(() => renderer.render(event))
            )
          ),

        (renderer) =>
          Effect.sync(() => {
            renderer.showCursor();
            renderer.exitAlternateBuffer();
          })
      ),
  };
}
