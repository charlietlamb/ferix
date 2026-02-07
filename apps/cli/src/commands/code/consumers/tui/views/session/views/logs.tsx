import type { ScrollBoxRenderable } from "@opentui/core";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import type { TUITask } from "../../../../../domain/schemas/tui.js";
import { StyledLine } from "../../../components/index.js";
import { useTheme } from "../../../context/index.js";
import { styleFerixTags } from "../../../tags/index.js";
import { taskLine } from "../../../tags/primitives.js";

interface LogsViewProps {
  readonly outputLines: readonly string[];
  readonly tasks: readonly TUITask[];
  readonly scrollOffset: number;
  readonly userScrolled: boolean;
  readonly height: number;
  readonly width: number;
}

/** Marker text emitted by task-block tag handler */
const TASK_BLOCK_MARKER = "__TASK_BLOCK__";

/**
 * Renders all tasks as compact inline lines.
 * Each task renders as: ◆ [id] title
 */
function TaskBlockInline(props: {
  readonly tasks: readonly TUITask[];
  readonly width: number;
}) {
  return (
    <For each={props.tasks}>
      {(task) => (
        <box paddingLeft={1}>
          <StyledLine
            chunks={taskLine(task.id, task.title, props.width)}
            maxWidth={props.width}
          />
        </box>
      )}
    </For>
  );
}

/**
 * Single log line component.
 * Extracted to avoid reactivity issues with styleFerixTags inside For callback.
 * Skips rendering for hidden tags (empty chunks) to prevent blank lines.
 * Also skips rendering if all chunks are empty/whitespace-only.
 * Detects task-block marker to delegate to TaskBlockInline.
 */
function LogLine(props: {
  readonly line: string;
  readonly width: number;
  readonly tasks: readonly TUITask[];
}) {
  const chunks = () => styleFerixTags(props.line || " ", props.width);

  // Check if this is a task-block marker
  const isTaskBlock = () =>
    chunks().length === 1 && chunks()[0]?.text === TASK_BLOCK_MARKER;

  // Check if there is any visible content (non-empty, non-whitespace text)
  const hasVisibleContent = () => {
    const c = chunks();
    if (c.length === 0) {
      return false;
    }
    return c.some((chunk) => chunk.text.trim().length > 0);
  };

  return (
    <Show when={hasVisibleContent()}>
      <Show
        fallback={
          <box paddingLeft={1}>
            <StyledLine chunks={chunks()} maxWidth={props.width} />
          </box>
        }
        when={isTaskBlock()}
      >
        <TaskBlockInline tasks={props.tasks} width={props.width} />
      </Show>
    </Show>
  );
}

/**
 * Logs view component.
 * Displays scrollable output lines with auto-scroll behavior and ferix tag styling.
 */
export function LogsView(props: LogsViewProps) {
  const { theme } = useTheme();

  const [scrollboxRef, setScrollboxRef] = createSignal<
    ScrollBoxRenderable | undefined
  >(undefined);

  // Calculate the total content height
  const totalLines = () => props.outputLines.length;
  const maxScroll = () => Math.max(0, totalLines() - props.height);

  // Auto-scroll when new content arrives and user hasn't scrolled
  createEffect(
    on(
      () => props.outputLines.length,
      () => {
        const ref = scrollboxRef();
        if (!props.userScrolled && ref) {
          ref.scrollTop = maxScroll();
        }
      }
    )
  );

  // Update scroll position when scrollOffset changes from parent
  createEffect(() => {
    const ref = scrollboxRef();
    if (ref) {
      ref.scrollTop = props.scrollOffset;
    }
  });

  // Available width for content (accounting for scrollbox padding)
  const contentWidth = () => props.width - 2;

  return (
    <scrollbox
      height={props.height}
      ref={setScrollboxRef}
      scrollY={true}
      width={props.width}
    >
      <box flexDirection="column" width={contentWidth()}>
        <Show
          fallback={
            <box paddingLeft={2} paddingTop={1}>
              <text fg={theme.textMuted}>Waiting for output...</text>
            </box>
          }
          when={props.outputLines.length > 0}
        >
          <For each={props.outputLines}>
            {(line) => (
              <LogLine line={line} tasks={props.tasks} width={contentWidth()} />
            )}
          </For>
        </Show>
      </box>
    </scrollbox>
  );
}
