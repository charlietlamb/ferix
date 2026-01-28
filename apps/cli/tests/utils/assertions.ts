import { expect } from "bun:test";
import { Cause, Effect, Exit, Option } from "effect";

/**
 * Runs an Effect and expects it to succeed, returning the success value.
 *
 * @param effect - The Effect to run
 * @returns The success value
 * @throws If the Effect fails
 *
 * @example
 * ```typescript
 * const result = await expectEffectSuccess(myEffect);
 * expect(result).toBe(expectedValue);
 * ```
 */
export async function expectEffectSuccess<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected success but got failure: ${Cause.pretty(exit.cause)}`
    );
  }
  return exit.value;
}

/**
 * Runs an Effect and expects it to fail, returning the error value.
 *
 * @param effect - The Effect to run
 * @param errorTag - Optional: expected error tag for tagged errors
 * @returns The error value
 * @throws If the Effect succeeds or fails with wrong error type
 *
 * @example
 * ```typescript
 * const error = await expectEffectFailure(myEffect, "ValidationError");
 * expect(error.message).toContain("invalid");
 * ```
 */
export async function expectEffectFailure<A, E>(
  effect: Effect.Effect<A, E, never>,
  errorTag?: string
): Promise<E> {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) {
    throw new Error(
      `Expected failure but got success: ${JSON.stringify(exit.value)}`
    );
  }

  const error = Cause.failureOption(exit.cause);
  if (Option.isNone(error)) {
    throw new Error(
      `Expected failure but got defect: ${Cause.pretty(exit.cause)}`
    );
  }

  if (errorTag) {
    const actualTag = (error.value as { _tag?: string })?._tag;
    if (actualTag !== errorTag) {
      throw new Error(
        `Expected error tag "${errorTag}" but got "${actualTag}"`
      );
    }
  }

  return error.value;
}

/**
 * Runs an Effect and expects it to cause a defect (throw).
 *
 * @param effect - The Effect to run
 * @returns The defect cause
 * @throws If the Effect succeeds or fails normally
 */
export async function expectEffectDefect<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<unknown> {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) {
    throw new Error(
      `Expected defect but got success: ${JSON.stringify(exit.value)}`
    );
  }

  const defect = Cause.defectOption(exit.cause);
  if (Option.isNone(defect)) {
    throw new Error(
      `Expected defect but got failure: ${Cause.pretty(exit.cause)}`
    );
  }

  return defect.value;
}

/**
 * Asserts that an array of tagged events matches the expected tag sequence.
 *
 * @param events - Array of events with _tag property
 * @param expectedTags - Expected sequence of tags
 *
 * @example
 * ```typescript
 * expectEventSequence(events, [
 *   "LoopStarted",
 *   "IterationStarted",
 *   "LLMText",
 *   "IterationCompleted",
 *   "LoopCompleted",
 * ]);
 * ```
 */
export function expectEventSequence<T extends { _tag: string }>(
  events: T[],
  expectedTags: string[]
): void {
  const actualTags = events.map((e) => e._tag);
  expect(actualTags).toEqual(expectedTags);
}

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

/**
 * Asserts that events contain at least one event with each specified tag.
 *
 * @param events - Array of events with _tag property
 * @param requiredTags - Tags that must be present
 *
 * @example
 * ```typescript
 * expectEventsContain(events, ["LoopStarted", "LoopCompleted"]);
 * ```
 */
export function expectEventsContain<T extends { _tag: string }>(
  events: T[],
  requiredTags: string[]
): void {
  const actualTags = new Set(events.map((e) => e._tag));
  for (const tag of requiredTags) {
    expect(actualTags.has(tag)).toBe(true);
  }
}

/**
 * Asserts that events do not contain any event with the specified tags.
 *
 * @param events - Array of events with _tag property
 * @param excludedTags - Tags that must not be present
 */
export function expectEventsExclude<T extends { _tag: string }>(
  events: T[],
  excludedTags: string[]
): void {
  const actualTags = new Set(events.map((e) => e._tag));
  for (const tag of excludedTags) {
    expect(actualTags.has(tag)).toBe(false);
  }
}

/**
 * Asserts that an event with a specific tag appears before another.
 *
 * @param events - Array of events with _tag property
 * @param firstTag - The tag that should appear first
 * @param secondTag - The tag that should appear second
 */
export function expectEventOrder<T extends { _tag: string }>(
  events: T[],
  firstTag: string,
  secondTag: string
): void {
  const firstIndex = events.findIndex((e) => e._tag === firstTag);
  const secondIndex = events.findIndex((e) => e._tag === secondTag);

  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeGreaterThanOrEqual(0);
  expect(firstIndex).toBeLessThan(secondIndex);
}

/**
 * Counts events with a specific tag.
 *
 * @param events - Array of events with _tag property
 * @param tag - The tag to count
 * @returns Number of matching events
 */
export function countEvents<T extends { _tag: string }>(
  events: T[],
  tag: string
): number {
  return events.filter((e) => e._tag === tag).length;
}

/**
 * Type guard to narrow an event to a specific type by tag.
 *
 * @param event - The event to check
 * @param tag - The expected tag
 * @returns True if the event has the specified tag
 *
 * @example
 * ```typescript
 * const event = findEvent(events, "PlanCreated");
 * if (event && hasTag(event, "PlanCreated")) {
 *   // event is now narrowed to PlanCreated type
 *   expect(event.plan.tasks.length).toBe(2);
 * }
 * ```
 */
export function hasTag<T extends { _tag: string }, Tag extends string>(
  event: T,
  tag: Tag
): event is T & { _tag: Tag } {
  return event._tag === tag;
}
