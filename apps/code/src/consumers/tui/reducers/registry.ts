import type { DomainEvent } from "../../../domain/index.js";
import type { TUIState } from "../../../domain/schemas/tui.js";

/**
 * State reducer interface for TUI state updates.
 */
export interface StateReducer<T extends DomainEvent["_tag"]> {
  readonly tag: T;
  readonly reduce: (
    state: TUIState,
    event: Extract<DomainEvent, { _tag: T }>
  ) => TUIState;
}

/**
 * Registry for TUI state reducers.
 */
export interface StateReducerRegistry {
  register<T extends DomainEvent["_tag"]>(reducer: StateReducer<T>): void;
  reduce(state: TUIState, event: DomainEvent): TUIState;
}

/**
 * Creates the state reducer registry.
 */
export function createStateReducerRegistry(): StateReducerRegistry {
  const reducers = new Map<
    string,
    (state: TUIState, event: DomainEvent) => TUIState
  >();

  return {
    register<T extends DomainEvent["_tag"]>(reducer: StateReducer<T>) {
      reducers.set(
        reducer.tag as string,
        reducer.reduce as (state: TUIState, event: DomainEvent) => TUIState
      );
    },

    reduce(state: TUIState, event: DomainEvent): TUIState {
      const reducer = reducers.get(event._tag);
      return reducer ? reducer(state, event) : state;
    },
  };
}

// Singleton registry instance
export const stateReducerRegistry = createStateReducerRegistry();
