import { Effect, Ref, Stream } from "effect";
import type { TerminalOutput } from "./output.js";
import { render } from "./render/index.js";
import { getMaxOutputOffset } from "./render/output-area.js";
import type { TUIState, ViewMode } from "./state.js";
import { navigate, scroll, scrollTo } from "./state.js";

/**
 * Safe wrapper for render that catches exceptions and logs to stderr.
 * This prevents render crashes from silently killing the TUI.
 */
function safeRender(state: TUIState, output: TerminalOutput): void {
  try {
    render(state, output);
  } catch (err) {
    process.stderr.write(`Render error: ${err}\n`);
  }
}

// Key action types
export type KeyAction =
  | { readonly type: "quit" }
  | {
      readonly type: "scroll";
      readonly direction: "up" | "down";
      readonly lines: number;
    }
  | { readonly type: "scroll_to"; readonly position: "top" | "bottom" }
  | {
      readonly type: "navigate";
      readonly direction: "next" | "prev" | "first" | "last";
    }
  | { readonly type: "select" }
  | { readonly type: "switch_view"; readonly view: ViewMode }
  | { readonly type: "back" }
  | { readonly type: "mouse_wheel"; readonly delta: number }
  | { readonly type: "none" };

// Key mappings for simple keys
const SIMPLE_KEY_ACTIONS: Record<string, KeyAction> = {
  "\x03": { type: "quit" }, // Ctrl+C
  j: { type: "scroll", direction: "down", lines: 1 },
  k: { type: "scroll", direction: "up", lines: 1 },
  g: { type: "scroll_to", position: "top" },
  G: { type: "scroll_to", position: "bottom" },
  "\x1b[A": { type: "scroll", direction: "up", lines: 1 }, // Up arrow
  "\x1b[B": { type: "scroll", direction: "down", lines: 1 }, // Down arrow
  "\x1b[5~": { type: "scroll", direction: "up", lines: 10 }, // Page up
  "\x1b[6~": { type: "scroll", direction: "down", lines: 10 }, // Page down
  "\x1b[H": { type: "scroll_to", position: "top" }, // Home
  "\x1b[1~": { type: "scroll_to", position: "top" }, // Home alt
  "\x1b[F": { type: "scroll_to", position: "bottom" }, // End
  "\x1b[4~": { type: "scroll_to", position: "bottom" }, // End alt
};

// Mouse wheel regex (top-level for performance)
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for mouse parsing
const MOUSE_WHEEL_REGEX = /\x1b\[<(\d+);(\d+);(\d+)[Mm]/;

// Convert scroll action to navigate for tasks view
function scrollToNavigate(action: KeyAction): KeyAction {
  if (action.type === "scroll") {
    return {
      type: "navigate",
      direction: action.direction === "up" ? "prev" : "next",
    };
  }
  if (action.type === "scroll_to") {
    return {
      type: "navigate",
      direction: action.position === "top" ? "first" : "last",
    };
  }
  return action;
}

// Parse mouse wheel from SGR format
function parseMouseWheel(key: string): KeyAction | null {
  const mouseMatch = key.match(MOUSE_WHEEL_REGEX);
  if (!mouseMatch) {
    return null;
  }

  const btnStr = mouseMatch[1];
  if (!btnStr) {
    return null;
  }

  const btn = Number.parseInt(btnStr, 10);
  if (btn === 64) {
    return { type: "mouse_wheel", delta: -3 };
  }
  if (btn === 65) {
    return { type: "mouse_wheel", delta: 3 };
  }

  return null;
}

// Parse key sequence into action
export function parseKey(data: Buffer, viewMode: ViewMode): KeyAction {
  const key = data.toString();

  // Check simple key mappings first
  const simpleAction = SIMPLE_KEY_ACTIONS[key];
  if (simpleAction) {
    // Convert scroll to navigate for tasks view
    if (viewMode === "tasks") {
      return scrollToNavigate(simpleAction);
    }
    return simpleAction;
  }

  // Escape - go back (only if single escape, not part of sequence)
  if (key === "\x1b" && data.length === 1) {
    return { type: "back" };
  }

  // View-specific keys
  if (viewMode === "logs" && key === "t") {
    return { type: "switch_view", view: "tasks" };
  }

  if (viewMode === "tasks" && (key === "\r" || key === "\n")) {
    return { type: "select" };
  }

  // Mouse wheel
  const mouseAction = parseMouseWheel(key);
  if (mouseAction) {
    return mouseAction;
  }

  return { type: "none" };
}

// Apply action to state
export function applyAction(
  state: TUIState,
  action: KeyAction,
  outputHeight: number
): TUIState {
  const maxOffset = getMaxOutputOffset(state.outputLines.length, outputHeight);

  switch (action.type) {
    case "scroll":
      return scroll(state, action.direction, action.lines, maxOffset);

    case "scroll_to":
      return scrollTo(state, action.position, maxOffset);

    case "navigate":
      return navigate(state, action.direction);

    case "select":
      if (state.viewMode === "tasks" && state.tasks.length > 0) {
        return { ...state, viewMode: "detail" };
      }
      return state;

    case "switch_view":
      return { ...state, viewMode: action.view };

    case "back":
      if (state.viewMode === "detail") {
        return { ...state, viewMode: "tasks" };
      }
      if (state.viewMode === "tasks") {
        return { ...state, viewMode: "logs" };
      }
      return state;

    case "mouse_wheel":
      if (state.viewMode === "tasks") {
        return navigate(state, action.delta < 0 ? "prev" : "next");
      }
      return scroll(
        state,
        action.delta < 0 ? "up" : "down",
        Math.abs(action.delta),
        maxOffset
      );

    default:
      return state;
  }
}

// Enable raw mode for keyboard input
function enableRawMode(): Effect.Effect<void> {
  return Effect.sync(() => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
    }
  });
}

// Disable raw mode
function disableRawMode(): Effect.Effect<void> {
  return Effect.sync(() => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  });
}

// Create stdin stream
function createStdinStream(): Stream.Stream<Buffer, never, never> {
  return Stream.async<Buffer>((emit) => {
    const onData = (data: Buffer) => {
      emit.single(data);
    };

    process.stdin.on("data", onData);

    return Effect.sync(() => {
      process.stdin.off("data", onData);
    });
  });
}

// Main input loop
export function runInputLoop(
  stateRef: Ref.Ref<TUIState>,
  output: TerminalOutput
): Effect.Effect<void, never, never> {
  const outputHeight = output.getHeight() - 6; // FIXED_ROWS

  return Effect.gen(function* () {
    yield* enableRawMode();

    const stdinStream = createStdinStream();

    yield* stdinStream.pipe(
      Stream.runForEach((data) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const action = parseKey(data, currentState.viewMode);

          if (action.type === "quit") {
            yield* Effect.interrupt;
          }

          if (action.type !== "none") {
            const newState = applyAction(currentState, action, outputHeight);
            yield* Ref.set(stateRef, newState);
            yield* Effect.sync(() => safeRender(newState, output));
          }
        })
      )
    );
  }).pipe(Effect.ensuring(disableRawMode()));
}
