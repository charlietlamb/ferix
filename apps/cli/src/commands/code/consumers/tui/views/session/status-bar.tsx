import { TextAttributes } from "@opentui/core";
import { Show } from "solid-js";
import type {
  ExecutionMode,
  TUIState,
} from "../../../../domain/schemas/tui.js";
import { useTheme } from "../../context/index.js";
import { formatElapsedTime } from "../../util/text.js";

interface StatusBarProps {
  readonly state: TUIState;
  readonly width: number;
}

/**
 * Get the display text and color for an execution mode.
 */
function getModeDisplay(
  mode: ExecutionMode,
  taskId: string | undefined,
  themeColors: ReturnType<typeof useTheme>["theme"]
) {
  const taskSuffix = taskId ? ` #${taskId}` : "";

  switch (mode) {
    case "breakdown":
      return { text: `BREAKDOWN${taskSuffix}`, color: themeColors.text };
    case "planning":
      return { text: `PLAN${taskSuffix}`, color: themeColors.info };
    case "working":
      return { text: `WORK${taskSuffix}`, color: themeColors.success };
    case "checking":
      return { text: `CHECK${taskSuffix}`, color: themeColors.warning };
    case "verifying":
      return { text: `VERIFY${taskSuffix}`, color: themeColors.warning };
    case "reviewing":
      return { text: `REVIEW${taskSuffix}`, color: themeColors.text };
    default:
      return { text: "IDLE", color: themeColors.textDim };
  }
}

/**
 * Get provider display configuration.
 */
function getProviderConfig(
  provider: string,
  themeColors: ReturnType<typeof useTheme>["theme"]
) {
  const configs: Record<
    string,
    { label: string; color: typeof themeColors.brand }
  > = {
    claude: { label: "CLAUDE", color: themeColors.warning },
    cursor: { label: "CURSOR", color: themeColors.info },
    opencode: { label: "OPENCODE", color: themeColors.success },
  };
  return (
    configs[provider] ?? {
      label: provider.toUpperCase(),
      color: themeColors.info,
    }
  );
}

/**
 * Status bar component.
 * Shows brand, mode, provider, iteration, elapsed time, and current tool.
 */
export function StatusBar(props: StatusBarProps) {
  const { theme } = useTheme();

  const modeDisplay = () =>
    getModeDisplay(props.state.executionMode, props.state.currentTaskId, theme);
  const providerConfig = () =>
    getProviderConfig(props.state.provider ?? "claude", theme);

  // Task progress
  const taskProgress = () => {
    if (props.state.tasks.length === 0) {
      return null;
    }
    const completed = props.state.tasks.filter(
      (t) => t.status === "done"
    ).length;
    const total = props.state.tasks.length;
    return { completed, total, allDone: completed === total };
  };

  return (
    <box
      borderColor={theme.border}
      borderStyle="single"
      flexDirection="row"
      height={1}
      paddingLeft={1}
      width={props.width}
    >
      {/* Brand */}
      <text attributes={TextAttributes.BOLD} fg={theme.brand}>
        {"▸ "}
      </text>
      <text attributes={TextAttributes.BOLD} fg={theme.text}>
        FERIX
      </text>

      <text fg={theme.textDim}>{" • "}</text>

      {/* YOLO mode */}
      <Show when={props.state.yolo}>
        <text fg={theme.warning}>{"⚠ YOLO"}</text>
        <text fg={theme.textDim}>{" • "}</text>
      </Show>

      {/* Debug mode */}
      <Show when={props.state.debug}>
        <text fg={theme.warning}>DEBUG</text>
        <text fg={theme.textDim}>{" • "}</text>
      </Show>

      {/* PR mode */}
      <Show when={props.state.pr}>
        <text fg={theme.info}>PR</text>
        <text fg={theme.textDim}>{" • "}</text>
      </Show>

      {/* Provider */}
      <text fg={providerConfig().color}>{providerConfig().label}</text>

      <text fg={theme.textDim}>{" • "}</text>

      {/* Status/Mode */}
      <Show when={props.state.status === "running"}>
        <text fg={theme.brand}>{"⠋ "}</text>
        <text fg={modeDisplay().color}>{modeDisplay().text}</text>
      </Show>
      <Show when={props.state.status === "complete"}>
        <text fg={theme.info}>COMPLETE</text>
      </Show>
      <Show when={props.state.status === "paused"}>
        <text fg={theme.warning}>PAUSED</text>
      </Show>
      <Show when={props.state.status === "error"}>
        <text fg={theme.error}>ERROR</text>
      </Show>
      <Show when={props.state.status === "idle"}>
        <text fg={theme.textDim}>IDLE</text>
      </Show>

      <text fg={theme.textDim}>{" • "}</text>

      {/* Iteration */}
      <text fg={theme.textDim}>
        {props.state.maxIterations > 0
          ? `${props.state.iteration}/${props.state.maxIterations}`
          : `${props.state.iteration}`}
      </text>

      {/* Elapsed time */}
      <Show when={props.state.startTime > 0}>
        <text fg={theme.textDim}>{" • "}</text>
        <text fg={theme.info}>{formatElapsedTime(props.state.startTime)}</text>
      </Show>

      {/* Task progress */}
      {(() => {
        const progress = taskProgress();
        if (!progress) {
          return null;
        }
        return (
          <>
            <text fg={theme.textDim}>{" • "}</text>
            <text fg={progress.allDone ? theme.success : theme.textDim}>
              {`TASK ${progress.completed}/${progress.total}`}
            </text>
          </>
        );
      })()}

      {/* Current tool */}
      <Show when={props.state.currentTool}>
        <text fg={theme.textDim}>{" • "}</text>
        <text fg={theme.brand}>{`[${props.state.currentTool}]`}</text>
      </Show>
    </box>
  );
}
