import { TextAttributes } from "@opentui/core";
import { Show } from "solid-js";
import type { TUIState } from "../../../../domain/schemas/tui.js";
import { useTheme } from "../../context/index.js";

interface FooterProps {
  readonly state: TUIState;
  readonly width: number;
  readonly outputHeight: number;
}

/**
 * Hint component for keyboard shortcuts.
 */
function Hint(props: { key: string; description: string }) {
  const { theme } = useTheme();

  return (
    <box flexDirection="row">
      <text fg={theme.text}>{"["}</text>
      <text attributes={TextAttributes.BOLD} fg={theme.text}>
        {props.key}
      </text>
      <text fg={theme.text}>{"]"}</text>
      <text fg={theme.textDim}>{` ${props.description}`}</text>
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
      {`[${percent}%]`}
    </text>
  );
}

/**
 * Footer hints for logs view.
 */
function LogsFooter(props: FooterProps) {
  return (
    <box flexDirection="row">
      <Hint description="scroll" key="j/k" />
      <text>{"  "}</text>
      <Hint description="half page" key="^D/^U" />
      <text>{"  "}</text>
      <ScrollPosition
        height={props.outputHeight}
        offset={props.state.scrollOffset}
        total={props.state.outputLines.length}
      />
      <Show when={props.state.outputLines.length > props.outputHeight}>
        <text>{"  "}</text>
      </Show>
      <Hint description="tasks" key="t" />
      <text>{"  "}</text>
      <Hint description="launcher" key="Esc" />
      <text>{"  "}</text>
      <Hint description="quit" key="^C" />
    </box>
  );
}

/**
 * Footer hints for tasks view.
 */
function TasksFooter() {
  return (
    <box flexDirection="row">
      <Hint description="navigate" key="j/k" />
      <text>{"  "}</text>
      <Hint description="details" key="Enter" />
      <text>{"  "}</text>
      <Hint description="back" key="Esc" />
      <text>{"  "}</text>
      <Hint description="quit" key="^C" />
    </box>
  );
}

/**
 * Footer hints for detail view.
 */
function DetailFooter() {
  return (
    <box flexDirection="row">
      <Hint description="scroll" key="j/k" />
      <text>{"  "}</text>
      <Hint description="back" key="Esc" />
      <text>{"  "}</text>
      <Hint description="quit" key="^C" />
    </box>
  );
}

/**
 * Footer component.
 * Shows context-sensitive keyboard hints.
 */
export function Footer(props: FooterProps) {
  const { theme } = useTheme();

  const renderHints = () => {
    switch (props.state.viewMode) {
      case "logs":
        return <LogsFooter {...props} />;
      case "tasks":
        return <TasksFooter />;
      case "detail":
        return <DetailFooter />;
      default:
        return (
          <box flexDirection="row">
            <Hint description="quit" key="^C" />
          </box>
        );
    }
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
      {renderHints()}
    </box>
  );
}
