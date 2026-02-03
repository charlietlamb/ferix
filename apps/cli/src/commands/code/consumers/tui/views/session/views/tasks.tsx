import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import type {
  TUIState,
  TUITask,
  TUITaskStatus,
} from "../../../../../domain/schemas/tui.js";
import { useTheme } from "../../../context/index.js";

interface TasksViewProps {
  readonly state: TUIState;
  readonly height: number;
  readonly width: number;
}

/**
 * Format duration between two timestamps.
 */
function formatDuration(startedAt?: number, completedAt?: number): string {
  if (!startedAt) {
    return "--:--";
  }
  const endTime = completedAt ?? Date.now();
  const diffMs = endTime - startedAt;
  const minutes = Math.floor(diffMs / 60_000);
  const seconds = Math.floor((diffMs % 60_000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Individual task row component.
 */
function TaskRow(props: { task: TUITask; isSelected: boolean; width: number }) {
  const { theme } = useTheme();

  const STATUS_SYMBOLS: Record<
    TUITaskStatus,
    { icon: string; color: typeof theme.success }
  > = {
    pending: { icon: "○", color: theme.textDim },
    in_progress: { icon: "◐", color: theme.warning },
    done: { icon: "●", color: theme.success },
    failed: { icon: "✗", color: theme.error },
  };

  const status = () =>
    STATUS_SYMBOLS[props.task.status] ?? STATUS_SYMBOLS.pending;

  // Calculate phase progress
  const phaseProgress = () => {
    if (props.task.phases.length === 0) {
      return null;
    }
    const done = props.task.phases.filter((p) => p.status === "done").length;
    return `${done}/${props.task.phases.length}`;
  };

  // Calculate criteria progress
  const criteriaIcons = () => {
    if (props.task.criteria.length === 0) {
      return null;
    }
    return props.task.criteria.map((c) => {
      if (c.status === "passed") {
        return { icon: "●", color: theme.success };
      }
      if (c.status === "failed") {
        return { icon: "✗", color: theme.error };
      }
      return { icon: "○", color: theme.textDim };
    });
  };

  return (
    <box
      backgroundColor={props.isSelected ? theme.backgroundHighlight : undefined}
      flexDirection="row"
      height={1}
      paddingLeft={1}
      width={props.width}
    >
      {/* Selection indicator */}
      <text fg={props.isSelected ? theme.brand : theme.background}>
        {props.isSelected ? "▸ " : "  "}
      </text>

      {/* Task ID */}
      <text fg={theme.text}>{`[${props.task.id}] `}</text>

      {/* Status icon */}
      <text fg={status().color}>{`${status().icon} `}</text>

      {/* Title - flexible width */}
      <text
        attributes={
          props.isSelected ? TextAttributes.BOLD : TextAttributes.NONE
        }
        fg={theme.text}
      >
        {props.task.title}
      </text>

      {/* Spacer */}
      <box flexGrow={1} />

      {/* Duration */}
      <text fg={theme.info}>
        {formatDuration(props.task.startedAt, props.task.completedAt)}
      </text>

      {/* Phase progress */}
      <Show when={phaseProgress()}>
        <text fg={theme.textDim}>{` ${phaseProgress()}`}</text>
      </Show>

      {/* Criteria icons */}
      <Show when={criteriaIcons()}>
        <text> </text>
        <For each={criteriaIcons()}>
          {(c) => <text fg={c.color}>{c.icon}</text>}
        </For>
      </Show>

      <text> </text>
    </box>
  );
}

/**
 * Git info section.
 */
function GitInfo(props: { state: TUIState; width: number }) {
  const { theme } = useTheme();

  return (
    <box flexDirection="column" width={props.width}>
      <Show when={props.state.gitBranch}>
        <box flexDirection="row" height={1} paddingLeft={1}>
          <text fg={theme.brand}>{"▸ "}</text>
          <text attributes={TextAttributes.BOLD} fg={theme.text}>
            GIT
          </text>
          <text fg={theme.textDim}>{" • "}</text>
          <text fg={theme.text}>{props.state.gitBranch}</text>
          <text> </text>
          <Show
            fallback={<text fg={theme.textDim}>Not pushed</text>}
            when={props.state.gitPushed}
          >
            <text fg={theme.success}>{"●"}</text>
          </Show>
        </box>
      </Show>

      <Show when={props.state.prUrl}>
        <box flexDirection="row" height={1} paddingLeft={1}>
          <text fg={theme.brand}>{"▸ "}</text>
          <text attributes={TextAttributes.BOLD} fg={theme.text}>
            PR
          </text>
          <text fg={theme.textDim}>{" • "}</text>
          <text fg={theme.info}>{props.state.prUrl}</text>
        </box>
      </Show>
    </box>
  );
}

/**
 * Tasks view component.
 * Shows a list of tasks with their status, duration, and progress.
 */
export function TasksView(props: TasksViewProps) {
  const { theme } = useTheme();

  const [scrollboxRef, setScrollboxRef] = createSignal<
    ScrollBoxRenderable | undefined
  >(undefined);

  // Auto-scroll to keep selected task visible
  createEffect(() => {
    const ref = scrollboxRef();
    if (ref) {
      const selectedPos = props.state.selectedTaskIndex;
      ref.scrollTop = Math.max(0, selectedPos - Math.floor(props.height / 2));
    }
  });

  const hasGitInfo = () => props.state.gitBranch || props.state.prUrl;
  const gitInfoHeight = () => {
    let h = 0;
    if (props.state.gitBranch) {
      h += 1;
    }
    if (props.state.prUrl) {
      h += 1;
    }
    return h;
  };

  // Header height (title + separator)
  const headerHeight = 3;
  // Available height for tasks
  const tasksHeight = () =>
    props.height - headerHeight - (hasGitInfo() ? gitInfoHeight() + 1 : 0);

  return (
    <box flexDirection="column" height={props.height} width={props.width}>
      {/* Header */}
      <box height={1} paddingLeft={1}>
        <text fg={theme.brand}>{"▸ "}</text>
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          TASKS
        </text>
      </box>

      {/* Separator */}
      <box
        borderColor={theme.border}
        borderStyle="single"
        height={1}
        width={props.width}
      />

      {/* Tasks list */}
      <Show
        fallback={
          <box height={tasksHeight()} paddingLeft={2}>
            <text fg={theme.textDim}>Waiting for tasks...</text>
          </box>
        }
        when={props.state.tasks.length > 0}
      >
        <scrollbox
          height={tasksHeight()}
          ref={setScrollboxRef}
          scrollY={true}
          width={props.width}
        >
          <box flexDirection="column" width={props.width - 2}>
            <For each={props.state.tasks}>
              {(task, index) => (
                <TaskRow
                  isSelected={index() === props.state.selectedTaskIndex}
                  task={task}
                  width={props.width - 2}
                />
              )}
            </For>
          </box>
        </scrollbox>
      </Show>

      {/* Separator before git info */}
      <Show when={hasGitInfo()}>
        <box
          borderColor={theme.border}
          borderStyle="single"
          height={1}
          width={props.width}
        />
        <GitInfo state={props.state} width={props.width} />
      </Show>
    </box>
  );
}
