import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { createEffect, createSignal, For, Show } from "solid-js";
import type {
  TUICriterion,
  TUIPhase,
  TUIState,
  TUITask,
} from "../../../../../domain/schemas/tui.js";
import { useTheme } from "../../../context/index.js";

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
 * Format a timestamp as HH:MM:SS.
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Get status display info.
 */
function getStatusInfo(
  status: string,
  themeColors: ReturnType<typeof useTheme>["theme"]
): {
  text: string;
  color: typeof themeColors.success;
} {
  switch (status) {
    case "done":
    case "passed":
      return { text: "Done", color: themeColors.success };
    case "in_progress":
      return { text: "In Progress", color: themeColors.warning };
    case "failed":
      return { text: "Failed", color: themeColors.error };
    default:
      return { text: "Pending", color: themeColors.textDim };
  }
}

/**
 * Phase row component.
 */
function PhaseRow(props: { phase: TUIPhase; isLast: boolean }) {
  const { theme } = useTheme();

  const STATUS_ICONS = {
    pending: { icon: "○", color: theme.textDim },
    in_progress: { icon: "◐", color: theme.warning },
    done: { icon: "●", color: theme.success },
    failed: { icon: "✗", color: theme.error },
  } as const;

  const status = () =>
    STATUS_ICONS[props.phase.status as keyof typeof STATUS_ICONS] ??
    STATUS_ICONS.pending;
  const prefix = () => (props.isLast ? TREE.last : TREE.middle);

  return (
    <box flexDirection="column">
      <box flexDirection="row" height={1} paddingLeft={3}>
        <text fg={theme.textDim}>{`${prefix()} `}</text>
        <text fg={status().color}>{`${status().icon} `}</text>
        <text fg={theme.textDim}>{`[${props.phase.id}] `}</text>
        <text fg={theme.text}>{props.phase.description}</text>
        <Show when={props.phase.startedAt}>
          <text fg={theme.info}>
            {`  ${formatDuration(props.phase.startedAt, props.phase.completedAt)}`}
          </text>
        </Show>
      </box>

      <Show when={props.phase.startedAt}>
        {(startedAt) => (
          <box flexDirection="row" height={1} paddingLeft={3}>
            <text fg={theme.textDim}>
              {`${props.isLast ? TREE.space : TREE.vertical}     `}
            </text>
            <text fg={theme.textDim}>
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

  const STATUS_ICONS = {
    pending: { icon: "○", color: theme.textDim },
    passed: { icon: "●", color: theme.success },
    failed: { icon: "✗", color: theme.error },
  } as const;

  const status = () =>
    STATUS_ICONS[props.criterion.status as keyof typeof STATUS_ICONS] ??
    STATUS_ICONS.pending;
  const prefix = () => (props.isLast ? TREE.last : TREE.middle);

  return (
    <box flexDirection="column">
      <box flexDirection="row" height={1} paddingLeft={3}>
        <text fg={theme.textDim}>{`${prefix()} `}</text>
        <text fg={status().color}>{`${status().icon} `}</text>
        <text fg={theme.textDim}>{`[${props.criterion.id}] `}</text>
        <text fg={theme.text}>{props.criterion.description}</text>
      </box>

      <Show
        when={
          props.criterion.status === "failed" && props.criterion.failureReason
        }
      >
        <box flexDirection="row" height={1} paddingLeft={3}>
          <text fg={theme.textDim}>
            {`${props.isLast ? TREE.space : TREE.vertical}     `}
          </text>
          <text fg={theme.error}>{`↳ ${props.criterion.failureReason}`}</text>
        </box>
      </Show>
    </box>
  );
}

/**
 * Task header section.
 */
function TaskHeader(props: { task: TUITask; width: number }) {
  const { theme } = useTheme();

  const STATUS_ICONS = {
    pending: { icon: "○", color: theme.textDim },
    in_progress: { icon: "◐", color: theme.warning },
    done: { icon: "●", color: theme.success },
    failed: { icon: "✗", color: theme.error },
  } as const;

  const statusInfo = () => getStatusInfo(props.task.status, theme);
  const statusIcon = () =>
    STATUS_ICONS[props.task.status as keyof typeof STATUS_ICONS] ??
    STATUS_ICONS.pending;

  return (
    <box flexDirection="column" width={props.width}>
      <box height={1} paddingLeft={1}>
        <text fg={theme.brand}>{"▸ "}</text>
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {`TASK #${props.task.id}`}
        </text>
      </box>

      <box height={1} paddingLeft={1}>
        <text fg={theme.text}>{props.task.title}</text>
      </box>

      <box height={1} />

      <box
        borderColor={theme.border}
        borderStyle="single"
        height={1}
        width={props.width}
      />

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
            <text fg={theme.textDim}>
              {` (${formatTime(startedAt())} → ${props.task.completedAt ? formatTime(props.task.completedAt) : "..."})`}
            </text>
          </box>
        )}
      </Show>

      <box height={1} />
    </box>
  );
}

/**
 * Phases section.
 */
function PhasesSection(props: { phases: readonly TUIPhase[] }) {
  const { theme } = useTheme();

  return (
    <Show when={props.phases.length > 0}>
      <box flexDirection="column">
        <box height={1} paddingLeft={1}>
          <text attributes={TextAttributes.BOLD} fg={theme.text}>
            Phases:
          </text>
        </box>
        <For each={props.phases}>
          {(phase, index) => (
            <PhaseRow
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
 * Criteria section.
 */
function CriteriaSection(props: { criteria: readonly TUICriterion[] }) {
  const { theme } = useTheme();

  return (
    <Show when={props.criteria.length > 0}>
      <box flexDirection="column">
        <box height={1} paddingLeft={1}>
          <text attributes={TextAttributes.BOLD} fg={theme.text}>
            Criteria:
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
 * Git info section.
 */
function GitSection(props: { state: TUIState; width: number }) {
  const { theme } = useTheme();

  return (
    <Show when={props.state.gitBranch}>
      <box flexDirection="column" width={props.width}>
        <box
          borderColor={theme.border}
          borderStyle="single"
          height={1}
          width={props.width}
        />

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
            <PhasesSection phases={currentTask().phases} />
            <CriteriaSection criteria={currentTask().criteria} />
            <GitSection state={props.state} width={props.width - 2} />
          </box>
        </scrollbox>
      )}
    </Show>
  );
}
