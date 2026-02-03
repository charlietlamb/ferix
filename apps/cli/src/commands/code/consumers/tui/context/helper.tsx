import {
  type Accessor,
  createContext,
  createMemo,
  type ParentProps,
  Show,
  useContext,
} from "solid-js";

/**
 * Factory for creating simple context providers with consistent patterns.
 *
 * This pattern, borrowed from OpenCode, provides:
 * - Type-safe context creation
 * - Automatic "ready" state handling (optional)
 * - Consistent error messages for missing providers
 *
 * @param input.name - Context name for error messages
 * @param input.init - Initialization function that returns the context value
 * @param input.gate - Whether to gate children rendering on ready state (default: true)
 *                     Set to false to bypass the Show component wrapper
 *
 * @example
 * ```tsx
 * const { use: useTheme, provider: ThemeProvider } = createSimpleContext({
 *   name: "Theme",
 *   init: (props: { mode: "dark" | "light" }) => ({
 *     mode: props.mode,
 *     colors: getColors(props.mode),
 *   }),
 * });
 * ```
 */
export function createSimpleContext<
  T,
  Props extends Record<string, unknown>,
>(input: {
  name: string;
  init: ((input: Props) => T) | (() => T);
  gate?: boolean;
}) {
  const ctx = createContext<T>();

  return {
    provider: (props: ParentProps<Props>) => {
      const init = input.init(props);
      const gate = input.gate ?? true;

      // If gating is disabled, render children directly without Show wrapper
      // This avoids memo computation issues when children write to signals
      if (!gate) {
        return <ctx.Provider value={init}>{props.children}</ctx.Provider>;
      }

      // Use createMemo to properly isolate the ready check computation
      // This prevents the ready evaluation from affecting child rendering context
      const isReady = createMemo(() => {
        const ready = (init as T & { ready?: Accessor<boolean> | boolean })
          .ready;
        return (
          ready === undefined || (typeof ready === "function" ? ready() : ready)
        );
      });

      return (
        <Show when={isReady()}>
          <ctx.Provider value={init}>{props.children}</ctx.Provider>
        </Show>
      );
    },
    use() {
      const value = useContext(ctx);
      if (!value) {
        throw new Error(
          `${input.name} context must be used within a context provider`
        );
      }
      return value;
    },
  };
}
