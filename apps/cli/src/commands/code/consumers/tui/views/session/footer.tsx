import { TextAttributes } from "@opentui/core";
import { For, Show } from "solid-js";
import type { TUIState } from "../../../../domain/schemas/tui.js";
import { SplitBorder } from "../../components/index.js";
import { useTheme } from "../../context/index.js";
import { computeDetailLineCount } from "../../util/detail-line-count.js";

interface FooterProps {
  readonly state: TUIState;
  readonly width: number;
  readonly outputHeight: number;
}

interface HintDef {
  readonly key: string;
  readonly description: string;
}

/**
 * Hint component for keyboard shortcuts.
 * Key in bold accent amber, description in textMuted.
 */
function Hint(props: HintDef) {
  const { theme } = useTheme();

  return (
    <box flexDirection="row">
      <text attributes={TextAttributes.BOLD} fg={theme.accent}>
        {props.key}
      </text>
      <text fg={theme.textMuted}>{` ${props.description}`}</text>
    </box>
  );
}

/**
 * Dot separator between hints.
 */
function HintSep() {
  const { theme } = useTheme();
  return <text fg={theme.textGhost}>{" · "}</text>;
}

/**
 * Renders a list of hints separated by dots.
 */
function HintList(props: { hints: readonly HintDef[] }) {
  return (
    <box flexDirection="row">
      <For each={props.hints}>
        {(hint, index) => (
          <>
            <Show when={index() > 0}>
              <HintSep />
            </Show>
            <Hint description={hint.description} key={hint.key} />
          </>
        )}
      </For>
    </box>
  );
}

/**
 * Scroll position indicator.
 */
function ScrollPosition(props: {
  offset: number;
  total: number;
  height: number;
}) {
  const { theme } = useTheme();

  if (props.total <= props.height) {
    return null;
  }

  const maxOffset = Math.max(0, props.total - props.height);
  const percent =
    maxOffset > 0 ? Math.round((props.offset / maxOffset) * 100) : 0;

  return (
    <text fg={props.offset > 0 ? theme.warning : theme.textDim}>
      {`${percent}%`}
    </text>
  );
}

/**
 * Get hints for logs view.
 */
function getLogsHints(): HintDef[] {
  return [
    { key: "j/k", description: "scroll" },
    { key: "^D/^U", description: "half page" },
    { key: "t", description: "tasks" },
    { key: "Esc", description: "launcher" },
    { key: "^C", description: "quit" },
  ];
}

/**
 * Get hints for tasks view.
 */
function getTasksHints(): HintDef[] {
  return [
    { key: "j/k", description: "navigate" },
    { key: "Enter", description: "details" },
    { key: "Esc", description: "back" },
    { key: "^C", description: "quit" },
  ];
}

/**
 * Get hints for detail view.
 */
function getDetailHints(): HintDef[] {
  return [
    { key: "j/k", description: "scroll" },
    { key: "Esc", description: "back" },
    { key: "^C", description: "quit" },
  ];
}

/**
 * Footer component.
 * Split layout: left = context info, right = keyboard hints.
 * Uses SplitBorder pattern with backgroundPanel.
 */
export function Footer(props: FooterProps) {
  const { theme } = useTheme();

  const hints = (): readonly HintDef[] => {
    switch (props.state.viewMode) {
      case "logs":
        return getLogsHints();
      case "tasks":
        return getTasksHints();
      case "detail":
        return getDetailHints();
      default:
        return [{ key: "^C", description: "quit" }];
    }
  };

  const leftContent = () => {
    if (props.state.viewMode === "logs") {
      const total = props.state.outputLines.length;
      if (total > props.outputHeight) {
        return (
          <ScrollPosition
            height={props.outputHeight}
            offset={props.state.scrollOffset}
            total={total}
          />
        );
      }
      return null;
    }
    if (props.state.viewMode === "tasks") {
      return (
        <text fg={theme.textMuted}>
          {`${props.state.tasks.length} task${props.state.tasks.length !== 1 ? "s" : ""}`}
        </text>
      );
    }
    if (props.state.viewMode === "detail") {
      const task = props.state.tasks[props.state.selectedTaskIndex];
      if (task) {
        const total = computeDetailLineCount(
          task,
          props.state.gitBranch,
          props.state.prUrl
        );
        if (total > props.outputHeight) {
          return (
            <ScrollPosition
              height={props.outputHeight}
              offset={props.state.scrollOffset}
              total={total}
            />
          );
        }
      }
      return null;
    }
    return null;
  };

  return (
    <SplitBorder width={props.width}>
      {/* Left: context info */}
      <box flexDirection="row" paddingLeft={1}>
        {leftContent()}
      </box>

      {/* Spacer */}
      <box flexGrow={1} />

      {/* Right: keyboard hints */}
      <box flexDirection="row" paddingRight={1}>
        <HintList hints={hints()} />
      </box>
    </SplitBorder>
  );
}
