import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import type {
  TUICriterion,
  TUIPhase,
  TUIState,
  TUITask,
} from "../../../../../domain/schemas/tui.js";
import { GitInfo, ProgressBar, Spinner } from "../../../components/index.js";
import { useTheme } from "../../../context/index.js";
import { formatDuration, formatTime } from "../../../util/format.js";
import {
  getCriterionStatusIcon,
  getStatusInfo,
  getTaskStatusIcon,
} from "../../../util/status.js";

interface DetailViewProps {
  readonly state: TUIState;
  readonly height: number;
  readonly width: number;
}

/**
 * Tree drawing characters.
 */
const TREE = {
  middle: "├─",
  last: "└─",
  vertical: "│ ",
  space: "  ",
} as const;

/**
 * Phase row component.
 */
function PhaseRow(props: {
  phase: TUIPhase;
  isLast: boolean;
  isActive: boolean;
}) {
  const { theme } = useTheme();

  const status = () => getTaskStatusIcon(props.phase.status, theme);
  const prefix = () => (props.isLast ? TREE.last : TREE.middle);

  const durationClr = () => {
    switch (props.phase.status) {
      case "done":
        return theme.success;
      case "in_progress":
        return theme.warning;
      default:
        return theme.textGhost;
    }
  };

  return (
    <box flexDirection="column">
      <box
        backgroundColor={props.isActive ? theme.backgroundElement : undefined}
        flexDirection="row"
        height={1}
        paddingLeft={3}
      >
        <text fg={theme.textMuted}>{`${prefix()} `}</text>
        <text fg={status().color}>{`${status().icon} `}</text>
        <text fg={theme.textMuted}>{`[${props.phase.id}] `}</text>
        <text fg={theme.text}>{props.phase.description}</text>
        <box flexGrow={1} />
        <Show when={props.phase.status === "in_progress"}>
          <text> </text>
          <Spinner active={true} />
        </Show>
        <text fg={durationClr()}>
          {`  ${formatDuration(props.phase.startedAt, props.phase.completedAt)}`}
        </text>
      </box>

      <Show when={props.phase.startedAt}>
        {(startedAt) => (
          <box flexDirection="row" height={1} paddingLeft={3}>
            <text fg={theme.textMuted}>
              {`${props.isLast ? TREE.space : TREE.vertical}     `}
            </text>
            <text fg={theme.textMuted}>
              {`${formatTime(startedAt())} → ${props.phase.completedAt ? formatTime(props.phase.completedAt) : "..."}`}
            </text>
          </box>
        )}
      </Show>
    </box>
  );
}

/**
 * Criterion row component.
 */
function CriterionRow(props: { criterion: TUICriterion; isLast: boolean }) {
  const { theme } = useTheme();

  const status = () => getCriterionStatusIcon(props.criterion.status, theme);
  const prefix = () => (props.isLast ? TREE.last : TREE.middle);

  return (
    <box flexDirection="column">
      <box flexDirection="row" height={1} paddingLeft={3}>
        <text fg={theme.textMuted}>{`${prefix()} `}</text>
        <text fg={status().color}>{`${status().icon} `}</text>
        <text fg={theme.textMuted}>{`[${props.criterion.id}] `}</text>
        <text fg={theme.text}>{props.criterion.description}</text>
        <Show when={props.criterion.status === "passed"}>
          <text fg={theme.success}>{" ✓ PASSED"}</text>
        </Show>
        <Show when={props.criterion.status === "failed"}>
          <text fg={theme.error}>{" ✗ FAILED"}</text>
        </Show>
      </box>

      <Show
        when={
          props.criterion.status === "failed" && props.criterion.failureReason
        }
      >
        <box flexDirection="row" height={1} paddingLeft={3}>
          <text fg={theme.textMuted}>
            {`${props.isLast ? TREE.space : TREE.vertical}     `}
          </text>
          <text fg={theme.error}>{`↳ ${props.criterion.failureReason}`}</text>
        </box>
      </Show>
    </box>
  );
}

/**
 * Task header section with backgroundPanel.
 */
function TaskHeader(props: { task: TUITask; width: number }) {
  const { theme } = useTheme();

  const statusInfo = () => getStatusInfo(props.task.status, theme);
  const statusIcon = () => getTaskStatusIcon(props.task.status, theme);

  const phasesDone = () =>
    props.task.phases.filter((p) => p.status === "done").length;
  const criteriaPassed = () =>
    props.task.criteria.filter((c) => c.status === "passed").length;
  const hasProgress = () =>
    props.task.phases.length > 0 || props.task.criteria.length > 0;

  return (
    <box flexDirection="column" width={props.width}>
      <box
        backgroundColor={theme.backgroundPanel}
        height={1}
        paddingLeft={1}
        width={props.width}
      >
        <text attributes={TextAttributes.BOLD} fg={theme.accent}>
          {"▸ "}
        </text>
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {`TASK #${props.task.id}`}
        </text>
      </box>

      <box height={1} paddingLeft={1}>
        <text fg={theme.text}>{props.task.title}</text>
      </box>

      <box height={1} />

      {/* Subtle divider */}
      <box height={1} paddingLeft={1} width={props.width}>
        <text fg={theme.borderSubtle}>
          {"─".repeat(Math.max(0, props.width - 2))}
        </text>
      </box>

      <box height={1} />

      <box flexDirection="row" height={1} paddingLeft={1}>
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {"Status: "}
        </text>
        <text fg={statusIcon().color}>{`${statusIcon().icon} `}</text>
        <text fg={statusInfo().color}>{statusInfo().text}</text>
      </box>

      <Show when={props.task.startedAt}>
        {(startedAt) => (
          <box flexDirection="row" height={1} paddingLeft={1}>
            <text attributes={TextAttributes.BOLD} fg={theme.text}>
              {"Duration: "}
            </text>
            <text fg={theme.info}>
              {formatDuration(startedAt(), props.task.completedAt)}
            </text>
            <text fg={theme.textMuted}>
              {` (${formatTime(startedAt())} → ${props.task.completedAt ? formatTime(props.task.completedAt) : "..."})`}
            </text>
          </box>
        )}
      </Show>

      {/* Progress summary */}
      <Show when={hasProgress()}>
        <box flexDirection="row" height={1} paddingLeft={1}>
          <text attributes={TextAttributes.BOLD} fg={theme.text}>
            {"Progress: "}
          </text>
          <Show when={props.task.phases.length > 0}>
            <ProgressBar
              done={phasesDone()}
              total={props.task.phases.length}
              width={10}
            />
            <text fg={theme.textMuted}>
              {` ${phasesDone()}/${props.task.phases.length} phases`}
            </text>
          </Show>
          <Show
            when={
              props.task.phases.length > 0 && props.task.criteria.length > 0
            }
          >
            <text fg={theme.textGhost}>{" · "}</text>
          </Show>
          <Show when={props.task.criteria.length > 0}>
            <For each={props.task.criteria}>
              {(c) => {
                if (c.status === "passed") {
                  return <text fg={theme.success}>{"●"}</text>;
                }
                if (c.status === "failed") {
                  return <text fg={theme.error}>{"✗"}</text>;
                }
                return <text fg={theme.textDim}>{"○"}</text>;
              }}
            </For>
            <text fg={theme.textMuted}>
              {` ${criteriaPassed()}/${props.task.criteria.length} criteria`}
            </text>
          </Show>
        </box>
      </Show>

      <box height={1} />
    </box>
  );
}

/**
 * Phases section with accent header.
 */
function PhasesSection(props: {
  phases: readonly TUIPhase[];
  currentTaskId?: string;
  taskId: string;
}) {
  const { theme } = useTheme();

  const doneCount = () =>
    props.phases.filter((p) => p.status === "done").length;

  return (
    <Show when={props.phases.length > 0}>
      <box flexDirection="column">
        <box flexDirection="row" height={1} paddingLeft={1}>
          <text attributes={TextAttributes.BOLD} fg={theme.accent}>
            {"▸ Phases:"}
          </text>
          <text fg={theme.textDim}>
            {` ${doneCount()}/${props.phases.length} complete`}
          </text>
        </box>
        <For each={props.phases}>
          {(phase, index) => (
            <PhaseRow
              isActive={
                props.currentTaskId === props.taskId &&
                phase.status === "in_progress"
              }
              isLast={index() === props.phases.length - 1}
              phase={phase}
            />
          )}
        </For>
        <box height={1} />
      </box>
    </Show>
  );
}

/**
 * Criteria section with accent header.
 */
function CriteriaSection(props: { criteria: readonly TUICriterion[] }) {
  const { theme } = useTheme();

  const passedCount = () =>
    props.criteria.filter((c) => c.status === "passed").length;

  return (
    <Show when={props.criteria.length > 0}>
      <box flexDirection="column">
        <box flexDirection="row" height={1} paddingLeft={1}>
          <text attributes={TextAttributes.BOLD} fg={theme.accent}>
            {"▸ Criteria:"}
          </text>
          <text fg={theme.textDim}>
            {` ${passedCount()}/${props.criteria.length} passed`}
          </text>
        </box>
        <For each={props.criteria}>
          {(criterion, index) => (
            <CriterionRow
              criterion={criterion}
              isLast={index() === props.criteria.length - 1}
            />
          )}
        </For>
        <box height={1} />
      </box>
    </Show>
  );
}

/**
 * Detail view component.
 * Shows detailed information about the selected task.
 */
export function DetailView(props: DetailViewProps) {
  const { theme } = useTheme();

  const [scrollboxRef, setScrollboxRef] = createSignal<
    ScrollBoxRenderable | undefined
  >(undefined);

  const task = () => props.state.tasks[props.state.selectedTaskIndex];

  createEffect(() => {
    const ref = scrollboxRef();
    if (ref) {
      ref.scrollTop = props.state.scrollOffset;
    }
  });

  return (
    <Show
      fallback={
        <box height={props.height} paddingLeft={2} width={props.width}>
          <text fg={theme.textDim}>No task selected</text>
        </box>
      }
      when={task()}
    >
      {(currentTask) => (
        <scrollbox
          height={props.height}
          ref={setScrollboxRef}
          scrollY={true}
          width={props.width}
        >
          <box flexDirection="column" width={props.width - 2}>
            <TaskHeader task={currentTask()} width={props.width - 2} />
            <PhasesSection
              currentTaskId={props.state.currentTaskId}
              phases={currentTask().phases}
              taskId={currentTask().id}
            />
            <CriteriaSection criteria={currentTask().criteria} />
            <GitInfo
              showDivider={true}
              state={props.state}
              width={props.width - 2}
            />
          </box>
        </scrollbox>
      )}
    </Show>
  );
}
