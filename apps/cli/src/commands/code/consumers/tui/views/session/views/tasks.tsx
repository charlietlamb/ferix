import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import type { TUIState, TUITask } from "../../../../../domain/schemas/tui.js";
import { GitInfo, ProgressBar, Spinner } from "../../../components/index.js";
import { useTheme } from "../../../context/index.js";
import { formatDuration } from "../../../util/format.js";
import {
  getStatusColor,
  getTaskStatusIcon,
  STATUS_LABELS,
} from "../../../util/status.js";

/**
 * Height of each task row in the scrollbox (2 content lines + 1 padding).
 */
export const TASK_ROW_HEIGHT = 3;

interface TasksViewProps {
  readonly state: TUIState;
  readonly height: number;
  readonly width: number;
}

/**
 * Individual task row component — multi-line layout.
 *
 * Line 1: selection indicator + status icon + title + spacer + duration
 * Line 2: phase progress bar + criteria icons + status label
 */
function TaskRow(props: {
  task: TUITask;
  isSelected: boolean;
  isActive: boolean;
  width: number;
}) {
  const { theme } = useTheme();

  const status = () => getTaskStatusIcon(props.task.status, theme);
  const statusClr = () => getStatusColor(props.task.status, theme);

  const phasesDone = () =>
    props.task.phases.filter((p) => p.status === "done").length;

  const criteriaPassed = () =>
    props.task.criteria.filter((c) => c.status === "passed").length;

  const criteriaIcons = () =>
    props.task.criteria.map((c) => {
      if (c.status === "passed") {
        return { icon: "●", color: theme.success };
      }
      if (c.status === "failed") {
        return { icon: "✗", color: theme.error };
      }
      return { icon: "○", color: theme.textDim };
    });

  const hasMetadata = () =>
    props.task.phases.length > 0 || props.task.criteria.length > 0;

  return (
    <box
      backgroundColor={props.isSelected ? theme.backgroundElement : undefined}
      border={props.isSelected ? ["left"] : undefined}
      borderColor={props.isSelected ? theme.brandGlow : undefined}
      flexDirection="column"
      paddingBottom={1}
      paddingLeft={1}
      width={props.width}
    >
      {/* Line 1: status + title + duration */}
      <box flexDirection="row" height={1}>
        {/* Selection indicator */}
        <text fg={props.isSelected ? theme.brand : theme.background}>
          {props.isSelected ? "▸ " : "  "}
        </text>

        {/* Status icon */}
        <text fg={status().color}>{`${status().icon} `}</text>

        {/* Title */}
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

        <text> </text>
      </box>

      {/* Line 2: progress metadata */}
      <box flexDirection="row" height={1} paddingLeft={4}>
        <Show when={props.task.phases.length > 0}>
          <text fg={theme.textMuted}>{"Phases "}</text>
          <ProgressBar
            done={phasesDone()}
            total={props.task.phases.length}
            width={6}
          />
          <text fg={theme.textMuted}>
            {` ${phasesDone()}/${props.task.phases.length}`}
          </text>
        </Show>

        <Show when={hasMetadata() && props.task.criteria.length > 0}>
          <Show when={props.task.phases.length > 0}>
            <text fg={theme.textGhost}>{" · "}</text>
          </Show>
          <text fg={theme.textMuted}>{"Criteria "}</text>
          <For each={criteriaIcons()}>
            {(c) => <text fg={c.color}>{c.icon}</text>}
          </For>
          <text fg={theme.textMuted}>
            {` ${criteriaPassed()}/${props.task.criteria.length}`}
          </text>
        </Show>

        <Show when={hasMetadata()}>
          <text fg={theme.textGhost}>{" · "}</text>
        </Show>

        <Show when={props.isActive}>
          <Spinner active={true} />
          <text> </text>
        </Show>

        <text fg={statusClr()}>{STATUS_LABELS[props.task.status]}</text>
      </box>
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

  createEffect(() => {
    const ref = scrollboxRef();
    if (ref) {
      const selectedPos = props.state.selectedTaskIndex * TASK_ROW_HEIGHT;
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

  const headerHeight = 2;
  const tasksHeight = () =>
    props.height - headerHeight - (hasGitInfo() ? gitInfoHeight() + 1 : 0);

  return (
    <box flexDirection="column" height={props.height} width={props.width}>
      {/* Header */}
      <box
        backgroundColor={theme.backgroundPanel}
        height={1}
        paddingLeft={1}
        width={props.width}
      >
        <text attributes={TextAttributes.BOLD} fg={theme.accent}>
          {"▸ TASKS"}
        </text>
        <text fg={theme.textGhost}>{` ${props.state.tasks.length}`}</text>
      </box>

      {/* Subtle separator */}
      <box height={1} paddingLeft={1} width={props.width}>
        <text fg={theme.borderSubtle}>
          {"─".repeat(Math.max(0, props.width - 2))}
        </text>
      </box>

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
                  isActive={task.id === props.state.currentTaskId}
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
        <box height={1} paddingLeft={1} width={props.width}>
          <text fg={theme.borderSubtle}>
            {"─".repeat(Math.max(0, props.width - 2))}
          </text>
        </box>
        <GitInfo state={props.state} width={props.width} />
      </Show>
    </box>
  );
}
