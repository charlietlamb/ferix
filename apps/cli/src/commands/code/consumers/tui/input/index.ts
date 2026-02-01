// Import bindings to register them
import "./bindings/navigation.js";
import "./bindings/scroll.js";
import "./bindings/view.js";
// Re-export registry and types

// Re-export parsing and handling logic
import { Data, Effect, Ref, Stream } from "effect";
import type { TUIState, ViewMode } from "../../../domain/schemas/tui.js";
import { FIXED_ROWS, MOUSE_SCROLL_DELTA } from "../constants.js";
import type { TerminalOutput } from "../output/index.js";
import { getMaxOutputOffset } from "../render/output-area.js";
import { getTaskDetailTotalLines } from "../render/task-detail.js";
import { navigate, scroll, scrollTo } from "../state.js";
import { safeRender } from "../utils.js";
import type { KeyAction } from "./registry.js";
import { keyBindingRegistry } from "./registry.js";

/**
 * Result from the input loop.
 */
export type InputLoopResult = "quit" | "back_to_launcher";

/**
 * Signal error for back to launcher.
 */
export class BackToLauncherSignal extends Data.TaggedError(
  "BackToLauncherSignal"
)<Record<string, never>> {}

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
function parseKey(data: Buffer, viewMode: ViewMode): KeyAction {
  const key = data.toString();

  // Check registry first
  const registeredAction = keyBindingRegistry.getAction(key, viewMode);
  if (registeredAction) {
    // Convert scroll actions to navigate in tasks view
    if (registeredAction.type === "scroll" && viewMode === "tasks") {
      return scrollToNavigate(registeredAction);
    }
    if (registeredAction.type === "scroll_to" && viewMode === "tasks") {
      return scrollToNavigate(registeredAction);
    }
    return registeredAction;
  }

  // Mouse wheel
  const mouseAction = parseMouseWheel(key);
  if (mouseAction) {
    return mouseAction;
  }

  return { type: "none" };
}

/**
 * Calculate max scroll offset based on view mode.
 */
function getMaxOffsetForView(
  state: TUIState,
  viewHeight: number,
  terminalWidth: number
): number {
  switch (state.viewMode) {
    case "logs":
      return getMaxOutputOffset(state.outputLines.length, viewHeight);
    case "detail":
      return Math.max(
        0,
        getTaskDetailTotalLines(state, terminalWidth) - viewHeight
      );
    case "tasks":
      // Tasks view uses navigation, not scrolling
      return 0;
    default:
      return 0;
  }
}

/**
 * Apply action to state.
 */
function applyAction(
  state: TUIState,
  action: KeyAction,
  outputHeight: number,
  terminalWidth: number
): TUIState {
  const maxOffset = getMaxOffsetForView(state, outputHeight, terminalWidth);

  switch (action.type) {
    case "scroll":
      return scroll(state, action.direction, action.lines, maxOffset);

    case "scroll_to":
      return scrollTo(state, action.position, maxOffset);

    case "navigate":
      return navigate(state, action.direction);

    case "select":
      if (state.viewMode === "tasks" && state.tasks.length > 0) {
        return {
          ...state,
          viewMode: "detail",
          scrollOffset: 0,
          userScrolled: false,
        };
      }
      return state;

    case "switch_view":
      return {
        ...state,
        viewMode: action.view,
        scrollOffset: 0,
        userScrolled: false,
      };

    case "back":
      if (state.viewMode === "detail") {
        return {
          ...state,
          viewMode: "tasks",
          scrollOffset: 0,
          userScrolled: false,
        };
      }
      if (state.viewMode === "tasks") {
        return {
          ...state,
          viewMode: "logs",
          scrollOffset: 0,
          userScrolled: false,
        };
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
 * Returns the reason for exiting: "quit" (Ctrl+C) or "back_to_launcher" (Escape from logs).
 */
export function runInputLoop(
  stateRef: Ref.Ref<TUIState>,
  output: TerminalOutput
): Effect.Effect<InputLoopResult, BackToLauncherSignal, never> {
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

          if (action.type === "back_to_launcher") {
            yield* Effect.fail(new BackToLauncherSignal({}));
          }

          if (action.type !== "none") {
            // Calculate dimensions dynamically to handle terminal resizes
            const outputHeight = output.getHeight() - FIXED_ROWS;
            const terminalWidth = output.getWidth();
            const newState = applyAction(
              currentState,
              action,
              outputHeight,
              terminalWidth
            );
            yield* Ref.set(stateRef, newState);
            yield* Effect.sync(() => safeRender(newState, output));
          }
        })
      )
    );

    return "quit" as InputLoopResult;
  }).pipe(Effect.ensuring(disableRawMode()));
}
