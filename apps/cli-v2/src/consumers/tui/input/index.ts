// Import bindings to register them
import "./bindings/navigation.js";
import "./bindings/scroll.js";
import "./bindings/view.js";

export type {
  KeyAction,
  KeyBinding,
  KeyBindingRegistry,
} from "./registry.js";
// Re-export registry and types
export { keyBindingRegistry } from "./registry.js";

// Re-export parsing and handling logic
import { Effect, Ref, Stream } from "effect";
import { FIXED_ROWS, MOUSE_SCROLL_DELTA } from "../constants.js";
import type { TerminalOutput } from "../output/index.js";
import { getMaxOutputOffset } from "../render/output-area.js";
import type { TUIState, ViewMode } from "../state.js";
import { navigate, scroll, scrollTo } from "../state.js";
import { safeRender } from "../utils.js";
import type { KeyAction } from "./registry.js";
import { keyBindingRegistry } from "./registry.js";

// Mouse wheel regex (top-level for performance)
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for mouse parsing
const MOUSE_WHEEL_REGEX = /\x1b\[<(\d+);(\d+);(\d+)[Mm]/;

/**
 * Convert scroll action to navigate for tasks view.
 */
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

/**
 * Parse mouse wheel from SGR format.
 */
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
    return { type: "mouse_wheel", delta: -MOUSE_SCROLL_DELTA };
  }
  if (btn === 65) {
    return { type: "mouse_wheel", delta: MOUSE_SCROLL_DELTA };
  }

  return null;
}

/**
 * Parse key sequence into action.
 */
export function parseKey(data: Buffer, viewMode: ViewMode): KeyAction {
  const key = data.toString();

  // Check registry first
  const registeredAction = keyBindingRegistry.getAction(key, viewMode);
  if (registeredAction) {
    // Handle single escape (not part of sequence) - check length
    if (key === "\x1b" && data.length > 1) {
      // This is an escape sequence, not bare escape
    } else if (registeredAction.type === "scroll" && viewMode === "tasks") {
      return scrollToNavigate(registeredAction);
    } else if (registeredAction.type === "scroll_to" && viewMode === "tasks") {
      return scrollToNavigate(registeredAction);
    } else {
      return registeredAction;
    }
  }

  // Mouse wheel
  const mouseAction = parseMouseWheel(key);
  if (mouseAction) {
    return mouseAction;
  }

  return { type: "none" };
}

/**
 * Apply action to state.
 */
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

/**
 * Main input loop.
 */
export function runInputLoop(
  stateRef: Ref.Ref<TUIState>,
  output: TerminalOutput
): Effect.Effect<void, never, never> {
  const outputHeight = output.getHeight() - FIXED_ROWS;

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
