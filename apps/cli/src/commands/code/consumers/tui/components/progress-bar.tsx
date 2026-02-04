import { useTheme } from "../context/index.js";

interface ProgressBarProps {
  readonly done: number;
  readonly total: number;
  readonly width: number;
}

/**
 * Progress bar using block characters.
 */
export function ProgressBar(props: ProgressBarProps) {
  const { theme } = useTheme();

  const filled = () =>
    props.total > 0 ? Math.round((props.done / props.total) * props.width) : 0;
  const empty = () => props.width - filled();

  return (
    <box flexDirection="row">
      <text fg={theme.success}>{"█".repeat(filled())}</text>
      <text fg={theme.textGhost}>{"░".repeat(empty())}</text>
    </box>
  );
}
