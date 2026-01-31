/**
 * Finds the first event with the specified tag.
 *
 * @param events - Array of events with _tag property
 * @param tag - The tag to search for
 * @returns The first matching event, or undefined
 *
 * @example
 * ```typescript
 * const loopStarted = findEvent(events, "LoopStarted");
 * expect(loopStarted).toBeDefined();
 * ```
 */
export function findEvent<T extends { _tag: string }>(
  events: T[],
  tag: string
): T | undefined {
  return events.find((e) => e._tag === tag);
}

/**
 * Finds all events with the specified tag.
 *
 * @param events - Array of events with _tag property
 * @param tag - The tag to search for
 * @returns Array of matching events
 *
 * @example
 * ```typescript
 * const textEvents = findEvents(events, "LLMText");
 * expect(textEvents.length).toBeGreaterThan(0);
 * ```
 */
export function findEvents<T extends { _tag: string }>(
  events: T[],
  tag: string
): T[] {
  return events.filter((e) => e._tag === tag);
}
