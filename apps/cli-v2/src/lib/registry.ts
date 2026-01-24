/**
 * Generic registry pattern for extensible handler registration.
 *
 * Registries allow new handlers to be added without modifying existing code,
 * following the Open/Closed Principle.
 */

/**
 * Base handler interface for key-based registries.
 */
export interface KeyedHandler<TKey, TInput, TOutput> {
  readonly key: TKey;
  readonly handle: (input: TInput) => TOutput;
}

/**
 * Base handler interface for pattern-based registries.
 */
export interface PatternHandler<TInput, TOutput> {
  readonly pattern: RegExp;
  readonly handle: (match: RegExpMatchArray, input: TInput) => TOutput;
}

/**
 * Creates a keyed registry for handlers indexed by a discriminant key.
 *
 * @example
 * ```typescript
 * const registry = createKeyedRegistry<string, InputType, OutputType>();
 * registry.register({ key: "MyKey", handle: (input) => processInput(input) });
 * const result = registry.get("MyKey")?.handle(input);
 * ```
 */
export function createKeyedRegistry<TKey, TInput, TOutput>(): {
  register: (handler: KeyedHandler<TKey, TInput, TOutput>) => void;
  get: (key: TKey) => KeyedHandler<TKey, TInput, TOutput> | undefined;
  getAll: () => readonly KeyedHandler<TKey, TInput, TOutput>[];
  handle: (key: TKey, input: TInput) => TOutput | undefined;
} {
  const handlers = new Map<TKey, KeyedHandler<TKey, TInput, TOutput>>();

  return {
    register(handler) {
      handlers.set(handler.key, handler);
    },
    get(key) {
      return handlers.get(key);
    },
    getAll() {
      return Array.from(handlers.values());
    },
    handle(key, input) {
      const handler = handlers.get(key);
      return handler?.handle(input);
    },
  };
}

/**
 * Creates a pattern registry for handlers matched by regex patterns.
 *
 * @example
 * ```typescript
 * const registry = createPatternRegistry<number, string>();
 * registry.register({
 *   pattern: /<tag>([^<]+)<\/tag>/g,
 *   handle: (match, width) => formatTag(match[1], width)
 * });
 * const result = registry.applyAll(line, 80);
 * ```
 */
export function createPatternRegistry<TInput, TOutput extends string>(): {
  register: (handler: PatternHandler<TInput, TOutput>) => void;
  getAll: () => readonly PatternHandler<TInput, TOutput>[];
  applyAll: (text: string, input: TInput) => string;
} {
  const handlers: PatternHandler<TInput, TOutput>[] = [];

  return {
    register(handler) {
      handlers.push(handler);
    },
    getAll() {
      return handlers;
    },
    applyAll(text, input) {
      let result = text;
      for (const { pattern, handle } of handlers) {
        result = result.replace(pattern, (...args) => {
          return handle(args as unknown as RegExpMatchArray, input);
        });
      }
      return result;
    },
  };
}

/**
 * Creates a reducer registry for state reducers indexed by event tag.
 *
 * @example
 * ```typescript
 * const registry = createReducerRegistry<State, DomainEvent>();
 * registry.register({
 *   key: "LoopStarted",
 *   handle: (state, event) => ({ ...state, running: true })
 * });
 * const newState = registry.reduce(state, event);
 * ```
 */
export function createReducerRegistry<
  TState,
  TEvent extends { _tag: string },
>(): {
  register: <T extends TEvent["_tag"]>(handler: {
    readonly key: T;
    readonly handle: (
      state: TState,
      event: Extract<TEvent, { _tag: T }>
    ) => TState;
  }) => void;
  reduce: (state: TState, event: TEvent) => TState;
  getAll: () => ReadonlyArray<{
    readonly key: TEvent["_tag"];
    readonly handle: (state: TState, event: TEvent) => TState;
  }>;
} {
  const handlers = new Map<string, (state: TState, event: TEvent) => TState>();

  return {
    register(handler) {
      handlers.set(
        handler.key,
        handler.handle as (state: TState, event: TEvent) => TState
      );
    },
    reduce(state, event) {
      const handler = handlers.get(event._tag);
      return handler ? handler(state, event) : state;
    },
    getAll() {
      return Array.from(handlers.entries()).map(([key, handle]) => ({
        key: key as TEvent["_tag"],
        handle,
      }));
    },
  };
}

/**
 * Creates a formatter registry for output formatting indexed by event tag.
 *
 * @example
 * ```typescript
 * const registry = createFormatterRegistry<DomainEvent, string | null>();
 * registry.register({
 *   key: "LoopStarted",
 *   format: (event) => `[LOOP] Started - ${event.config.task}`
 * });
 * const output = registry.format(event);
 * ```
 */
export function createFormatterRegistry<
  TEvent extends { _tag: string },
  TOutput,
>(): {
  register: <T extends TEvent["_tag"]>(handler: {
    readonly key: T;
    readonly format: (event: Extract<TEvent, { _tag: T }>) => TOutput;
  }) => void;
  format: (event: TEvent) => TOutput | undefined;
  getAll: () => ReadonlyArray<{
    readonly key: TEvent["_tag"];
    readonly format: (event: TEvent) => TOutput;
  }>;
} {
  const handlers = new Map<string, (event: TEvent) => TOutput>();

  return {
    register(handler) {
      handlers.set(handler.key, handler.format as (event: TEvent) => TOutput);
    },
    format(event) {
      const handler = handlers.get(event._tag);
      return handler?.(event);
    },
    getAll() {
      return Array.from(handlers.entries()).map(([key, format]) => ({
        key: key as TEvent["_tag"],
        format,
      }));
    },
  };
}

/**
 * Creates a mapper registry for transforming one event type to another.
 *
 * @example
 * ```typescript
 * const registry = createMapperRegistry<LLMEvent, DomainEvent>();
 * registry.register({
 *   key: "Text",
 *   map: (event) => ({ _tag: "LLMText", text: event.text })
 * });
 * const mapped = registry.map(llmEvent);
 * ```
 */
export function createMapperRegistry<
  TSource extends { _tag: string },
  TTarget,
>(): {
  register: <T extends TSource["_tag"]>(handler: {
    readonly key: T;
    readonly map: (event: Extract<TSource, { _tag: T }>) => TTarget;
  }) => void;
  map: (event: TSource) => TTarget | undefined;
  getAll: () => ReadonlyArray<{
    readonly key: TSource["_tag"];
    readonly map: (event: TSource) => TTarget;
  }>;
} {
  const handlers = new Map<string, (event: TSource) => TTarget>();

  return {
    register(handler) {
      handlers.set(handler.key, handler.map as (event: TSource) => TTarget);
    },
    map(event) {
      const handler = handlers.get(event._tag);
      return handler?.(event);
    },
    getAll() {
      return Array.from(handlers.entries()).map(([key, map]) => ({
        key: key as TSource["_tag"],
        map,
      }));
    },
  };
}
