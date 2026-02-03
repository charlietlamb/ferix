import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { createMemo, createSignal, Match, Switch } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import type { ViewMode } from "../../../../domain/schemas/tui.js";
import { useTheme } from "../../context/index.js";
import type { MutableTUIState } from "../../util/stream-to-store.js";
import { clamp } from "../../util/text.js";
import { Footer } from "./footer.js";
import { StatusBar } from "./status-bar.js";
import { TaskBar } from "./task-bar.js";
import { DetailView, LogsView, TasksView } from "./views/index.js";

/**
 * Fixed rows: status bar (1) + task bar (1) + footer (1) + borders (2)
 */
const FIXED_ROWS = 5;

interface SessionContentProps {
  readonly store: MutableTUIState;
  readonly setStore: SetStoreFunction<MutableTUIState>;
  readonly onEscape: () => void;
}

/**
 * Shared session content component.
 *
 * Contains all the session rendering and keyboard navigation logic
 * shared between ConsumerSession (action.ts) and SessionView (launcher).
 * Callers handle their own Ctrl+C and stream setup; this component
 * only handles view-mode navigation and Escape via the onEscape callback.
 */
export function SessionContent(props: SessionContentProps) {
  const dimensions = useTerminalDimensions();
  const { theme } = useTheme();

  // Local UI state
  const [viewMode, setViewMode] = createSignal<ViewMode>("logs");
  const [selectedTaskIndex, setSelectedTaskIndex] = createSignal(0);
  const [scrollOffset, setScrollOffset] = createSignal(0);
  const [userScrolled, setUserScrolled] = createSignal(false);

  // Calculate content height
  const contentHeight = createMemo(() => dimensions().height - FIXED_ROWS);

  // Max scroll offset based on current view
  const maxScrollOffset = createMemo(() => {
    switch (viewMode()) {
      case "logs":
        return Math.max(0, props.store.outputLines.length - contentHeight());
      case "tasks":
        return Math.max(0, props.store.tasks.length - contentHeight());
      case "detail": {
        const task = props.store.tasks[selectedTaskIndex()];
        if (!task) {
          return 0;
        }
        const estimatedLines =
          10 + task.phases.length * 2 + task.criteria.length * 2;
        return Math.max(0, estimatedLines - contentHeight());
      }
      default:
        return 0;
    }
  });

  // Construct merged state for sub-components
  const mergedState = () => ({
    ...props.store,
    viewMode: viewMode(),
    selectedTaskIndex: selectedTaskIndex(),
    scrollOffset: scrollOffset(),
    userScrolled: userScrolled(),
  });

  // Handle keyboard input (view-mode navigation only)
  useKeyboard((evt) => {
    const currentViewMode = viewMode();
    const maxOffset = maxScrollOffset();

    switch (currentViewMode) {
      case "logs":
        handleLogsKeyboard(evt, maxOffset);
        break;
      case "tasks":
        handleTasksKeyboard(evt);
        break;
      case "detail":
        handleDetailKeyboard(evt, maxOffset);
        break;
      default:
        break;
    }
  });

  // Keyboard handler for logs view
  const handleLogsKeyboard = (
    evt: { name: string; shift?: boolean; ctrl?: boolean },
    maxOffset: number
  ) => {
    switch (evt.name) {
      case "j":
      case "down": {
        const newOffset = Math.min(scrollOffset() + 1, maxOffset);
        setScrollOffset(newOffset);
        setUserScrolled(true);
        break;
      }

      case "k":
      case "up": {
        const newOffset = Math.max(scrollOffset() - 1, 0);
        setScrollOffset(newOffset);
        setUserScrolled(newOffset > 0);
        break;
      }

      case "d":
        if (evt.ctrl) {
          const halfPage = Math.floor(contentHeight() / 2);
          const newOffset = Math.min(scrollOffset() + halfPage, maxOffset);
          setScrollOffset(newOffset);
          setUserScrolled(true);
        }
        break;

      case "u":
        if (evt.ctrl) {
          const halfPage = Math.floor(contentHeight() / 2);
          const newOffset = Math.max(scrollOffset() - halfPage, 0);
          setScrollOffset(newOffset);
          setUserScrolled(newOffset > 0);
        }
        break;

      case "g":
        if (evt.shift) {
          setScrollOffset(maxOffset);
          setUserScrolled(true);
        } else {
          setScrollOffset(0);
          setUserScrolled(false);
        }
        break;

      case "t":
        setViewMode("tasks");
        setScrollOffset(0);
        setUserScrolled(false);
        break;

      case "escape":
        props.onEscape();
        break;

      default:
        break;
    }
  };

  // Keyboard handler for tasks view
  const handleTasksKeyboard = (evt: {
    name: string;
    shift?: boolean;
    ctrl?: boolean;
  }) => {
    const maxIndex = Math.max(0, props.store.tasks.length - 1);

    switch (evt.name) {
      case "j":
      case "down":
        setSelectedTaskIndex((prev) => Math.min(prev + 1, maxIndex));
        break;

      case "k":
      case "up":
        setSelectedTaskIndex((prev) => Math.max(prev - 1, 0));
        break;

      case "g":
        if (evt.shift) {
          setSelectedTaskIndex(maxIndex);
        } else {
          setSelectedTaskIndex(0);
        }
        break;

      case "return":
        if (props.store.tasks.length > 0) {
          setViewMode("detail");
          setScrollOffset(0);
          setUserScrolled(false);
        }
        break;

      case "escape":
        setViewMode("logs");
        break;

      default:
        break;
    }
  };

  // Keyboard handler for detail view
  const handleDetailKeyboard = (
    evt: { name: string; shift?: boolean; ctrl?: boolean },
    maxOffset: number
  ) => {
    switch (evt.name) {
      case "j":
      case "down":
        setScrollOffset((prev) => clamp(prev + 1, 0, maxOffset));
        setUserScrolled(true);
        break;

      case "k":
      case "up": {
        const newOffset = clamp(scrollOffset() - 1, 0, maxOffset);
        setScrollOffset(newOffset);
        setUserScrolled(newOffset > 0);
        break;
      }

      case "d":
        if (evt.ctrl) {
          const halfPage = Math.floor(contentHeight() / 2);
          setScrollOffset((prev) => clamp(prev + halfPage, 0, maxOffset));
          setUserScrolled(true);
        }
        break;

      case "u":
        if (evt.ctrl) {
          const halfPage = Math.floor(contentHeight() / 2);
          const newOffset = clamp(scrollOffset() - halfPage, 0, maxOffset);
          setScrollOffset(newOffset);
          setUserScrolled(newOffset > 0);
        }
        break;

      case "g":
        if (evt.shift) {
          setScrollOffset(maxOffset);
          setUserScrolled(true);
        } else {
          setScrollOffset(0);
          setUserScrolled(false);
        }
        break;

      case "escape":
        setViewMode("tasks");
        setScrollOffset(0);
        setUserScrolled(false);
        break;

      default:
        break;
    }
  };

  return (
    <box
      backgroundColor={theme.background}
      flexDirection="column"
      height="100%"
      width="100%"
    >
      {/* Status bar */}
      <StatusBar state={mergedState()} width={dimensions().width} />

      {/* Task bar */}
      <TaskBar
        task={props.store.task ?? "Loading..."}
        width={dimensions().width}
      />

      {/* Content area */}
      <Switch>
        <Match when={viewMode() === "logs"}>
          <LogsView
            height={contentHeight()}
            outputLines={props.store.outputLines}
            scrollOffset={scrollOffset()}
            userScrolled={userScrolled()}
            width={dimensions().width}
          />
        </Match>
        <Match when={viewMode() === "tasks"}>
          <TasksView
            height={contentHeight()}
            state={mergedState()}
            width={dimensions().width}
          />
        </Match>
        <Match when={viewMode() === "detail"}>
          <DetailView
            height={contentHeight()}
            state={mergedState()}
            width={dimensions().width}
          />
        </Match>
      </Switch>

      {/* Footer */}
      <Footer
        outputHeight={contentHeight()}
        state={mergedState()}
        width={dimensions().width}
      />
    </box>
  );
}
